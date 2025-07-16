/**
 * Claude Code Sync Command - Real bidirectional sync between Critical Claude and Claude Code
 */
import { CommandHandler } from '../command-registry.js';
export declare class ClaudeCodeSyncCommand implements CommandHandler {
    private backlogManager;
    private integration;
    private realIntegration;
    private hookAwareManager;
    private conflictResolver;
    constructor();
    execute(action: string, input: any, options: any): Promise<void>;
    private syncToClaudeCode;
    private syncFromClaudeCode;
    private performBidirectionalSync;
    private executeClaudeCodeTodoWrite;
    private executeClaudeCodeTodoRead;
    private resolveConflicts;
    /**
     * Apply a conflict resolution to the actual systems
     */
    private applyConflictResolution;
    private mapTaskStatusToTodoStatus;
    private mapTodoStatusToTaskStatus;
    private getStatusEmoji;
    private getPriorityColor;
    private testIntegrationMethods;
    /**
     * Process hook events that may have triggered task state changes
     */
    private processHookEvents;
    /**
     * Detect hook event from environment variables or other context
     */
    private detectHookEvent;
}
//# sourceMappingURL=claude-code-sync.d.ts.map