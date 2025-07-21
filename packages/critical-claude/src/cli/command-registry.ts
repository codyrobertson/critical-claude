/**
 * Simplified Command Registry - Only unified task management
 */

import { Command } from 'commander';

export interface CommandHandler {
  execute(action: string, input: any, options: any): Promise<void>;
}

interface CommandConfig {
  name: string;
  description: string;
  loader: () => Promise<CommandHandler>;
}

export class CommandRegistry {
  private commands: Map<string, CommandConfig> = new Map();

  constructor() {
    this.initializeCommands();
  }

  private initializeCommands(): void {
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

  private register(config: CommandConfig): void {
    this.commands.set(config.name, config);
  }

  async getHandler(name: string): Promise<CommandHandler | null> {
    const config = this.commands.get(name);
    if (!config) {
      return null;
    }

    return await config.loader();
  }

  registerWithCommander(program: Command): void {
    // Commander registration is now handled directly in cc-main.ts
    // This method is kept for compatibility
  }

  listCommands(): string[] {
    return Array.from(this.commands.keys());
  }
}