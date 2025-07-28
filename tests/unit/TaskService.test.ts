import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskService } from '../../src/services/TaskService.js';
import { FileStorage } from '../../src/storage/FileStorage.js';

// Mock FileStorage
const mockStorage = {
  save: vi.fn(),
  findById: vi.fn(),
  findAll: vi.fn(),
  delete: vi.fn(),
  ensureDirectory: vi.fn()
};

vi.mock('../../src/storage/FileStorage.js', () => ({
  FileStorage: vi.fn().mockImplementation(() => mockStorage)
}));

describe('TaskService', () => {
  let taskService: TaskService;
  let storage: FileStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    storage = new FileStorage();
    taskService = new TaskService(storage);
  });

  describe('createTask', () => {
    it('should create task with minimal data', async () => {
      mockStorage.save.mockResolvedValue({ success: true });

      const result = await taskService.createTask({
        title: 'Test Task'
      });

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Test Task');
      expect(result.data?.status).toBe('todo');
      expect(result.data?.priority).toBe('medium');
      expect(result.data?.id).toMatch(/^test-task-\d{8}-\d{6}$/);
      expect(mockStorage.save).toHaveBeenCalledWith('tasks', expect.any(String), expect.any(Object));
    });

    it('should create task with all properties', async () => {
      mockStorage.save.mockResolvedValue({ success: true });

      const result = await taskService.createTask({
        title: 'Complex Task',
        description: 'Detailed description',
        priority: 'high',
        status: 'in_progress',
        assignee: 'John Doe',
        labels: ['urgent', 'bug'],
        estimatedHours: 4
      });

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Complex Task');
      expect(result.data?.description).toBe('Detailed description');
      expect(result.data?.priority).toBe('high');
      expect(result.data?.status).toBe('in_progress');
      expect(result.data?.assignee).toBe('John Doe');
      expect(result.data?.labels).toEqual(['urgent', 'bug']);
      expect(result.data?.estimatedHours).toBe(4);
    });

    it('should validate required title', async () => {
      const result = await taskService.createTask({
        title: ''
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Task title is required');
      expect(mockStorage.save).not.toHaveBeenCalled();
    });

    it('should accept valid priority values', async () => {
      mockStorage.save.mockResolvedValue(undefined);

      const result = await taskService.createTask({
        title: 'Test Task',
        priority: 'high'
      });

      expect(result.success).toBe(true);
      expect(result.data?.priority).toBe('high');
    });

    it('should accept valid status values', async () => {
      mockStorage.save.mockResolvedValue(undefined);

      const result = await taskService.createTask({
        title: 'Test Task',
        status: 'in_progress'
      });

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('in_progress');
    });

    it('should handle storage errors', async () => {
      mockStorage.save.mockRejectedValue(new Error('Storage failed'));

      const result = await taskService.createTask({
        title: 'Test Task'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create task: Storage failed');
    });
  });

  describe('listTasks', () => {
    it('should list all tasks without filters', async () => {
      const mockTasks = [
        { id: 'task-1', title: 'Task 1', status: 'todo', priority: 'medium' },
        { id: 'task-2', title: 'Task 2', status: 'done', priority: 'high' }
      ];
      mockStorage.findAll.mockResolvedValue(mockTasks);

      const result = await taskService.listTasks({});

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTasks);
      expect(mockStorage.findAll).toHaveBeenCalledWith('tasks');
    });

    it('should filter tasks by status', async () => {
      const mockTasks = [
        { id: 'task-1', title: 'Task 1', status: 'todo', priority: 'medium' },
        { id: 'task-2', title: 'Task 2', status: 'done', priority: 'high' }
      ];
      mockStorage.findAll.mockResolvedValue(mockTasks);

      const result = await taskService.listTasks({ status: 'todo' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].status).toBe('todo');
    });

    it('should filter tasks by priority', async () => {
      const mockTasks = [
        { id: 'task-1', title: 'Task 1', status: 'todo', priority: 'medium' },
        { id: 'task-2', title: 'Task 2', status: 'done', priority: 'high' }
      ];
      mockStorage.findAll.mockResolvedValue(mockTasks);

      const result = await taskService.listTasks({ priority: 'high' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].priority).toBe('high');
    });

    it('should filter tasks by assignee', async () => {
      const mockTasks = [
        { id: 'task-1', title: 'Task 1', assignee: 'John Doe' },
        { id: 'task-2', title: 'Task 2', assignee: 'Jane Smith' }
      ];
      mockStorage.findAll.mockResolvedValue(mockTasks);

      const result = await taskService.listTasks({ assignee: 'John Doe' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].assignee).toBe('John Doe');
    });

    it('should filter tasks by labels', async () => {
      const mockTasks = [
        { id: 'task-1', title: 'Task 1', labels: ['bug', 'urgent'] },
        { id: 'task-2', title: 'Task 2', labels: ['feature'] }
      ];
      mockStorage.findAll.mockResolvedValue(mockTasks);

      const result = await taskService.listTasks({ labels: ['bug'] });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].labels).toContain('bug');
    });

    it('should handle storage errors', async () => {
      mockStorage.findAll.mockRejectedValue(new Error('Storage failed'));

      const result = await taskService.listTasks({});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to list tasks: Storage failed');
    });
  });

  describe('viewTask', () => {
    it('should return task by ID', async () => {
      const mockTask = { id: 'task-1', title: 'Test Task' };
      mockStorage.findById.mockResolvedValue(mockTask);

      const result = await taskService.viewTask('task-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTask);
      expect(mockStorage.findById).toHaveBeenCalledWith('tasks', 'task-1');
    });

    it('should handle task not found', async () => {
      mockStorage.findById.mockResolvedValue(null);

      const result = await taskService.viewTask('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Task with ID nonexistent not found');
    });
  });

  describe('updateTask', () => {
    it('should update existing task', async () => {
      const existingTask = {
        id: 'task-1',
        title: 'Original Title',
        description: 'Original description',
        status: 'todo' as const,
        priority: 'medium' as const,
        labels: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      };
      
      mockStorage.findById.mockResolvedValue(existingTask);
      mockStorage.save.mockResolvedValue(undefined);

      const result = await taskService.updateTask('task-1', {
        title: 'Updated Title',
        status: 'in_progress'
      });

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Updated Title');
      expect(result.data?.status).toBe('in_progress');
      expect(result.data?.priority).toBe('medium'); // unchanged
      expect(result.data?.updatedAt).not.toBe(existingTask.updatedAt);
    });

    it('should handle task not found for update', async () => {
      mockStorage.findById.mockResolvedValue(null);

      const result = await taskService.updateTask('nonexistent', { title: 'New Title' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Task with ID nonexistent not found');
    });
  });

  describe('deleteTask', () => {
    it('should delete existing task', async () => {
      mockStorage.delete.mockResolvedValue(true);

      const result = await taskService.deleteTask('task-1');

      expect(result.success).toBe(true);
      expect(mockStorage.delete).toHaveBeenCalledWith('tasks', 'task-1');
    });

    it('should handle task not found for delete', async () => {
      mockStorage.delete.mockResolvedValue(false);

      const result = await taskService.deleteTask('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Task with ID nonexistent not found');
    });
  });

  describe('getTaskStats', () => {
    it('should calculate task statistics', async () => {
      const mockTasks = [
        { status: 'todo', priority: 'high' },
        { status: 'todo', priority: 'medium' },
        { status: 'in_progress', priority: 'high' },
        { status: 'done', priority: 'low' },
        { status: 'blocked', priority: 'high' },
        { status: 'archived', priority: 'low' }
      ];
      mockStorage.findAll.mockResolvedValue(mockTasks);

      const result = await taskService.getTaskStats();

      expect(result.success).toBe(true);
      expect(result.data?.total).toBe(6);
      expect(result.data?.todo).toBe(2);
      expect(result.data?.in_progress).toBe(1);
      expect(result.data?.done).toBe(1);
      expect(result.data?.blocked).toBe(1);
      expect(result.data?.archived).toBe(1);
    });
  });
});