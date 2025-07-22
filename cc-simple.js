#!/usr/bin/env node

/**
 * Simple Critical Claude CLI
 * Standalone CLI using the DDD domain structure
 */

import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Simple Task class (copied from domain)
class Task {
  constructor(
    id,
    title,
    description,
    status,
    priority,
    labels,
    createdAt,
    updatedAt,
    assignee,
    estimatedHours,
    dependencies,
    draft
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.status = status;
    this.priority = priority;
    this.labels = labels || [];
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.assignee = assignee;
    this.estimatedHours = estimatedHours;
    this.dependencies = dependencies || [];
    this.draft = draft || false;
  }

  canBeAssigned() {
    return this.status !== 'done' && this.status !== 'archived';
  }

  isComplete() {
    return this.status === 'done';
  }
}

// Simple Task Repository
class TaskRepository {
  constructor(storagePath) {
    this.storagePath = storagePath;
  }

  async findAll() {
    try {
      const tasksDir = path.join(this.storagePath, 'tasks');
      const files = await fs.readdir(tasksDir);
      const taskFiles = files.filter(f => f.endsWith('.json'));
      
      const tasks = [];
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

  async findById(id) {
    try {
      const taskPath = this.getTaskPath(id);
      const content = await fs.readFile(taskPath, 'utf-8');
      const data = JSON.parse(content);
      return this.mapFromStorage(data);
    } catch {
      return null;
    }
  }

  async save(task) {
    await this.ensureTasksDirectory();
    const taskPath = this.getTaskPath(task.id);
    const data = this.mapToStorage(task);
    await fs.writeFile(taskPath, JSON.stringify(data, null, 2));
  }

  async delete(id) {
    try {
      const taskPath = this.getTaskPath(id);
      await fs.unlink(taskPath);
      return true;
    } catch {
      return false;
    }
  }

  async ensureTasksDirectory() {
    const tasksDir = path.join(this.storagePath, 'tasks');
    await fs.mkdir(tasksDir, { recursive: true });
  }

  getTaskPath(id) {
    return path.join(this.storagePath, 'tasks', `${id}.json`);
  }

  mapToStorage(task) {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      labels: task.labels,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      assignee: task.assignee,
      estimatedHours: task.estimatedHours,
      dependencies: task.dependencies,
      draft: task.draft
    };
  }

  mapFromStorage(data) {
    return new Task(
      data.id,
      data.title,
      data.description,
      data.status,
      data.priority,
      data.labels || [],
      new Date(data.createdAt),
      new Date(data.updatedAt),
      data.assignee,
      data.estimatedHours,
      data.dependencies || [],
      data.draft || false
    );
  }
}

// Simple Task Service
class TaskService {
  constructor(repository) {
    this.repository = repository;
  }

  async createTask(request) {
    try {
      if (!request.title?.trim()) {
        return { success: false, error: 'Title is required' };
      }

      const task = new Task(
        this.generateTaskId(),
        request.title.trim(),
        request.description || '',
        'todo',
        request.priority || 'medium',
        request.labels || [],
        new Date(),
        new Date(),
        request.assignee,
        request.estimatedHours,
        [],
        request.draft || false
      );

      await this.repository.save(task);
      return { success: true, data: task };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async listTasks(filter = {}) {
    try {
      let tasks = await this.repository.findAll();

      if (filter.status) {
        tasks = tasks.filter(task => task.status === filter.status);
      }

      if (filter.assignee) {
        tasks = tasks.filter(task => task.assignee === filter.assignee);
      }

      return { success: true, data: tasks };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async viewTask(id) {
    try {
      const task = await this.repository.findById(id);
      if (!task) {
        return { success: false, error: 'Task not found' };
      }
      return { success: true, data: task };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateTask(request) {
    try {
      const existingTask = await this.repository.findById(request.id);
      if (!existingTask) {
        return { success: false, error: 'Task not found' };
      }

      const updatedTask = new Task(
        existingTask.id,
        request.title || existingTask.title,
        request.description !== undefined ? request.description : existingTask.description,
        request.status || existingTask.status,
        request.priority || existingTask.priority,
        request.labels || existingTask.labels,
        existingTask.createdAt,
        new Date(),
        request.assignee !== undefined ? request.assignee : existingTask.assignee,
        request.estimatedHours !== undefined ? request.estimatedHours : existingTask.estimatedHours,
        existingTask.dependencies,
        existingTask.draft
      );

      await this.repository.save(updatedTask);
      return { success: true, data: updatedTask };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteTask(id) {
    try {
      const result = await this.repository.delete(id);
      if (!result) {
        return { success: false, error: 'Task not found' };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  generateTaskId() {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// CLI Application
class CLIApplication {
  constructor() {
    const storagePath = path.join(os.homedir(), '.critical-claude');
    const taskRepository = new TaskRepository(storagePath);
    this.taskService = new TaskService(taskRepository);
  }

  async start() {
    const program = new Command();
    
    program
      .name('cc')
      .description('Critical Claude CLI - DDD Architecture')
      .version('2.3.0');

    // Task management commands
    program
      .command('task')
      .description('Task management')
      .argument('<action>', 'Action: create, list, view, update, delete')
      .argument('[args...]', 'Action arguments')
      .option('-t, --title <title>', 'Task title')
      .option('-d, --description <desc>', 'Task description')
      .option('-p, --priority <priority>', 'Priority: critical, high, medium, low', 'medium')
      .option('-s, --status <status>', 'Status: todo, in_progress, done, blocked', 'todo')
      .option('-a, --assignee <assignee>', 'Task assignee')
      .option('--labels <labels...>', 'Task labels')
      .option('--hours <hours>', 'Estimated hours', parseFloat)
      .action(async (action, args, options) => {
        try {
          await this.handleTaskCommand(action, args, options);
        } catch (error) {
          console.error('❌ Task operation failed:', error.message);
          process.exit(1);
        }
      });

    // Other commands delegate to legacy CLI
    program
      .command('*')
      .description('Other commands (research, template, etc.)')
      .action(async () => {
        console.log('🔄 For other commands, use: npm run build:legacy && node packages/critical-claude/dist/cli/cc-main.js');
      });

    await program.parseAsync(process.argv);
  }

  async handleTaskCommand(action, args, options) {
    switch (action) {
      case 'create':
        if (!options.title) {
          console.error('❌ Title is required for task creation');
          process.exit(1);
        }
        
        const createResult = await this.taskService.createTask({
          title: options.title,
          description: options.description,
          priority: options.priority,
          assignee: options.assignee,
          labels: options.labels || [],
          estimatedHours: options.hours
        });
        
        if (createResult.success) {
          console.log(`✅ Created task: ${createResult.data.title}`);
          console.log(`   ID: ${createResult.data.id}`);
          console.log(`   Priority: ${createResult.data.priority}`);
        } else {
          console.error(`❌ Failed to create task: ${createResult.error}`);
        }
        break;

      case 'list':
        const listResult = await this.taskService.listTasks({
          status: options.status === 'todo' ? undefined : options.status,
          assignee: options.assignee
        });
        
        if (listResult.success) {
          console.log(`📋 Found ${listResult.data.length} tasks:\n`);
          listResult.data.forEach(task => {
            console.log(`${task.status === 'done' ? '✅' : '📌'} ${task.title}`);
            console.log(`   ID: ${task.id}`);
            console.log(`   Status: ${task.status} | Priority: ${task.priority}`);
            if (task.assignee) console.log(`   Assignee: ${task.assignee}`);
            if (task.labels.length > 0) console.log(`   Labels: ${task.labels.join(', ')}`);
            console.log('');
          });
        } else {
          console.error(`❌ Failed to list tasks: ${listResult.error}`);
        }
        break;

      case 'view':
        const taskId = args[0];
        if (!taskId) {
          console.error('❌ Task ID is required');
          process.exit(1);
        }
        
        const viewResult = await this.taskService.viewTask(taskId);
        if (viewResult.success) {
          const task = viewResult.data;
          console.log(`📋 Task: ${task.title}`);
          console.log(`   ID: ${task.id}`);
          console.log(`   Status: ${task.status}`);
          console.log(`   Priority: ${task.priority}`);
          console.log(`   Created: ${task.createdAt.toLocaleDateString()}`);
          console.log(`   Updated: ${task.updatedAt.toLocaleDateString()}`);
          if (task.description) console.log(`   Description: ${task.description}`);
          if (task.assignee) console.log(`   Assignee: ${task.assignee}`);
          if (task.estimatedHours) console.log(`   Estimated: ${task.estimatedHours}h`);
          if (task.labels.length > 0) console.log(`   Labels: ${task.labels.join(', ')}`);
        } else {
          console.error(`❌ Task not found: ${taskId}`);
        }
        break;

      case 'update':
        const updateId = args[0];
        if (!updateId) {
          console.error('❌ Task ID is required');
          process.exit(1);
        }
        
        const updateData = { id: updateId };
        if (options.title) updateData.title = options.title;
        if (options.description) updateData.description = options.description;
        if (options.status) updateData.status = options.status;
        if (options.priority) updateData.priority = options.priority;
        if (options.assignee) updateData.assignee = options.assignee;
        if (options.labels) updateData.labels = options.labels;
        if (options.hours) updateData.estimatedHours = options.hours;
        
        const updateResult = await this.taskService.updateTask(updateData);
        if (updateResult.success) {
          console.log(`✅ Updated task: ${updateResult.data.title}`);
        } else {
          console.error(`❌ Failed to update task: ${updateResult.error}`);
        }
        break;

      case 'delete':
        const deleteId = args[0];
        if (!deleteId) {
          console.error('❌ Task ID is required');
          process.exit(1);
        }
        
        const deleteResult = await this.taskService.deleteTask(deleteId);
        if (deleteResult.success) {
          console.log(`✅ Deleted task: ${deleteId}`);
        } else {
          console.error(`❌ Failed to delete task: ${deleteResult.error}`);
        }
        break;

      default:
        console.error(`❌ Unknown action: ${action}`);
        console.log('Available actions: create, list, view, update, delete');
        process.exit(1);
    }
  }
}

// Start the application
const app = new CLIApplication();
app.start().catch(error => {
  console.error('❌ CLI Application failed:', error);
  process.exit(1);
});