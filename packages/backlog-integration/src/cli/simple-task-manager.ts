/**
 * Simple Task Manager - Simplified data flow for small teams (5 users)
 * Removes the complex Phase > Epic > Sprint hierarchy for direct task management
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const logger = {
  info: (msg: string, data?: any) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg: string, error?: Error) => console.error(`[ERROR] ${msg}`, error?.message || ''),
  warn: (msg: string, data?: any) => console.warn(`[WARN] ${msg}`, data || '')
};

export interface SimpleTask {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'blocked' | 'done' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  storyPoints: number;
  labels: string[];
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface SimpleConfig {
  tasksPath: string;
  maxActiveTasks: number;
  autoArchiveDays: number;
}

export class SimpleTaskManager {
  private config: SimpleConfig;
  
  constructor(config?: Partial<SimpleConfig>) {
    const defaultPath = process.cwd();
    this.config = {
      tasksPath: path.join(defaultPath, '.critical-claude-simple', 'tasks'),
      maxActiveTasks: 10, // Small team limit
      autoArchiveDays: 30,
      ...config
    };
  }
  
  async initialize(): Promise<void> {
    await fs.mkdir(this.config.tasksPath, { recursive: true });
  }
  
  async createTask(taskData: Partial<SimpleTask>): Promise<SimpleTask> {
    const task: SimpleTask = {
      id: uuidv4(),
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      assignee: taskData.assignee,
      storyPoints: taskData.storyPoints || 1,
      labels: taskData.labels || [],
      dueDate: taskData.dueDate,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await this.saveTask(task);
    logger.info('Simple task created', { taskId: task.id, title: task.title });
    
    return task;
  }
  
  async listTasks(filters?: {
    status?: string;
    assignee?: string;
    priority?: string;
    labels?: string[];
  }): Promise<SimpleTask[]> {
    try {
      const files = await fs.readdir(this.config.tasksPath);
      const tasks: SimpleTask[] = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.config.tasksPath, file);
          const content = await fs.readFile(filePath, 'utf8');
          const task = JSON.parse(content) as SimpleTask;
          
          // Convert date strings back to Date objects
          task.createdAt = new Date(task.createdAt);
          task.updatedAt = new Date(task.updatedAt);
          if (task.completedAt) task.completedAt = new Date(task.completedAt);
          if (task.dueDate) task.dueDate = new Date(task.dueDate);
          
          // Apply filters
          if (filters) {
            if (filters.status && task.status !== filters.status) continue;
            if (filters.assignee && task.assignee !== filters.assignee) continue;
            if (filters.priority && task.priority !== filters.priority) continue;
            if (filters.labels && !filters.labels.some(label => task.labels.includes(label))) continue;
          }
          
          tasks.push(task);
        }
      }
      
      // Sort by priority (critical first) then by created date
      return tasks.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    } catch (error) {
      logger.error('Failed to list tasks', error as Error);
      return [];
    }
  }
  
  async getTask(id: string): Promise<SimpleTask | null> {
    try {
      const filePath = path.join(this.config.tasksPath, `${id}.json`);
      const content = await fs.readFile(filePath, 'utf8');
      const task = JSON.parse(content) as SimpleTask;
      
      // Convert date strings back to Date objects
      task.createdAt = new Date(task.createdAt);
      task.updatedAt = new Date(task.updatedAt);
      if (task.completedAt) task.completedAt = new Date(task.completedAt);
      if (task.dueDate) task.dueDate = new Date(task.dueDate);
      
      return task;
    } catch (error) {
      return null;
    }
  }
  
  async updateTask(taskId: string, updates: Partial<SimpleTask>): Promise<SimpleTask> {
    const existingTask = await this.getTask(taskId);
    if (!existingTask) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const updatedTask: SimpleTask = {
      ...existingTask,
      ...updates,
      id: taskId, // Ensure ID doesn't change
      updatedAt: new Date()
    };

    // Set completion date if status changed to done
    if (updates.status === 'done' && existingTask.status !== 'done') {
      updatedTask.completedAt = new Date();
    }

    await this.saveTask(updatedTask);
    logger.info(`Simple task updated: ${updatedTask.title}`);
    return updatedTask;
  }
  
  async deleteTask(taskId: string): Promise<void> {
    const existingTask = await this.getTask(taskId);
    if (!existingTask) {
      throw new Error(`Task not found: ${taskId}`);
    }

    try {
      const filePath = path.join(this.config.tasksPath, `${taskId}.json`);
      await fs.unlink(filePath);
      logger.info(`Simple task deleted: ${existingTask.title}`);
    } catch (error) {
      throw new Error(`Failed to delete task: ${(error as Error).message}`);
    }
  }
  
  async getStats(): Promise<{
    totalTasks: number;
    todoTasks: number;
    inProgressTasks: number;
    doneTasks: number;
    blockedTasks: number;
    overdueTasks: number;
    averageStoryPoints: number;
  }> {
    const tasks = await this.listTasks();
    const now = new Date();
    
    const stats = {
      totalTasks: tasks.length,
      todoTasks: tasks.filter(t => t.status === 'todo').length,
      inProgressTasks: tasks.filter(t => t.status === 'in-progress').length,
      doneTasks: tasks.filter(t => t.status === 'done').length,
      blockedTasks: tasks.filter(t => t.status === 'blocked').length,
      overdueTasks: tasks.filter(t => t.dueDate && t.dueDate < now && t.status !== 'done').length,
      averageStoryPoints: tasks.length > 0 ? tasks.reduce((sum, t) => sum + t.storyPoints, 0) / tasks.length : 0
    };
    
    return stats;
  }
  
  async archiveOldTasks(): Promise<number> {
    const tasks = await this.listTasks();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.autoArchiveDays);
    
    let archivedCount = 0;
    
    for (const task of tasks) {
      if (task.status === 'done' && task.completedAt && task.completedAt < cutoffDate) {
        await this.updateTask(task.id, { status: 'archived' });
        archivedCount++;
      }
    }
    
    logger.info(`Archived ${archivedCount} old completed tasks`);
    return archivedCount;
  }
  
  async getTasksByAssignee(): Promise<Record<string, SimpleTask[]>> {
    const tasks = await this.listTasks({ status: 'todo' }); // Only active tasks
    const tasksByAssignee: Record<string, SimpleTask[]> = {};
    
    for (const task of tasks) {
      const assignee = task.assignee || 'Unassigned';
      if (!tasksByAssignee[assignee]) {
        tasksByAssignee[assignee] = [];
      }
      tasksByAssignee[assignee].push(task);
    }
    
    return tasksByAssignee;
  }
  
  private async saveTask(task: SimpleTask): Promise<void> {
    const filePath = path.join(this.config.tasksPath, `${task.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(task, null, 2));
  }
}