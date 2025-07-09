#!/usr/bin/env node

/**
 * Critical Claude Main CLI - Enhanced with lazy loading and quick task creation
 * 
 * New usage patterns:
 *   cc task "fix login bug"                    - Quick task creation
 *   cc task "add auth @high #security 5pts"   - Natural language parsing
 *   cc agile phase create "MVP Phase"          - Full AGILE hierarchy
 *   cc analyze velocity                        - Analysis commands
 */

import { program } from 'commander';
import chalk from 'chalk';
import { CommandRegistry } from './command-registry.js';
import { QuickTaskCommand } from './commands/quick-task.js';
import { CriticalClaudeCommands } from './commands.js';
import { logger } from '../core/logger.js';

// Create command registry for lazy loading
const registry = new CommandRegistry();

// Register command loaders
registry.register({
  name: 'task',
  description: 'Quick task creation with natural language parsing',
  category: 'quick',
  loader: async () => new QuickTaskCommand()
});

registry.register({
  name: 'agile',
  description: 'Full AGILE hierarchy management (Phase > Epic > Sprint > Task)',
  category: 'agile',
  loader: async () => new CriticalClaudeCommands()
});

// Initialize CLI
function initializeCLI() {
  program
    .name('cc')
    .description('Critical Claude CLI - Enhanced AGILE backlog management')
    .version('2.0.0')
    .option('-v, --verbose', 'Enable verbose logging')
    .option('-q, --quiet', 'Suppress non-essential output')
    .option('--no-color', 'Disable colored output');

  // Handle global options
  program.hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts();
    
    if (opts.verbose) {
      process.env.CC_LOG_LEVEL = 'DEBUG';
    }
    if (opts.quiet) {
      process.env.CC_LOG_LEVEL = 'ERROR';
    }
    if (opts.noColor) {
      process.env.FORCE_COLOR = '0';
    }
  });

  // Register quick task command with natural language support
  const taskCmd = program
    .command('task <input>')
    .alias('t')
    .description('Create tasks with natural language parsing')
    .option('-m, --mode <mode>', 'Creation mode (quick|interactive|bulk)', 'quick')
    .option('-s, --sprint <sprintId>', 'Add to specific sprint')
    .option('-e, --epic <epicId>', 'Add to specific epic')
    .option('-p, --phase <phaseId>', 'Add to specific phase')
    .option('--dry-run', 'Show what would be created without creating')
    .option('--ai-enhance', 'Use AI to enhance task details')
    .action(async (input, options) => {
      try {
        const handler = await registry.getHandler('task');
        await handler.execute('create', input, options);
      } catch (error) {
        logger.error('Task creation failed', error as Error);
        process.exit(1);
      }
    });

  // Add task subcommands
  taskCmd
    .command('list')
    .alias('ls')
    .description('List recent tasks')
    .option('-n, --count <count>', 'Number of tasks to show', parseInt, 10)
    .option('-f, --filter <filter>', 'Filter tasks')
    .action(async (options) => {
      try {
        const handler = await registry.getHandler('task');
        await handler.execute('list', null, options);
      } catch (error) {
        logger.error('Task listing failed', error as Error);
        process.exit(1);
      }
    });

  taskCmd
    .command('focus <taskId>')
    .alias('f')
    .description('Focus on a specific task')
    .action(async (taskId, options) => {
      try {
        const handler = await registry.getHandler('task');
        await handler.execute('focus', taskId, options);
      } catch (error) {
        logger.error('Task focus failed', error as Error);
        process.exit(1);
      }
    });

  // Register full AGILE commands with lazy loading
  const agileCmd = program
    .command('agile')
    .alias('a')
    .description('Full AGILE hierarchy management')
    .action(async () => {
      // Show AGILE help when no subcommand
      agileCmd.help();
    });

  // Lazy load AGILE subcommands when needed
  agileCmd.hook('preAction', async (thisCommand) => {
    const handler = await registry.getHandler('agile');
    if (handler && handler.registerCommands) {
      handler.registerCommands(thisCommand);
    }
  });

  // Add enhanced shortcuts for common operations
  program
    .command('quick <description>')
    .alias('q')
    .description('Super quick task creation with smart defaults')
    .option('-a, --assignee <user>', 'Assign to user')
    .option('-l, --labels <labels...>', 'Add labels')
    .action(async (description, options) => {
      try {
        // Use context to create task with smart defaults
        const handler = await registry.getHandler('task');
        await handler.execute('quick', description, options);
      } catch (error) {
        logger.error('Quick task creation failed', error as Error);
        process.exit(1);
      }
    });

  // Analysis commands (lazy loaded)
  const analyzeCmd = program
    .command('analyze')
    .alias('an')
    .description('Project analysis and reporting')
    .action(() => {
      analyzeCmd.help();
    });

  analyzeCmd
    .command('velocity')
    .description('Analyze team velocity trends')
    .option('-s, --sprints <count>', 'Number of sprints', parseInt, 5)
    .option('-t, --team <member>', 'Specific team member')
    .action(async (options) => {
      try {
        const handler = await registry.getHandler('agile');
        await handler.execute('analyze-velocity', null, options);
      } catch (error) {
        logger.error('Velocity analysis failed', error as Error);
        process.exit(1);
      }
    });

  analyzeCmd
    .command('risks')
    .description('Identify project risks')
    .option('-s, --sprint <sprintId>', 'Analyze specific sprint')
    .option('--create-tasks', 'Create mitigation tasks')
    .action(async (options) => {
      try {
        const handler = await registry.getHandler('agile');
        await handler.execute('analyze-risks', null, options);
      } catch (error) {
        logger.error('Risk analysis failed', error as Error);
        process.exit(1);
      }
    });

  // Context management
  program
    .command('context')
    .alias('ctx')
    .description('Manage project context')
    .option('-s, --show', 'Show current context')
    .option('-r, --reset', 'Reset context')
    .action(async (options) => {
      try {
        const handler = await registry.getHandler('task');
        await handler.execute('context', null, options);
      } catch (error) {
        logger.error('Context management failed', error as Error);
        process.exit(1);
      }
    });

  // Claude Code integration
  program
    .command('sync-claude-code')
    .alias('sync')
    .description('Sync with Claude Code native todo system')
    .option('--execute', 'Actually execute the sync (default: dry-run)')
    .option('--status', 'Show sync status')
    .option('--setup-hooks', 'Setup Claude Code hooks')
    .option('--demo', 'Show integration demo')
    .action(async (options) => {
      try {
        const { ClaudeCodeSyncCommand } = await import('./commands/claude-code-sync.js');
        const handler = new ClaudeCodeSyncCommand();
        
        if (options.status) {
          await handler.execute('status', null, options);
        } else if (options.setupHooks) {
          await handler.execute('setup-hooks', null, options);
        } else if (options.demo) {
          await handler.execute('demo', null, options);
        } else {
          await handler.execute('sync', null, options);
        }
      } catch (error) {
        logger.error('Claude Code sync failed', error as Error);
        process.exit(1);
      }
    });

  // Status overview
  program
    .command('status')
    .alias('st')
    .description('Show project status overview')
    .option('-d, --detailed', 'Show detailed status')
    .option('-f, --format <format>', 'Output format (text|json|markdown)', 'text')
    .action(async (options) => {
      try {
        const handler = await registry.getHandler('agile');
        await handler.execute('status', null, options);
      } catch (error) {
        logger.error('Status overview failed', error as Error);
        process.exit(1);
      }
    });

  // Help enhancements
  program.on('--help', () => {
    console.log('');
    console.log(chalk.cyan('Quick Start Examples:'));
    console.log('  $ cc task "fix login bug"                    # Create task');
    console.log('  $ cc task "add auth @high #security 5pts"   # Natural language');
    console.log('  $ cc quick "update docs"                    # Super quick');
    console.log('  $ cc agile phase create "MVP Phase"         # Full AGILE');
    console.log('  $ cc status                                 # Project overview');
    console.log('');
    console.log(chalk.cyan('Natural Language Task Examples:'));
    console.log('  $ cc task "fix login bug @high #auth due:friday"');
    console.log('  $ cc task "implement user profile 8pts for:@alice"');
    console.log('  $ cc task "refactor payment [needs testing] #refactor"');
    console.log('');
    console.log(chalk.cyan('Claude Code Integration:'));
    console.log('  $ cc sync-claude-code                       # Sync to Claude Code todos');
    console.log('  $ cc sync-claude-code --execute             # Execute sync');
    console.log('  $ cc sync-claude-code --status              # Show sync status');
    console.log('  $ cc sync-claude-code --setup-hooks         # Setup automatic sync');
    console.log('  $ cc sync-claude-code --demo                # Show integration demo');
    console.log('');
    console.log(chalk.gray('For command details: cc <command> --help'));
  });

  // Error handling
  program.exitOverride((err) => {
    if (err.code === 'commander.help' || err.code === 'commander.version') {
      process.exit(0);
    }
    logger.error('Command failed', err);
    process.exit(1);
  });

  return program;
}

// Performance measurement
const startTime = Date.now();

// Initialize and run
const cli = initializeCLI();

// Measure startup time
process.on('beforeExit', () => {
  const startupTime = Date.now() - startTime;
  if (process.env.CC_LOG_LEVEL === 'DEBUG') {
    logger.debug(`CLI startup time: ${startupTime}ms`);
  }
});

// Parse arguments
cli.parse(process.argv);

// Show help if no arguments
if (!process.argv.slice(2).length) {
  cli.help();
}