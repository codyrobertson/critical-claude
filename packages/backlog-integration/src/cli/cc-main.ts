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

import { performance } from 'perf_hooks';

// Measure startup time
const startTime = performance.now();

// Only import what we absolutely need upfront
import { Command } from 'commander';

// Dynamic imports for heavy dependencies
let chalk: any;
let registry: any;
let logger: any;

async function loadHeavyDependencies() {
  if (!chalk) {
    const [chalkModule, registryModule, loggerModule] = await Promise.all([
      import('chalk'),
      import('./command-registry.js'),
      import('../core/logger.js')
    ]);
    
    chalk = chalkModule.default;
    const { CommandRegistry } = registryModule;
    logger = loggerModule.logger;
    registry = new CommandRegistry();
  }
  return { chalk, registry, logger };
}

// Command registration will be done lazily when needed

// Initialize CLI
async function initializeCLI() {
  const program = new Command();
  
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

  // Natural task management commands
  program
    .command('create <title>')
    .alias('c')
    .description('Create a new task')
    .option('-d, --description <desc>', 'Task description')
    .option('-p, --priority <priority>', 'Task priority (critical|high|medium|low)', 'medium')
    .option('-a, --assignee <assignee>', 'Task assignee')
    .option('-s, --status <status>', 'Task status (To Do|In Progress|Done|Blocked)', 'To Do')
    .option('--labels <labels...>', 'Task labels/tags')
    .option('--draft', 'Create as draft')
    .action(async (title, options) => {
      try {
        const { MCPTaskSimpleCommand } = await import('./commands/mcp-task-simple.js');
        const handler = new MCPTaskSimpleCommand();
        await handler.execute('create', title, options);
      } catch (error) {
        console.error('❌ Task creation failed:', (error as Error).message);
        process.exit(1);
      }
    });

  program
    .command('list')
    .alias('ls')
    .description('List recent tasks')
    .option('-n, --count <count>', 'Number of tasks to show', parseInt, 10)
    .option('-f, --filter <filter>', 'Filter tasks')
    .option('-s, --status <status>', 'Filter by status (To Do|In Progress|Done|Blocked)')
    .option('-p, --priority <priority>', 'Task priority (critical|high|medium|low)')
    .option('-a, --assignee <assignee>', 'Task assignee')
    .option('--includeDrafts', 'Include drafts in list')
    .option('--plain', 'Plain text output')
    .action(async (options) => {
      try {
        const { MCPTaskSimpleCommand } = await import('./commands/mcp-task-simple.js');
        const handler = new MCPTaskSimpleCommand();
        await handler.execute('list', null, options);
      } catch (error) {
        console.error('❌ Task listing failed:', (error as Error).message);
        process.exit(1);
      }
    });

  program
    .command('view <taskId>')
    .alias('show')
    .description('View task details')
    .option('--plain', 'Plain text output')
    .action(async (taskId, options) => {
      try {
        const { MCPTaskSimpleCommand } = await import('./commands/mcp-task-simple.js');
        const handler = new MCPTaskSimpleCommand();
        await handler.execute('view', taskId, options);
      } catch (error) {
        console.error('❌ Task view failed:', (error as Error).message);
        process.exit(1);
      }
    });

  program
    .command('edit <taskId>')
    .alias('update')
    .description('Edit a task')
    .option('-t, --title <title>', 'Update task title')
    .option('-d, --description <desc>', 'Update task description')
    .option('-p, --priority <priority>', 'Update task priority')
    .option('-a, --assignee <assignee>', 'Update task assignee')
    .option('-s, --status <status>', 'Update task status')
    .option('--labels <labels...>', 'Update task labels')
    .action(async (taskId, options) => {
      try {
        const { MCPTaskSimpleCommand } = await import('./commands/mcp-task-simple.js');
        const handler = new MCPTaskSimpleCommand();
        await handler.execute('edit', taskId, options);
      } catch (error) {
        console.error('❌ Task edit failed:', (error as Error).message);
        process.exit(1);
      }
    });

  program
    .command('archive <taskId>')
    .description('Archive a completed task')
    .action(async (taskId, options) => {
      try {
        const { MCPTaskSimpleCommand } = await import('./commands/mcp-task-simple.js');
        const handler = new MCPTaskSimpleCommand();
        await handler.execute('archive', taskId, options);
      } catch (error) {
        console.error('❌ Task archive failed:', (error as Error).message);
        process.exit(1);
      }
    });

  program
    .command('ai <text>')
    .description('Create tasks from text using AI')
    .option('--context <project>', 'Project context for AI')
    .option('--expand <level>', 'AI expansion level (1-3)', parseInt, 2)
    .action(async (text, options) => {
      try {
        const { MCPTaskSimpleCommand } = await import('./commands/mcp-task-simple.js');
        const handler = new MCPTaskSimpleCommand();
        await handler.execute('ai', text, options);
      } catch (error) {
        console.error('❌ AI task creation failed:', (error as Error).message);
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
    const { registry } = await loadHeavyDependencies();
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
        const { registry } = await loadHeavyDependencies();
        const handler = await registry.getHandler('task');
        await handler.execute('quick', description, options);
      } catch (error) {
        console.error('❌ Quick task creation failed:', (error as Error).message);
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
        const { registry } = await loadHeavyDependencies();
        const handler = await registry.getHandler('agile');
        await handler.execute('analyze-velocity', null, options);
      } catch (error) {
        console.error('❌ Velocity analysis failed:', (error as Error).message);
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
        const { registry } = await loadHeavyDependencies();
        const handler = await registry.getHandler('agile');
        await handler.execute('analyze-risks', null, options);
      } catch (error) {
        console.error('❌ Risk analysis failed:', (error as Error).message);
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
        const { registry } = await loadHeavyDependencies();
        const handler = await registry.getHandler('task');
        await handler.execute('context', null, options);
      } catch (error) {
        console.error('❌ Context management failed:', (error as Error).message);
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
    .option('--test', 'Test integration methods without syncing')
    .option('--direction <direction>', 'Sync direction (to-claude-code|from-claude-code|both)', 'both')
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
        console.error('❌ Claude Code sync failed:', (error as Error).message);
        process.exit(1);
      }
    });

  // Hook management commands
  const hooksCmd = program
    .command('hooks [action]')
    .description('Manage Claude Code hooks integration')
    .action(async (action, options) => {
      try {
        const { registry } = await loadHeavyDependencies();
        const handler = await registry.getHandler('hooks');
        await handler.execute(action || 'help', null, options);
      } catch (error) {
        console.error('❌ Hooks command failed:', (error as Error).message);
        process.exit(1);
      }
    });

  hooksCmd
    .command('install')
    .description('Install basic Claude Code hooks')
    .action(async (options) => {
      try {
        const { registry } = await loadHeavyDependencies();
        const handler = await registry.getHandler('hooks');
        await handler.execute('install', null, options);
      } catch (error) {
        console.error('❌ Hook installation failed:', (error as Error).message);
        process.exit(1);
      }
    });

  hooksCmd
    .command('status')
    .description('Show hook status and activity')
    .action(async (options) => {
      try {
        const { registry } = await loadHeavyDependencies();
        const handler = await registry.getHandler('hooks');
        await handler.execute('status', null, options);
      } catch (error) {
        console.error('❌ Hook status check failed:', (error as Error).message);
        process.exit(1);
      }
    });

  hooksCmd
    .command('test')
    .description('Test hook integration')
    .action(async (options) => {
      try {
        const { registry } = await loadHeavyDependencies();
        const handler = await registry.getHandler('hooks');
        await handler.execute('test', null, options);
      } catch (error) {
        console.error('❌ Hook test failed:', (error as Error).message);
        process.exit(1);
      }
    });

  hooksCmd
    .command('upgrade')
    .description('Upgrade to advanced hooks')
    .action(async (options) => {
      try {
        const { registry } = await loadHeavyDependencies();
        const handler = await registry.getHandler('hooks');
        await handler.execute('upgrade', null, options);
      } catch (error) {
        console.error('❌ Hook upgrade failed:', (error as Error).message);
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
        const { registry } = await loadHeavyDependencies();
        const handler = await registry.getHandler('agile');
        await handler.execute('status', null, options);
      } catch (error) {
        console.error('❌ Status overview failed:', (error as Error).message);
        process.exit(1);
      }
    });

  // Live monitor command
  program
    .command('live')
    .alias('l')
    .description('Live monitor for tasks and sync activity with real-time updates')
    .option('-t, --tail-lines <lines>', 'Number of log lines to tail', parseInt, 10)
    .option('-r, --refresh-rate <ms>', 'Refresh rate in milliseconds', parseInt, 1000)
    .action(async (options) => {
      try {
        const { registry } = await loadHeavyDependencies();
        const handler = await registry.getHandler('live');
        await handler.execute('monitor', null, options);
      } catch (error) {
        console.error('❌ Live monitor failed:', (error as Error).message);
        process.exit(1);
      }
    });

  // Simple task management for small teams
  program
    .command('simple [action] [args...]')
    .alias('s')
    .description('Simplified task management for small teams')
    .option('-s, --status <status>', 'Filter by status (todo|in-progress|blocked|done|archived)')
    .option('-p, --priority <priority>', 'Task priority (critical|high|medium|low)')
    .option('-a, --assignee <assignee>', 'Task assignee')
    .option('--points <points>', 'Story points (1-13)')
    .option('--due <date>', 'Due date (YYYY-MM-DD)')
    .option('--labels <labels...>', 'Task labels/tags')
    .option('--description <desc>', 'Task description')
    .option('-v, --verbose', 'Show detailed information')
    .action(async (action, args, options) => {
      try {
        const { registry } = await loadHeavyDependencies();
        const handler = await registry.getHandler('simple');
        await handler.execute(action || 'list', args || [], options);
      } catch (error) {
        console.error('❌ Simple task command failed:', (error as Error).message);
        process.exit(1);
      }
    });


  // Task UI as standalone command
  program
    .command('task-ui')
    .alias('ui')
    .description('Launch interactive task management UI with optimized performance')
    .action(async (options) => {
      try {
        const { registry } = await loadHeavyDependencies();
        const handler = await registry.getHandler('task-ui');
        await handler.execute('ui', null, options);
      } catch (error) {
        console.error('❌ Task UI failed:', (error as Error).message);
        process.exit(1);
      }
    });

  // Monitor command
  program
    .command('monitor')
    .alias('m')
    .description('Launch the Critical Claude task and hook monitor')
    .option('-t, --terminal', 'Use terminal-based monitor instead of GUI')
    .action(async (options) => {
      try {
        const { registry } = await loadHeavyDependencies();
        const handler = await registry.getHandler('monitor');
        await handler.execute(options.terminal ? 'terminal' : 'gui', null, options);
      } catch (error) {
        console.error('❌ Monitor launch failed:', (error as Error).message);
        process.exit(1);
      }
    });

  // Help enhancements - only load when needed
  program.on('--help', async () => {
    const { chalk } = await loadHeavyDependencies();
    console.log('');
    console.log(chalk.cyan('Quick Start Examples:'));
    console.log('  $ cc create "Fix login bug"                 # Create task');
    console.log('  $ cc list                                   # List tasks');
    console.log('  $ cc view <task-id>                         # View task details');
    console.log('  $ cc edit <task-id> --status "In Progress"  # Update task');
    console.log('  $ cc ai "Build user authentication system"  # AI generates tasks');
    console.log('');
    console.log(chalk.cyan('Task Management:'));
    console.log('  $ cc create "Fix bug" --priority high --assignee alice');
    console.log('  $ cc list --status "In Progress" --assignee bob');
    console.log('  $ cc archive <task-id>                      # Archive completed task');
    console.log('');
    console.log(chalk.cyan('AI-Powered Features:'));
    console.log('  $ cc ai "Implement OAuth2 login system"     # Generate multiple tasks');
    console.log('  $ cc ai ./requirements.md --context "web-app"  # Tasks from file');
    console.log('');
    console.log(chalk.cyan('Monitor & Sync:'));
    console.log('  $ cc monitor                                # Launch task monitor');
    console.log('  $ cc sync-claude-code                       # Sync with Claude Code');
    console.log('  $ cc task-ui                                # Interactive UI');
    console.log('');
    console.log(chalk.gray('For detailed help: cc <command> --help'));
  });

  // Error handling
  program.exitOverride((err) => {
    if (err.code === 'commander.help' || err.code === 'commander.version') {
      process.exit(0);
    }
    console.error('❌ Command failed:', err.message);
    process.exit(1);
  });

  return program;
}

// Run the CLI
async function main() {
  try {
    const program = await initializeCLI();
    await program.parseAsync(process.argv);
    
    // Measure performance
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (process.env.CC_PERFORMANCE_LOG === 'true') {
      console.log(`CLI startup time: ${duration.toFixed(2)}ms`);
    }
    
    // Exit if no arguments (show help)
    if (!process.argv.slice(2).length) {
      program.help();
    }
  } catch (error) {
    console.error('❌ CLI initialization failed:', (error as Error).message);
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

main();