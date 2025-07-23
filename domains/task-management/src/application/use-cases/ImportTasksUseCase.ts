/**
 * Import Tasks Use Case
 * Imports tasks from various formats for data migration and restoration
 */

import { ITaskRepository } from '../../domain/repositories/ITaskRepository.js';
import { Task, TaskId } from '../../domain/entities/Task.js';
import { TaskStatus, Priority } from '../../shared/types.js';
import { ProgressIndicator, ProgressBar } from '../../shared/progress-indicator.js';

export interface ImportTasksRequest {
  filePath: string;
  format?: 'json' | 'csv' | 'auto';
  mergeStrategy?: 'replace' | 'merge' | 'skip';
}

export interface ImportTasksResponse {
  success: boolean;
  importedCount?: number;
  skippedCount?: number;
  errors?: string[];
  summary?: string;
}

export class ImportTasksUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(request: ImportTasksRequest): Promise<ImportTasksResponse> {
    const progress = new ProgressIndicator('Reading import file...');
    
    try {
      progress.start();
      
      progress.updateMessage('Reading import file...');
      const content = await this.readFile(request.filePath);
      
      progress.updateMessage('Detecting file format...');
      const format = request.format || this.detectFormat(request.filePath, content);
      
      progress.updateMessage(`Parsing ${format} content...`);
      const tasks = await this.parseContent(content, format);
      
      progress.stop();
      const result = await this.importTasks(tasks, request.mergeStrategy || 'merge');

      return {
        success: true,
        importedCount: result.imported,
        skippedCount: result.skipped,
        errors: result.errors,
        summary: `Successfully imported ${result.imported} tasks, skipped ${result.skipped}`
      };
    } catch (error) {
      progress.error('Import failed');
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Import failed']
      };
    }
  }

  private async readFile(filePath: string): Promise<string> {
    const fs = await import('fs/promises');
    return await fs.readFile(filePath, 'utf-8');
  }

  private detectFormat(filePath: string, content: string): 'json' | 'csv' {
    if (filePath.endsWith('.json')) return 'json';
    if (filePath.endsWith('.csv')) return 'csv';

    // Auto-detect based on content
    const trimmed = content.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
    return 'csv';
  }

  private async parseContent(content: string, format: string): Promise<Partial<Task>[]> {
    switch (format) {
      case 'json':
        return this.parseJson(content);
      case 'csv':
        return this.parseCsv(content);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private parseJson(content: string): Partial<Task>[] {
    const data = JSON.parse(content);
    
    // Handle our export format
    if (data.tasks && Array.isArray(data.tasks)) {
      return data.tasks;
    }

    // Handle array of tasks
    if (Array.isArray(data)) {
      return data;
    }

    throw new Error('Invalid JSON format: expected array of tasks or export object');
  }

  private parseCsv(content: string): Partial<Task>[] {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV must have at least header and one data row');

    const headers = this.parseCsvRow(lines[0]);
    const tasks: Partial<Task>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvRow(lines[i]);
      if (values.length !== headers.length) continue;

      const task: any = {};
      headers.forEach((header, index) => {
        const value = values[index];
        switch (header.toLowerCase()) {
          case 'id':
            task.id = value;
            break;
          case 'title':
            task.title = value;
            break;
          case 'description':
            task.description = value || undefined;
            break;
          case 'status':
            task.status = value;
            break;
          case 'priority':
            task.priority = value;
            break;
          case 'assignee':
            task.assignee = value || undefined;
            break;
          case 'labels':
            task.labels = value ? value.split(', ') : [];
            break;
          case 'estimated hours':
            task.estimatedHours = value ? parseFloat(value) : undefined;
            break;
          case 'created at':
            task.createdAt = value ? new Date(value) : undefined;
            break;
          case 'updated at':
            task.updatedAt = value ? new Date(value) : undefined;
            break;
          case 'archived':
            if (value.toLowerCase() === 'true') {
              task.status = 'archived';
            }
            break;
        }
      });

      if (task.title) {
        tasks.push(task);
      }
    }

    return tasks;
  }

  private parseCsvRow(row: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < row.length) {
      const char = row[i];
      
      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        if (row[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = false;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
      
      i++;
    }
    
    values.push(current);
    return values;
  }

  private async importTasks(tasks: Partial<Task>[], mergeStrategy: string): Promise<{imported: number, skipped: number, errors: string[]}> {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    const progressBar = new ProgressBar(tasks.length, 'Importing tasks');

    for (let i = 0; i < tasks.length; i++) {
      const taskData = tasks[i];
      try {
        if (!taskData.title) {
          errors.push(`Skipping task without title: ${JSON.stringify(taskData)}`);
          progressBar.increment(`Skipped task ${i + 1}`);
          continue;
        }

        // Check if task already exists
        const taskIdValue = taskData.id && typeof taskData.id === 'object' ? (taskData.id as any).value : (taskData.id as string | undefined);
        const existingTask = taskIdValue ? await this.taskRepository.findById(taskIdValue) : null;

        if (existingTask && mergeStrategy === 'skip') {
          skipped++;
          progressBar.increment(`Skipped existing task: ${taskData.title}`);
          continue;
        }

        // Create new task
        const task = new Task(
          taskIdValue ? TaskId.create(taskIdValue) : TaskId.generate(),
          taskData.title,
          taskData.description || '',
          (taskData.status as TaskStatus) || 'todo',
          (taskData.priority as Priority) || 'medium',
          taskData.labels || [],
          taskData.createdAt || new Date(),
          taskData.updatedAt || new Date(),
          taskData.assignee,
          taskData.estimatedHours
        );

        await this.taskRepository.save(task);
        imported++;
        progressBar.increment(`Imported: ${taskData.title}`);
      } catch (error) {
        errors.push(`Failed to import task ${taskData.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        progressBar.increment(`Failed: ${taskData.title}`);
      }
    }

    progressBar.complete(`Import completed: ${imported} imported, ${skipped} skipped`);
    return { imported, skipped, errors };
  }
}