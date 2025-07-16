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
            const { registry, logger } = await loadHeavyDependencies();
            const handler = await registry.getHandler('task');
            await handler.execute('create', input, options);
        }
        catch (error) {
            console.error('❌ Task creation failed:', error.message);
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
            const { registry } = await loadHeavyDependencies();
            const handler = await registry.getHandler('task');
            await handler.execute('list', null, options);
        }
        catch (error) {
            console.error('❌ Task listing failed:', error.message);
            process.exit(1);
        }
    });
    taskCmd
        .command('focus <taskId>')
        .alias('f')
        .description('Focus on a specific task')
        .action(async (taskId, options) => {
        try {
            const { registry } = await loadHeavyDependencies();
            const handler = await registry.getHandler('task');
            await handler.execute('focus', taskId, options);
        }
        catch (error) {
            console.error('❌ Task focus failed:', error.message);
            process.exit(1);
        }
    });
    taskCmd
        .command('ui')
        .alias('browse')
        .description('Launch interactive task management UI')
        .action(async (options) => {
        try {
            const { registry } = await loadHeavyDependencies();
            const handler = await registry.getHandler('task-ui');
            await handler.execute('ui', null, options);
        }
        catch (error) {
            console.error('❌ Task UI failed:', error.message);
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
        }
        catch (error) {
            console.error('❌ Quick task creation failed:', error.message);
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
        }
        catch (error) {
            console.error('❌ Velocity analysis failed:', error.message);
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
        }
        catch (error) {
            console.error('❌ Risk analysis failed:', error.message);
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
        }
        catch (error) {
            console.error('❌ Context management failed:', error.message);
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
            }
            else if (options.setupHooks) {
                await handler.execute('setup-hooks', null, options);
            }
            else if (options.demo) {
                await handler.execute('demo', null, options);
            }
            else {
                await handler.execute('sync', null, options);
            }
        }
        catch (error) {
            console.error('❌ Claude Code sync failed:', error.message);
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
        }
        catch (error) {
            console.error('❌ Hooks command failed:', error.message);
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
        }
        catch (error) {
            console.error('❌ Hook installation failed:', error.message);
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
        }
        catch (error) {
            console.error('❌ Hook status check failed:', error.message);
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
        }
        catch (error) {
            console.error('❌ Hook test failed:', error.message);
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
        }
        catch (error) {
            console.error('❌ Hook upgrade failed:', error.message);
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
        }
        catch (error) {
            console.error('❌ Status overview failed:', error.message);
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
        }
        catch (error) {
            console.error('❌ Live monitor failed:', error.message);
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
        }
        catch (error) {
            console.error('❌ Simple task command failed:', error.message);
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
        }
        catch (error) {
            console.error('❌ Task UI failed:', error.message);
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
        }
        catch (error) {
            console.error('❌ Monitor launch failed:', error.message);
            process.exit(1);
        }
    });
    // Help enhancements - only load when needed
    program.on('--help', async () => {
        const { chalk } = await loadHeavyDependencies();
        console.log('');
        console.log(chalk.cyan('Quick Start Examples:'));
        console.log('  $ cc task "fix login bug"                    # Create task');
        console.log('  $ cc task "add auth @high #security 5pts"   # Natural language');
        console.log('  $ cc task-ui                                # Interactive task UI');
        console.log('  $ cc simple create "update docs" @high       # Simple task');
        console.log('  $ cc live                                   # Live monitor');
        console.log('  $ cc status                                 # Project overview');
        console.log('');
        console.log(chalk.cyan('Natural Language Task Examples:'));
        console.log('  $ cc task "fix login bug @high #auth due:friday"');
        console.log('  $ cc task "implement user profile 8pts for:@alice"');
        console.log('  $ cc sync-claude-code                       # Sync with Claude Code');
        console.log('');
        console.log(chalk.cyan('Monitor & Hooks:'));
        console.log('  $ cc monitor                                # Launch Electron GUI monitor');
        console.log('  $ cc monitor --terminal                     # Terminal-based monitor');
        console.log('  $ cc sync-claude-code --setup-hooks         # Setup automatic sync');
        console.log('');
        console.log(chalk.gray('For more commands: cc --help'));
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