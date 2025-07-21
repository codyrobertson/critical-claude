/**
 * In-Memory Task Repository
 * Simple in-memory implementation for development and testing
 */

import {
  ITaskRepository,
  TaskFilter,
  TaskSort,
  PaginationOptions,
  PaginatedResult
} from '../../domain/repositories/ITaskRepository';
import { Task } from '../../domain/entities/Task';
import { TaskId } from '../../domain/value-objects/TaskId';
import { TaskStatus } from '../../domain/value-objects/TaskStatus';
import { TaskPriority } from '../../domain/value-objects/TaskPriority';

export class InMemoryTaskRepository implements ITaskRepository {
  private tasks: Map<string, Task> = new Map();
  private transactionTasks: Map<string, Task> | null = null;

  async findById(id: TaskId): Promise<Task | null> {
    const store = this.getActiveStore();
    return store.get(id.value) || null;
  }

  async findAll(
    filter?: TaskFilter,
    sort?: TaskSort,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Task>> {
    const store = this.getActiveStore();
    let tasks = Array.from(store.values());

    // Apply filters
    if (filter) {
      tasks = this.applyFilter(tasks, filter);
    }

    // Apply sorting
    if (sort) {
      tasks = this.applySort(tasks, sort);
    }

    // Calculate pagination
    const total = tasks.length;
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 50;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      items: tasks.slice(start, end),
      total,
      page,
      pageSize,
      totalPages
    };
  }

  async findByIds(ids: TaskId[]): Promise<Task[]> {
    const store = this.getActiveStore();
    const tasks: Task[] = [];
    
    for (const id of ids) {
      const task = store.get(id.value);
      if (task) {
        tasks.push(task);
      }
    }
    
    return tasks;
  }

  async search(query: string, limit?: number): Promise<Task[]> {
    const store = this.getActiveStore();
    const lowerQuery = query.toLowerCase();
    const results: Array<{ task: Task; score: number }> = [];

    for (const task of store.values()) {
      const score = this.calculateSearchScore(task, lowerQuery);
      if (score > 0) {
        results.push({ task, score });
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // Apply limit
    const tasks = results.slice(0, limit || 20).map(r => r.task);
    
    return tasks;
  }

  async save(task: Task): Promise<void> {
    const store = this.getActiveStore();
    store.set(task.id.value, task);
  }

  async saveMany(tasks: Task[]): Promise<void> {
    const store = this.getActiveStore();
    for (const task of tasks) {
      store.set(task.id.value, task);
    }
  }

  async delete(id: TaskId): Promise<void> {
    const store = this.getActiveStore();
    store.delete(id.value);
  }

  async deleteMany(ids: TaskId[]): Promise<void> {
    const store = this.getActiveStore();
    for (const id of ids) {
      store.delete(id.value);
    }
  }

  async findSubtasks(parentId: TaskId): Promise<Task[]> {
    const store = this.getActiveStore();
    const subtasks: Task[] = [];
    
    for (const task of store.values()) {
      if (task.parentId?.equals(parentId)) {
        subtasks.push(task);
      }
    }
    
    return subtasks;
  }

  async findRootTasks(): Promise<Task[]> {
    const store = this.getActiveStore();
    const rootTasks: Task[] = [];
    
    for (const task of store.values()) {
      if (!task.parentId) {
        rootTasks.push(task);
      }
    }
    
    return rootTasks;
  }

  async countByStatus(status: TaskStatus): Promise<number> {
    const store = this.getActiveStore();
    let count = 0;
    
    for (const task of store.values()) {
      if (task.status.equals(status)) {
        count++;
      }
    }
    
    return count;
  }

  async findOverdueTasks(): Promise<Task[]> {
    const store = this.getActiveStore();
    const overdueTasks: Task[] = [];
    const now = new Date();
    
    for (const task of store.values()) {
      if (task.status.isActive()) {
        const dueDate = task.metadata.customFields['dueDate'] as string | undefined;
        if (dueDate && new Date(dueDate) < now) {
          overdueTasks.push(task);
        }
      }
    }
    
    return overdueTasks;
  }

  async beginTransaction(): Promise<void> {
    if (this.transactionTasks) {
      throw new Error('Transaction already in progress');
    }
    
    // Create a copy of the current state
    this.transactionTasks = new Map(this.tasks);
  }

  async commitTransaction(): Promise<void> {
    if (!this.transactionTasks) {
      throw new Error('No transaction in progress');
    }
    
    // Replace the main store with the transaction store
    this.tasks = this.transactionTasks;
    this.transactionTasks = null;
  }

  async rollbackTransaction(): Promise<void> {
    if (!this.transactionTasks) {
      throw new Error('No transaction in progress');
    }
    
    // Discard the transaction store
    this.transactionTasks = null;
  }

  private getActiveStore(): Map<string, Task> {
    return this.transactionTasks || this.tasks;
  }

  private applyFilter(tasks: Task[], filter: TaskFilter): Task[] {
    return tasks.filter(task => {
      // Status filter
      if (filter.status && filter.status.length > 0) {
        const hasStatus = filter.status.some(s => task.status.equals(s));
        if (!hasStatus) return false;
      }

      // Priority filter
      if (filter.priority && filter.priority.length > 0) {
        const hasPriority = filter.priority.some(p => task.priority.equals(p));
        if (!hasPriority) return false;
      }

      // Tags filter
      if (filter.tags && filter.tags.length > 0) {
        const hasTags = filter.tags.some(tag => task.tags.has(tag));
        if (!hasTags) return false;
      }

      // Search filter
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const matches = 
          task.title.toLowerCase().includes(searchLower) ||
          task.description.toLowerCase().includes(searchLower);
        if (!matches) return false;
      }

      // Parent ID filter
      if (filter.parentId) {
        if (!task.parentId || !task.parentId.equals(filter.parentId)) {
          return false;
        }
      }

      // Has subtasks filter
      if (filter.hasSubtasks !== undefined) {
        const hasSubtasks = task.subtasks.length > 0;
        if (hasSubtasks !== filter.hasSubtasks) return false;
      }

      // Date filters
      if (filter.createdAfter && task.createdAt < filter.createdAfter) return false;
      if (filter.createdBefore && task.createdAt > filter.createdBefore) return false;
      if (filter.updatedAfter && task.updatedAt < filter.updatedAfter) return false;
      if (filter.updatedBefore && task.updatedAt > filter.updatedBefore) return false;

      return true;
    });
  }

  private applySort(tasks: Task[], sort: TaskSort): Task[] {
    const sorted = [...tasks];
    const multiplier = sort.direction === 'asc' ? 1 : -1;

    sorted.sort((a, b) => {
      switch (sort.field) {
        case 'createdAt':
          return (a.createdAt.getTime() - b.createdAt.getTime()) * multiplier;
        
        case 'updatedAt':
          return (a.updatedAt.getTime() - b.updatedAt.getTime()) * multiplier;
        
        case 'priority':
          return (a.priority.getOrder() - b.priority.getOrder()) * multiplier;
        
        case 'title':
          return a.title.localeCompare(b.title) * multiplier;
        
        case 'status':
          return a.status.value.localeCompare(b.status.value) * multiplier;
        
        default:
          return 0;
      }
    });

    return sorted;
  }

  private calculateSearchScore(task: Task, query: string): number {
    let score = 0;

    // Title match (highest weight)
    if (task.title.toLowerCase().includes(query)) {
      score += 10;
      if (task.title.toLowerCase().startsWith(query)) {
        score += 5;
      }
    }

    // Description match
    if (task.description.toLowerCase().includes(query)) {
      score += 5;
    }

    // Tag match
    for (const tag of task.tags) {
      if (tag.toLowerCase().includes(query)) {
        score += 3;
      }
    }

    // Status/Priority match
    if (task.status.value.includes(query)) score += 2;
    if (task.priority.value.includes(query)) score += 2;

    return score;
  }

  // Helper method for seeding test data
  async seed(tasks: Task[]): Promise<void> {
    for (const task of tasks) {
      await this.save(task);
    }
  }

  // Helper method for clearing all data
  async clear(): Promise<void> {
    this.tasks.clear();
  }
}