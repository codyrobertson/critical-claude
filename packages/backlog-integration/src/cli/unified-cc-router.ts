#!/usr/bin/env node

/**
 * Unified Critical Claude CLI Router
 * Standardized command structure with clean, intuitive commands
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { spawn } from 'child_process';

const program = new Command();

program
  .name('cc')
  .description('Critical Claude - Unified CLI for code critique and task management')
  .version('3.0.0')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-q, --quiet', 'Suppress non-essential output')
  .option('--no-color', 'Disable colored output');

// Handle global options
program.hook('preAction', (thisCommand) => {
  const opts = thisCommand.opts();
  if (opts.verbose) process.env.CC_LOG_LEVEL = 'DEBUG';
  if (opts.quiet) process.env.CC_LOG_LEVEL = 'ERROR';
  if (opts.noColor) process.env.FORCE_COLOR = '0';
});

// ═══════════════════════════════════════════════════════════════
// 📋 TASK MANAGEMENT: cc task <action>
// ═══════════════════════════════════════════════════════════════

const taskCmd = program
  .command('task <action>')
  .alias('t')
  .description('Task management operations')
  .action(async (action, options) => {
    switch (action) {
      case 'list':
      case 'ls':
        await executeTaskCommand('list', [], options);
        break;
      case 'ui':
      case 'interface':
        await executeTaskCommand('ui', [], options);
        break;
      case 'add':
      case 'create':
        const title = options.args?.[0] || await promptForTitle();
        await executeTaskCommand('add', [title], options);
        break;
      case 'show':
      case 'view':
        const id = options.args?.[0];
        if (!id) {
          console.error(chalk.red('❌ Task ID required: cc task show <id>'));
          process.exit(1);
        }
        await executeTaskCommand('show', [id], options);
        break;
      case 'edit':
      case 'update':
        const editId = options.args?.[0];
        if (!editId) {
          console.error(chalk.red('❌ Task ID required: cc task edit <id>'));
          process.exit(1);
        }
        await executeTaskCommand('edit', [editId], options);
        break;
      case 'delete':
      case 'remove':
        const deleteId = options.args?.[0];
        if (!deleteId) {
          console.error(chalk.red('❌ Task ID required: cc task delete <id>'));
          process.exit(1);
        }
        await executeTaskCommand('delete', [deleteId], options);
        break;
      default:
        console.error(chalk.red(`❌ Unknown task action: ${action}`));
        console.log(chalk.yellow('Available actions: list, ui, add, show, edit, delete'));
        process.exit(1);
    }
  });

// Add task subcommands for better UX
taskCmd
  .command('list')
  .alias('ls')
  .description('List all tasks')
  .option('-s, --status <status>', 'Filter by status')
  .option('-p, --priority <priority>', 'Filter by priority')
  .action(async (options) => {
    await executeTaskCommand('list', [], options);
  });

taskCmd
  .command('ui')
  .description('Launch interactive task management UI')
  .action(async (options) => {
    await executeTaskCommand('ui', [], options);
  });

taskCmd
  .command('add <title>')
  .description('Add new task')
  .option('-p, --priority <priority>', 'Task priority (critical|high|medium|low)')
  .option('-a, --assignee <assignee>', 'Task assignee')
  .option('-d, --description <desc>', 'Task description')
  .action(async (title, options) => {
    await executeTaskCommand('add', [title], options);
  });

// ═══════════════════════════════════════════════════════════════
// 🔧 HOOK MANAGEMENT: cc hook <action>
// ═══════════════════════════════════════════════════════════════

const hookCmd = program
  .command('hook <action>')
  .description('Claude Code hook management')
  .action(async (action, options) => {
    switch (action) {
      case 'status':
        await executeHookCommand('status', [], options);
        break;
      case 'install':
        await executeHookCommand('install', [], options);
        break;
      case 'test':
        await executeHookCommand('test', [], options);
        break;
      case 'upgrade':
        await executeHookCommand('upgrade', [], options);
        break;
      default:
        console.error(chalk.red(`❌ Unknown hook action: ${action}`));
        console.log(chalk.yellow('Available actions: status, install, test, upgrade'));
        process.exit(1);
    }
  });

// Add hook subcommands
hookCmd
  .command('status')
  .description('Show hook status and activity')
  .action(async (options) => {
    await executeHookCommand('status', [], options);
  });

hookCmd
  .command('install')
  .description('Install Claude Code hooks')
  .action(async (options) => {
    await executeHookCommand('install', [], options);
  });

hookCmd
  .command('test')
  .description('Test hook integration')
  .action(async (options) => {
    await executeHookCommand('test', [], options);
  });

hookCmd
  .command('upgrade')
  .description('Upgrade to advanced hooks')
  .action(async (options) => {
    await executeHookCommand('upgrade', [], options);
  });

// ═══════════════════════════════════════════════════════════════
// 🔍 CODE ANALYSIS: Semantic command structure
// ═══════════════════════════════════════════════════════════════

// cc analyze file <path>        - Analyze specific file
// cc analyze architecture       - Analyze overall architecture  
// cc analyze codebase          - Explore entire codebase
// cc review file <path>        - Review specific file
// cc review architecture       - Review system architecture

const analyzeCmd = program
  .command('analyze <type> [path]')
  .description('Analyze code, architecture, or codebase')
  .action(async (type, path, options) => {
    switch (type) {
      case 'file':
        if (!path) {
          console.error(chalk.red('❌ File path required: cc analyze file <path>'));
          process.exit(1);
        }
        await executeCritiqueCommand('code', [path], options);
        break;
      case 'architecture':
        const archPath = path || '.';
        await executeCritiqueCommand('arch', [archPath], options);
        break;
      case 'codebase':
        const codebasePath = path || '.';
        await executeCritiqueCommand('explore', [codebasePath], options);
        break;
      default:
        console.error(chalk.red(`❌ Unknown analysis type: ${type}`));
        console.log(chalk.yellow('Available types: file, architecture, codebase'));
        process.exit(1);
    }
  });

const reviewCmd = program
  .command('review <type> [path]')
  .description('Review code, architecture, or system design')
  .action(async (type, path, options) => {
    switch (type) {
      case 'file':
        if (!path) {
          console.error(chalk.red('❌ File path required: cc review file <path>'));
          process.exit(1);
        }
        await executeCritiqueCommand('code', [path], options);
        break;
      case 'architecture':
        const archPath = path || '.';
        await executeCritiqueCommand('arch', [archPath], options);
        break;
      default:
        console.error(chalk.red(`❌ Unknown review type: ${type}`));
        console.log(chalk.yellow('Available types: file, architecture'));
        process.exit(1);
    }
  });

// ═══════════════════════════════════════════════════════════════
// 🤖 AI PLANNING: cc plan <input>
// ═══════════════════════════════════════════════════════════════

const planCmd = program
  .command('plan <type>')
  .description('AI-powered planning and timeline generation')
  .action(async (type, options) => {
    const input = options.args?.[0];
    
    switch (type) {
      case 'feature':
        if (!input) {
          console.error(chalk.red('❌ Feature description required: cc plan feature "<description>"'));
          process.exit(1);
        }
        await executePlanCommand('feature', [input], options);
        break;
      case 'timeline':
        if (!input) {
          console.error(chalk.red('❌ Project description required: cc plan timeline "<description>"'));
          process.exit(1);
        }
        await executePlanCommand('timeline', [input], options);
        break;
      case 'mvp':
        if (!input) {
          console.error(chalk.red('❌ MVP description required: cc plan mvp "<description>"'));
          process.exit(1);
        }
        await executePlanCommand('mvp', [input], options);
        break;
      default:
        console.error(chalk.red(`❌ Unknown plan type: ${type}`));
        console.log(chalk.yellow('Available types: feature, timeline, mvp'));
        process.exit(1);
    }
  });

// ═══════════════════════════════════════════════════════════════
// 🎮 INTERACTIVE UI: cc ui
// ═══════════════════════════════════════════════════════════════

program
  .command('ui [type]')
  .description('Launch interactive interfaces')
  .action(async (type, options) => {
    switch (type) {
      case 'monitor':
        await executeUICommand('monitor', [], options);
        break;
      case 'status':
        await executeUICommand('status', [], options);
        break;
      default:
        // Default to task UI
        await executeUICommand('task', [], options);
    }
  });

// ═══════════════════════════════════════════════════════════════
// 📊 SYSTEM STATUS: cc status
// ═══════════════════════════════════════════════════════════════

program
  .command('status [component]')
  .description('Show system status')
  .action(async (component, options) => {
    switch (component) {
      case 'tasks':
        await executeStatusCommand('tasks', [], options);
        break;
      case 'hooks':
        await executeStatusCommand('hooks', [], options);
        break;
      case 'sync':
        await executeStatusCommand('sync', [], options);
        break;
      default:
        await executeStatusCommand('overview', [], options);
    }
  });

// ═══════════════════════════════════════════════════════════════
// EXECUTION FUNCTIONS
// ═══════════════════════════════════════════════════════════════

async function executeTaskCommand(action: string, args: string[], options: any): Promise<void> {
  try {
    switch (action) {
      case 'list':
        await spawn('cc-backlog', ['task-ui', 'list'], { stdio: 'inherit' });
        break;
      case 'ui':
        await spawn('cc-backlog', ['task-ui'], { stdio: 'inherit' });
        break;
      case 'add':
        console.log(chalk.blue(`📝 Adding task: ${args[0]}`));
        // Implement task creation logic
        break;
      default:
        console.log(chalk.blue(`📋 Task ${action}: ${args.join(' ')}`));
    }
  } catch (error) {
    console.error(chalk.red(`❌ Task command failed: ${(error as Error).message}`));
    process.exit(1);
  }
}

async function executeHookCommand(action: string, args: string[], options: any): Promise<void> {
  try {
    const command = `cc-hooks-${action}`;
    await spawn('cc-backlog', [command], { stdio: 'inherit' });
  } catch (error) {
    console.error(chalk.red(`❌ Hook command failed: ${(error as Error).message}`));
    process.exit(1);
  }
}

async function executeCritiqueCommand(type: string, args: string[], options: any): Promise<void> {
  try {
    if (type === 'code') {
      // Analyze specific file
      await spawn('cc-backlog', ['cc-analyze', ...args], { stdio: 'inherit' });
    } else if (type === 'arch') {
      // Architecture analysis
      await spawn('cc-backlog', ['cc-analyze', '--create-tasks', ...args], { stdio: 'inherit' });
    } else if (type === 'explore') {
      // Codebase exploration
      await spawn('cc-backlog', ['cc-analyze', '--create-tasks', ...args], { stdio: 'inherit' });
    } else {
      console.error(chalk.red(`❌ Unknown analysis type: ${type}`));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red(`❌ Analysis command failed: ${(error as Error).message}`));
    process.exit(1);
  }
}

async function executePlanCommand(type: string, args: string[], options: any): Promise<void> {
  try {
    await spawn('cc', ['plan', type, ...args], { stdio: 'inherit' });
  } catch (error) {
    console.error(chalk.red(`❌ Plan command failed: ${(error as Error).message}`));
    process.exit(1);
  }
}

async function executeUICommand(type: string, args: string[], options: any): Promise<void> {
  try {
    switch (type) {
      case 'task':
        await spawn('cc-backlog', ['task-ui'], { stdio: 'inherit' });
        break;
      case 'monitor':
        await spawn('cc-backlog', ['live'], { stdio: 'inherit' });
        break;
      default:
        await spawn('cc-backlog', ['task-ui'], { stdio: 'inherit' });
    }
  } catch (error) {
    console.error(chalk.red(`❌ UI command failed: ${(error as Error).message}`));
    process.exit(1);
  }
}

async function executeStatusCommand(component: string, args: string[], options: any): Promise<void> {
  try {
    switch (component) {
      case 'hooks':
        await spawn('cc-backlog', ['cc-hooks-status'], { stdio: 'inherit' });
        break;
      case 'tasks':
        await spawn('cc-backlog', ['status'], { stdio: 'inherit' });
        break;
      default:
        await spawn('cc-backlog', ['status'], { stdio: 'inherit' });
    }
  } catch (error) {
    console.error(chalk.red(`❌ Status command failed: ${(error as Error).message}`));
    process.exit(1);
  }
}

async function promptForTitle(): Promise<string> {
  // Simple fallback - in a real implementation you'd use inquirer
  console.error(chalk.red('❌ Task title required: cc task add "<title>"'));
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════
// HELP AND ERROR HANDLING
// ═══════════════════════════════════════════════════════════════

program.on('--help', () => {
  console.log('');
  console.log(chalk.cyan('📖 Standardized Command Examples:'));
  console.log('');
  console.log(chalk.yellow('Task Management:'));
  console.log('  cc task list                    # List all tasks');
  console.log('  cc task ui                      # Interactive task UI');
  console.log('  cc task add "Fix login bug"     # Add new task');
  console.log('');
  console.log(chalk.yellow('Hook Management:'));
  console.log('  cc hook status                  # Check hook status');
  console.log('  cc hook install                 # Install hooks');
  console.log('  cc hook test                    # Test hooks');
  console.log('');
  console.log(chalk.yellow('Code Analysis:'));
  console.log('  cc analyze file src/auth.ts     # Analyze specific file');
  console.log('  cc analyze architecture         # Analyze system architecture');
  console.log('  cc analyze codebase            # Explore entire codebase');
  console.log('  cc review file src/auth.ts     # Review specific file');
  console.log('  cc review architecture         # Review system architecture');
  console.log('');
  console.log(chalk.yellow('Interactive UI:'));
  console.log('  cc ui                           # Task management UI');
  console.log('  cc ui monitor                   # Live monitor');
  console.log('');
  console.log(chalk.yellow('System Status:'));
  console.log('  cc status                       # Overall status');
  console.log('  cc status hooks                 # Hook status');
  console.log('');
});

// Parse command line arguments
program.parse(process.argv);

// Show help if no arguments provided
if (!process.argv.slice(2).length) {
  program.help();
}