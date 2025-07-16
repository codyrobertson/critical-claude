/**
 * Command Registry - Fast command loading with lazy initialization
 * Only loads what's needed when it's needed
 */
import { Command } from 'commander';
export interface CommandLoader {
    name: string;
    description: string;
    loader: () => Promise<CommandHandler>;
    options?: CommandOption[];
    category?: string;
}
export interface CommandOption {
    flags: string;
    description: string;
    defaultValue?: any;
}
export interface CommandHandler {
    execute(action: string, input: any, options: any): Promise<void>;
    registerCommands?: (program: any) => void;
}
export declare class CommandRegistry {
    private commands;
    private loadedHandlers;
    /**
     * Register a command with lazy loading
     */
    register(loader: CommandLoader): void;
    /**
     * Register all commands with the Commander program
     * This is fast because it only registers metadata, not implementations
     */
    registerWithCommander(program: Command): void;
    /**
     * Execute a command, loading it if necessary
     */
    private executeCommand;
    /**
     * Get a loaded handler for direct use
     */
    getHandler(name: string): Promise<CommandHandler>;
    /**
     * Register default commands
     */
    private registerDefaultCommands;
    /**
     * Get available commands without loading them
     */
    getAvailableCommands(): {
        name: string;
        description: string;
    }[];
}
export declare const commandRegistry: CommandRegistry;
export declare function registerAllCommands(): void;
//# sourceMappingURL=command-registry.d.ts.map