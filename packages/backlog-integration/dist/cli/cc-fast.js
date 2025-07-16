#!/usr/bin/env node
/**
 * Critical Claude Fast CLI
 * Optimized for instant startup with lazy loading
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
async function initializeCLI() {
    const program = new Command();
    program
        .name('cc')
        .description('Critical Claude CLI - Enhanced AGILE backlog management')
        .version('2.0.0')
        .option('-v, --verbose', 'Enable verbose logging')
        .option('-q, --quiet', 'Suppress non-essential output')
        .option('--no-color', 'Disable colored output');
    // Register core commands with lazy loading
    program
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
    // Quick task creation
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
    // Status command
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
            console.error('❌ Status command failed:', error.message);
            process.exit(1);
        }
    });
    // Sync command
    program
        .command('sync')
        .description('Sync with Claude Code native todo system')
        .option('--execute', 'Actually execute the sync (default: dry-run)')
        .action(async (options) => {
        try {
            const { ClaudeCodeSyncCommand } = await import('./commands/claude-code-sync.js');
            const handler = new ClaudeCodeSyncCommand();
            await handler.execute('sync', null, options);
        }
        catch (error) {
            console.error('❌ Sync failed:', error.message);
            process.exit(1);
        }
    });
    // Only load full help when requested
    program.on('--help', async () => {
        const { chalk } = await loadHeavyDependencies();
        console.log('');
        console.log(chalk.cyan('Quick Start Examples:'));
        console.log('  $ cc task "fix login bug"                    # Create task');
        console.log('  $ cc task "add auth @high #security 5pts"   # Natural language');
        console.log('  $ cc quick "update docs"                    # Super quick');
        console.log('  $ cc status                                 # Project overview');
        console.log('');
        console.log(chalk.cyan('Natural Language Task Examples:'));
        console.log('  $ cc task "fix login bug @high #auth due:friday"');
        console.log('  $ cc task "implement user profile 8pts for:@alice"');
        console.log('  $ cc sync                                   # Sync with Claude Code');
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
//# sourceMappingURL=cc-fast.js.map