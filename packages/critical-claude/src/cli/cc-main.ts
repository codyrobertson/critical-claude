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
export async function initializeCLI() {
  const program = new Command();
  
  program
    .name('cc')
    .description('Critical Claude CLI - Unified Task Management')
    .version('2.3.0')
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

  // Init command
  program
    .command('init')
    .description('Initialize Critical Claude in your project')
    .option('--name <name>', 'Project name')
    .option('--template <template>', 'Initial template to load')
    .option('--team-size <size>', 'Team size', parseInt, 3)
    .action(async (options) => {
      try {
        const { UnifiedStorageManager } = await import('../core/unified-storage.js');
        const { AIService } = await import('../core/ai-service.js');
        const fs = await import('fs/promises');
        const path = await import('path');
        
        console.log('🚀 Initializing Critical Claude...');
        
        // Initialize storage
        const storage = new UnifiedStorageManager();
        await storage.initialize();
        
        // Create cc.env from template if it doesn't exist
        const envPath = path.join(process.cwd(), 'cc.env');
        // Fix path calculation for both development and production
        const fileUrl = new URL(import.meta.url);
        const dirname = path.dirname(fileUrl.pathname);
        // Remove leading slash on Windows
        const normalizedDirname = process.platform === 'win32' && dirname.startsWith('/') 
          ? dirname.substring(1) 
          : dirname;
        const templatePath = path.join(normalizedDirname, '../../cc.env.template');
        
        try {
          await fs.access(envPath);
          console.log('✅ cc.env already exists');
        } catch {
          try {
            let templateContent: string;
            try {
              // Try to read from template file first
              templateContent = await fs.readFile(templatePath, 'utf-8');
            } catch {
              // Fallback to embedded template
              templateContent = `# Critical Claude Environment Configuration
# Copy this file to cc.env and configure your AI provider

# =============================================================================
# AI PROVIDER CONFIGURATION
# Choose ONE of the following providers:
# =============================================================================

# Option 1: OpenAI (Recommended for most users)
# Get your API key from: https://platform.openai.com/api-keys
# OPENAI_API_KEY=sk-your-openai-api-key-here

# Option 2: Anthropic Claude API
# Get your API key from: https://console.anthropic.com/
# ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here

# Option 3: Claude Code CLI (Auto-detected if installed)
# Install with: npm install -g @anthropic-ai/claude-code
# Then authenticate with: claude auth login
# No additional environment variables needed

# =============================================================================
# CRITICAL CLAUDE CONFIGURATION
# =============================================================================

# Project name (used for task prefixes and organization)
CC_PROJECT_NAME=my-project

# Default team size for AI estimations
CC_TEAM_SIZE=3

# Team experience level (junior|intermediate|senior)
CC_EXPERIENCE_LEVEL=intermediate

# Enable verbose logging for debugging
# CC_LOG_LEVEL=DEBUG

# =============================================================================
# TASK MANAGEMENT SETTINGS
# =============================================================================

# Maximum number of AI-generated tasks per request
CC_MAX_TASKS=8

# Enable automatic dependency detection
CC_AUTO_DEPS=true

# Default task status for new tasks
CC_DEFAULT_STATUS=todo
`;
            }
            
            await fs.writeFile(envPath, templateContent);
            console.log('✅ Created cc.env from template');
            console.log('⚠️  Please configure your API keys in cc.env');
          } catch (err) {
            console.log('⚠️  Could not create cc.env - please create it manually');
            if (process.env.CC_DEBUG) {
              console.error('Template path:', templatePath);
              console.error('Error:', err);
            }
          }
        }
        
        // Load initial template if specified
        if (options.template) {
          const { TemplateCommand } = await import('./commands/template.js');
          const templateHandler = new TemplateCommand();
          console.log(`\n📋 Loading template: ${options.template}...`);
          await templateHandler.execute('load', [options.template], {});
        }
        
        console.log('\n✨ Critical Claude initialized successfully!');
        console.log('\nNext steps:');
        console.log('  1. Configure your API keys in cc.env');
        console.log('  2. Run "cc task ai <description>" to generate tasks');
        console.log('  3. Run "cc task list" to see your tasks');
        console.log('  4. Run "cc --help" for more commands');
        
      } catch (error) {
        console.error('❌ Initialization failed:', (error as Error).message);
        process.exit(1);
      }
    });

  // Unified task management - ONLY task command needed
  program
    .command('task [action] [args...]')
    .alias('t')
    .description('Unified task management (create|list|view|edit|delete|ai)')
    .option('-p, --priority <priority>', 'Task priority (critical|high|medium|low)', 'medium')
    .option('-s, --status <status>', 'Task status (todo|in_progress|done|blocked)')
    .option('-a, --assignee <assignee>', 'Task assignee')
    .option('--labels <labels...>', 'Task labels/tags')
    .option('-d, --description <desc>', 'Task description')
    .option('--points <num>', 'Story points')
    .option('--hours <num>', 'Estimated hours')
    .option('--actualHours <num>', 'Actual hours')
    .option('--ai', 'Enable AI assistance')
    .option('--plain', 'Plain text output')
    .option('--maxTasks <num>', 'Maximum tasks to generate', parseInt, 8)
    .option('--teamSize <num>', 'Team size for estimation', parseInt)
    .option('--experience <level>', 'Team experience (junior|intermediate|senior)', 'intermediate')
    .option('--timeline <time>', 'Time constraint for project')
    .option('--apply', 'Apply AI estimations to tasks')
    .option('--noDeps', 'Skip dependency generation')
    .option('--noEstimate', 'Skip AI estimation')
    .option('--draft', 'Create as draft')
    .option('--includeDrafts', 'Include drafts in list')
    .option('--includeArchived', 'Include archived tasks')
    .option('-n, --count <num>', 'Number of tasks to show', parseInt, 20)
    .option('--sortBy <field>', 'Sort by field (createdAt|updatedAt|priority|title|status)', 'updatedAt')
    .option('--sortOrder <order>', 'Sort order (asc|desc)', 'desc')
    .action(async (action, args, options) => {
      try {
        const { UnifiedTaskCommand } = await import('./commands/unified-task.js');
        const handler = new UnifiedTaskCommand();
        await handler.execute(action || 'list', args || [], options);
      } catch (error) {
        console.error('❌ Task operation failed:', (error as Error).message);
        process.exit(1);
      }
    });

  // Task viewer command
  program
    .command('viewer')
    .alias('v')
    .description('Launch terminal-based task viewer')
    .option('-d, --debug', 'Enable debug logging')
    .option('-v, --verbose', 'Enable verbose logging')
    .option('-q, --quiet', 'Suppress non-error output')
    .action(async (options) => {
      try {
        const { ViewerCommand } = await import('./commands/viewer.js');
        const handler = new ViewerCommand();
        await handler.execute(options);
      } catch (error) {
        console.error('❌ Viewer failed:', (error as Error).message);
        process.exit(1);
      }
    });

  // Template command
  program
    .command('template [action] [args...]')
    .alias('tpl')
    .description('Task template management')
    .option('-d, --description <desc>', 'Template description')
    .option('-o, --output <file>', 'Output file for export')
    .option('--draft', 'Create tasks as drafts')
    .option('--status <status>', 'Filter tasks by status')
    .option('--priority <priority>', 'Filter tasks by priority')
    .option('--labels <labels...>', 'Filter tasks by labels')
    .option('-q, --quiet', 'Suppress detailed output')
    .action(async (action, args, options) => {
      try {
        const { TemplateCommand } = await import('./commands/template.js');
        const handler = new TemplateCommand();
        await handler.execute(action || 'list', args || [], options);
      } catch (error) {
        console.error('❌ Template operation failed:', (error as Error).message);
        process.exit(1);
      }
    });

  // Template generator command
  program
    .command('create-template')
    .description('Interactive template generator - create custom templates with guided prompts')
    .action(async () => {
      try {
        console.log('🚀 Launching Interactive Template Generator...\n');
        
        // Import the template generator
        const { spawn } = await import('child_process');
        const path = await import('path');
        
        // Find the script path
        const scriptPath = path.join(path.dirname(new URL(import.meta.url).pathname), '../../../scripts/create-template.js');
        
        // Run the interactive script
        const child = spawn('node', [scriptPath], {
          stdio: 'inherit',
          shell: true
        });
        
        child.on('error', (err) => {
          console.error('❌ Failed to start template generator:', err.message);
          process.exit(1);
        });
        
        child.on('close', (code) => {
          if (code !== 0) {
            console.error(`❌ Template generator exited with code ${code}`);
            process.exit(code || 1);
          }
        });
        
      } catch (error) {
        console.error('❌ Template generator failed:', (error as Error).message);
        process.exit(1);
      }
    });

  // Hook system management
  program
    .command('hooks')
    .description('Unified hook system management')
    .option('--status', 'Show hook status')
    .option('--init', 'Initialize hook system')
    .action(async (options) => {
      try {
        const { UnifiedHookManager } = await import('../core/unified-hook-manager.js');
        const { UnifiedStorageManager } = await import('../core/unified-storage.js');
        
        const storage = new UnifiedStorageManager();
        await storage.initialize();
        
        const hookManager = new UnifiedHookManager(storage);
        
        if (options.init) {
          await hookManager.initialize();
          console.log('✅ Hook system initialized');
        } else {
          const health = await hookManager.healthCheck();
          console.log('🔧 Hook System Status:');
          console.log(`  Enabled: ${health.enabled ? '✅' : '❌'}`);
          console.log(`  Working: ${health.working ? '✅' : '❌'}`);
          if (health.lastSync) {
            console.log(`  Last Sync: ${health.lastSync.toISOString()}`);
          }
        }
      } catch (error) {
        console.error('❌ Hook system failed:', (error as Error).message);
        process.exit(1);
      }
    });

  // MCP Server command for Claude Desktop integration
  program
    .command('mcp-server')
    .description('Start MCP server for Claude Desktop integration')
    .option('-p, --port <port>', 'Server port', parseInt, 3000)
    .option('--log-level <level>', 'Log level (error|warn|info|debug)', 'info')
    .action(async (options) => {
      try {
        // Import and run the MCP server
        const serverModule = await import('../mcp-server.js');
        console.log('🚀 Starting MCP server for Claude Desktop...');
        // The mcp-server.js handles its own initialization
      } catch (error) {
        console.error('❌ MCP server failed:', (error as Error).message);
        process.exit(1);
      }
    });


  // Help enhancements - only load when needed
  program.on('--help', async () => {
    const { chalk } = await loadHeavyDependencies();
    console.log('');
    console.log(chalk.cyan('✨ Critical Claude - Unified Task Management'));
    console.log('');
    console.log(chalk.cyan('Getting Started:'));
    console.log('  $ cc init                                   # Initialize in your project');
    console.log('  $ cc init --template webapp                 # Init with a template');
    console.log('');
    console.log(chalk.cyan('Quick Examples:'));
    console.log('  $ cc task create "Fix login bug"            # Create task');
    console.log('  $ cc task list                              # List tasks');
    console.log('  $ cc task view <task-id>                    # View task details');
    console.log('  $ cc task edit <task-id> --status done     # Update task');
    console.log('  $ cc task ai "Build auth system"           # AI generates tasks');
    console.log('  $ cc task expand <task-id>                 # Expand into subtasks');
    console.log('  $ cc task estimate <task-id> --apply       # AI task estimation');
    console.log('  $ cc task deps                             # Analyze dependencies');
    console.log('');
    console.log(chalk.cyan('Template System:'));
    console.log('  $ cc task template list                     # List available templates');
    console.log('  $ cc task template webapp                   # Load webapp template');
    console.log('  $ cc create-template                        # Interactive template creator');
    console.log('');
    console.log(chalk.cyan('Task Operations:'));
    console.log('  $ cc task create "Fix bug @high #security 3pts for:alice"');
    console.log('  $ cc task list --status in_progress --assignee bob');
    console.log('  $ cc task delete <task-id>                  # Delete task');
    console.log('  $ cc task archive <task-id>                 # Archive task');
    console.log('');
    console.log(chalk.cyan('Claude Desktop Integration:'));
    console.log('  $ cc mcp-server                            # Start MCP server');
    console.log('');
    console.log(chalk.gray('📖 Everything goes through: cc task [action]'));
    console.log(chalk.gray('   Actions: create|list|view|edit|delete|archive|ai|stats'));
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