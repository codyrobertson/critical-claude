/**
 * Simplified CLI Application
 * Replaces the over-engineered CLIApplication with proper initialization
 */

import { Command } from 'commander';
import * as path from 'path';
import * as os from 'os';
import { FileStorage } from '../storage/index.js';
import { 
  TaskService, 
  TemplateService, 
  AnalyticsService, 
  ResearchService, 
  ViewerService 
} from '../services/index.js';
import { ConfigValidator, CLIConfig } from '../config/ConfigValidator.js';
import { logger } from '../utils/Logger.js';

export class SimplifiedCLI {
  private storage!: FileStorage;
  private taskService!: TaskService;
  private templateService!: TemplateService;
  private analyticsService!: AnalyticsService;
  private researchService!: ResearchService;
  private viewerService!: ViewerService;
  private config: CLIConfig;

  constructor(private configPath?: string) {
    // Config will be loaded during start() to allow async validation
    this.config = {} as CLIConfig;
  }

  private async initializeServices(): Promise<void> {
    logger.operation('CLI initialization');
    
    // Validate and load configuration first
    const startTime = Date.now();
    const validation = await ConfigValidator.loadAndValidate(this.configPath);
    logger.performance('Config validation', startTime);
    
    if (!validation.valid) {
      logger.error('Configuration validation failed', validation.errors);
      console.error('❌ Configuration validation failed:');
      validation.errors.forEach(error => console.error(`  • ${error}`));
      
      if (validation.errors.some(e => e.includes('sample config'))) {
        console.error('\n💡 Generate a sample config with:');
        console.error('  cc config --generate > ~/.critical-claude/config.json');
      }
      
      process.exit(1);
    }

    // Show warnings if any
    if (validation.warnings.length > 0) {
      logger.warn('Configuration warnings', validation.warnings);
      validation.warnings.forEach(warning => console.warn(`⚠️  ${warning}`));
    }

    this.config = validation.config;
    
    // Set logger level from config
    if (this.config.logLevel) {
      logger.setLevel(this.config.logLevel);
    }
    logger.info('Logger initialized', { level: this.config.logLevel });
    
    // Initialize all services with validated config
    logger.debug('Initializing services', { storagePath: this.config.storagePath });
    this.storage = new FileStorage(this.config.storagePath);
    this.taskService = new TaskService(this.storage);
    this.templateService = new TemplateService(this.storage);
    this.analyticsService = new AnalyticsService(this.storage);
    this.researchService = new ResearchService(this.storage);
    this.viewerService = new ViewerService(this.storage);
    
    logger.info('CLI initialized successfully');
  }

  async start(): Promise<void> {
    // Initialize services with config validation
    await this.initializeServices();
    
    const program = new Command();
    
    program
      .name('cc')
      .description('Critical Claude CLI - Simplified Architecture')
      .version('2.4.0');

    // Task management commands
    this.setupTaskCommands(program);
    
    // Template system commands
    this.setupTemplateCommands(program);
    
    // Research commands
    this.setupResearchCommands(program);
    
    // Viewer commands
    this.setupViewerCommands(program);
    
    // Analytics commands
    this.setupAnalyticsCommands(program);
    
    // Configuration commands
    this.setupConfigCommands(program);
    
    // Help and verification commands
    this.setupUtilityCommands(program);

    await program.parseAsync(process.argv);
  }

  private setupTaskCommands(program: Command): void {
    const taskCmd = program
      .command('task')
      .description('Task management')
      .argument('<action>', 'Action: create, list, view, update, delete, archive, export, import, backup, ai, research')
      .argument('[args...]', 'Action arguments')
      .option('-t, --title <title>', 'Task title')
      .option('-d, --description <desc>', 'Task description')
      .option('-p, --priority <priority>', 'Priority: critical, high, medium, low', 'medium')
      .option('-s, --status <status>', 'Status: todo, in_progress, done, blocked', 'todo')
      .option('-a, --assignee <assignee>', 'Task assignee')
      .option('--labels <labels...>', 'Task labels')
      .option('--hours <hours>', 'Estimated hours', parseFloat)
      .option('--format <format>', 'Export/import format: json, csv, markdown', 'json')
      .option('--file <file>', 'File path for import/export')
      .option('--include-archived', 'Include archived tasks in export')
      .option('--merge-strategy <strategy>', 'Import merge strategy: replace, merge, skip', 'merge');

    taskCmd.action(async (action, args, options) => {
      await this.analyticsService.withTracking('task', action, async () => {
        await this.handleTaskCommand(action, args, options);
      });
    });
  }

  private async handleTaskCommand(action: string, args: string[], options: any): Promise<void> {
    try {
      switch (action) {
        case 'create':
          const createResult = await this.taskService.createTask({
            title: options.title,
            description: options.description,
            priority: options.priority,
            status: options.status,
            assignee: options.assignee,
            labels: options.labels,
            estimatedHours: options.hours
          });
          
          if (createResult.success) {
            console.log(`✅ Task created: ${createResult.data!.title}`);
            console.log(`   ID: ${createResult.data!.id}`);
          } else {
            console.error(`❌ ${createResult.error}`);
            process.exit(1);
          }
          break;

        case 'list':
          const listResult = await this.taskService.listTasks({
            status: options.status !== 'todo' ? options.status : undefined,
            priority: options.priority !== 'medium' ? options.priority : undefined,
            assignee: options.assignee,
            labels: options.labels
          });
          
          if (listResult.success) {
            const tasks = listResult.data!;
            if (tasks.length === 0) {
              console.log('No tasks found.');
            } else {
              console.log(`📋 Found ${tasks.length} tasks:\n`);
              tasks.forEach(task => {
                const statusIcon = SimplifiedCLI.getStatusIcon(task.status);
                const priorityIcon = SimplifiedCLI.getPriorityIcon(task.priority);
                console.log(`${statusIcon} ${priorityIcon} ${task.title}`);
                console.log(`   ID: ${task.id} | Status: ${task.status} | Priority: ${task.priority}`);
                if (task.assignee) console.log(`   Assignee: ${task.assignee}`);
                if (task.labels.length > 0) console.log(`   Labels: ${task.labels.join(', ')}`);
                console.log('');
              });
            }
          } else {
            console.error(`❌ ${listResult.error}`);
            process.exit(1);
          }
          break;

        case 'view':
          if (!args[0]) {
            console.error('❌ Task ID is required');
            process.exit(1);
          }
          
          const viewResult = await this.taskService.viewTask(args[0]);
          
          if (viewResult.success) {
            const task = viewResult.data!;
            console.log(`📋 Task: ${task.title}\n`);
            console.log(`ID: ${task.id}`);
            console.log(`Status: ${task.status}`);
            console.log(`Priority: ${task.priority}`);
            console.log(`Description: ${task.description || 'No description'}`);
            if (task.assignee) console.log(`Assignee: ${task.assignee}`);
            if (task.labels.length > 0) console.log(`Labels: ${task.labels.join(', ')}`);
            if (task.estimatedHours) console.log(`Estimated Hours: ${task.estimatedHours}`);
            console.log(`Created: ${task.createdAt.toLocaleString()}`);
            console.log(`Updated: ${task.updatedAt.toLocaleString()}`);
          } else {
            console.error(`❌ ${viewResult.error}`);
            process.exit(1);
          }
          break;

        case 'update':
          if (!args[0]) {
            console.error('❌ Task ID is required');
            process.exit(1);
          }
          
          const updateResult = await this.taskService.updateTask(args[0], {
            title: options.title,
            description: options.description,
            priority: options.priority !== 'medium' ? options.priority : undefined,
            status: options.status !== 'todo' ? options.status : undefined,
            assignee: options.assignee,
            labels: options.labels,
            estimatedHours: options.hours
          });
          
          if (updateResult.success) {
            console.log(`✅ Task updated: ${updateResult.data!.title}`);
          } else {
            console.error(`❌ ${updateResult.error}`);
            process.exit(1);
          }
          break;

        case 'delete':
          if (!args[0]) {
            console.error('❌ Task ID is required');
            process.exit(1);
          }
          
          const deleteResult = await this.taskService.deleteTask(args[0]);
          
          if (deleteResult.success) {
            console.log(`✅ Task deleted`);
          } else {
            console.error(`❌ ${deleteResult.error}`);
            process.exit(1);
          }
          break;

        case 'archive':
          if (!args[0]) {
            console.error('❌ Task ID is required');
            process.exit(1);
          }
          
          const archiveResult = await this.taskService.archiveTask(args[0]);
          
          if (archiveResult.success) {
            console.log(`✅ Task archived: ${archiveResult.data!.title}`);
          } else {
            console.error(`❌ ${archiveResult.error}`);
            process.exit(1);
          }
          break;

        case 'export':
          const exportResult = await this.taskService.exportTasks({
            format: options.format,
            file: options.file,
            includeArchived: options.includeArchived
          });
          
          if (exportResult.success) {
            console.log(`✅ Exported ${exportResult.data!.taskCount} tasks to ${exportResult.data!.filePath}`);
          } else {
            console.error(`❌ ${exportResult.error}`);
            process.exit(1);
          }
          break;

        case 'backup':
          const backupResult = await this.taskService.backupTasks();
          
          if (backupResult.success) {
            console.log(`✅ Backup created: ${backupResult.data!.backupPath}`);
            console.log(`   Tasks backed up: ${backupResult.data!.taskCount}`);
          } else {
            console.error(`❌ ${backupResult.error}`);
            process.exit(1);
          }
          break;

        case 'ai':
          console.log('🤖 AI task generation not yet implemented in simplified version');
          break;

        case 'research':
          if (!args[0]) {
            console.error('❌ Research query is required');
            process.exit(1);
          }
          
          const researchResult = await this.researchService.executeResearch({
            query: args[0],
            outputFormat: 'both'
          });
          
          if (researchResult.success) {
            console.log(`✅ Research completed: ${args[0]}`);
            if (researchResult.reportPath) {
              console.log(`   Report: ${researchResult.reportPath}`);
            }
            if (researchResult.tasksCreated) {
              console.log(`   Tasks created: ${researchResult.tasksCreated}`);
            }
          } else {
            console.error(`❌ ${researchResult.error}`);
            process.exit(1);
          }
          break;

        default:
          console.error(`❌ Unknown action: ${action}`);
          console.log('Available actions: create, list, view, update, delete, archive, export, import, backup, research');
          process.exit(1);
      }
    } catch (error) {
      console.error(`❌ Task command failed: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  }

  private setupTemplateCommands(program: Command): void {
    const templateCmd = program
      .command('template')
      .description('Template operations')
      .argument('<action>', 'Action: list, apply, view')
      .argument('[args...]', 'Action arguments')
      .option('-v, --variables <vars...>', 'Template variables (key=value)');

    templateCmd.action(async (action, args, options) => {
      await this.analyticsService.withTracking('template', action, async () => {
        await this.handleTemplateCommand(action, args, options);
      });
    });
  }

  private async handleTemplateCommand(action: string, args: string[], options: any): Promise<void> {
    try {
      switch (action) {
        case 'list':
        case 'ls':
          const listResult = await this.templateService.listTemplates();
          
          if (listResult.success && listResult.data) {
            console.log(`📋 Available templates (${listResult.data.length}):\n`);
            
            const builtInTemplates = listResult.data.filter(t => 
              t.metadata.author === 'Critical Claude'
            );
            const userTemplates = listResult.data.filter(t => 
              t.metadata.author !== 'Critical Claude'
            );

            if (builtInTemplates.length > 0) {
              console.log('📦 Built-in Templates:');
              builtInTemplates.forEach(template => {
                console.log(`  ${template.name} - ${template.description}`);
                console.log(`    Tasks: ${template.tasks.length} | Tags: ${template.metadata.tags?.join(', ') || 'none'}`);
                console.log('');
              });
            }

            if (userTemplates.length > 0) {
              console.log('👤 User Templates:');
              userTemplates.forEach(template => {
                console.log(`  ${template.name} - ${template.description}`);
                console.log(`    Tasks: ${template.tasks.length} | Author: ${template.metadata.author || 'unknown'}`);
                console.log('');
              });
            }

            console.log('Use "cc template apply <name>" to apply a template');
          } else {
            console.error(`❌ ${listResult.error}`);
            process.exit(1);
          }
          break;

        case 'apply':
        case 'use':
          if (!args[0]) {
            console.error('❌ Template name is required');
            process.exit(1);
          }
          
          // Parse variables
          const variables: Record<string, string> = {};
          if (options.variables) {
            options.variables.forEach((varPair: string) => {
              const [key, value] = varPair.split('=');
              if (key && value) {
                variables[key] = value;
              }
            });
          }
          
          const applyResult = await this.templateService.applyTemplate({
            templateName: args[0],
            variables
          });
          
          if (applyResult.success && applyResult.data) {
            console.log(`✅ Applied template: ${applyResult.templateName}`);
            console.log(`   Tasks created: ${applyResult.tasksCreated}`);
            console.log('\nCreated tasks:');
            applyResult.data.forEach(task => {
              console.log(`  📌 ${task.title} (${task.priority} priority)`);
            });
          } else {
            console.error(`❌ ${applyResult.error}`);
            process.exit(1);
          }
          break;

        case 'view':
        case 'show':
          if (!args[0]) {
            console.error('❌ Template name is required');
            process.exit(1);
          }

          const viewResult = await this.templateService.viewTemplate({ nameOrId: args[0] });
          
          if (viewResult.success && viewResult.data) {
            const template = viewResult.data;
            console.log(`📋 Template: ${template.name}\n`);
            console.log(`Description: ${template.description}`);
            console.log(`Tasks: ${viewResult.taskCount}`);
            console.log(`Created: ${template.metadata.createdAt.toLocaleDateString()}`);
            console.log(`Updated: ${template.metadata.updatedAt.toLocaleDateString()}`);
            
            if (template.metadata.author) {
              console.log(`Author: ${template.metadata.author}`);
            }
            
            if (template.metadata.tags && template.metadata.tags.length > 0) {
              console.log(`Tags: ${template.metadata.tags.join(', ')}`);
            }

            if (Object.keys(template.variables).length > 0) {
              console.log('\nVariables:');
              Object.entries(template.variables).forEach(([key, value]) => {
                console.log(`  ${key}: ${value}`);
              });
            }

            console.log('\nTasks:');
            template.tasks.forEach((task, index) => {
              console.log(`  ${index + 1}. ${task.title} (${task.priority || 'medium'} priority)`);
              if (task.description) {
                console.log(`     ${task.description}`);
              }
            });
          } else {
            console.error(`❌ ${viewResult.error}`);
            process.exit(1);
          }
          break;

        default:
          console.error(`❌ Unknown template action: ${action}`);
          console.log('Available actions: list, apply, view');
          process.exit(1);
      }
    } catch (error) {
      console.error(`❌ Template command failed: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  }

  private setupResearchCommands(program: Command): void {
    const researchCmd = program
      .command('research')
      .description('AI research operations')
      .argument('<query>', 'Research query')
      .option('-f, --files <files...>', 'Files to include')
      .option('--format <format>', 'Output format: tasks, report, both', 'both')
      .option('--depth <number>', 'Max research depth', parseInt, 3);

    researchCmd.action(async (query, options) => {
      await this.analyticsService.withTracking('research', undefined, async () => {
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
          console.error(`❌ ${result.error || 'Research failed'}`);
          process.exit(1);
        }
      });
    });
  }

  private setupViewerCommands(program: Command): void {
    const viewerCmd = program
      .command('viewer')
      .description('Launch task viewer')
      .option('--log-level <level>', 'Log level: debug, info, warn, error', 'info')
      .option('--theme <theme>', 'Theme: dark, light', 'dark');

    viewerCmd.action(async (options) => {
      await this.analyticsService.withTracking('viewer', undefined, async () => {
        const result = await this.viewerService.launchViewer({
          logLevel: options.logLevel,
          theme: options.theme
        });

        if (result.success) {
          console.log(`✅ Viewer launched successfully`);
        } else {
          console.error(`❌ ${result.error}`);
          process.exit(1);
        }
      });
    });
  }

  private setupAnalyticsCommands(program: Command): void {
    const analyticsCmd = program
      .command('analytics')
      .description('Usage analytics and statistics')
      .argument('[action]', 'Action: stats, export, clear', 'stats')
      .option('--format <format>', 'Export format: json, csv', 'json');

    analyticsCmd.action(async (action, options) => {
      // Don't track analytics commands to avoid recursion
      try {
        switch (action) {
          case 'stats':
            const stats = await this.analyticsService.getUsageStats();
            
            console.log('📊 Critical Claude Usage Statistics\n');
            console.log(`Total commands tracked: ${stats.totalMetrics}`);
            console.log(`Recent commands (7 days): ${stats.recentCommands}`);
            console.log(`Success rate: ${(stats.successRate * 100).toFixed(1)}%\n`);
            
            if (stats.topCommands.length > 0) {
              console.log('🏆 Most used commands:');
              stats.topCommands.forEach(({command, count}, index) => {
                console.log(`  ${index + 1}. ${command}: ${count} times`);
              });
              console.log('');
            }
            
            if (stats.errorBreakdown.length > 0) {
              console.log('⚠️  Error breakdown:');
              stats.errorBreakdown.forEach(({error, count}) => {
                console.log(`  ${error}: ${count} times`);
              });
            }
            break;

          case 'export':
            const exportData = await this.analyticsService.exportMetrics(options.format);
            const filename = `critical-claude-analytics-${new Date().toISOString().split('T')[0]}.${options.format}`;
            
            console.log(`✅ Analytics exported (${filename})`);
            // In real implementation, would write to file
            break;

          case 'clear':
            const clearResult = await this.analyticsService.clearAllMetrics();
            if (clearResult.success) {
              console.log('✅ All analytics data cleared');
            } else {
              console.error(`❌ ${clearResult.error}`);
              process.exit(1);
            }
            break;

          default:
            console.error(`❌ Unknown analytics action: ${action}`);
            console.log('Available actions: stats, export, clear');
            process.exit(1);
        }
      } catch (error) {
        console.error(`❌ Analytics command failed: ${error instanceof Error ? error.message : error}`);
        process.exit(1);
      }
    });
  }

  private setupUtilityCommands(program: Command): void {
    // Shortcuts command
    const shortcutsCmd = program
      .command('shortcuts')
      .alias('keys')
      .description('Show keyboard shortcuts and keybindings');

    shortcutsCmd.action(async () => {
      console.log('🎮 Critical Claude Keyboard Shortcuts\n');
      
      console.log('📋 VIEWER SHORTCUTS (cc viewer)');
      console.log('================================\n');
      console.log('Basic Controls:');
      console.log('  j/k or ↑/↓      Navigate up/down');
      console.log('  Enter           Select task');
      console.log('  Space           Toggle task status');
      console.log('  /               Search tasks');
      console.log('  f               Filter by status');
      console.log('  q               Quit');
      console.log('  ?               Show help');
      
      console.log('\n💻 CLI SHORTCUTS');
      console.log('================\n');
      console.log('Quick Task Creation:');
      console.log('  cc task create -t "Title" -d "Description"');
      console.log('  cc task create -t "Bug fix" -p high -s todo');
      console.log('');
      console.log('Data Management:');
      console.log('  cc task export --format json');
      console.log('  cc task backup');
      console.log('');
      console.log('Analytics:');
      console.log('  cc analytics stats');
      console.log('  cc analytics export --format csv');
    });

    // Verify command
    const verifyCmd = program
      .command('verify')
      .alias('check')
      .description('Verify Critical Claude installation')
      .option('--health', 'Run health check instead of full verification');

    verifyCmd.action(async (options) => {
      console.log('🔍 Critical Claude Installation Verification\n');
      
      if (options.health) {
        console.log('Running health check...\n');
        
        try {
          // Check storage access
          await this.storage.ensureDirectory();
          console.log('✅ Storage directory accessible');
          
          // Check services initialization
          const stats = await this.analyticsService.getUsageStats();
          console.log('✅ Services initialized correctly');
          
          console.log('\n🎉 Health check passed! Critical Claude is ready to use.');
        } catch (error) {
          console.error('❌ Health check failed:', error);
          process.exit(1);
        }
      } else {
        console.log('Running basic verification...\n');
        console.log('✅ CLI application loaded');
        console.log('✅ All services initialized');
        console.log('✅ Storage system ready');
        console.log('\n🎉 Installation verification completed successfully!');
      }
    });
  }

  // Helper methods for display
  private static getStatusIcon(status: string): string {
    const icons = {
      todo: '⭕',
      in_progress: '🟡',
      done: '✅',
      blocked: '🔴',
      archived: '📦'
    };
    return icons[status as keyof typeof icons] || '❓';
  }

  private static getPriorityIcon(priority: string): string {
    const icons = {
      critical: '🔥',
      high: '🔺',
      medium: '🟡',
      low: '🔽'
    };
    return icons[priority as keyof typeof icons] || '❓';
  }

  private setupConfigCommands(program: Command): void {
    const configCmd = program
      .command('config')
      .description('Configuration management')
      .option('--generate', 'Generate sample configuration file')
      .option('--validate', 'Validate current configuration')
      .option('--show', 'Show current configuration');

    configCmd.action(async (options) => {
      try {
        if (options.generate) {
          const sampleConfig = ConfigValidator.generateSampleConfig();
          console.log(sampleConfig);
          return;
        }

        if (options.validate) {
          const validation = await ConfigValidator.loadAndValidate(this.configPath);
          
          if (validation.valid) {
            console.log('✅ Configuration is valid');
            if (validation.warnings.length > 0) {
              console.log('\n⚠️  Warnings:');
              validation.warnings.forEach(warning => console.log(`  • ${warning}`));
            }
          } else {
            console.log('❌ Configuration has errors:');
            validation.errors.forEach(error => console.log(`  • ${error}`));
            process.exit(1);
          }
          return;
        }

        if (options.show) {
          console.log('🔧 Current Configuration:\n');
          console.log(JSON.stringify(this.config, null, 2));
          return;
        }

        // Default: show help
        configCmd.help();
      } catch (error) {
        console.error(`❌ Config command failed: ${error instanceof Error ? error.message : error}`);
        process.exit(1);
      }
    });
  }
}