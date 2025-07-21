/**
 * Task Repository Adapter
 * Adapts between Critical Claude storage and viewer domain model
 */

import { ITaskRepository, TaskFilter, TaskSort, PaginationOptions, PaginatedResult } from '../../domain/repositories/ITaskRepository';
import { Task } from '../../domain/entities/Task';
import { TaskId } from '../../domain/value-objects/TaskId';
import { TaskStatus } from '../../domain/value-objects/TaskStatus';
import { TaskPriority } from '../../domain/value-objects/TaskPriority';
import { TaskMetadata } from '../../domain/value-objects/TaskMetadata';
import { UnifiedStorageManager } from '../../../core/unified-storage';
import { CommonTask, TaskListOptions, TaskFilter as StorageFilter } from '../../../types/common-task';

export class TaskRepositoryAdapter implements ITaskRepository {
  private storage: UnifiedStorageManager;
  private initialized: boolean = false;

  constructor() {
    this.storage = new UnifiedStorageManager();
  }

  async initialize(): Promise<void> {
    if (!this.initialized) {
      await this.storage.initialize();
      this.initialized = true;
    }
  }

  // ITaskRepository implementation
  async findById(id: TaskId): Promise<Task | null> {
    await this.initialize();
    const commonTask = await this.storage.getTask(id.value);
    return commonTask ? this.convertFromCommonTask(commonTask) : null;
  }

  async findAll(
    filter?: TaskFilter,
    sort?: TaskSort,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Task>> {
    await this.initialize();

    // Convert filter to storage format
    const storageFilter: StorageFilter = {};
    if (filter) {
      if (filter.status && filter.status.length > 0) {
        // Take first status only as storage doesn't support array
        storageFilter.status = this.mapStatusToString(filter.status[0]) as any;
      }
      if (filter.priority && filter.priority.length > 0) {
        // Take first priority only
        storageFilter.priority = this.mapPriorityToString(filter.priority[0]) as any;
      }
      if (filter.tags && filter.tags.length > 0) {
        storageFilter.labels = filter.tags;
      }
    }

    const options: TaskListOptions = {
      filter: storageFilter,
      sortBy: sort?.field || 'updatedAt',
      sortOrder: sort?.direction || 'desc',
      plain: false
    };

    const tasks = await this.storage.listTasks(options);
    
    // Apply pagination in memory
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    
    const paginatedTasks = tasks.slice(startIdx, endIdx);
    const domainTasks = paginatedTasks.map(t => this.convertFromCommonTask(t));

    return {
      items: domainTasks,
      total: tasks.length,
      page,
      pageSize,
      totalPages: Math.ceil(tasks.length / pageSize)
    };
  }

  async findByIds(ids: TaskId[]): Promise<Task[]> {
    await this.initialize();
    const tasks = await Promise.all(
      ids.map(id => this.storage.getTask(id.value))
    );
    return tasks
      .filter((t): t is CommonTask => t !== null)
      .map(t => this.convertFromCommonTask(t));
  }

  async search(query: string, limit?: number): Promise<Task[]> {
    await this.initialize();
    
    // Get all tasks and filter in memory
    const allTasks = await this.storage.listTasks({
      filter: {},
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      plain: false
    });
    
    const lowerQuery = query.toLowerCase();
    const filtered = allTasks.filter(task =>
      task.title.toLowerCase().includes(lowerQuery) ||
      (task.description?.toLowerCase().includes(lowerQuery) ?? false) ||
      task.labels.some(label => label.toLowerCase().includes(lowerQuery))
    );
    
    const limitedTasks = limit ? filtered.slice(0, limit) : filtered;
    return limitedTasks.map(t => this.convertFromCommonTask(t));
  }

  async save(task: Task): Promise<void> {
    await this.initialize();
    
    // Check if task exists
    const existing = await this.storage.getTask(task.id.value);
    
    if (existing) {
      // Update existing task
      await this.storage.updateTask({
        id: task.id.value,
        title: task.title,
        description: task.description || undefined,
        status: this.mapStatusToString(task.status) as any,
        priority: this.mapPriorityToString(task.priority) as any,
        assignee: task.metadata.source || undefined,
        labels: Array.from(task.tags),
        storyPoints: task.metadata.estimatedDuration ? Math.ceil(task.metadata.estimatedDuration / 60) : undefined,
        estimatedHours: task.metadata.estimatedDuration ? task.metadata.estimatedDuration / 60 : undefined
      });
    } else {
      // Create new task
      await this.storage.createTask({
        title: task.title,
        description: task.description || undefined,
        status: this.mapStatusToString(task.status) as any,
        priority: this.mapPriorityToString(task.priority) as any,
        assignee: task.metadata.source || undefined,
        labels: Array.from(task.tags),
        storyPoints: task.metadata.estimatedDuration ? Math.ceil(task.metadata.estimatedDuration / 60) : undefined,
        estimatedHours: task.metadata.estimatedDuration ? task.metadata.estimatedDuration / 60 : undefined,
        draft: false,
        aiGenerated: false,
        source: 'manual'
      });
    }
  }

  async saveMany(tasks: Task[]): Promise<void> {
    await this.initialize();
    for (const task of tasks) {
      await this.save(task);
    }
  }

  async delete(id: TaskId): Promise<void> {
    await this.initialize();
    await this.storage.deleteTask(id.value);
  }

  async deleteMany(ids: TaskId[]): Promise<void> {
    await this.initialize();
    for (const id of ids) {
      await this.storage.deleteTask(id.value);
    }
  }

  async findSubtasks(parentId: TaskId): Promise<Task[]> {
    await this.initialize();
    
    // Search for tasks with parent label
    const tasks = await this.storage.listTasks({
      filter: {
        labels: [`parent:${parentId.value}`]
      },
      sortBy: 'createdAt',
      sortOrder: 'asc',
      plain: false
    });
    
    return tasks.map(t => this.convertFromCommonTask(t));
  }

  async findRootTasks(): Promise<Task[]> {
    await this.initialize();
    
    // Get all tasks without parent labels
    const allTasks = await this.storage.listTasks({
      filter: {},
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      plain: false
    });
    
    const rootTasks = allTasks.filter(task =>
      !task.labels.some(label => label.startsWith('parent:'))
    );
    
    return rootTasks.map(t => this.convertFromCommonTask(t));
  }

  async countByStatus(status: TaskStatus): Promise<number> {
    await this.initialize();
    
    const tasks = await this.storage.listTasks({
      filter: {
        status: this.mapStatusToString(status) as any
      },
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      plain: false
    });
    
    return tasks.length;
  }

  async findOverdueTasks(): Promise<Task[]> {
    await this.initialize();
    
    // Get in-progress tasks
    const tasks = await this.storage.listTasks({
      filter: {
        status: 'in_progress'
      },
      sortBy: 'createdAt',
      sortOrder: 'asc',
      plain: false
    });
    
    // Filter for overdue (more than 7 days old)
    const overdueTasks = tasks.filter(task => {
      const daysOld = (Date.now() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysOld > 7;
    });
    
    return overdueTasks.map(t => this.convertFromCommonTask(t));
  }

  // Transaction support (no-op for current storage)
  async beginTransaction(): Promise<void> {
    // No-op
  }

  async commitTransaction(): Promise<void> {
    // No-op
  }

  async rollbackTransaction(): Promise<void> {
    // No-op
  }

  // Conversion helpers
  private convertFromCommonTask(commonTask: CommonTask): Task {
    // Extract parent ID from labels if present
    const parentLabel = commonTask.labels.find(l => l.startsWith('parent:'));
    const parentId = parentLabel ? new TaskId(parentLabel.substring(7)) : undefined;
    
    // Extract subtask IDs from dependencies that are labeled as children
    const subtaskIds = (commonTask.dependencies || []).map(dep => new TaskId(dep));
    
    return new Task(
      new TaskId(commonTask.id),
      commonTask.title,
      commonTask.description || '',
      this.mapStringToStatus(commonTask.status),
      this.mapStringToPriority(commonTask.priority),
      new TaskMetadata(
        commonTask.assignee || 'General',
        commonTask.epicId || 'General',
        (commonTask.estimatedHours || 0) * 60, // Convert to minutes
        commonTask.actualHours ? commonTask.actualHours * 60 : undefined
      ),
      new Date(commonTask.createdAt),
      new Date(commonTask.updatedAt),
      commonTask.status === 'done' ? new Date(commonTask.updatedAt) : undefined,
      new Set(commonTask.labels.filter(l => !l.startsWith('parent:'))),
      subtaskIds,
      parentId
    );
  }

  private mapStatusToString(status: TaskStatus): string {
    if (status.equals(TaskStatus.pending())) return 'todo';
    if (status.equals(TaskStatus.inProgress())) return 'in_progress';
    if (status.equals(TaskStatus.completed())) return 'done';
    if (status.equals(TaskStatus.blocked())) return 'blocked';
    return 'todo';
  }

  private mapStringToStatus(status: string): TaskStatus {
    switch (status) {
      case 'todo': return TaskStatus.pending();
      case 'in_progress': return TaskStatus.inProgress();
      case 'done': return TaskStatus.completed();
      case 'blocked': return TaskStatus.blocked();
      default: return TaskStatus.pending();
    }
  }

  private mapPriorityToString(priority: TaskPriority): string {
    if (priority.equals(TaskPriority.critical())) return 'critical';
    if (priority.equals(TaskPriority.high())) return 'high';
    if (priority.equals(TaskPriority.medium())) return 'medium';
    if (priority.equals(TaskPriority.low())) return 'low';
    return 'medium';
  }

  private mapStringToPriority(priority: string): TaskPriority {
    switch (priority) {
      case 'critical': return TaskPriority.critical();
      case 'high': return TaskPriority.high();
      case 'medium': return TaskPriority.medium();
      case 'low': return TaskPriority.low();
      default: return TaskPriority.medium();
    }
  }
}