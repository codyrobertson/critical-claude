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
let chalk;
let registry;
let logger;
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
        }
        catch (error) {
            console.error('❌ Task operation failed:', error.message);
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
        }
        catch (error) {
            console.error('❌ Viewer failed:', error.message);
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
        }
        catch (error) {
            console.error('❌ Template operation failed:', error.message);
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
            }
            else {
                const health = await hookManager.healthCheck();
                console.log('🔧 Hook System Status:');
                console.log(`  Enabled: ${health.enabled ? '✅' : '❌'}`);
                console.log(`  Working: ${health.working ? '✅' : '❌'}`);
                if (health.lastSync) {
                    console.log(`  Last Sync: ${health.lastSync.toISOString()}`);
                }
            }
        }
        catch (error) {
            console.error('❌ Hook system failed:', error.message);
            process.exit(1);
        }
    });
    // Help enhancements - only load when needed
    program.on('--help', async () => {
        const { chalk } = await loadHeavyDependencies();
        console.log('');
        console.log(chalk.cyan('✨ Critical Claude - Unified Task Management'));
        console.log('');
        console.log(chalk.cyan('Quick Examples:'));
        console.log('  $ cc task create "Fix login bug"             # Create task');
        console.log('  $ cc task list                              # List tasks');
        console.log('  $ cc task view <task-id>                    # View task details');
        console.log('  $ cc task edit <task-id> --status done     # Update task');
        console.log('  $ cc task ai "Build auth system"           # AI generates tasks');
        console.log('  $ cc task expand <task-id>                 # Expand into subtasks');
        console.log('  $ cc task estimate <task-id> --apply       # AI task estimation');
        console.log('  $ cc task deps                             # Analyze dependencies');
        console.log('');
        console.log(chalk.cyan('Task Operations:'));
        console.log('  $ cc task create "Fix bug @high #security 3pts for:alice"');
        console.log('  $ cc task list --status in_progress --assignee bob');
        console.log('  $ cc task delete <task-id>                  # Delete task');
        console.log('  $ cc task archive <task-id>                 # Archive task');
        console.log('');
        console.log(chalk.cyan('Claude Code Integration:'));
        console.log('  $ cc sync-claude-code --execute            # Sync with Claude Code');
        console.log('  $ cc sync-claude-code --status             # Check sync status');
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
    }
    catch (error) {
        console.error('❌ CLI initialization failed:', error.message);
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
//# sourceMappingURL=cc-main.js.map