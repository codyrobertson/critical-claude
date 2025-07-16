#!/usr/bin/env node

/**
 * Critical Claude Backlog CLI
 * AI-powered AGILE task management command-line interface
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { CriticalClaudeCommands } from './commands.js';

// Simple logger for now
const logger = {
  info: (msg: string, data?: any) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg: string, error?: Error) => console.error(`[ERROR] ${msg}`, error?.message || ''),
  warn: (msg: string, data?: any) => console.warn(`[WARN] ${msg}`, data || '')
};

const program = new Command();
const commands = new CriticalClaudeCommands();

// CLI Configuration
program
  .name('cc-backlog')
  .description('Critical Claude Backlog - AI-powered AGILE task management')
  .version('1.0.0')
  .configureHelp({
    sortSubcommands: true
  });

// Global options
program
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--config <path>', 'Path to configuration file')
  .option('--backlog-path <path>', 'Custom backlog storage path');

// Configure logging based on verbose flag
program.hook('preAction', (thisCommand) => {
  const options = thisCommand.opts();
  if (options.verbose) {
    process.env.LOG_LEVEL = 'debug';
  }
});

// Register all commands
commands.registerCommands(program);

// Add helpful commands

// Status command
program
  .command('status')
  .description('Show project backlog status overview')
  .option('-s, --summary', 'Show summary statistics')
  .option('-m, --markdown', 'Generate markdown report')
  .action(async (options) => {
    const { BacklogManager } = await import('./backlog-manager.js');
    const manager = new BacklogManager();
    await manager.initialize();
    
    try {
      if (options.markdown) {
        const markdown = await manager.generateMarkdownSummary();
        console.log(markdown);
        return;
      }
      
      const stats = await manager.getProjectStats();
      
      console.log(chalk.cyan('\n📊 Critical Claude Backlog Status'));
      console.log(chalk.dim('━'.repeat(50)));
      
      console.log(`${chalk.blue('Phases:')} ${stats.totalPhases}`);
      console.log(`${chalk.green('Epics:')} ${stats.totalEpics}`);
      console.log(`${chalk.yellow('Sprints:')} ${stats.totalSprints}`);
      console.log(`${chalk.magenta('Tasks:')} ${stats.totalTasks}`);
      console.log(`${chalk.cyan('AI Generated:')} ${stats.aiGeneratedTasks} (${Math.round((stats.aiGeneratedTasks / stats.totalTasks) * 100)}%)`);
      
      if (options.summary) {
        const phases = await manager.getPhases();
        console.log(chalk.cyan('\n📋 Recent Phases:'));
        phases.slice(-3).forEach(phase => {
          const statusColor = phase.status === 'active' ? chalk.green : 
                             phase.status === 'completed' ? chalk.blue : chalk.yellow;
          console.log(`  ${statusColor(phase.status)} ${phase.name}`);
        });
      }
      
    } catch (error) {
      console.error(chalk.red(`Status check failed: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// Init command
program
  .command('init')
  .description('Initialize Critical Claude Backlog in current directory')
  .option('--force', 'Overwrite existing configuration')
  .action(async (options) => {
    const { BacklogManager } = await import('./backlog-manager.js');
    
    try {
      console.log(chalk.cyan('🚀 Initializing Critical Claude Backlog...'));
      
      const manager = new BacklogManager();
      await manager.initialize();
      
      // Create initial phase
      const initialPhase = await manager.createPhase({
        name: 'Project Setup',
        description: 'Initial project setup and configuration',
        goals: ['Set up development environment', 'Configure CI/CD', 'Define project structure']
      });
      
      console.log(chalk.green('✅ Backlog initialized successfully!'));
      console.log(chalk.cyan('\n📋 Created initial phase:'));
      console.log(`  ID: ${initialPhase.id}`);
      console.log(`  Name: ${initialPhase.name}`);
      console.log(`  Description: ${initialPhase.description}`);
      
      console.log(chalk.yellow('\n💡 Next steps:'));
      console.log('  • Run "cc-backlog agile epic create" to add epics');
      console.log('  • Use "cc-backlog cc-plan" to generate AI tasks');
      console.log('  • Check "cc-backlog status" for overview');
      
    } catch (error) {
      console.error(chalk.red(`Initialization failed: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// Quick start command
program
  .command('quick-start')
  .description('Interactive quick start guide')
  .action(async () => {
    // @ts-ignore
    const inquirer = (await import('inquirer')).default;
    const { BacklogManager } = await import('./backlog-manager.js');
    
    try {
      console.log(chalk.cyan('🎯 Critical Claude Backlog Quick Start'));
      console.log(chalk.dim('Let\'s get your AI-powered backlog set up!\n'));
      
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: 'What\'s your project name?',
          default: 'My Project'
        },
        {
          type: 'input',
          name: 'firstFeature',
          message: 'Describe your first feature:',
          default: 'User authentication with email and password'
        },
        {
          type: 'number',
          name: 'teamSize',
          message: 'How many developers on your team?',
          default: 2
        },
        {
          type: 'confirm',
          name: 'generateTasks',
          message: 'Generate AI tasks for your first feature?',
          default: true
        }
      ]);
      
      const manager = new BacklogManager();
      await manager.initialize();
      
      // Create project phase
      const phase = await manager.createPhase({
        name: `${answers.projectName} - MVP`,
        description: `Initial development phase for ${answers.projectName}`,
        goals: ['Deliver core functionality', 'Establish development workflow']
      });
      
      // Create epic for first feature
      const epic = await manager.createEpic({
        phaseId: phase.id,
        name: answers.firstFeature,
        description: `Implementation of: ${answers.firstFeature}`,
        businessValue: 'Core user functionality'
      });
      
      // Create initial sprint
      const sprint = await manager.createSprint({
        epicId: epic.id,
        name: 'Sprint 1 - Foundation',
        goal: 'Set up basic feature foundation'
      });
      
      console.log(chalk.green('\n✅ Project structure created!'));
      console.log(`  Phase: ${phase.name} (${phase.id})`);
      console.log(`  Epic: ${epic.name} (${epic.id})`);
      console.log(`  Sprint: ${sprint.name} (${sprint.id})`);
      
      if (answers.generateTasks) {
        console.log(chalk.cyan('\n🤖 Generating AI tasks...'));
        // This would call the AI planning functionality
        console.log(chalk.yellow('AI task generation ready - run:'));
        console.log(`cc-backlog cc-plan "${answers.firstFeature}" --sprint ${sprint.id} --team-size ${answers.teamSize}`);
      }
      
      console.log(chalk.cyan('\n🎉 Quick start complete! Run "cc-backlog status" to see your backlog.'));
      
    } catch (error) {
      console.error(chalk.red(`Quick start failed: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// Task UI command
program
  .command('task-ui [action] [args...]')
  .alias('ui')
  .description('Simple task management interface')
  .action(async (action, args, options) => {
    try {
      const { SimpleTaskUICommand } = await import('./commands/simple-task-ui.js');
      const taskUI = new SimpleTaskUICommand();
      await taskUI.execute(action || 'menu', args, options);
    } catch (error) {
      console.error(chalk.red(`Task UI failed: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// Live monitor command
program
  .command('live')
  .alias('monitor')
  .description('Live monitor for tasks and sync activity with real-time updates')
  .action(async () => {
    try {
      const { LiveCommand } = await import('./commands/live.js');
      const live = new LiveCommand();
      await live.execute('monitor', null, {});
    } catch (error) {
      console.error(chalk.red(`Live monitor failed: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// Hooks management command
program
  .command('hooks [action]')
  .description('Manage Claude Code hooks integration')
  .action(async (action, options) => {
    try {
      const { HookSetupCommand } = await import('./commands/hook-setup.js');
      const hookSetup = new HookSetupCommand();
      await hookSetup.execute(action || 'help', null, options);
    } catch (error) {
      console.error(chalk.red(`Hooks command failed: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// Claude Code hooks management (separate command)
program
  .command('cc-hooks [action]')
  .alias('claude-hooks')
  .description('Advanced Claude Code hooks management')
  .action(async (action, options) => {
    try {
      const { HookSetupCommand } = await import('./commands/hook-setup.js');
      const hookSetup = new HookSetupCommand();
      await hookSetup.execute(action || 'help', null, options);
    } catch (error) {
      console.error(chalk.red(`Claude Code hooks command failed: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// Add Claude Code hook subcommands
program
  .command('cc-hooks-install')
  .description('Install basic Claude Code hooks')
  .action(async (options) => {
    try {
      const { HookSetupCommand } = await import('./commands/hook-setup.js');
      const hookSetup = new HookSetupCommand();
      await hookSetup.execute('install', null, options);
    } catch (error) {
      console.error(chalk.red(`Hook installation failed: ${(error as Error).message}`));
      process.exit(1);
    }
  });

program
  .command('cc-hooks-status')
  .description('Show Claude Code hook status and activity')
  .action(async (options) => {
    try {
      const { HookSetupCommand } = await import('./commands/hook-setup.js');
      const hookSetup = new HookSetupCommand();
      await hookSetup.execute('status', null, options);
    } catch (error) {
      console.error(chalk.red(`Hook status check failed: ${(error as Error).message}`));
      process.exit(1);
    }
  });

program
  .command('cc-hooks-test')
  .description('Test Claude Code hook integration')
  .action(async (options) => {
    try {
      const { HookSetupCommand } = await import('./commands/hook-setup.js');
      const hookSetup = new HookSetupCommand();
      await hookSetup.execute('test', null, options);
    } catch (error) {
      console.error(chalk.red(`Hook test failed: ${(error as Error).message}`));
      process.exit(1);
    }
  });

program
  .command('cc-hooks-upgrade')
  .description('Upgrade to advanced Claude Code hooks')
  .action(async (options) => {
    try {
      const { HookSetupCommand } = await import('./commands/hook-setup.js');
      const hookSetup = new HookSetupCommand();
      await hookSetup.execute('upgrade', null, options);
    } catch (error) {
      console.error(chalk.red(`Hook upgrade failed: ${(error as Error).message}`));
      process.exit(1);
    }
  });

program
  .command('cc-hooks-comprehensive-test')
  .description('Run comprehensive hook testing for all edge cases')
  .action(async (options) => {
    try {
      const { ComprehensiveHookTestCommand } = await import('./commands/comprehensive-hook-test.js');
      const hookTest = new ComprehensiveHookTestCommand();
      await hookTest.execute('test', null, options);
    } catch (error) {
      console.error(chalk.red(`Comprehensive hook test failed: ${(error as Error).message}`));
      process.exit(1);
    }
  });

program
  .command('cc-hooks-real-test')
  .description('Test hooks with real Claude Code instances')
  .action(async (options) => {
    try {
      const { RealClaudeIntegrationTestCommand } = await import('./commands/real-claude-integration-test.js');
      const realTest = new RealClaudeIntegrationTestCommand();
      await realTest.execute('test', null, options);
    } catch (error) {
      console.error(chalk.red(`Real Claude integration test failed: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// Parse command line
program.parseAsync(process.argv).catch((error) => {
  const err = error as any;
  
  // Handle help display (not an error)
  if (err.code === 'commander.helpDisplayed') {
    process.exit(0);
  }
  
  // Handle other commander errors
  if (err.name === 'CommanderError') {
    if (err.code !== 'commander.version') {
      console.error(chalk.red(`Error: ${err.message}`));
    }
    process.exit(err.exitCode || 1);
  }
  
  // Handle other errors
  console.error(chalk.red(`Unexpected error: ${error}`));
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});