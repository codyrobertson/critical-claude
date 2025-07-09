/**
 * Command Registry - Fast command loading with lazy initialization
 * Only loads what's needed when it's needed
 */

import { Command } from 'commander';
import { logger } from '../core/logger.js';

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

export class CommandRegistry {
  private commands = new Map<string, CommandLoader>();
  private loadedHandlers = new Map<string, CommandHandler>();
  
  /**
   * Register a command with lazy loading
   */
  register(loader: CommandLoader): void {
    this.commands.set(loader.name, loader);
  }
  
  /**
   * Register all commands with the Commander program
   * This is fast because it only registers metadata, not implementations
   */
  registerWithCommander(program: Command): void {
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
  private async executeCommand(name: string, args: any[]): Promise<void> {
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
  async getHandler(name: string): Promise<CommandHandler> {
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
   * Get available commands without loading them
   */
  getAvailableCommands(): { name: string; description: string }[] {
    return Array.from(this.commands.values()).map(loader => ({
      name: loader.name,
      description: loader.description
    }));
  }
}

// Global registry instance
export const commandRegistry = new CommandRegistry();

// Register all commands (metadata only, no loading)
export function registerAllCommands(): void {
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
      const { CriticalClaudeCommands } = await import('./commands.js');
      return new CriticalClaudeCommands();
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
}