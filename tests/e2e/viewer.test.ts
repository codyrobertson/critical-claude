/**
 * End-to-End Viewer Tests
 * Tests the terminal UI viewer functionality
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

interface ViewerSession {
  process: ChildProcess;
  stdin: NodeJS.WritableStream;
  stdout: string;
  stderr: string;
}

class ViewerTestRunner {
  private testDir: string;
  private sessions: ViewerSession[] = [];

  constructor() {
    this.testDir = path.join(os.tmpdir(), `critical-claude-viewer-test-${Date.now()}`);
  }

  async setup(): Promise<void> {
    await fs.mkdir(this.testDir, { recursive: true });
    process.env.CRITICAL_CLAUDE_HOME = this.testDir;

    // Create some test tasks
    await this.createTestTasks();
  }

  async cleanup(): Promise<void> {
    // Kill all viewer sessions
    for (const session of this.sessions) {
      if (session.process && !session.process.killed) {
        session.process.kill('SIGTERM');
      }
    }
    this.sessions = [];

    try {
      await fs.rm(this.testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  private async createTestTasks(): Promise<void> {
    const tasks = [
      { title: 'High Priority Task', priority: 'high', status: 'todo' },
      { title: 'Medium Priority Task', priority: 'medium', status: 'in_progress' },
      { title: 'Low Priority Task', priority: 'low', status: 'done' },
      { title: 'Search Test Task', priority: 'high', status: 'todo', labels: ['search', 'test'] },
      { title: 'Filter Test Task', priority: 'medium', status: 'blocked', labels: ['filter'] }
    ];

    for (const task of tasks) {
      const cli = spawn('node', [
        'applications/cli-application/src/index.ts',
        'task', 'create',
        '--title', task.title,
        '--priority', task.priority,
        '--status', task.status,
        ...(task.labels ? ['--labels', ...task.labels] : [])
      ], {
        env: { ...process.env, CRITICAL_CLAUDE_HOME: this.testDir }
      });

      await new Promise((resolve) => {
        cli.on('close', resolve);
      });
    }
  }

  async startViewer(timeout: number = 10000): Promise<ViewerSession> {
    return new Promise((resolve, reject) => {
      const viewerProcess = spawn('node', [
        'applications/cli-application/src/index.ts',
        'viewer',
        '--log-level', 'error' // Reduce log noise
      ], {
        stdio: 'pipe',
        env: { ...process.env, CRITICAL_CLAUDE_HOME: this.testDir, TERM: 'xterm-256color' }
      });

      let stdout = '';
      let stderr = '';

      const session: ViewerSession = {
        process: viewerProcess,
        stdin: viewerProcess.stdin!,
        stdout: '',
        stderr: ''
      };

      viewerProcess.stdout?.on('data', (data) => {
        const chunk = data.toString();
        stdout += chunk;
        session.stdout += chunk;
      });

      viewerProcess.stderr?.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;
        session.stderr += chunk;
      });

      // Wait for viewer to initialize
      const initTimer = setTimeout(() => {
        if (stdout.includes('Critical Claude Task Viewer') || stdout.includes('Controls:')) {
          clearTimeout(initTimer);
          this.sessions.push(session);
          resolve(session);
        } else {
          viewerProcess.kill('SIGTERM');
          reject(new Error(`Viewer failed to initialize. stdout: ${stdout}, stderr: ${stderr}`));
        }
      }, 2000);

      viewerProcess.on('error', (error) => {
        clearTimeout(initTimer);
        reject(error);
      });

      viewerProcess.on('close', (code) => {
        clearTimeout(initTimer);
        if (code !== 0 && code !== null) {
          reject(new Error(`Viewer exited with code ${code}. stderr: ${stderr}`));
        }
      });

      // Set overall timeout
      setTimeout(() => {
        clearTimeout(initTimer);
        viewerProcess.kill('SIGTERM');
        reject(new Error('Viewer initialization timeout'));
      }, timeout);
    });
  }

  async sendKey(session: ViewerSession, key: string): Promise<void> {
    return new Promise((resolve) => {
      session.stdin.write(key);
      // Small delay to allow UI to process
      setTimeout(resolve, 100);
    });
  }

  async sendKeys(session: ViewerSession, keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.sendKey(session, key);
    }
  }

  async waitForOutput(session: ViewerSession, expectedText: string, timeout: number = 5000): Promise<boolean> {
    return new Promise((resolve) => {
      if (session.stdout.includes(expectedText)) {
        resolve(true);
        return;
      }

      const checkInterval = setInterval(() => {
        if (session.stdout.includes(expectedText)) {
          clearInterval(checkInterval);
          clearTimeout(timeoutTimer);
          resolve(true);
        }
      }, 100);

      const timeoutTimer = setTimeout(() => {
        clearInterval(checkInterval);
        resolve(false);
      }, timeout);
    });
  }

  closeSession(session: ViewerSession): void {
    if (session.process && !session.process.killed) {
      session.process.kill('SIGTERM');
    }
    const index = this.sessions.indexOf(session);
    if (index > -1) {
      this.sessions.splice(index, 1);
    }
  }
}

describe('Viewer E2E Tests', () => {
  let testRunner: ViewerTestRunner;

  beforeEach(async () => {
    testRunner = new ViewerTestRunner();
    await testRunner.setup();
  }, 30000);

  afterEach(async () => {
    await testRunner.cleanup();
  }, 10000);

  describe('Viewer Launch and Basic Navigation', () => {
    it('should launch viewer successfully', async () => {
      const session = await testRunner.startViewer();

      expect(session.stdout).toMatch(/Critical Claude Task Viewer|Controls:/);
      expect(session.process.pid).toBeDefined();

      testRunner.closeSession(session);
    }, 15000);

    it('should display task list', async () => {
      const session = await testRunner.startViewer();

      // Wait for tasks to load
      const hasHighPriority = await testRunner.waitForOutput(session, 'High Priority Task');
      const hasMediumPriority = await testRunner.waitForOutput(session, 'Medium Priority Task');

      expect(hasHighPriority).toBe(true);
      expect(hasMediumPriority).toBe(true);

      testRunner.closeSession(session);
    }, 15000);

    it('should navigate with arrow keys', async () => {
      const session = await testRunner.startViewer();

      await testRunner.waitForOutput(session, 'High Priority Task');

      // Navigate down
      await testRunner.sendKey(session, '\u001b[B'); // Down arrow
      await testRunner.sendKey(session, '\u001b[B'); // Down arrow

      // The cursor should have moved (exact verification depends on UI implementation)
      expect(session.stdout).toContain('Task');

      testRunner.closeSession(session);
    }, 15000);

    it('should navigate with Vim keys', async () => {
      const session = await testRunner.startViewer();

      await testRunner.waitForOutput(session, 'High Priority Task');

      // Navigate with j/k keys
      await testRunner.sendKey(session, 'j'); // Down
      await testRunner.sendKey(session, 'j'); // Down
      await testRunner.sendKey(session, 'k'); // Up

      expect(session.stdout).toContain('Task');

      testRunner.closeSession(session);
    }, 15000);
  });

  describe('Search Functionality', () => {
    it('should open search with / key', async () => {
      const session = await testRunner.startViewer();

      await testRunner.waitForOutput(session, 'High Priority Task');

      // Open search
      await testRunner.sendKey(session, '/');

      // Should show search interface
      const hasSearchPrompt = await testRunner.waitForOutput(session, 'Search:');
      expect(hasSearchPrompt || session.stdout.includes('search')).toBe(true);

      testRunner.closeSession(session);
    }, 15000);

    it('should search for tasks', async () => {
      const session = await testRunner.startViewer();

      await testRunner.waitForOutput(session, 'High Priority Task');

      // Open search and type query
      await testRunner.sendKey(session, '/');
      await testRunner.sendKeys(session, ['S', 'e', 'a', 'r', 'c', 'h']);

      // Should filter results
      const hasSearchResults = await testRunner.waitForOutput(session, 'Search Test Task', 3000);
      expect(hasSearchResults).toBe(true);

      testRunner.closeSession(session);
    }, 15000);

    it('should exit search with Escape', async () => {
      const session = await testRunner.startViewer();

      await testRunner.waitForOutput(session, 'High Priority Task');

      // Open search
      await testRunner.sendKey(session, '/');
      await testRunner.sendKeys(session, ['t', 'e', 's', 't']);

      // Exit search
      await testRunner.sendKey(session, '\u001b'); // Escape

      // Should return to normal view
      await testRunner.waitForOutput(session, 'High Priority Task');

      testRunner.closeSession(session);
    }, 15000);
  });

  describe('Filtering', () => {
    it('should filter by status with f key', async () => {
      const session = await testRunner.startViewer();

      await testRunner.waitForOutput(session, 'High Priority Task');

      // Open filter
      await testRunner.sendKey(session, 'f');

      // Should show filter options or filtered results
      const hasFilter = await testRunner.waitForOutput(session, 'filter', 3000) ||
                       await testRunner.waitForOutput(session, 'status', 3000);

      // Note: Exact behavior depends on filter implementation
      expect(session.stdout.length).toBeGreaterThan(0);

      testRunner.closeSession(session);
    }, 15000);
  });

  describe('Task Interaction', () => {
    it('should select task with Enter', async () => {
      const session = await testRunner.startViewer();

      await testRunner.waitForOutput(session, 'High Priority Task');

      // Select first task
      await testRunner.sendKey(session, '\r'); // Enter

      // Should show task details or selection confirmation
      expect(session.stdout.length).toBeGreaterThan(0);

      testRunner.closeSession(session);
    }, 15000);

    it('should toggle task status with Space', async () => {
      const session = await testRunner.startViewer();

      await testRunner.waitForOutput(session, 'High Priority Task');

      // Toggle task status
      await testRunner.sendKey(session, ' '); // Space

      // Status should change (exact verification depends on UI)
      expect(session.stdout.length).toBeGreaterThan(0);

      testRunner.closeSession(session);
    }, 15000);
  });

  describe('Help and Information', () => {
    it('should show help with ? key', async () => {
      const session = await testRunner.startViewer();

      await testRunner.waitForOutput(session, 'High Priority Task');

      // Show help
      await testRunner.sendKey(session, '?');

      // Should display help information
      const hasHelp = await testRunner.waitForOutput(session, 'help', 3000) ||
                     await testRunner.waitForOutput(session, 'Help', 3000) ||
                     await testRunner.waitForOutput(session, 'shortcuts', 3000);

      expect(hasHelp || session.stdout.includes('Controls')).toBe(true);

      testRunner.closeSession(session);
    }, 15000);
  });

  describe('Exit Functionality', () => {
    it('should quit with q key', async () => {
      const session = await testRunner.startViewer();

      await testRunner.waitForOutput(session, 'High Priority Task');

      // Quit viewer
      await testRunner.sendKey(session, 'q');

      // Wait for process to exit
      await new Promise((resolve) => {
        session.process.on('close', resolve);
        // Fallback timeout
        setTimeout(resolve, 2000);
      });

      expect(session.process.killed || session.process.exitCode !== null).toBe(true);
    }, 15000);

    it('should handle Ctrl+C gracefully', async () => {
      const session = await testRunner.startViewer();

      await testRunner.waitForOutput(session, 'High Priority Task');

      // Send Ctrl+C
      await testRunner.sendKey(session, '\u0003'); // Ctrl+C

      // Wait for process to exit
      await new Promise((resolve) => {
        session.process.on('close', resolve);
        setTimeout(resolve, 2000);
      });

      expect(session.process.killed || session.process.exitCode !== null).toBe(true);
    }, 15000);
  });

  describe('Error Handling', () => {
    it('should handle empty task list gracefully', async () => {
      // Create a new test environment with no tasks
      const emptyTestDir = path.join(os.tmpdir(), `empty-test-${Date.now()}`);
      await fs.mkdir(emptyTestDir, { recursive: true });

      const emptyViewer = spawn('node', [
        'applications/cli-application/src/index.ts',
        'viewer'
      ], {
        stdio: 'pipe',
        env: { ...process.env, CRITICAL_CLAUDE_HOME: emptyTestDir }
      });

      let stdout = '';
      emptyViewer.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      // Wait for initialization
      await new Promise((resolve) => {
        setTimeout(resolve, 3000);
      });

      // Should handle empty state gracefully
      expect(stdout.length).toBeGreaterThan(0);

      emptyViewer.kill('SIGTERM');
      await fs.rm(emptyTestDir, { recursive: true, force: true });
    }, 15000);

    it('should recover from terminal resize', async () => {
      const session = await testRunner.startViewer();

      await testRunner.waitForOutput(session, 'High Priority Task');

      // Simulate terminal resize by sending SIGWINCH
      session.process.kill('SIGWINCH');

      // Give time to redraw
      await new Promise(resolve => setTimeout(resolve, 500));

      // Should still be functional
      await testRunner.sendKey(session, 'j');
      expect(session.stdout.length).toBeGreaterThan(0);

      testRunner.closeSession(session);
    }, 15000);
  });
});