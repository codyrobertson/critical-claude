/**
 * MCP Task Command - Uses the new AI-powered MCP server for task management
 * Connects to critical-claude-mcp server for enhanced task operations
 */
import { CommandHandler } from '../command-registry.js';
export declare class MCPTaskCommand implements CommandHandler {
    constructor();
    execute(action: string, input: any, options: any): Promise<void>;
    /**
     * Get the MCP client instance
     */
    private getMCPClient;
    private createTask;
    private listTasks;
    private viewTask;
    private updateTask;
    private archiveTask;
    private showBoard;
    private aiCreateTasks;
    private aiExpandTask;
    private aiAnalyzeDependencies;
    private initializeTaskSystem;
    /**
     * Display the MCP server response in a user-friendly format
     */
    private displayResponse;
    /**
     * Show usage information
     */
    showUsage(): void;
}
//# sourceMappingURL=mcp-task.d.ts.map