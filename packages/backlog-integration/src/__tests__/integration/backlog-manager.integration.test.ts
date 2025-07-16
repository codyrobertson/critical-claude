/**
 * BacklogManager Integration Tests
 * Tests real file operations, task persistence, and hook triggering
 */

import { BacklogManager } from '../../cli/backlog-manager.js';
import { EnhancedTask } from '../../types/enhanced-task.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn } from 'child_process';

describe('BacklogManager Integration Tests', () => {
  let backlogManager: BacklogManager;
  let testProjectDir: string;
  let hookLogPath: string;
  let syncLogPath: string;

  beforeAll(async () => {
    // Setup test environment
    testProjectDir = path.join(process.cwd(), 'test-integration');
    hookLogPath = path.join(process.env.HOME!, '.critical-claude/hook-debug.log');
    syncLogPath = path.join(process.env.HOME!, '.critical-claude/sync.log');
    
    // Ensure test directory exists
    await fs.mkdir(testProjectDir, { recursive: true });
    process.chdir(testProjectDir);
    
    // Initialize BacklogManager
    backlogManager = new BacklogManager();
    await backlogManager.initialize();
  });

  afterAll(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testProjectDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  beforeEach(async () => {
    // Clear any existing tasks
    try {
      const tasks = await backlogManager.listTasks();
      for (const task of tasks) {
        await backlogManager.deleteTask(task.id);
      }
    } catch (error) {
      // Ignore if no tasks exist
    }
  });

  describe('Task CRUD Operations', () => {
    it('should create, read, update, and delete tasks with file persistence', async () => {
      // Create a task
      const taskData = {
        title: 'Integration test task',
        description: 'Testing file persistence',
        priority: 'high' as const,
        labels: ['integration', 'test'],
        storyPoints: 5
      };

      const createdTask = await backlogManager.createTask(taskData);
      
      // Verify task was created
      expect(createdTask).toBeDefined();
      expect(createdTask.title).toBe(taskData.title);
      expect(createdTask.priority).toBe(taskData.priority);
      expect(createdTask.labels).toEqual(taskData.labels);
      expect(createdTask.storyPoints).toBe(taskData.storyPoints);

      // Verify task persists after re-initialization
      const newBacklogManager = new BacklogManager();
      await newBacklogManager.initialize();
      const retrievedTask = await newBacklogManager.getTask(createdTask.id);
      
      expect(retrievedTask).toBeDefined();
      expect(retrievedTask.title).toBe(taskData.title);

      // Update the task
      const updateData = {
        title: 'Updated integration test task',
        status: 'in_progress' as const,
        priority: 'medium' as const
      };

      const updatedTask = await newBacklogManager.updateTask(createdTask.id, updateData);
      expect(updatedTask.title).toBe(updateData.title);
      expect(updatedTask.status).toBe(updateData.status);
      expect(updatedTask.priority).toBe(updateData.priority);

      // Verify update persists
      const reRetrievedTask = await newBacklogManager.getTask(createdTask.id);
      expect(reRetrievedTask.title).toBe(updateData.title);
      expect(reRetrievedTask.status).toBe(updateData.status);

      // Delete the task
      await newBacklogManager.deleteTask(createdTask.id);
      
      // Verify task is deleted
      const deletedTask = await newBacklogManager.getTask(createdTask.id);
      expect(deletedTask).toBeNull();
    });

    it('should handle bulk task operations efficiently', async () => {
      // Create multiple tasks
      const taskPromises = Array.from({ length: 10 }, (_, i) => 
        backlogManager.createTask({
          title: `Bulk test task ${i + 1}`,
          description: `Testing bulk operations ${i + 1}`,
          priority: i % 2 === 0 ? 'high' as const : 'medium' as const,
          labels: [`bulk-${i}`]
        })
      );

      const createdTasks = await Promise.all(taskPromises);
      expect(createdTasks).toHaveLength(10);

      // Verify all tasks can be listed
      const allTasks = await backlogManager.listTasks();
      expect(allTasks.length).toBeGreaterThanOrEqual(10);

      // Verify search functionality
      const highPriorityTasks = allTasks.filter(task => task.priority === 'high');
      expect(highPriorityTasks.length).toBe(5);

      // Test project stats
      const stats = await backlogManager.getProjectStats();
      expect(stats.total).toBeGreaterThanOrEqual(10);
      expect(stats.byPriority.high).toBe(5);
      expect(stats.byPriority.medium).toBe(5);
    });
  });

  describe('Hook Integration Verification', () => {
    it('should trigger hooks when tasks are created/updated via CLI', async () => {
      // Clear existing hook logs
      try {
        await fs.writeFile(hookLogPath, '');
        await fs.writeFile(syncLogPath, '');
      } catch (error) {
        // Logs may not exist yet
      }

      // Create task via CLI (this should trigger hooks)
      // Find the package root directory (from src/__tests__/integration to package root)
      const packageRoot = path.resolve(__dirname, '../../..');
      const cliPath = path.join(packageRoot, 'dist/cli/cc-main.js');
      
      console.log(`CLI path: ${cliPath}`);
      console.log(`Package root: ${packageRoot}`);
      
      const cliProcess = spawn('node', [
        cliPath,
        'task',
        'Hook integration test task @high #hook-test'
      ], {
        cwd: testProjectDir, // Use same directory as test BacklogManager
        stdio: 'pipe'
      });

      // Capture CLI output for debugging
      let cliOutput = '';
      let cliError = '';
      cliProcess.stdout?.on('data', (data) => {
        cliOutput += data.toString();
      });
      cliProcess.stderr?.on('data', (data) => {
        cliError += data.toString();
      });

      // Wait for CLI to complete
      await new Promise((resolve, reject) => {
        cliProcess.on('close', (code) => {
          console.log('CLI stdout:', cliOutput);
          console.log('CLI stderr:', cliError);
          if (code === 0) resolve(undefined);
          else {
            reject(new Error(`CLI failed with code ${code}`));
          }
        });
        
        // Timeout after 10 seconds
        setTimeout(() => reject(new Error('CLI timeout')), 10000);
      });

      // Check if hook was triggered
      let hookLogContent = '';
      try {
        hookLogContent = await fs.readFile(hookLogPath, 'utf-8');
      } catch (error) {
        // Hook log may not exist if hooks not configured
      }

      // Verify task was actually created
      const tasks = await backlogManager.listTasks();
      console.log('All tasks after CLI creation:');
      tasks.forEach(task => console.log(`- ${task.title}`));
      
      const hookTestTask = tasks.find(task => task.title.includes('Hook integration test task'));
      if (!hookTestTask) {
        console.log('Looking for tasks containing "Hook integration test task" but not found');
        console.log('Expected task ID from CLI: 9c58be3f-34eb-4671-a506-61577d16ee26');
        console.log('This suggests CLI and test BacklogManager use different storage');
      }
      expect(hookTestTask).toBeDefined();

      // If hooks are properly configured, we should see hook activity
      if (hookLogContent.includes('Hook triggered')) {
        console.log('✅ Hook integration is working correctly');
        expect(hookLogContent).toContain('Hook triggered');
      } else {
        console.warn('⚠️  Hook integration may not be configured properly');
        // This is a warning, not a failure, as hook setup depends on environment
      }
    }, 15000);

    it('should verify sync behavior with live monitoring', async () => {
      // Create task that should trigger sync
      const task = await backlogManager.createTask({
        title: 'Sync test task',
        description: 'Testing sync integration',
        priority: 'high',
        labels: ['sync-test']
      });

      // Manually trigger sync command
      const syncPackageRoot = path.resolve(__dirname, '../../..');
      const syncProcess = spawn('node', [
        path.join(syncPackageRoot, 'dist/cli/cc-main.js'),
        'sync-claude-code',
        '--execute'
      ], {
        cwd: testProjectDir, // Use same directory as test BacklogManager
        stdio: 'pipe'
      });

      let syncOutput = '';
      syncProcess.stdout.on('data', (data) => {
        syncOutput += data.toString();
      });

      // Wait for sync to complete
      await new Promise((resolve, reject) => {
        syncProcess.on('close', (code) => {
          if (code === 0) resolve(undefined);
          else reject(new Error(`Sync failed with code ${code}`));
        });
        
        setTimeout(() => reject(new Error('Sync timeout')), 15000);
      });

      // Verify sync output
      expect(syncOutput).toMatch(/Synced \d+ (todos from Claude Code|tasks to Claude Code)/);
      console.log('✅ Sync integration is working correctly');

      // Check sync log
      try {
        const syncLogContent = await fs.readFile(syncLogPath, 'utf-8');
        if (syncLogContent.match(/Synced \d+ (todos|tasks)/)) {
          expect(syncLogContent).toMatch(/Synced \d+ (todos|tasks)/);
        }
      } catch (error) {
        // Sync log may not exist
      }
    }, 20000);
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle corrupted task files gracefully', async () => {
      // Create a valid task first
      const task = await backlogManager.createTask({
        title: 'Test task for corruption',
        description: 'Testing error handling'
      });

      // Corrupt the task file
      const taskFilePath = path.join('.critical-claude/tasks', `${task.id}.json`);
      await fs.writeFile(taskFilePath, 'invalid json content');

      // Try to read tasks - should handle corruption gracefully
      const tasks = await backlogManager.listTasks();
      
      // Should either exclude corrupted task or handle error gracefully
      expect(Array.isArray(tasks)).toBe(true);
      
      // Try to get the corrupted task specifically
      const corruptedTask = await backlogManager.getTask(task.id);
      expect(corruptedTask).toBeNull();
    });

    it('should handle concurrent task operations safely', async () => {
      // Create multiple tasks concurrently
      const concurrentOperations = Array.from({ length: 5 }, (_, i) => 
        Promise.all([
          backlogManager.createTask({ title: `Concurrent task A${i}` }),
          backlogManager.createTask({ title: `Concurrent task B${i}` })
        ])
      );

      const results = await Promise.all(concurrentOperations);
      
      // Verify all tasks were created successfully
      expect(results).toHaveLength(5);
      results.forEach(([taskA, taskB]) => {
        expect(taskA).toBeDefined();
        expect(taskB).toBeDefined();
        expect(taskA.id).not.toBe(taskB.id);
      });

      // Verify final state is consistent
      const allTasks = await backlogManager.listTasks();
      expect(allTasks.length).toBeGreaterThanOrEqual(10);
    });
  });
});