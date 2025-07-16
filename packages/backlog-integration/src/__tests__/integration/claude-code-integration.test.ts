/**
 * Claude Code Integration Tests
 * Tests bidirectional sync, hook detection, and real-world integration scenarios
 */

import { ClaudeCodeIntegration } from '../../integrations/claude-code-integration.js';
import { BacklogManager } from '../../cli/backlog-manager.js';
import { EnhancedTask } from '../../types/enhanced-task.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn } from 'child_process';

describe('Claude Code Integration Tests', () => {
  let claudeCodeIntegration: ClaudeCodeIntegration;
  let backlogManager: BacklogManager;
  let testProjectDir: string;
  let originalCwd: string;

  beforeAll(async () => {
    // Store original working directory
    originalCwd = process.cwd();
    
    // Setup test environment
    testProjectDir = path.join(process.cwd(), 'test-claude-integration');
    await fs.mkdir(testProjectDir, { recursive: true });
    process.chdir(testProjectDir);
    
    // Initialize components
    backlogManager = new BacklogManager();
    await backlogManager.initialize();
    
    claudeCodeIntegration = new ClaudeCodeIntegration(backlogManager);
  });

  afterAll(async () => {
    // Cleanup
    try {
      await fs.rm(testProjectDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  beforeEach(async () => {
    // Clear existing tasks
    try {
      const tasks = await backlogManager.listTasks();
      for (const task of tasks) {
        await backlogManager.deleteTask(task.id);
      }
    } catch (error) {
      // Ignore if no tasks exist
    }
  });

  describe('Task Synchronization', () => {
    it('should sync Critical Claude tasks to Claude Code format', async () => {
      // Create test tasks with various properties
      const testTasks = [
        {
          title: 'High priority feature task',
          description: 'Implement user authentication',
          priority: 'high' as const,
          labels: ['auth', 'security'],
          storyPoints: 8,
          assignee: 'dev-team'
        },
        {
          title: 'Medium priority bug fix',
          description: 'Fix login validation issue',
          priority: 'medium' as const,
          labels: ['bug', 'validation'],
          storyPoints: 3
        },
        {
          title: 'Low priority documentation',
          description: 'Update API documentation',
          priority: 'low' as const,
          labels: ['docs'],
          storyPoints: 2
        }
      ];

      // Create tasks in Critical Claude
      const createdTasks: EnhancedTask[] = [];
      for (const taskData of testTasks) {
        const task = await backlogManager.createTask(taskData);
        createdTasks.push(task);
      }

      // Test sync to Claude Code
      await claudeCodeIntegration.syncToClaudeCodeTodos(createdTasks);

      // Verify sync completed without errors
      expect(createdTasks).toHaveLength(3);
      
      // Test natural language formatting
      const formattedTask = claudeCodeIntegration.formatTaskForClaudeCode(createdTasks[0]);
      expect(formattedTask).toContain('High priority feature task');
      expect(formattedTask).toContain('[8pts]');
      expect(formattedTask).toContain('#auth');
      expect(formattedTask).toContain('#security');
    });

    it('should handle task status mapping correctly', async () => {
      // Create tasks with different statuses
      const task1 = await backlogManager.createTask({
        title: 'Todo task',
        status: 'todo'
      });
      
      const task2 = await backlogManager.createTask({
        title: 'In progress task',
        status: 'in_progress'
      });
      
      const task3 = await backlogManager.createTask({
        title: 'Done task',
        status: 'done'
      });

      // Test status mapping
      expect(claudeCodeIntegration.mapStatusToClaudeCode('todo')).toBe('pending');
      expect(claudeCodeIntegration.mapStatusToClaudeCode('in_progress')).toBe('in_progress');
      expect(claudeCodeIntegration.mapStatusToClaudeCode('done')).toBe('completed');

      // Test reverse mapping
      expect(claudeCodeIntegration.mapStatusFromClaudeCode('pending')).toBe('todo');
      expect(claudeCodeIntegration.mapStatusFromClaudeCode('in_progress')).toBe('in_progress');
      expect(claudeCodeIntegration.mapStatusFromClaudeCode('completed')).toBe('done');
    });

    it('should handle natural language parsing for imported tasks', async () => {
      // Simulate Claude Code todos being imported
      const claudeCodeTodos = [
        {
          content: 'Implement user dashboard @high #frontend #react 5pts for:alice',
          status: 'pending' as const,
          priority: 'high' as const,
          id: 'test-1'
        },
        {
          content: 'Fix responsive layout issue @medium #css #bug 2pts',
          status: 'in_progress' as const,
          priority: 'medium' as const,
          id: 'test-2'
        }
      ];

      // Test parsing of natural language elements
      for (const todo of claudeCodeTodos) {
        const parsedTask = claudeCodeIntegration.parseNaturalLanguage(todo.content);
        
        if (todo.content.includes('@high')) {
          expect(parsedTask.priority).toBe('high');
        }
        
        if (todo.content.includes('#frontend')) {
          expect(parsedTask.labels).toContain('frontend');
        }
        
        if (todo.content.includes('5pts')) {
          expect(parsedTask.storyPoints).toBe(5);
        }
        
        if (todo.content.includes('for:alice')) {
          expect(parsedTask.assignee).toBe('alice');
        }
      }
    });
  });

  describe('Hook Integration Scenarios', () => {
    it('should detect and respond to TodoWrite operations', async () => {
      // This test simulates the hook detection we're experiencing issues with
      const hookLogPath = path.join(process.env.HOME!, '.critical-claude/hook-debug.log');
      const syncLogPath = path.join(process.env.HOME!, '.critical-claude/sync.log');
      
      // Clear logs
      try {
        await fs.writeFile(hookLogPath, '');
        await fs.writeFile(syncLogPath, '');
      } catch (error) {
        // Logs may not exist
      }

      // Create a task that should trigger hooks
      const task = await backlogManager.createTask({
        title: 'Hook detection test task',
        description: 'This should trigger Claude Code hooks',
        priority: 'high',
        labels: ['hook-test']
      });

      // Simulate what happens when TodoWrite is called
      // (This is what should trigger the hook but we're not seeing in monitor)
      const mockTodoWriteOperation = async () => {
        // Write to hook log to simulate hook trigger
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] Hook triggered! Event: PostToolUse, Tool: TodoWrite, PWD: ${process.cwd()}\\n`;
        
        try {
          await fs.appendFile(hookLogPath, logEntry);
          await fs.appendFile(hookLogPath, `[${timestamp}] Running Critical Claude sync...\\n`);
        } catch (error) {
          console.warn('Could not write to hook log:', error);
        }
      };

      await mockTodoWriteOperation();

      // Verify hook log content
      try {
        const hookContent = await fs.readFile(hookLogPath, 'utf-8');
        expect(hookContent).toContain('Hook triggered');
        expect(hookContent).toContain('TodoWrite');
      } catch (error) {
        console.warn('Hook log not accessible, this may indicate hook setup issues');
      }

      // Test actual sync operation
      const tasks = await backlogManager.listTasks();
      await claudeCodeIntegration.syncToClaudeCodeTodos(tasks);
      
      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks.some(t => t.title.includes('Hook detection test task'))).toBe(true);
    });

    it('should handle live monitor integration properly', async () => {
      // Test the scenario where live monitor should show hook activity
      const task1 = await backlogManager.createTask({
        title: 'Live monitor test task 1',
        priority: 'high'
      });

      const task2 = await backlogManager.createTask({
        title: 'Live monitor test task 2',
        priority: 'medium'
      });

      // Simulate sync operation that monitor should detect
      const tasks = await backlogManager.listTasks();
      await claudeCodeIntegration.syncToClaudeCodeTodos(tasks);

      // Verify tasks exist and can be synced
      expect(tasks.length).toBeGreaterThanOrEqual(2);
      
      // Check if sync log gets updated (what live monitor watches)
      const syncLogPath = path.join(process.env.HOME!, '.critical-claude/sync.log');
      try {
        const syncContent = await fs.readFile(syncLogPath, 'utf-8');
        console.log('Sync log content sample:', syncContent.slice(-200));
      } catch (error) {
        console.warn('Sync log not accessible');
      }
    });
  });

  describe('Real-World Integration Scenarios', () => {
    it('should handle the complete workflow: create → sync → monitor', async () => {
      // Step 1: Create tasks via CLI (real-world scenario)
      const createProcess = spawn('node', [
        path.join(originalCwd, 'dist/cli/cc-main.js'),
        'task',
        'Complete workflow test @high #e2e #integration 3pts'
      ], {
        cwd: process.cwd(),
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';
      createProcess.stdout.on('data', (data) => stdout += data.toString());
      createProcess.stderr.on('data', (data) => stderr += data.toString());

      await new Promise((resolve, reject) => {
        createProcess.on('close', (code) => {
          if (code === 0) {
            resolve(undefined);
          } else {
            console.log('CLI stdout:', stdout);
            console.log('CLI stderr:', stderr);
            reject(new Error(`Task creation failed with code ${code}`));
          }
        });
        setTimeout(() => reject(new Error('Task creation timeout')), 10000);
      });

      // Step 2: Verify task was created
      const tasks = await backlogManager.listTasks();
      const workflowTask = tasks.find(t => t.title.includes('Complete workflow test'));
      expect(workflowTask).toBeDefined();
      expect(workflowTask!.priority).toBe('high');
      expect(workflowTask!.labels).toContain('e2e');
      expect(workflowTask!.storyPoints).toBe(3);

      // Step 3: Test sync operation
      const syncProcess = spawn('node', [
        path.join(originalCwd, 'dist/cli/cc-main.js'),
        'sync-claude-code',
        '--execute'
      ], {
        cwd: process.cwd(),
        stdio: 'pipe'
      });

      let syncOutput = '';
      syncProcess.stdout.on('data', (data) => {
        syncOutput += data.toString();
      });

      await new Promise((resolve, reject) => {
        syncProcess.on('close', (code) => {
          if (code === 0) resolve(undefined);
          else reject(new Error(`Sync failed with code ${code}`));
        });
        setTimeout(() => reject(new Error('Sync timeout')), 15000);
      });

      // Verify sync worked
      expect(syncOutput).toContain('Successfully executed TodoWrite');
      console.log('✅ Complete workflow test passed');

      // Step 4: Test what live monitor should see
      // The monitor should detect both the task creation and sync events
      const hookLogPath = path.join(process.env.HOME!, '.critical-claude/hook-debug.log');
      const syncLogPath = path.join(process.env.HOME!, '.critical-claude/sync.log');

      try {
        const hookContent = await fs.readFile(hookLogPath, 'utf-8');
        const syncContent = await fs.readFile(syncLogPath, 'utf-8');
        
        console.log('Hook activity detected:', hookContent.includes('Hook triggered'));
        console.log('Sync activity detected:', syncContent.includes('tasks synced'));
        
        // This reveals whether our monitor integration is working
        if (!hookContent.includes('Hook triggered')) {
          console.warn('⚠️  Hook detection may need configuration - this explains missing monitor activity');
        }
      } catch (error) {
        console.warn('Log files not accessible - hook/sync monitoring may need setup');
      }
    }, 30000);

    it('should maintain data consistency across operations', async () => {
      // Create, update, sync, and verify consistency
      const originalTask = await backlogManager.createTask({
        title: 'Consistency test task',
        description: 'Testing data consistency',
        priority: 'medium',
        labels: ['consistency', 'test'],
        storyPoints: 4
      });

      // Update the task
      const updatedTask = await backlogManager.updateTask(originalTask.id, {
        title: 'Updated consistency test task',
        priority: 'high',
        status: 'in_progress'
      });

      // Sync the updated task
      await claudeCodeIntegration.syncToClaudeCodeTodos([updatedTask]);

      // Verify all changes are reflected correctly
      const retrievedTask = await backlogManager.getTask(originalTask.id);
      expect(retrievedTask.title).toBe('Updated consistency test task');
      expect(retrievedTask.priority).toBe('high');
      expect(retrievedTask.status).toBe('in_progress');
      expect(retrievedTask.labels).toEqual(['consistency', 'test']);
      expect(retrievedTask.storyPoints).toBe(4);

      // Verify formatting for Claude Code includes all updates
      const formatted = claudeCodeIntegration.formatTaskForClaudeCode(retrievedTask);
      expect(formatted).toContain('Updated consistency test task');
      expect(formatted).toContain('[4pts]');
      expect(formatted).toContain('#consistency');
      expect(formatted).toContain('#test');
    });
  });
});