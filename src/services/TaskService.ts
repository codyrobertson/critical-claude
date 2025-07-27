/**
 * Simplified Task Service
 * Consolidates TaskService + 10 UseCase classes into direct service methods
 */

import { 
  Task, 
  CreateTaskData, 
  UpdateTaskData, 
  TaskFilters, 
  createTask, 
  updateTask, 
  applyFilters,
  Result,
  createSuccessResult,
  createErrorResult,
  ExportOptions,
  ImportOptions
} from '../models/index.js';
import { FileStorage } from '../storage/index.js';
import { logger } from '../utils/Logger.js';
import { validateTaskData, sanitizeTaskData, formatValidationErrors } from '../../shared/input-validation.js';

export interface TaskStats {
  total: number;
  todo: number;
  in_progress: number;
  done: number;
  blocked: number;
  archived: number;
}

export interface BackupResult {
  backupPath: string;
  taskCount: number;
}

export class TaskService {
  private readonly COLLECTION = 'tasks';

  constructor(private storage: FileStorage) {}

  // Core CRUD Operations
  async createTask(data: CreateTaskData): Promise<Result<Task>> {
    const startTime = Date.now();
    logger.operation('Creating task', { title: data.title, priority: data.priority });
    
    try {
      // Sanitize input data
      const sanitized = sanitizeTaskData(data);
      if (!sanitized) {
        logger.warn('Task creation failed: invalid data format');
        return createErrorResult('Invalid task data format');
      }

      // Comprehensive validation
      const validationResult = validateTaskData(sanitized);
      if (!validationResult.isValid) {
        const errorMessage = formatValidationErrors(validationResult);
        logger.warn('Task creation failed: validation errors', { errors: validationResult.errors });
        return createErrorResult(`Validation failed: ${errorMessage}`);
      }

      // Log warnings but don't block creation
      if (validationResult.warnings.length > 0) {
        logger.warn('Task creation warnings', { warnings: validationResult.warnings });
      }

      const task = createTask(sanitized);
      await this.storage.save(this.COLLECTION, task.id, task);
      
      logger.performance('Task creation', startTime);
      logger.info('Task created successfully', { id: task.id, title: task.title });
      return createSuccessResult(task);
    } catch (error) {
      logger.error('Failed to create task', error);
      return createErrorResult(`Failed to create task: ${error instanceof Error ? error.message : error}`);
    }
  }

  async listTasks(filters: TaskFilters = {}): Promise<Result<Task[]>> {
    const startTime = Date.now();
    logger.operation('Listing tasks', filters);
    
    try {
      const allTasks = await this.storage.findAll<Task>(this.COLLECTION);
      const filteredTasks = applyFilters(allTasks, filters);
      
      // Sort by creation date (newest first)
      filteredTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      logger.performance('Task listing', startTime);
      logger.debug('Tasks listed', { total: allTasks.length, filtered: filteredTasks.length });
      return createSuccessResult(filteredTasks);
    } catch (error) {
      logger.error('Failed to list tasks', error);
      return createErrorResult(`Failed to list tasks: ${error instanceof Error ? error.message : error}`);
    }
  }

  async viewTask(id: string): Promise<Result<Task>> {
    try {
      const task = await this.storage.findById<Task>(this.COLLECTION, id);
      
      if (!task) {
        return createErrorResult(`Task with ID ${id} not found`);
      }
      
      return createSuccessResult(task);
    } catch (error) {
      return createErrorResult(`Failed to view task: ${error instanceof Error ? error.message : error}`);
    }
  }

  async updateTask(id: string, updates: UpdateTaskData): Promise<Result<Task>> {
    const startTime = Date.now();
    logger.operation('Updating task', { id, updates });
    
    try {
      // Validate ID
      const idValidation = validateTaskData({ id });
      if (!idValidation.isValid) {
        return createErrorResult(`Invalid task ID: ${formatValidationErrors(idValidation)}`);
      }

      const existingTask = await this.storage.findById<Task>(this.COLLECTION, id);
      
      if (!existingTask) {
        logger.warn('Task update failed: task not found', { id });
        return createErrorResult(`Task with ID ${id} not found`);
      }

      // Sanitize and validate update data
      const sanitized = sanitizeTaskData(updates);
      if (!sanitized) {
        return createErrorResult('Invalid update data format');
      }

      const validationResult = validateTaskData(sanitized);
      if (!validationResult.isValid) {
        const errorMessage = formatValidationErrors(validationResult);
        logger.warn('Task update failed: validation errors', { id, errors: validationResult.errors });
        return createErrorResult(`Validation failed: ${errorMessage}`);
      }

      if (validationResult.warnings.length > 0) {
        logger.warn('Task update warnings', { id, warnings: validationResult.warnings });
      }

      const updatedTask = updateTask(existingTask, sanitized);
      await this.storage.save(this.COLLECTION, id, updatedTask);
      
      logger.performance('Task update', startTime);
      logger.info('Task updated successfully', { id, title: updatedTask.title });
      return createSuccessResult(updatedTask);
    } catch (error) {
      logger.error('Failed to update task', error);
      return createErrorResult(`Failed to update task: ${error instanceof Error ? error.message : error}`);
    }
  }

  async deleteTask(id: string): Promise<Result<boolean>> {
    try {
      const deleted = await this.storage.delete(this.COLLECTION, id);
      
      if (!deleted) {
        return createErrorResult(`Task with ID ${id} not found`);
      }
      
      return createSuccessResult(true);
    } catch (error) {
      return createErrorResult(`Failed to delete task: ${error instanceof Error ? error.message : error}`);
    }
  }

  async archiveTask(id: string): Promise<Result<Task>> {
    try {
      return await this.updateTask(id, { status: 'archived' });
    } catch (error) {
      return createErrorResult(`Failed to archive task: ${error instanceof Error ? error.message : error}`);
    }
  }

  // Statistics
  async getTaskStats(): Promise<Result<TaskStats>> {
    try {
      const tasks = await this.storage.findAll<Task>(this.COLLECTION);
      
      const stats: TaskStats = {
        total: tasks.length,
        todo: tasks.filter(t => t.status === 'todo').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        done: tasks.filter(t => t.status === 'done').length,
        blocked: tasks.filter(t => t.status === 'blocked').length,
        archived: tasks.filter(t => t.status === 'archived').length
      };
      
      return createSuccessResult(stats);
    } catch (error) {
      return createErrorResult(`Failed to get task stats: ${error instanceof Error ? error.message : error}`);
    }
  }

  // Export/Import
  async exportTasks(options: ExportOptions): Promise<Result<{ filePath: string; taskCount: number }>> {
    const startTime = Date.now();
    logger.operation('Exporting tasks', { format: options.format, includeArchived: options.includeArchived });
    
    try {
      const tasks = await this.storage.findAll<Task>(this.COLLECTION);
      const filteredTasks = options.includeArchived ? tasks : tasks.filter(t => t.status !== 'archived');
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = options.file || `tasks-export-${timestamp}.${options.format}`;
      
      let content: string;
      
      switch (options.format) {
        case 'json':
          content = JSON.stringify(filteredTasks, null, 2);
          break;
        case 'csv':
          content = this.tasksToCSV(filteredTasks);
          break;
        case 'markdown':
          content = this.tasksToMarkdown(filteredTasks);
          break;
        default:
          logger.warn('Export failed: unsupported format', { format: options.format });
          return createErrorResult(`Unsupported format: ${options.format}`);
      }
      
      logger.performance('Task export', startTime);
      logger.info('Tasks exported successfully', { format: options.format, count: filteredTasks.length });
      
      // For now, return the content - actual file writing would be handled by CLI
      return createSuccessResult({ 
        filePath: fileName, 
        taskCount: filteredTasks.length 
      });
    } catch (error) {
      logger.error('Failed to export tasks', error);
      return createErrorResult(`Failed to export tasks: ${error instanceof Error ? error.message : error}`);
    }
  }

  async importTasks(options: ImportOptions, data: string): Promise<Result<{ imported: number; errors: string[] }>> {
    try {
      let tasks: Task[];
      const errors: string[] = [];
      
      switch (options.format) {
        case 'json':
          tasks = JSON.parse(data);
          break;
        default:
          return createErrorResult(`Import format ${options.format} not yet implemented`);
      }
      
      let imported = 0;
      
      for (const taskData of tasks) {
        try {
          // Validate task structure
          if (!taskData.id || !taskData.title) {
            errors.push(`Invalid task structure: missing id or title`);
            continue;
          }
          
          // Handle merge strategy
          const existingTask = await this.storage.findById<Task>(this.COLLECTION, taskData.id);
          
          if (existingTask && options.mergeStrategy === 'skip') {
            continue;
          }
          
          await this.storage.save(this.COLLECTION, taskData.id, taskData as Task);
          imported++;
        } catch (error) {
          errors.push(`Failed to import task ${taskData.id}: ${error}`);
        }
      }
      
      return createSuccessResult({ imported, errors });
    } catch (error) {
      return createErrorResult(`Failed to import tasks: ${error instanceof Error ? error.message : error}`);
    }
  }

  // Backup
  async backupTasks(): Promise<Result<BackupResult>> {
    try {
      const backupPath = await this.storage.backup();
      const tasks = await this.storage.findAll<Task>(this.COLLECTION);
      
      return createSuccessResult({
        backupPath,
        taskCount: tasks.length
      });
    } catch (error) {
      return createErrorResult(`Failed to backup tasks: ${error instanceof Error ? error.message : error}`);
    }
  }

  // Helper methods for format conversion
  private tasksToCSV(tasks: Task[]): string {
    const headers = ['id', 'title', 'description', 'status', 'priority', 'assignee', 'labels', 'estimatedHours', 'createdAt', 'updatedAt'];
    const rows = [headers.join(',')];
    
    tasks.forEach(task => {
      const row = [
        task.id,
        `"${task.title.replace(/"/g, '""')}"`,
        `"${task.description.replace(/"/g, '""')}"`,
        task.status,
        task.priority,
        task.assignee || '',
        `"${task.labels.join(';')}"`,
        task.estimatedHours?.toString() || '',
        task.createdAt.toISOString(),
        task.updatedAt.toISOString()
      ];
      rows.push(row.join(','));
    });
    
    return rows.join('\n');
  }

  private tasksToMarkdown(tasks: Task[]): string {
    const lines = ['# Task Export', '', `Generated on: ${new Date().toISOString()}`, ''];
    
    tasks.forEach(task => {
      lines.push(`## ${task.title}`);
      lines.push('');
      lines.push(`- **ID**: ${task.id}`);
      lines.push(`- **Status**: ${task.status}`);
      lines.push(`- **Priority**: ${task.priority}`);
      if (task.assignee) lines.push(`- **Assignee**: ${task.assignee}`);
      if (task.estimatedHours) lines.push(`- **Estimated Hours**: ${task.estimatedHours}`);
      if (task.labels.length > 0) lines.push(`- **Labels**: ${task.labels.join(', ')}`);
      lines.push(`- **Created**: ${task.createdAt.toISOString()}`);
      lines.push(`- **Updated**: ${task.updatedAt.toISOString()}`);
      lines.push('');
      if (task.description) {
        lines.push('### Description');
        lines.push(task.description);
        lines.push('');
      }
      lines.push('---');
      lines.push('');
    });
    
    return lines.join('\n');
  }

  // Convenience methods removed - use listTasks with filters directly
  // Can be restored if needed for specific use cases
}