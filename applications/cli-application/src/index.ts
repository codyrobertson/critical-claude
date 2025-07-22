#!/usr/bin/env node

/**
 * Critical Claude CLI Application
 * Entry point for the DDD-structured CLI application
 */

import { Command } from 'commander';
import { TaskService } from '../../../domains/task-management/dist/application/services/TaskService.js';
import { TaskRepository } from '../../../domains/task-management/dist/infrastructure/TaskRepository.js';
import { TemplateService } from '../../../domains/template-system/dist/application/services/TemplateService.js';
import { ResearchService } from '../../../domains/research-intelligence/dist/application/services/ResearchService.js';
import { ViewerService } from '../../../domains/user-interface/dist/application/services/ViewerService.js';
import path from 'path';
import os from 'os';

class CLIApplication {
  private taskService: TaskService;
  private templateService: TemplateService;
  private researchService: ResearchService;
  private viewerService: ViewerService;

  constructor() {
    // Setup task management domain
    const storagePath = path.join(os.homedir(), '.critical-claude');
    const taskRepository = new TaskRepository(storagePath);
    this.taskService = new TaskService(taskRepository);
    
    // Setup other domains
    this.templateService = new TemplateService();
    this.researchService = new ResearchService();
    this.viewerService = new ViewerService();
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
      .argument('<action>', 'Action: create, list, view, update, delete, archive')
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
          console.error('❌ Task operation failed:', error instanceof Error ? error.message : error);
          process.exit(1);
        }
      });

    // Template management commands
    program
      .command('template')
      .description('Template operations')
      .argument('<action>', 'Action: create, list')
      .argument('[args...]', 'Action arguments')
      .option('-n, --name <name>', 'Template name')
      .option('-o, --output <dir>', 'Output directory')
      .action(async (action, args, options) => {
        try {
          await this.handleTemplateCommand(action, args, options);
        } catch (error) {
          console.error('❌ Template operation failed:', error instanceof Error ? error.message : error);
          process.exit(1);
        }
      });

    // Research commands
    program
      .command('research')
      .description('AI research operations')
      .argument('<query>', 'Research query')
      .option('-f, --files <files...>', 'Files to include')
      .option('--format <format>', 'Output format: tasks, report, both', 'both')
      .option('--depth <number>', 'Max research depth', parseInt, 3)
      .action(async (query, options) => {
        try {
          await this.handleResearchCommand(query, options);
        } catch (error) {
          console.error('❌ Research operation failed:', error instanceof Error ? error.message : error);
          process.exit(1);
        }
      });

    // Viewer commands
    program
      .command('viewer')
      .description('Launch task viewer')
      .option('--log-level <level>', 'Log level: debug, info, warn, error', 'info')
      .option('--theme <theme>', 'Theme: dark, light', 'dark')
      .action(async (options) => {
        try {
          await this.handleViewerCommand(options);
        } catch (error) {
          console.error('❌ Viewer operation failed:', error instanceof Error ? error.message : error);
          process.exit(1);
        }
      });

    await program.parseAsync(process.argv);
  }

  private async handleTaskCommand(action: string, args: any[], options: any) {
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
        
        if (createResult.success && createResult.task) {
          console.log(`✅ Created task: ${createResult.task.title}`);
          console.log(`   ID: ${createResult.task.id.value}`);
        } else {
          console.error(`❌ Failed to create task: ${createResult.error}`);
        }
        break;

      case 'list':
        const listResult = await this.taskService.listTasks({
          status: options.status === 'todo' ? undefined : options.status,
          assignee: options.assignee
        });
        
        if (listResult.success && listResult.tasks) {
          console.log(`📋 Found ${listResult.tasks.length} tasks:\n`);
          listResult.tasks.forEach(task => {
            console.log(`${task.status === 'done' ? '✅' : '📌'} ${task.title}`);
            console.log(`   ID: ${task.id.value}`);
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
        
        const viewResult = await this.taskService.viewTask({ taskId });
        if (viewResult.success && viewResult.task) {
          const task = viewResult.task;
          console.log(`📋 Task: ${task.title}`);
          console.log(`   ID: ${task.id.value}`);
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
        
        const updateData: any = { id: updateId };
        if (options.title) updateData.title = options.title;
        if (options.description) updateData.description = options.description;
        if (options.status) updateData.status = options.status;
        if (options.priority) updateData.priority = options.priority;
        if (options.assignee) updateData.assignee = options.assignee;
        if (options.labels) updateData.labels = options.labels;
        if (options.hours) updateData.estimatedHours = options.hours;
        
        const updateResult = await this.taskService.updateTask(updateData);
        if (updateResult.success && updateResult.task) {
          console.log(`✅ Updated task: ${updateResult.task.title}`);
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
        
        const deleteResult = await this.taskService.deleteTask({ taskId: deleteId });
        if (deleteResult.success) {
          console.log(`✅ Deleted task: ${deleteId}`);
        } else {
          console.error(`❌ Failed to delete task: ${deleteResult.error}`);
        }
        break;

      case 'archive':
        const archiveId = args[0];
        if (!archiveId) {
          console.error('❌ Task ID is required');
          process.exit(1);
        }
        
        const archiveResult = await this.taskService.archiveTask({ taskId: archiveId });
        if (archiveResult.success && archiveResult.archivedTask) {
          console.log(`📦 Archived task: ${archiveResult.archivedTask.title}`);
        } else {
          console.error(`❌ Failed to archive task: ${archiveResult.error}`);
        }
        break;

      default:
        console.error(`❌ Unknown action: ${action}`);
        console.log('Available actions: create, list, view, update, delete, archive');
        process.exit(1);
    }
  }

  private async handleTemplateCommand(action: string, args: any[], options: any) {
    switch (action) {
      case 'create':
        if (!options.name) {
          console.error('❌ Template name is required');
          process.exit(1);
        }
        
        const createResult = await this.templateService.executeTemplate({
          templateName: options.name,
          outputDir: options.output,
          variables: {}
        });
        
        if (createResult.success) {
          console.log(`✅ Template created successfully`);
          if (createResult.outputPath) {
            console.log(`   Output: ${createResult.outputPath}`);
          }
        } else {
          console.error(`❌ ${createResult.error}`);
        }
        break;

      case 'list':
        const listResult = await this.templateService.listTemplates();
        if (listResult.success && listResult.data) {
          console.log(`📋 Available templates:`);
          listResult.data.forEach(template => {
            console.log(`  - ${template}`);
          });
        } else {
          console.error(`❌ ${listResult.error}`);
        }
        break;

      default:
        console.error(`❌ Unknown template action: ${action}`);
        console.log('Available actions: create, list');
        process.exit(1);
    }
  }

  private async handleResearchCommand(query: string, options: any) {
    const result = await this.researchService.executeResearch({
      query,
      files: options.files,
      outputFormat: options.format,
      maxDepth: options.depth
    });

    if (result.success) {
      console.log(`✅ Research completed successfully`);
      if (result.reportPath) {
        console.log(`   Report: ${result.reportPath}`);
      }
      if (result.tasksCreated) {
        console.log(`   Tasks created: ${result.tasksCreated}`);
      }
    } else {
      console.error(`❌ ${result.error}`);
    }
  }

  private async handleViewerCommand(options: any) {
    const result = await this.viewerService.launchViewer({
      logLevel: options.logLevel,
      theme: options.theme
    });

    if (result.success) {
      console.log(`✅ Viewer launched successfully`);
    } else {
      console.error(`❌ ${result.error}`);
    }
  }
}

// Start the application
const app = new CLIApplication();
app.start().catch(error => {
  console.error('❌ CLI Application failed:', error);
  process.exit(1);
});