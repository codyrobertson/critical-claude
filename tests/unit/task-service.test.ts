/**
 * Task Service Unit Tests
 * Comprehensive tests for task management functionality
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { TaskService } from '../../domains/task-management/src/application/services/TaskService';
import { ITaskRepository } from '../../domains/task-management/src/domain/repositories/ITaskRepository';
import { Task, TaskId } from '../../domains/task-management/src/domain/entities/Task';

// Mock repository
class MockTaskRepository implements ITaskRepository {
  private tasks: Map<string, Task> = new Map();

  async findById(id: string): Promise<Task | null> {
    return this.tasks.get(id) || null;
  }

  async findAll(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async save(task: Task): Promise<void> {
    this.tasks.set(task.id.value, task);
  }

  async delete(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async findByStatus(status: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.status === status);
  }

  async findByAssignee(assignee: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.assignee === assignee);
  }

  async findByLabels(labels: string[]): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task =>
      labels.some(label => task.labels.includes(label))
    );
  }

  async countTotal(): Promise<number> {
    return this.tasks.size;
  }

  clear(): void {
    this.tasks.clear();
  }
}

describe('TaskService', () => {
  let taskService: TaskService;
  let mockRepository: MockTaskRepository;

  beforeEach(() => {
    mockRepository = new MockTaskRepository();
    taskService = new TaskService(mockRepository);
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      const result = await taskService.createTask({
        title: 'Test Task',
        description: 'Test Description',
        priority: 'high',
        assignee: 'test@example.com',
        labels: ['test', 'unit'],
        estimatedHours: 2
      });

      expect(result.success).toBe(true);
      expect(result.task).toBeDefined();
      expect(result.task?.title).toBe('Test Task');
      expect(result.task?.priority).toBe('high');
    });

    it('should handle missing title', async () => {
      const result = await taskService.createTask({
        title: '',
        description: 'Test Description'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('title');
    });

    it('should assign default values', async () => {
      const result = await taskService.createTask({
        title: 'Minimal Task'
      });

      expect(result.success).toBe(true);
      expect(result.task?.status).toBe('todo');
      expect(result.task?.priority).toBe('medium');
      expect(result.task?.labels).toEqual([]);
    });
  });

  describe('listTasks', () => {
    beforeEach(async () => {
      // Create test tasks
      await taskService.createTask({
        title: 'Task 1',
        status: 'todo',
        priority: 'high',
        assignee: 'user1@example.com'
      });
      
      await taskService.createTask({
        title: 'Task 2',
        status: 'in_progress',
        priority: 'medium',
        assignee: 'user2@example.com'
      });
      
      await taskService.createTask({
        title: 'Task 3',
        status: 'done',
        priority: 'low',
        assignee: 'user1@example.com'
      });
    });

    it('should list all tasks', async () => {
      const result = await taskService.listTasks();

      expect(result.success).toBe(true);
      expect(result.tasks).toHaveLength(3);
      expect(result.count).toBe(3);
    });

    it('should filter by status', async () => {
      const result = await taskService.listTasks({ status: 'todo' });

      expect(result.success).toBe(true);
      expect(result.tasks).toHaveLength(1);
      expect(result.tasks?.[0].title).toBe('Task 1');
    });

    it('should filter by assignee', async () => {
      const result = await taskService.listTasks({ assignee: 'user1@example.com' });

      expect(result.success).toBe(true);
      expect(result.tasks).toHaveLength(2);
    });

    it('should filter by priority', async () => {
      const result = await taskService.listTasks({ priority: 'high' });

      expect(result.success).toBe(true);
      expect(result.tasks).toHaveLength(1);
      expect(result.tasks?.[0].priority).toBe('high');
    });
  });

  describe('updateTask', () => {
    let taskId: string;

    beforeEach(async () => {
      const result = await taskService.createTask({
        title: 'Original Task',
        description: 'Original Description',
        status: 'todo',
        priority: 'medium'
      });
      taskId = result.task!.id.value;
    });

    it('should update task successfully', async () => {
      const result = await taskService.updateTask({
        taskId,
        title: 'Updated Task',
        status: 'in_progress',
        priority: 'high'
      });

      expect(result.success).toBe(true);
      expect(result.task?.title).toBe('Updated Task');
      expect(result.task?.status).toBe('in_progress');
      expect(result.task?.priority).toBe('high');
    });

    it('should handle partial updates', async () => {
      const result = await taskService.updateTask({
        taskId,
        status: 'done'
      });

      expect(result.success).toBe(true);
      expect(result.task?.title).toBe('Original Task');
      expect(result.task?.status).toBe('done');
    });

    it('should handle non-existent task', async () => {
      const result = await taskService.updateTask({
        taskId: 'non-existent',
        title: 'Updated'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('deleteTask', () => {
    let taskId: string;

    beforeEach(async () => {
      const result = await taskService.createTask({
        title: 'Task to Delete'
      });
      taskId = result.task!.id.value;
    });

    it('should delete task successfully', async () => {
      const result = await taskService.deleteTask({ taskId });

      expect(result.success).toBe(true);

      // Verify task is deleted
      const viewResult = await taskService.viewTask({ taskId });
      expect(viewResult.success).toBe(false);
    });

    it('should handle non-existent task', async () => {
      const result = await taskService.deleteTask({ taskId: 'non-existent' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('exportTasks', () => {
    beforeEach(async () => {
      await taskService.createTask({
        title: 'Export Task 1',
        description: 'First task for export',
        status: 'todo',
        priority: 'high',
        labels: ['export', 'test']
      });

      await taskService.createTask({
        title: 'Export Task 2',
        description: 'Second task for export',
        status: 'done',
        priority: 'medium',
        labels: ['export']
      });
    });

    it('should export tasks in JSON format', async () => {
      const result = await taskService.exportTasks({
        format: 'json',
        includeArchived: false
      });

      expect(result.success).toBe(true);
      expect(result.taskCount).toBe(2);
      expect(result.exportPath).toContain('.json');
    });

    it('should export tasks in CSV format', async () => {
      const result = await taskService.exportTasks({
        format: 'csv',
        includeArchived: true
      });

      expect(result.success).toBe(true);
      expect(result.taskCount).toBe(2);
      expect(result.exportPath).toContain('.csv');
    });

    it('should filter archived tasks', async () => {
      const result = await taskService.exportTasks({
        format: 'json',
        includeArchived: false
      });

      expect(result.success).toBe(true);
      expect(result.taskCount).toBe(2); // No archived tasks
    });
  });

  describe('backupTasks', () => {
    beforeEach(async () => {
      await taskService.createTask({
        title: 'Backup Task',
        description: 'Task for backup testing'
      });
    });

    it('should create backup successfully', async () => {
      const result = await taskService.backupTasks({
        format: 'json'
      });

      expect(result.success).toBe(true);
      expect(result.backupPath).toContain('backup-');
      expect(result.backupPath).toContain('.json');
    });

    it('should list backups', async () => {
      // Create a backup first
      await taskService.backupTasks({ format: 'json' });

      const result = await taskService.listBackups();

      expect(result.success).toBe(true);
      expect(result.backups).toBeDefined();
      expect(result.backups!.length).toBeGreaterThan(0);
    });
  });

  describe('convenience methods', () => {
    beforeEach(async () => {
      await taskService.createTask({
        title: 'High Priority Task',
        priority: 'high',
        assignee: 'test@example.com'
      });

      await taskService.createTask({
        title: 'Medium Priority Task',
        priority: 'medium',
        assignee: 'other@example.com'
      });
    });

    it('should get active task count', async () => {
      const count = await taskService.getActiveTaskCount();
      expect(count).toBe(2);
    });

    it('should get tasks by priority', async () => {
      const tasks = await taskService.getTasksByPriority('high');
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('High Priority Task');
    });

    it('should get tasks by assignee', async () => {
      const tasks = await taskService.getTasksByAssignee('test@example.com');
      expect(tasks).toHaveLength(1);
      expect(tasks[0].assignee).toBe('test@example.com');
    });
  });

  describe('error handling', () => {
    it('should handle repository errors gracefully', async () => {
      // Mock repository to throw error
      const errorRepository = {
        ...mockRepository,
        findAll: jest.fn().mockRejectedValue(new Error('Database error'))
      } as unknown as ITaskRepository;

      const errorService = new TaskService(errorRepository);
      const result = await errorService.listTasks();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
    });

    it('should validate input parameters', async () => {
      const result = await taskService.createTask({
        title: '', // Empty title should fail
        priority: 'invalid' as any // Invalid priority
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});