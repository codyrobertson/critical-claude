/**
 * CLI Integration Tests
 * Tests the full CLI functionality end-to-end
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

interface CLIResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

class CLITestRunner {
  private testDir: string;

  constructor() {
    this.testDir = path.join(os.tmpdir(), `critical-claude-test-${Date.now()}`);
  }

  async setup(): Promise<void> {
    await fs.mkdir(this.testDir, { recursive: true });
    process.env.CRITICAL_CLAUDE_HOME = this.testDir;
  }

  async cleanup(): Promise<void> {
    try {
      await fs.rm(this.testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  async runCLI(args: string[], timeout: number = 5000): Promise<CLIResult> {
    return new Promise((resolve) => {
      const cli = spawn('node', ['applications/cli-application/src/index.ts', ...args], {
        stdio: 'pipe',
        env: { ...process.env, CRITICAL_CLAUDE_HOME: this.testDir }
      });

      let stdout = '';
      let stderr = '';

      cli.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      cli.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      const timer = setTimeout(() => {
        cli.kill('SIGTERM');
        resolve({ stdout, stderr, exitCode: -1 });
      }, timeout);

      cli.on('close', (code) => {
        clearTimeout(timer);
        resolve({ stdout, stderr, exitCode: code || 0 });
      });
    });
  }
}

describe('CLI Integration Tests', () => {
  let cliRunner: CLITestRunner;

  beforeEach(async () => {
    cliRunner = new CLITestRunner();
    await cliRunner.setup();
  });

  afterEach(async () => {
    await cliRunner.cleanup();
  });

  describe('Help and Information', () => {
    it('should show help when no arguments provided', async () => {
      const result = await cliRunner.runCLI(['--help']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Critical Claude CLI');
      expect(result.stdout).toContain('Usage:');
    });

    it('should show version information', async () => {
      const result = await cliRunner.runCLI(['--version']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
    });

    it('should show keyboard shortcuts', async () => {
      const result = await cliRunner.runCLI(['shortcuts']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Keyboard Shortcuts');
      expect(result.stdout).toContain('VIEWER SHORTCUTS');
      expect(result.stdout).toContain('CLI SHORTCUTS');
    });
  });

  describe('Task Management', () => {
    it('should create a task', async () => {
      const result = await cliRunner.runCLI([
        'task', 'create',
        '--title', 'Test Task',
        '--description', 'Integration test task',
        '--priority', 'high'
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Created task: Test Task');
      expect(result.stdout).toContain('ID:');
    });

    it('should list tasks', async () => {
      // Create a task first
      await cliRunner.runCLI([
        'task', 'create',
        '--title', 'Task for Listing',
        '--priority', 'medium'
      ]);

      const result = await cliRunner.runCLI(['task', 'list']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Found');
      expect(result.stdout).toContain('Task for Listing');
    });

    it('should update a task', async () => {
      // Create a task first
      const createResult = await cliRunner.runCLI([
        'task', 'create',
        '--title', 'Task to Update'
      ]);

      // Extract task ID from output
      const idMatch = createResult.stdout.match(/ID: ([\w-]+)/);
      expect(idMatch).toBeTruthy();
      const taskId = idMatch![1];

      // Update the task
      const updateResult = await cliRunner.runCLI([
        'task', 'update', taskId,
        '--status', 'in_progress',
        --title', 'Updated Task Title'
      ]);

      expect(updateResult.exitCode).toBe(0);
      expect(updateResult.stdout).toContain('Updated task');
    });

    it('should delete a task', async () => {
      // Create a task first
      const createResult = await cliRunner.runCLI([
        'task', 'create',
        '--title', 'Task to Delete'
      ]);

      const idMatch = createResult.stdout.match(/ID: ([\w-]+)/);
      const taskId = idMatch![1];

      // Delete the task
      const deleteResult = await cliRunner.runCLI([
        'task', 'delete', taskId
      ]);

      expect(deleteResult.exitCode).toBe(0);
      expect(deleteResult.stdout).toContain('Deleted task');
    });

    it('should archive a task', async () => {
      // Create a task first
      const createResult = await cliRunner.runCLI([
        'task', 'create',
        '--title', 'Task to Archive'
      ]);

      const idMatch = createResult.stdout.match(/ID: ([\w-]+)/);
      const taskId = idMatch![1];

      // Archive the task
      const archiveResult = await cliRunner.runCLI([
        'task', 'archive', taskId
      ]);

      expect(archiveResult.exitCode).toBe(0);
      expect(archiveResult.stdout).toContain('Archived task');
    });
  });

  describe('Data Management', () => {
    beforeEach(async () => {
      // Create some test tasks
      await cliRunner.runCLI([
        'task', 'create',
        '--title', 'Export Task 1',
        '--description', 'First task for export testing',
        '--priority', 'high'
      ]);

      await cliRunner.runCLI([
        'task', 'create',
        '--title', 'Export Task 2',
        '--description', 'Second task for export testing',
        '--priority', 'medium'
      ]);
    });

    it('should export tasks in JSON format', async () => {
      const result = await cliRunner.runCLI([
        'task', 'export',
        '--format', 'json'
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Exported');
      expect(result.stdout).toContain('tasks to');
      expect(result.stdout).toContain('.json');
    });

    it('should export tasks in CSV format', async () => {
      const result = await cliRunner.runCLI([
        'task', 'export',
        '--format', 'csv'
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Exported');
      expect(result.stdout).toContain('.csv');
    });

    it('should create backups', async () => {
      const result = await cliRunner.runCLI([
        'task', 'backup'
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Backup created');
      expect(result.stdout).toContain('backup-');
    });

    it('should import tasks from JSON', async () => {
      // First export tasks
      const exportResult = await cliRunner.runCLI([
        'task', 'export',
        '--format', 'json',
        '--file', 'test-export.json'
      ]);

      expect(exportResult.exitCode).toBe(0);

      // Clear existing tasks by creating new test environment
      await cliRunner.cleanup();
      await cliRunner.setup();

      // Import the tasks
      const importResult = await cliRunner.runCLI([
        'task', 'import',
        '--file', 'test-export.json',
        '--merge-strategy', 'replace'
      ]);

      expect(importResult.exitCode).toBe(0);
      expect(importResult.stdout).toContain('Successfully imported');
    });
  });

  describe('Analytics', () => {
    it('should show usage statistics', async () => {
      // Run a few commands to generate analytics data
      await cliRunner.runCLI(['task', 'create', '--title', 'Analytics Test']);
      await cliRunner.runCLI(['task', 'list']);

      const result = await cliRunner.runCLI(['analytics', 'stats']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Usage Statistics');
      expect(result.stdout).toContain('Total commands tracked');
      expect(result.stdout).toContain('Success rate');
    });

    it('should export analytics data', async () => {
      // Generate some analytics data
      await cliRunner.runCLI(['task', 'list']);

      const result = await cliRunner.runCLI([
        'analytics', 'export',
        '--format', 'json'
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Analytics exported');
    });

    it('should clear analytics data', async () => {
      // Generate analytics data
      await cliRunner.runCLI(['task', 'list']);

      const clearResult = await cliRunner.runCLI(['analytics', 'clear']);

      expect(clearResult.exitCode).toBe(0);
      expect(clearResult.stdout).toContain('analytics data cleared');

      // Verify data is cleared
      const statsResult = await cliRunner.runCLI(['analytics', 'stats']);
      expect(statsResult.stdout).toContain('Total commands tracked: 0');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid commands gracefully', async () => {
      const result = await cliRunner.runCLI(['invalid-command']);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Unknown command');
    });

    it('should handle missing required arguments', async () => {
      const result = await cliRunner.runCLI(['task', 'create']);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Title is required');
    });

    it('should handle non-existent task IDs', async () => {
      const result = await cliRunner.runCLI([
        'task', 'view', 'non-existent-id'
      ]);

      expect(result.exitCode).toBe(0); // CLI doesn't exit with error, but shows error message
      expect(result.stdout).toContain('Task not found');
    });

    it('should handle invalid file paths for import', async () => {
      const result = await cliRunner.runCLI([
        'task', 'import',
        '--file', 'non-existent-file.json'
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Import failed');
    });
  });

  describe('Complex Workflows', () => {
    it('should support complete task lifecycle', async () => {
      // Create task
      const createResult = await cliRunner.runCLI([
        'task', 'create',
        '--title', 'Lifecycle Test Task',
        '--description', 'Testing complete lifecycle',
        --priority', 'high',
        '--labels', 'test', 'lifecycle'
      ]);

      expect(createResult.exitCode).toBe(0);
      const taskId = createResult.stdout.match(/ID: ([\w-]+)/)![1];

      // Update task status
      const updateResult = await cliRunner.runCLI([
        'task', 'update', taskId,
        '--status', 'in_progress'
      ]);
      expect(updateResult.exitCode).toBe(0);

      // Complete task
      const completeResult = await cliRunner.runCLI([
        'task', 'update', taskId,
        '--status', 'done'
      ]);
      expect(completeResult.exitCode).toBe(0);

      // Archive task
      const archiveResult = await cliRunner.runCLI([
        'task', 'archive', taskId
      ]);
      expect(archiveResult.exitCode).toBe(0);

      // Verify task is archived
      const listResult = await cliRunner.runCLI(['task', 'list']);
      expect(listResult.stdout).not.toContain('Lifecycle Test Task');
    });

    it('should support batch operations via export/import', async () => {
      // Create multiple tasks
      const tasks = ['Task 1', 'Task 2', 'Task 3'];
      for (const title of tasks) {
        await cliRunner.runCLI(['task', 'create', '--title', title]);
      }

      // Export all tasks
      const exportResult = await cliRunner.runCLI([
        'task', 'export',
        '--format', 'json',
        '--file', 'batch-test.json'
      ]);
      expect(exportResult.exitCode).toBe(0);

      // Clear tasks
      await cliRunner.cleanup();
      await cliRunner.setup();

      // Import tasks back
      const importResult = await cliRunner.runCLI([
        'task', 'import',
        '--file', 'batch-test.json'
      ]);
      expect(importResult.exitCode).toBe(0);

      // Verify all tasks are imported
      const listResult = await cliRunner.runCLI(['task', 'list']);
      for (const title of tasks) {
        expect(listResult.stdout).toContain(title);
      }
    });
  });
});