/**
 * Task Manager for Critical Claude MCP Integration
 * Provides direct task management within Claude conversations
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../logger.js';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  assignee?: string;
  tags: string[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  projectPath?: string;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  assignee?: string;
  tags?: string[];
}

export interface TaskAction {
  action: 'list' | 'create' | 'update' | 'delete' | 'sync' | 'status';
  taskData?: Partial<Task>;
  filters?: TaskFilters;
  syncDirection?: 'to_claude' | 'from_claude' | 'bidirectional';
}

export interface TaskResult {
  success: boolean;
  task?: Task;
  tasks?: Task[];
  totalTasks?: number;
  completedTasks?: number;
  inProgressTasks?: number;
  pendingTasks?: number;
  syncedCount?: number;
  conflicts?: number;
  claudeCodeSynced?: boolean;
  errors?: string[];
}

export class TaskManager {
  private config: any;
  private tasksDir: string;

  constructor(config: any = {}) {
    this.config = config;
    this.tasksDir = path.join(os.homedir(), '.critical-claude', 'tasks');
  }

  async handleAction(action: TaskAction): Promise<TaskResult> {
    try {
      // Ensure tasks directory exists
      await fs.mkdir(this.tasksDir, { recursive: true });

      switch (action.action) {
        case 'list':
          return await this.listTasks(action.filters);
        case 'create':
          return await this.createTask(action.taskData!);
        case 'update':
          return await this.updateTask(action.taskData!);
        case 'delete':
          return await this.deleteTask(action.taskData!.id!);
        case 'sync':
          return await this.syncTasks(action.syncDirection || 'bidirectional');
        case 'status':
          return await this.getTaskStatus();
        default:
          throw new Error(`Unknown action: ${action.action}`);
      }
    } catch (error) {
      logger.error('Task action failed', { action: action.action }, error as Error);
      return {
        success: false,
        errors: [(error as Error).message]
      };
    }
  }

  private async listTasks(filters?: TaskFilters): Promise<TaskResult> {
    try {
      const tasks = await this.loadAllTasks();
      
      let filteredTasks = tasks;
      
      if (filters) {
        filteredTasks = tasks.filter(task => {
          if (filters.status && task.status !== filters.status) return false;
          if (filters.priority && task.priority !== filters.priority) return false;
          if (filters.assignee && task.assignee !== filters.assignee) return false;
          if (filters.tags && !filters.tags.some(tag => task.tags.includes(tag))) return false;
          return true;
        });
      }

      // Sort by priority and creation date
      filteredTasks.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      return {
        success: true,
        tasks: filteredTasks
      };
    } catch (error) {
      logger.error('Failed to list tasks', error as Error);
      return {
        success: false,
        errors: [(error as Error).message]
      };
    }
  }

  private async createTask(taskData: Partial<Task>): Promise<TaskResult> {
    try {
      const task: Task = {
        id: uuidv4(),
        title: taskData.title || 'Untitled Task',
        description: taskData.description,
        priority: taskData.priority || 'medium',
        status: taskData.status || 'pending',
        assignee: taskData.assignee,
        tags: taskData.tags || [],
        dueDate: taskData.dueDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projectPath: taskData.projectPath || process.cwd()
      };

      await this.saveTask(task);
      
      // Try to sync with Claude Code if available
      const claudeCodeSynced = await this.syncToClaudeCode([task]);

      logger.info('Created task', { id: task.id, title: task.title });

      return {
        success: true,
        task,
        claudeCodeSynced
      };
    } catch (error) {
      logger.error('Failed to create task', error as Error);
      return {
        success: false,
        errors: [(error as Error).message]
      };
    }
  }

  private async updateTask(taskData: Partial<Task>): Promise<TaskResult> {
    try {
      if (!taskData.id) {
        throw new Error('Task ID is required for update');
      }

      const existingTask = await this.loadTask(taskData.id);
      if (!existingTask) {
        throw new Error(`Task not found: ${taskData.id}`);
      }

      const updatedTask: Task = {
        ...existingTask,
        ...taskData,
        id: existingTask.id, // Ensure ID doesn't change
        updatedAt: new Date().toISOString()
      };

      await this.saveTask(updatedTask);
      
      // Try to sync with Claude Code if available
      const claudeCodeSynced = await this.syncToClaudeCode([updatedTask]);

      logger.info('Updated task', { id: updatedTask.id, title: updatedTask.title });

      return {
        success: true,
        task: updatedTask,
        claudeCodeSynced
      };
    } catch (error) {
      logger.error('Failed to update task', error as Error);
      return {
        success: false,
        errors: [(error as Error).message]
      };
    }
  }

  private async deleteTask(taskId: string): Promise<TaskResult> {
    try {
      const taskFile = path.join(this.tasksDir, `${taskId}.json`);
      
      // Check if task exists
      const existingTask = await this.loadTask(taskId);
      if (!existingTask) {
        throw new Error(`Task not found: ${taskId}`);
      }

      await fs.unlink(taskFile);
      
      logger.info('Deleted task', { id: taskId });

      return {
        success: true
      };
    } catch (error) {
      logger.error('Failed to delete task', error as Error);
      return {
        success: false,
        errors: [(error as Error).message]
      };
    }
  }

  private async syncTasks(direction: 'to_claude' | 'from_claude' | 'bidirectional'): Promise<TaskResult> {
    try {
      let syncedCount = 0;
      let conflicts = 0;

      if (direction === 'to_claude' || direction === 'bidirectional') {
        const tasks = await this.loadAllTasks();
        const synced = await this.syncToClaudeCode(tasks);
        if (synced) syncedCount += tasks.length;
      }

      if (direction === 'from_claude' || direction === 'bidirectional') {
        const claudeTasks = await this.syncFromClaudeCode();
        syncedCount += claudeTasks.length;
      }

      logger.info('Sync completed', { direction, syncedCount, conflicts });

      return {
        success: true,
        syncedCount,
        conflicts,
        claudeCodeSynced: true
      };
    } catch (error) {
      logger.error('Failed to sync tasks', error as Error);
      return {
        success: false,
        errors: [(error as Error).message]
      };
    }
  }

  private async getTaskStatus(): Promise<TaskResult> {
    try {
      const tasks = await this.loadAllTasks();
      
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
      const pendingTasks = tasks.filter(t => t.status === 'pending').length;

      return {
        success: true,
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks
      };
    } catch (error) {
      logger.error('Failed to get task status', error as Error);
      return {
        success: false,
        errors: [(error as Error).message]
      };
    }
  }

  private async loadAllTasks(): Promise<Task[]> {
    try {
      const files = await fs.readdir(this.tasksDir);
      const taskFiles = files.filter(f => f.endsWith('.json'));
      
      const tasks: Task[] = [];
      for (const file of taskFiles) {
        try {
          const content = await fs.readFile(path.join(this.tasksDir, file), 'utf8');
          const task = JSON.parse(content) as Task;
          tasks.push(task);
        } catch (error) {
          logger.warn('Failed to load task file', { file, error: (error as Error).message });
        }
      }

      return tasks;
    } catch (error) {
      // Directory doesn't exist or is empty
      return [];
    }
  }

  private async loadTask(id: string): Promise<Task | null> {
    try {
      const taskFile = path.join(this.tasksDir, `${id}.json`);
      const content = await fs.readFile(taskFile, 'utf8');
      return JSON.parse(content) as Task;
    } catch {
      return null;
    }
  }

  private async saveTask(task: Task): Promise<void> {
    const taskFile = path.join(this.tasksDir, `${task.id}.json`);
    await fs.writeFile(taskFile, JSON.stringify(task, null, 2));
  }

  private async syncToClaudeCode(tasks: Task[]): Promise<boolean> {
    try {
      // Check if Claude Code integration is available
      const claudeDir = path.join(os.homedir(), '.claude');
      
      try {
        await fs.access(claudeDir);
      } catch {
        // Claude Code not available
        return false;
      }

      // Convert tasks to Claude Code todo format
      const todos = tasks.map(task => ({
        id: task.id,
        content: task.title,
        status: this.mapStatusToClaudeCode(task.status),
        priority: task.priority,
        tags: task.tags,
        description: task.description,
        assignee: task.assignee,
        dueDate: task.dueDate
      }));

      // Write to Claude Code integration file
      const integrationFile = path.join(claudeDir, 'critical-claude-tasks.json');
      await fs.writeFile(integrationFile, JSON.stringify({
        lastSync: new Date().toISOString(),
        tasks: todos
      }, null, 2));

      logger.info('Synced tasks to Claude Code', { taskCount: tasks.length });
      return true;
    } catch (error) {
      logger.warn('Failed to sync to Claude Code', error as Error);
      return false;
    }
  }

  private async syncFromClaudeCode(): Promise<Task[]> {
    try {
      const claudeDir = path.join(os.homedir(), '.claude');
      const integrationFile = path.join(claudeDir, 'claude-code-todos.json');
      
      try {
        const content = await fs.readFile(integrationFile, 'utf8');
        const data = JSON.parse(content);
        
        // Convert Claude Code todos to our task format
        const tasks: Task[] = [];
        for (const todo of data.todos || []) {
          const task: Task = {
            id: todo.id || uuidv4(),
            title: todo.content || 'Imported Task',
            description: todo.description,
            priority: this.mapPriorityFromClaudeCode(todo.priority),
            status: this.mapStatusFromClaudeCode(todo.status),
            assignee: todo.assignee,
            tags: todo.tags || [],
            dueDate: todo.dueDate,
            createdAt: todo.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            projectPath: process.cwd()
          };
          
          await this.saveTask(task);
          tasks.push(task);
        }

        logger.info('Synced tasks from Claude Code', { taskCount: tasks.length });
        return tasks;
      } catch {
        // No Claude Code todos to sync
        return [];
      }
    } catch (error) {
      logger.warn('Failed to sync from Claude Code', error as Error);
      return [];
    }
  }

  private mapStatusToClaudeCode(status: string): string {
    switch (status) {
      case 'pending': return 'pending';
      case 'in_progress': return 'in_progress';
      case 'completed': return 'completed';
      case 'blocked': return 'pending'; // Map blocked to pending for Claude Code
      default: return 'pending';
    }
  }

  private mapStatusFromClaudeCode(status: string): Task['status'] {
    switch (status) {
      case 'pending': return 'pending';
      case 'in_progress': return 'in_progress';
      case 'completed': return 'completed';
      default: return 'pending';
    }
  }

  private mapPriorityFromClaudeCode(priority: string): Task['priority'] {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  }
}