/**
 * Simplified Command Registry - Only unified task management
 */
import { Command } from 'commander';
export interface CommandHandler {
    execute(action: string, input: any, options: any): Promise<void>;
}
export declare class CommandRegistry {
    private commands;
    constructor();
    private initializeCommands;
    private register;
    getHandler(name: string): Promise<CommandHandler | null>;
    registerWithCommander(program: Command): void;
    listCommands(): string[];
}
//# sourceMappingURL=command-registry.d.ts.map