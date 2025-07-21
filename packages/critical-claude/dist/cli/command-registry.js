/**
 * Simplified Command Registry - Only unified task management
 */
export class CommandRegistry {
    commands = new Map();
    constructor() {
        this.initializeCommands();
    }
    initializeCommands() {
        // Only register the unified task command
        this.register({
            name: 'task',
            description: 'Unified task management',
            loader: async () => {
                const { UnifiedTaskCommand } = await import('./commands/unified-task.js');
                return new UnifiedTaskCommand();
            }
        });
    }
    register(config) {
        this.commands.set(config.name, config);
    }
    async getHandler(name) {
        const config = this.commands.get(name);
        if (!config) {
            return null;
        }
        return await config.loader();
    }
    registerWithCommander(program) {
        // Commander registration is now handled directly in cc-main.ts
        // This method is kept for compatibility
    }
    listCommands() {
        return Array.from(this.commands.keys());
    }
}
//# sourceMappingURL=command-registry.js.map