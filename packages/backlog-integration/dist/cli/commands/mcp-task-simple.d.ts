/**
 * Simple MCP Task Command - Direct connection to MCP server
 * Simplified approach that just calls the MCP server directly
 */
import { CommandHandler } from '../command-registry.js';
export declare class MCPTaskSimpleCommand implements CommandHandler {
    private mcpServerPath;
    constructor();
    execute(action: string, input: any, options: any): Promise<void>;
    private executeMCPCommand;
    /**
     * Fallback method to list tasks from file system
     */
    private listTasksFromFileSystem;
    /**
     * Fallback method to create task in file system
     */
    private createTaskInFileSystem;
    /**
     * View a specific task from file system
     */
    private viewTaskFromFileSystem;
    /**
     * Edit a task in file system
     */
    private editTaskInFileSystem;
    /**
     * Archive a task in file system
     */
    private archiveTaskInFileSystem;
    /**
     * Create AI-powered tasks from text
     */
    private createAITasksFromText;
    private getFallbackMessage;
    private showGettingStarted;
}
//# sourceMappingURL=mcp-task-simple.d.ts.map