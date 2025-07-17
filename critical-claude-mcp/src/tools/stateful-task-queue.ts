/**
 * Stateful Task Queue System for Critical Claude
 * Provides persistent, hook-integrated task management
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../logger.js';

export interface QueuedTask {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
  assignee?: string;
  tags: string[];
  dependencies: string[]; // Task IDs that must be completed first
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  projectPath?: string;
  sourceType: 'manual' | 'claude_code' | 'hook' | 'api';
  sourceData?: any; // Original data from source system
  subtasks: QueuedTask[];
  comments: TaskComment[];
  stateHistory: TaskStateChange[];
}

export interface TaskComment {
  id: string;
  content: string;
  author: string;
  timestamp: string;
  type: 'note' | 'status_change' | 'system';
}

export interface TaskStateChange {
  timestamp: string;
  fromStatus: string;
  toStatus: string;
  reason?: string;
  triggeredBy: 'user' | 'system' | 'hook';
}

export interface TaskQueue {
  id: string;
  name: string;
  description: string;
  tasks: QueuedTask[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    totalTasks: number;
    completedTasks: number;
    activeUsers: string[];
  };
}

export interface QueueOptions {
  persistencePath?: string;
  autoSave?: boolean;
  enableHooks?: boolean;
  syncWithClaudeCode?: boolean;
}

export class StatefulTaskQueue extends EventEmitter {
  private queue: TaskQueue;
  private persistencePath: string;
  private autoSave: boolean;
  private enableHooks: boolean;
  private syncWithClaudeCode: boolean;
  private saveTimeout?: NodeJS.Timeout;

  constructor(queueName: string = 'default', options: QueueOptions = {}) {
    super();
    
    this.persistencePath = options.persistencePath || 
      path.join(os.homedir(), '.critical-claude', 'queues', `${queueName}.json`);
    this.autoSave = options.autoSave !== false;
    this.enableHooks = options.enableHooks || false;
    this.syncWithClaudeCode = options.syncWithClaudeCode || false;

    this.queue = {
      id: uuidv4(),
      name: queueName,
      description: `Task queue for ${queueName}`,
      tasks: [],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalTasks: 0,
        completedTasks: 0,
        activeUsers: []
      }
    };
  }

  async initialize(): Promise<void> {
    try {
      // Ensure persistence directory exists
      await fs.mkdir(path.dirname(this.persistencePath), { recursive: true });

      // Load existing queue if it exists
      await this.loadQueue();

      // Setup hook integration if enabled
      if (this.enableHooks) {
        await this.setupHookIntegration();
      }

      // Setup Claude Code sync if enabled
      if (this.syncWithClaudeCode) {
        await this.setupClaudeCodeSync();
      }

      logger.info('Task queue initialized', {
        name: this.queue.name,
        taskCount: this.queue.tasks.length,
        persistencePath: this.persistencePath
      });
    } catch (error) {
      logger.error('Failed to initialize task queue', error as Error);
      throw error;
    }
  }

  async addTask(taskData: Partial<QueuedTask>): Promise<QueuedTask> {
    const task: QueuedTask = {
      id: taskData.id || uuidv4(),
      title: taskData.title || 'Untitled Task',
      description: taskData.description,
      priority: taskData.priority || 'medium',
      status: taskData.status || 'pending',
      assignee: taskData.assignee,
      tags: taskData.tags || [],
      dependencies: taskData.dependencies || [],
      dueDate: taskData.dueDate,
      estimatedHours: taskData.estimatedHours,
      actualHours: taskData.actualHours,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      projectPath: taskData.projectPath || process.cwd(),
      sourceType: taskData.sourceType || 'manual',
      sourceData: taskData.sourceData,
      subtasks: taskData.subtasks || [],
      comments: [],
      stateHistory: [{
        timestamp: new Date().toISOString(),
        fromStatus: 'none',
        toStatus: taskData.status || 'pending',
        triggeredBy: 'user'
      }]
    };

    // Check dependencies
    if (task.dependencies.length > 0) {
      const unresolvedDeps = task.dependencies.filter(depId => 
        !this.queue.tasks.find(t => t.id === depId && t.status === 'completed')
      );
      
      if (unresolvedDeps.length > 0) {
        task.status = 'blocked';
        task.comments.push({
          id: uuidv4(),
          content: `Task blocked by unresolved dependencies: ${unresolvedDeps.join(', ')}`,
          author: 'system',
          timestamp: new Date().toISOString(),
          type: 'system'
        });
      }
    }

    this.queue.tasks.push(task);
    this.updateMetadata();
    
    this.emit('taskAdded', task);
    
    if (this.autoSave) {
      this.scheduleSave();
    }

    logger.info('Task added to queue', { taskId: task.id, title: task.title });
    return task;
  }

  async updateTask(taskId: string, updates: Partial<QueuedTask>): Promise<QueuedTask> {
    const taskIndex = this.queue.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const task = this.queue.tasks[taskIndex];
    const oldStatus = task.status;
    
    // Apply updates
    Object.assign(task, updates, {
      id: task.id, // Preserve ID
      updatedAt: new Date().toISOString()
    });

    // Record status change if applicable
    if (updates.status && updates.status !== oldStatus) {
      task.stateHistory.push({
        timestamp: new Date().toISOString(),
        fromStatus: oldStatus,
        toStatus: updates.status,
        reason: updates.description ? 'Status updated' : undefined,
        triggeredBy: 'user'
      });

      if (updates.status === 'completed') {
        task.completedAt = new Date().toISOString();
        
        // Check if this completion unblocks other tasks
        await this.checkAndUnblockDependentTasks(taskId);
      }
    }

    this.updateMetadata();
    this.emit('taskUpdated', task, oldStatus);
    
    if (this.autoSave) {
      this.scheduleSave();
    }

    logger.info('Task updated', { taskId, status: task.status });
    return task;
  }

  async deleteTask(taskId: string): Promise<boolean> {
    const taskIndex = this.queue.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      return false;
    }

    const task = this.queue.tasks[taskIndex];
    
    // Check if other tasks depend on this one
    const dependentTasks = this.queue.tasks.filter(t => 
      t.dependencies.includes(taskId) && t.status !== 'completed'
    );

    if (dependentTasks.length > 0) {
      throw new Error(`Cannot delete task: ${dependentTasks.length} tasks depend on it`);
    }

    this.queue.tasks.splice(taskIndex, 1);
    this.updateMetadata();
    
    this.emit('taskDeleted', task);
    
    if (this.autoSave) {
      this.scheduleSave();
    }

    logger.info('Task deleted', { taskId });
    return true;
  }

  async addComment(taskId: string, content: string, author: string = 'user'): Promise<TaskComment> {
    const task = this.queue.tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const comment: TaskComment = {
      id: uuidv4(),
      content,
      author,
      timestamp: new Date().toISOString(),
      type: 'note'
    };

    task.comments.push(comment);
    task.updatedAt = new Date().toISOString();
    
    this.emit('commentAdded', task, comment);
    
    if (this.autoSave) {
      this.scheduleSave();
    }

    return comment;
  }

  getTasks(filters?: {
    status?: string;
    priority?: string;
    assignee?: string;
    tags?: string[];
    projectPath?: string;
  }): QueuedTask[] {
    let filteredTasks = [...this.queue.tasks];

    if (filters) {
      if (filters.status) {
        filteredTasks = filteredTasks.filter(t => t.status === filters.status);
      }
      if (filters.priority) {
        filteredTasks = filteredTasks.filter(t => t.priority === filters.priority);
      }
      if (filters.assignee) {
        filteredTasks = filteredTasks.filter(t => t.assignee === filters.assignee);
      }
      if (filters.tags && filters.tags.length > 0) {
        filteredTasks = filteredTasks.filter(t => 
          filters.tags!.some(tag => t.tags.includes(tag))
        );
      }
      if (filters.projectPath) {
        filteredTasks = filteredTasks.filter(t => t.projectPath === filters.projectPath);
      }
    }

    // Sort by priority and creation date
    return filteredTasks.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  getTask(taskId: string): QueuedTask | undefined {
    return this.queue.tasks.find(t => t.id === taskId);
  }

  getQueueStats(): {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    blocked: number;
    byPriority: Record<string, number>;
    avgCompletionTime?: number;
  } {
    const tasks = this.queue.tasks;
    const stats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      blocked: tasks.filter(t => t.status === 'blocked').length,
      byPriority: {
        critical: tasks.filter(t => t.priority === 'critical').length,
        high: tasks.filter(t => t.priority === 'high').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        low: tasks.filter(t => t.priority === 'low').length
      },
      avgCompletionTime: undefined as number | undefined
    };

    // Calculate average completion time
    const completedTasks = tasks.filter(t => t.status === 'completed' && t.completedAt);
    if (completedTasks.length > 0) {
      const totalTime = completedTasks.reduce((sum, task) => {
        const created = new Date(task.createdAt).getTime();
        const completed = new Date(task.completedAt!).getTime();
        return sum + (completed - created);
      }, 0);
      
      stats.avgCompletionTime = totalTime / completedTasks.length / (1000 * 60 * 60); // Hours
    }

    return stats;
  }

  async syncWithClaudeCodeTodos(): Promise<{ imported: number; exported: number }> {
    let imported = 0;
    let exported = 0;

    try {
      // Export to Claude Code format
      const claudeCodeTodos = this.queue.tasks.map(task => ({
        id: task.id,
        content: task.title,
        status: this.mapStatusToClaudeCode(task.status),
        priority: task.priority,
        description: task.description,
        tags: task.tags,
        assignee: task.assignee,
        dueDate: task.dueDate,
        projectPath: task.projectPath
      }));

      const claudeDir = path.join(os.homedir(), '.claude');
      const exportFile = path.join(claudeDir, 'critical-claude-tasks.json');
      
      await fs.mkdir(claudeDir, { recursive: true });
      await fs.writeFile(exportFile, JSON.stringify({
        lastSync: new Date().toISOString(),
        tasks: claudeCodeTodos
      }, null, 2));

      exported = claudeCodeTodos.length;

      // Import from Claude Code if available
      const importFile = path.join(claudeDir, 'claude-code-todos.json');
      try {
        const importData = JSON.parse(await fs.readFile(importFile, 'utf8'));
        
        for (const todo of importData.todos || []) {
          // Check if task already exists
          const existingTask = this.queue.tasks.find(t => 
            t.sourceType === 'claude_code' && t.sourceData?.originalId === todo.id
          );

          if (!existingTask) {
            await this.addTask({
              title: todo.content || 'Imported Task',
              description: todo.description,
              priority: this.mapPriorityFromClaudeCode(todo.priority),
              status: this.mapStatusFromClaudeCode(todo.status),
              tags: todo.tags || [],
              sourceType: 'claude_code',
              sourceData: { originalId: todo.id, originalData: todo }
            });
            imported++;
          }
        }
      } catch {
        // No Claude Code todos to import
      }

      logger.info('Claude Code sync completed', { imported, exported });
      this.emit('claudeCodeSynced', { imported, exported });

    } catch (error) {
      logger.error('Claude Code sync failed', error as Error);
    }

    return { imported, exported };
  }

  private async checkAndUnblockDependentTasks(completedTaskId: string): Promise<void> {
    const dependentTasks = this.queue.tasks.filter(t => 
      t.dependencies.includes(completedTaskId) && t.status === 'blocked'
    );

    for (const task of dependentTasks) {
      // Check if all dependencies are now complete
      const unresolvedDeps = task.dependencies.filter(depId => 
        !this.queue.tasks.find(t => t.id === depId && t.status === 'completed')
      );

      if (unresolvedDeps.length === 0) {
        await this.updateTask(task.id, { 
          status: 'pending',
          updatedAt: new Date().toISOString()
        });

        task.comments.push({
          id: uuidv4(),
          content: 'Task unblocked - all dependencies completed',
          author: 'system',
          timestamp: new Date().toISOString(),
          type: 'system'
        });
      }
    }
  }

  private updateMetadata(): void {
    this.queue.metadata.updatedAt = new Date().toISOString();
    this.queue.metadata.totalTasks = this.queue.tasks.length;
    this.queue.metadata.completedTasks = this.queue.tasks.filter(t => t.status === 'completed').length;
  }

  private scheduleSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(() => {
      this.saveQueue().catch(error => {
        logger.error('Failed to auto-save queue', error as Error);
      });
    }, 1000); // Debounce saves
  }

  private async loadQueue(): Promise<void> {
    try {
      const content = await fs.readFile(this.persistencePath, 'utf8');
      const savedQueue = JSON.parse(content);
      
      // Merge with current queue, preserving any runtime data
      this.queue = {
        ...this.queue,
        ...savedQueue,
        metadata: {
          ...this.queue.metadata,
          ...savedQueue.metadata
        }
      };

      logger.info('Queue loaded from persistence', { 
        taskCount: this.queue.tasks.length,
        path: this.persistencePath 
      });
    } catch (error) {
      // File doesn't exist or is corrupted, start with empty queue
      logger.info('Starting with new queue (no existing data found)');
    }
  }

  async saveQueue(): Promise<void> {
    try {
      await fs.writeFile(this.persistencePath, JSON.stringify(this.queue, null, 2));
      logger.debug('Queue saved to persistence', { path: this.persistencePath });
    } catch (error) {
      logger.error('Failed to save queue', error as Error);
      throw error;
    }
  }

  private async setupHookIntegration(): Promise<void> {
    // Setup hook listeners for task state changes
    this.on('taskAdded', (task) => {
      this.triggerHook('task_added', { task });
    });

    this.on('taskUpdated', (task, oldStatus) => {
      this.triggerHook('task_updated', { task, oldStatus });
    });

    this.on('taskDeleted', (task) => {
      this.triggerHook('task_deleted', { task });
    });

    logger.info('Hook integration enabled');
  }

  private async setupClaudeCodeSync(): Promise<void> {
    // Setup periodic sync with Claude Code
    setInterval(async () => {
      try {
        await this.syncWithClaudeCodeTodos();
      } catch (error) {
        logger.error('Periodic Claude Code sync failed', error as Error);
      }
    }, 30000); // Sync every 30 seconds

    logger.info('Claude Code sync enabled');
  }

  private triggerHook(event: string, data: any): void {
    try {
      const hookData = {
        timestamp: new Date().toISOString(),
        event,
        source: 'critical_claude_task_queue',
        data
      };

      // Write to hook file for external processing
      const hookFile = path.join(os.homedir(), '.critical-claude', 'hooks', 'queue-events.json');
      fs.writeFile(hookFile, JSON.stringify(hookData, null, 2)).catch(error => {
        logger.warn('Failed to write hook data', error as Error);
      });

      this.emit('hookTriggered', event, data);
    } catch (error) {
      logger.error('Hook trigger failed', error as Error);
    }
  }

  private mapStatusToClaudeCode(status: string): string {
    switch (status) {
      case 'pending': return 'pending';
      case 'in_progress': return 'in_progress';
      case 'completed': return 'completed';
      case 'blocked': return 'pending'; // Map blocked to pending for Claude Code
      case 'cancelled': return 'pending';
      default: return 'pending';
    }
  }

  private mapStatusFromClaudeCode(status: string): QueuedTask['status'] {
    switch (status) {
      case 'pending': return 'pending';
      case 'in_progress': return 'in_progress';
      case 'completed': return 'completed';
      default: return 'pending';
    }
  }

  private mapPriorityFromClaudeCode(priority: string): QueuedTask['priority'] {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  }
}