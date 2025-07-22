/**
 * Task Repository Implementation
 * File-based storage implementation for tasks
 */

import { Task, TaskId } from '../domain/entities/Task.js';
import { ITaskRepository } from '../domain/repositories/ITaskRepository.js';
import fs from 'fs/promises';
import path from 'path';

export class TaskRepository implements ITaskRepository {
  constructor(private readonly storageBasePath: string) {}

  async findById(id: string): Promise<Task | null> {
    try {
      const taskPath = this.getTaskPath(id);
      const content = await fs.readFile(taskPath, 'utf-8');
      const data = JSON.parse(content);
      return this.mapFromStorage(data);
    } catch {
      return null;
    }
  }

  async findAll(): Promise<Task[]> {
    try {
      const tasksDir = path.join(this.storageBasePath, 'tasks');
      const files = await fs.readdir(tasksDir);
      const taskFiles = files.filter(f => f.endsWith('.json'));
      
      const tasks: Task[] = [];
      for (const file of taskFiles) {
        try {
          const content = await fs.readFile(path.join(tasksDir, file), 'utf-8');
          const data = JSON.parse(content);
          tasks.push(this.mapFromStorage(data));
        } catch {
          // Skip invalid files
        }
      }
      
      return tasks;
    } catch {
      return [];
    }
  }

  async save(task: Task): Promise<void> {
    await this.ensureTasksDirectory();
    const taskPath = this.getTaskPath(task.id.value);
    const data = this.mapToStorage(task);
    await fs.writeFile(taskPath, JSON.stringify(data, null, 2));
  }

  async delete(id: string): Promise<boolean> {
    try {
      const taskPath = this.getTaskPath(id);
      await fs.unlink(taskPath);
      return true;
    } catch {
      return false;
    }
  }

  async findByStatus(status: string): Promise<Task[]> {
    const allTasks = await this.findAll();
    return allTasks.filter(task => task.status === status);
  }

  async findByAssignee(assignee: string): Promise<Task[]> {
    const allTasks = await this.findAll();
    return allTasks.filter(task => task.assignee === assignee);
  }

  async findByLabels(labels: string[]): Promise<Task[]> {
    const allTasks = await this.findAll();
    return allTasks.filter(task => 
      labels.some(label => task.labels.includes(label))
    );
  }

  async countTotal(): Promise<number> {
    const allTasks = await this.findAll();
    return allTasks.length;
  }

  async archive(id: string): Promise<Task | null> {
    const task = await this.findById(id);
    if (!task) return null;

    // Create archived version
    const archivedTask = new Task(
      task.id,
      task.title,
      task.description,
      'archived',
      task.priority,
      task.labels,
      task.createdAt,
      new Date(),
      task.assignee,
      task.estimatedHours,
      task.dependencies,
      task.draft
    );

    // Move to archive directory
    await this.ensureArchiveDirectory();
    const archivePath = path.join(this.storageBasePath, 'archive', `${id}.json`);
    const data = this.mapToStorage(archivedTask);
    await fs.writeFile(archivePath, JSON.stringify(data, null, 2));

    // Remove from active tasks
    await this.delete(id);

    return archivedTask;
  }

  private getTaskPath(id: string): string {
    return path.join(this.storageBasePath, 'tasks', `${id}.json`);
  }

  private async ensureTasksDirectory(): Promise<void> {
    const tasksDir = path.join(this.storageBasePath, 'tasks');
    await fs.mkdir(tasksDir, { recursive: true });
  }

  private async ensureArchiveDirectory(): Promise<void> {
    const archiveDir = path.join(this.storageBasePath, 'archive');
    await fs.mkdir(archiveDir, { recursive: true });
  }

  private mapToStorage(task: Task): any {
    return {
      id: task.id.value,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      labels: task.labels,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      assignee: task.assignee,
      estimatedHours: task.estimatedHours,
      dependencies: task.dependencies.map(dep => dep.value),
      draft: task.draft
    };
  }

  private mapFromStorage(data: any): Task {
    return new Task(
      TaskId.create(data.id),
      data.title,
      data.description,
      data.status,
      data.priority,
      data.labels || [],
      new Date(data.createdAt),
      new Date(data.updatedAt),
      data.assignee,
      data.estimatedHours,
      (data.dependencies || []).map((dep: string) => TaskId.create(dep)),
      data.draft || false
    );
  }
}