/**
 * Claude Code Sync Command
 * Demonstrates integration between Critical Claude and Claude Code's native todo system
 */
import { CommandHandler } from '../command-registry.js';
export declare class ClaudeCodeSyncCommand implements CommandHandler {
    private backlogManager;
    private integration;
    constructor();
    execute(action: string, input: any, options: any): Promise<void>;
    /**
     * Sync Critical Claude tasks to Claude Code todos
     */
    private syncTasks;
    /**
     * Actually execute the sync to Claude Code's TodoWrite
     */
    private executeClaudeCodeSync;
    /**
     * Show synchronization status
     */
    private showSyncStatus;
    /**
     * Setup Claude Code hooks for automatic synchronization
     */
    private setupHooks;
    /**
     * Demonstrate the integration with examples
     */
    private demonstrateIntegration;
    /**
     * Helper methods
     */
    private getStatusIcon;
    private getPriorityColor;
    private mapStatusToClaudeCode;
}
//# sourceMappingURL=claude-code-sync.d.ts.map