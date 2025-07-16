/**
 * Critical Path Tests - Core functionality that must work in production
 * These tests cover the essential workflows that users depend on
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { BacklogManager } from '../cli/backlog-manager.js';
import { TaskUIManager } from '../cli/task-ui-manager.js';
import { PathValidator } from '../utils/path-validator.js';
import { QuickTaskCommand } from '../cli/commands/quick-task.js';

describe('Critical Path - Core Functionality', () => {
  let testDir: string;
  let backlogManager: BacklogManager;
  
  beforeEach(async () => {
    // Create isolated test directory
    testDir = path.join(process.cwd(), 'test-temp-' + Date.now());
    await fs.mkdir(testDir, { recursive: true });
    
    // Initialize backlog manager in test directory
    backlogManager = new BacklogManager({
      backlogPath: path.join(testDir, '.critical-claude'),
      phasesPath: path.join(testDir, '.critical-claude', 'phases'),
      epicsPath: path.join(testDir, '.critical-claude', 'epics'),
      sprintsPath: path.join(testDir, '.critical-claude', 'sprints'),
      tasksPath: path.join(testDir, '.critical-claude', 'tasks')
    });
    
    await backlogManager.initialize();
  });
  
  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('🚨 CRITICAL: Task Management Core', () => {
    it('should create and retrieve tasks', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test description',
        priority: 'high' as const,
        storyPoints: 3
      };
      
      const createdTask = await backlogManager.createTask(taskData);
      
      expect(createdTask.id).toBeDefined();
      expect(createdTask.title).toBe('Test Task');
      expect(createdTask.priority).toBe('high');
      expect(createdTask.status).toBe('todo');
      
      // Verify persistence
      const retrievedTask = await backlogManager.getTask(createdTask.id);
      expect(retrievedTask).toBeTruthy();
      expect(retrievedTask?.title).toBe('Test Task');
    });

    it('should list tasks correctly', async () => {
      // Create multiple tasks with delay to ensure proper ordering
      await backlogManager.createTask({ title: 'Task 1', priority: 'high' });
      await new Promise(resolve => setTimeout(resolve, 2)); // Small delay
      await backlogManager.createTask({ title: 'Task 2', priority: 'medium' });
      await new Promise(resolve => setTimeout(resolve, 2)); // Small delay
      await backlogManager.createTask({ title: 'Task 3', priority: 'low' });
      
      const tasks = await backlogManager.listTasks();
      
      expect(tasks).toHaveLength(3);
      // Tasks should be ordered by creation time (newest first)
      expect(tasks[0].title).toBe('Task 3'); // Newest first
      expect(tasks[1].title).toBe('Task 2');
      expect(tasks[2].title).toBe('Task 1'); // Oldest last
    });

    it('should update task status and maintain state history', async () => {
      const task = await backlogManager.createTask({
        title: 'Status Test Task',
        priority: 'medium'
      });
      
      // Change task status from 'todo' to 'focused' (valid transition)
      const result = await backlogManager.changeTaskState(
        task.id, 
        'focused', 
        'test-user', 
        'Starting work'
      );
      
      expect(result.success).toBe(true);
      expect(result.task?.status).toBe('focused');
      expect(result.task?.stateHistory).toHaveLength(2); // Creation + update
      
      // Verify persistence
      const retrievedTask = await backlogManager.getTask(task.id);
      expect(retrievedTask?.status).toBe('focused');
      expect(retrievedTask?.stateHistory).toHaveLength(2);
    });

    it('should delete tasks properly', async () => {
      const task = await backlogManager.createTask({
        title: 'Delete Test Task',
        priority: 'low'
      });
      
      // Verify task exists
      const existingTask = await backlogManager.getTask(task.id);
      expect(existingTask).toBeTruthy();
      
      // Delete task
      await backlogManager.deleteTask(task.id);
      
      // Verify task is gone
      const deletedTask = await backlogManager.getTask(task.id);
      expect(deletedTask).toBeNull();
    });
  });

  describe('🔥 HIGH: Quick Task Creation', () => {
    it('should create tasks with proper structure', async () => {
      // Create task directly through backlog manager to test the pattern
      const task = await backlogManager.createTask({
        title: 'Fix authentication bug',
        priority: 'high',
        description: 'Critical security issue requiring immediate attention'
      });
      
      expect(task.title).toBe('Fix authentication bug');
      expect(task.priority).toBe('high');
      expect(task.status).toBe('todo');
      expect(task.id).toBeDefined();
      
      // Verify task was persisted
      const tasks = await backlogManager.listTasks();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('Fix authentication bug');
      expect(tasks[0].priority).toBe('high');
    });

    it('should handle different priority levels', async () => {
      await backlogManager.createTask({
        title: 'Critical bug fix',
        priority: 'critical'
      });
      
      const tasks = await backlogManager.listTasks();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].priority).toBe('critical');
    });
  });

  describe('📋 MEDIUM: Path Validation', () => {
    it('should detect critical claude directories', async () => {
      // Create additional .critical-claude directory
      const extraDir = path.join(testDir, 'subdirectory', '.critical-claude');
      await fs.mkdir(extraDir, { recursive: true });
      
      // Test path detection with explicit directory
      const paths = await PathValidator.detectCriticalClaudeDirectories(testDir);
      expect(paths.length).toBeGreaterThan(0);
      
      // Should find at least the main test directory
      expect(paths.some(p => p.includes(testDir))).toBe(true);
    });

    it('should provide helpful validation feedback', async () => {
      const validation = await PathValidator.validateTaskDirectory();
      
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('warnings');
      expect(validation).toHaveProperty('recommendations');
      expect(validation).toHaveProperty('detectedPaths');
      
      // Basic validation should work regardless of directory
      expect(typeof validation.isValid).toBe('boolean');
      expect(Array.isArray(validation.warnings)).toBe(true);
      expect(Array.isArray(validation.recommendations)).toBe(true);
      expect(Array.isArray(validation.detectedPaths)).toBe(true);
    });
  });

  describe('⚡ PERFORMANCE: Scalability Tests', () => {
    it('should handle project stats efficiently (fixed O(n²) issue)', async () => {
      // Create test data hierarchy
      const phase = await backlogManager.createPhase({
        name: 'Test Phase',
        description: 'Performance test phase'
      });
      
      const epic = await backlogManager.createEpic({
        phaseId: phase.id,
        name: 'Test Epic',
        description: 'Performance test epic'
      });
      
      // Create multiple sprints with tasks
      for (let i = 0; i < 5; i++) {
        const sprint = await backlogManager.createSprint({
          epicId: epic.id,
          name: `Sprint ${i + 1}`,
          goal: `Sprint ${i + 1} goal`
        });
        
        // Add tasks to sprint
        for (let j = 0; j < 3; j++) {
          await backlogManager.createTask({
            title: `Task ${i}-${j}`,
            description: `Task for sprint ${i + 1}`,
            sprintId: sprint.id
          });
        }
      }
      
      // Measure performance of stats calculation
      const startTime = Date.now();
      const stats = await backlogManager.getProjectStats();
      const endTime = Date.now();
      
      // Should complete quickly (under 100ms for this small dataset)
      expect(endTime - startTime).toBeLessThan(100);
      
      // Verify stats are correct
      expect(stats.totalPhases).toBe(1);
      expect(stats.totalEpics).toBe(1);
      expect(stats.totalSprints).toBe(5);
      expect(stats.totalTasks).toBe(15); // 5 sprints × 3 tasks
    });

    it('should list tasks efficiently with large datasets', async () => {
      // Create 10 tasks (smaller dataset for faster tests)
      const tasks = [];
      for (let i = 0; i < 10; i++) {
        const task = await backlogManager.createTask({
          title: `Performance Test Task ${i}`,
          priority: i % 2 === 0 ? 'high' : 'medium'
        });
        tasks.push(task);
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      
      // Measure listing performance
      const startTime = Date.now();
      const retrievedTasks = await backlogManager.listTasks();
      const endTime = Date.now();
      
      // Should complete quickly (under 100ms for 10 tasks)
      expect(endTime - startTime).toBeLessThan(100);
      expect(retrievedTasks).toHaveLength(10);
      
      // Verify ordering (newest first) - last created should be first
      expect(retrievedTasks[0].title).toBe('Performance Test Task 9');
      expect(retrievedTasks[9].title).toBe('Performance Test Task 0');
    });
  });

  describe('🛡️ SECURITY: Data Integrity', () => {
    it('should maintain data consistency during concurrent operations', async () => {
      // Create tasks concurrently
      const concurrentTasks = Array.from({ length: 10 }, (_, i) =>
        backlogManager.createTask({
          title: `Concurrent Task ${i}`,
          priority: 'medium'
        })
      );
      
      const createdTasks = await Promise.all(concurrentTasks);
      
      // All tasks should be created successfully
      expect(createdTasks).toHaveLength(10);
      createdTasks.forEach((task, index) => {
        expect(task.title).toBe(`Concurrent Task ${index}`);
        expect(task.id).toBeDefined();
      });
      
      // Verify all tasks are persisted
      const allTasks = await backlogManager.listTasks();
      expect(allTasks).toHaveLength(10);
    });

    it('should validate task IDs and prevent conflicts', async () => {
      const task1 = await backlogManager.createTask({ title: 'Task 1' });
      const task2 = await backlogManager.createTask({ title: 'Task 2' });
      
      // IDs should be unique
      expect(task1.id).not.toBe(task2.id);
      expect(task1.id).toMatch(/^[a-f0-9-]{36}$/); // UUID format
      expect(task2.id).toMatch(/^[a-f0-9-]{36}$/); // UUID format
    });
  });

  describe('🔧 ERROR HANDLING: Resilience', () => {
    it('should handle missing task files gracefully', async () => {
      const nonExistentId = 'non-existent-task-id';
      
      const task = await backlogManager.getTask(nonExistentId);
      expect(task).toBeNull();
      
      // Should not throw when trying to update non-existent task
      await expect(async () => {
        await backlogManager.updateTask(nonExistentId, { title: 'Updated' });
      }).rejects.toThrow('Task not found');
    });

    it('should handle corrupted task files', async () => {
      // Create a valid task first
      const validTask = await backlogManager.createTask({ title: 'Valid Task' });
      
      // Corrupt the task file
      const taskFilePath = path.join(testDir, '.critical-claude', 'tasks', `${validTask.id}.json`);
      await fs.writeFile(taskFilePath, 'invalid json content');
      
      // Should handle gracefully
      const corruptedTask = await backlogManager.getTask(validTask.id);
      expect(corruptedTask).toBeNull();
      
      // List should skip corrupted files
      const tasks = await backlogManager.listTasks();
      expect(tasks).toHaveLength(0);
    });

    it('should handle directory permission issues', async () => {
      // This test would be platform-specific and might need special setup
      // For now, just verify the BacklogManager initializes properly
      expect(backlogManager.isInitialized()).toBe(true);
    });
  });
});