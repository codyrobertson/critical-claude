/**
 * Command Registry - Fast command loading with lazy initialization
 * Only loads what's needed when it's needed
 */
import { logger } from '../core/logger.js';
export class CommandRegistry {
    commands = new Map();
    loadedHandlers = new Map();
    /**
     * Register a command with lazy loading
     */
    register(loader) {
        this.commands.set(loader.name, loader);
    }
    /**
     * Register all commands with the Commander program
     * This is fast because it only registers metadata, not implementations
     */
    registerWithCommander(program) {
        // Quick task creation shorthand
        program
            .command('task [description...]')
            .alias('t')
            .description('Quick task creation (shorthand: t)')
            .option('-p, --priority <priority>', 'Task priority (@critical|@high|@medium|@low)')
            .option('-s, --points <points>', 'Story points')
            .option('-l, --labels <labels...>', 'Task labels')
            .option('--sprint <sprintId>', 'Target sprint (default: active sprint)')
            .option('--epic <epicId>', 'Target epic (default: inferred from context)')
            .option('-a, --assignee <user>', 'Assign to user')
            .option('--ai', 'Enhance with AI suggestions')
            .option('-i, --interactive', 'Interactive mode')
            .option('-b, --bulk', 'Bulk creation from stdin')
            .action(async (description, options) => {
            const { QuickTaskCommand } = await import('./commands/quick-task.js');
            const handler = new QuickTaskCommand();
            await handler.execute('default', description || [], options);
        });
        // Simple task management for small teams
        program
            .command('simple [action] [args...]')
            .alias('s')
            .description('Simplified task management for small teams (shorthand: s)')
            .option('-s, --status <status>', 'Filter by status (todo|in-progress|blocked|done|archived)')
            .option('-p, --priority <priority>', 'Task priority (critical|high|medium|low)')
            .option('-a, --assignee <assignee>', 'Task assignee')
            .option('--points <points>', 'Story points (1-13)')
            .option('--due <date>', 'Due date (YYYY-MM-DD)')
            .option('--labels <labels...>', 'Task labels/tags')
            .option('--description <desc>', 'Task description')
            .option('-v, --verbose', 'Show detailed information')
            .action(async (action, args, options) => {
            const { SimpleTaskCommand } = await import('./commands/simple-task.js');
            const handler = new SimpleTaskCommand();
            await handler.execute(action || 'list', args || [], options);
        });
        // Register all other commands
        for (const [name, loader] of this.commands.entries()) {
            const cmd = program
                .command(loader.name)
                .description(loader.description);
            // Add options if specified
            if (loader.options) {
                for (const option of loader.options) {
                    cmd.option(option.flags, option.description, option.defaultValue);
                }
            }
            // Lazy load and execute
            cmd.action(async (...args) => {
                await this.executeCommand(name, args);
            });
        }
    }
    /**
     * Execute a command, loading it if necessary
     */
    async executeCommand(name, args) {
        const loader = this.commands.get(name);
        if (!loader) {
            throw new Error(`Unknown command: ${name}`);
        }
        // Check if already loaded
        let handler = this.loadedHandlers.get(name);
        if (!handler) {
            // Load on demand
            logger.debug(`Loading command handler: ${name}`);
            handler = await loader.loader();
            this.loadedHandlers.set(name, handler);
        }
        // Extract options from last argument (Commander pattern)
        const options = args[args.length - 1];
        const actualArgs = args.slice(0, -1);
        await handler.execute('default', actualArgs, options);
    }
    /**
     * Get a loaded handler for direct use
     */
    async getHandler(name) {
        // Auto-register commands if not already registered
        if (this.commands.size === 0) {
            this.registerDefaultCommands();
        }
        const loader = this.commands.get(name);
        if (!loader) {
            throw new Error(`Unknown command: ${name}`);
        }
        let handler = this.loadedHandlers.get(name);
        if (!handler) {
            logger.debug(`Loading command handler: ${name}`);
            handler = await loader.loader();
            this.loadedHandlers.set(name, handler);
        }
        return handler;
    }
    /**
     * Register default commands
     */
    registerDefaultCommands() {
        this.register({
            name: 'task',
            description: 'Quick task creation with natural language parsing',
            loader: async () => {
                const { QuickTaskCommand } = await import('./commands/quick-task.js');
                return new QuickTaskCommand();
            }
        });
        this.register({
            name: 'agile',
            description: 'Full AGILE hierarchy management',
            loader: async () => {
                const { CriticalClaudeCommands } = await import('./commands.js');
                return new CriticalClaudeCommands();
            }
        });
        this.register({
            name: 'live',
            description: 'Live monitor for tasks and sync activity',
            loader: async () => {
                const { LiveCommand } = await import('./commands/live.js');
                return new LiveCommand();
            }
        });
        this.register({
            name: 'task-ui',
            description: 'Persistent task management UI with arrow key navigation',
            loader: async () => {
                const { PersistentTaskUICommand } = await import('./commands/persistent-task-ui.js');
                return new PersistentTaskUICommand();
            }
        });
        this.register({
            name: 'simple',
            description: 'Simplified task management for small teams',
            loader: async () => {
                const { SimpleTaskCommand } = await import('./commands/simple-task.js');
                return new SimpleTaskCommand();
            }
        });
        this.register({
            name: 'sync-claude-code',
            description: 'Sync Critical Claude tasks with Claude Code todos',
            loader: async () => {
                const { ClaudeCodeSyncCommand } = await import('./commands/claude-code-sync.js');
                return new ClaudeCodeSyncCommand();
            }
        });
        this.register({
            name: 'hooks',
            description: 'Manage Claude Code hooks integration',
            loader: async () => {
                const { HookSetupCommand } = await import('./commands/hook-setup.js');
                return new HookSetupCommand();
            }
        });
    }
    /**
     * Get available commands without loading them
     */
    getAvailableCommands() {
        return Array.from(this.commands.values()).map(loader => ({
            name: loader.name,
            description: loader.description
        }));
    }
}
// Global registry instance
export const commandRegistry = new CommandRegistry();
// Register all commands (metadata only, no loading)
export function registerAllCommands() {
    // AGILE commands
    commandRegistry.register({
        name: 'agile',
        description: 'AGILE hierarchy management (Phase > Epic > Sprint > Task)',
        loader: async () => {
            const { CriticalClaudeCommands } = await import('./commands.js');
            return new CriticalClaudeCommands();
        }
    });
    // AI-powered commands
    commandRegistry.register({
        name: 'ai',
        description: 'AI-powered development assistance',
        loader: async () => {
            const { CriticalClaudeCommands } = await import('./commands.js');
            return new CriticalClaudeCommands();
        }
    });
    // Analysis commands
    commandRegistry.register({
        name: 'analyze',
        description: 'Project analysis and reporting',
        loader: async () => {
            const { CriticalClaudeCommands } = await import('./commands.js');
            return new CriticalClaudeCommands();
        }
    });
    // Hook management
    commandRegistry.register({
        name: 'hooks',
        description: 'Manage Claude Code hooks integration',
        loader: async () => {
            const { HookSetupCommand } = await import('./commands/hook-setup.js');
            return new HookSetupCommand();
        }
    });
    // Direct plan generation (backwards compatibility)
    commandRegistry.register({
        name: 'cc-plan',
        description: 'Generate tasks from feature description using AI',
        loader: async () => {
            const { CriticalClaudeCommands } = await import('./commands.js');
            return new CriticalClaudeCommands();
        },
        options: [
            { flags: '-t, --team-size <size>', description: 'Team size', defaultValue: 2 },
            { flags: '-s, --sprint-length <days>', description: 'Sprint length in days', defaultValue: 14 },
            { flags: '--sprint <sprintId>', description: 'Target sprint for tasks' },
            { flags: '--auto-create', description: 'Automatically create tasks without confirmation' }
        ]
    });
    // Direct code analysis (backwards compatibility)
    commandRegistry.register({
        name: 'cc-analyze',
        description: 'Analyze code and generate improvement tasks',
        loader: async () => {
            const { CriticalClaudeCommands } = await import('./commands.js');
            return new CriticalClaudeCommands();
        },
        options: [
            { flags: '-c, --create-tasks', description: 'Auto-create tasks from analysis' },
            { flags: '--priority <priority>', description: 'Default priority for generated tasks', defaultValue: 'medium' },
            { flags: '--assignee <assignee>', description: 'Default assignee for tasks' }
        ]
    });
    // Path validation and diagnostics
    commandRegistry.register({
        name: 'diagnostic',
        description: 'Run diagnostic checks for configuration and path issues',
        loader: async () => {
            const { PathValidator } = await import('../utils/path-validator.js');
            return {
                execute: async () => {
                    await PathValidator.runDiagnostic();
                }
            };
        }
    });
    // Simple task management for small teams
    commandRegistry.register({
        name: 'simple',
        description: 'Simplified task management for teams of 5 or fewer',
        loader: async () => {
            const { SimpleTaskCommand } = await import('./commands/simple-task.js');
            return new SimpleTaskCommand();
        },
        options: [
            { flags: '-s, --status <status>', description: 'Filter by status (todo|in-progress|blocked|done|archived)' },
            { flags: '-p, --priority <priority>', description: 'Task priority (critical|high|medium|low)' },
            { flags: '-a, --assignee <assignee>', description: 'Task assignee' },
            { flags: '--points <points>', description: 'Story points (1-13)' },
            { flags: '--due <date>', description: 'Due date (YYYY-MM-DD)' },
            { flags: '--labels <labels...>', description: 'Task labels/tags' },
            { flags: '--description <desc>', description: 'Task description' },
            { flags: '-v, --verbose', description: 'Show detailed information' }
        ]
    });
}
//# sourceMappingURL=command-registry.js.map