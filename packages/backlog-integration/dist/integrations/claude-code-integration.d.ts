/**
 * Claude Code Integration
 * Connects Critical Claude task system with Claude Code's native todo and hooks
 */
import { EnhancedTask } from '../types/agile.js';
import { BacklogManager } from '../cli/backlog-manager.js';
interface ClaudeCodeTodo {
    content: string;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    id: string;
}
export declare class ClaudeCodeIntegration {
    private backlogManager;
    constructor(backlogManager: BacklogManager);
    private checkHookStatus;
    /**
     * Sync Critical Claude tasks to Claude Code todos
     * This creates a bidirectional sync between our enhanced task system
     * and Claude Code's native todo functionality
     */
    syncToClaudeCodeTodos(tasks: EnhancedTask[]): Promise<void>;
    /**
     * Format a Critical Claude task for Claude Code's todo system
     */
    private formatTaskForClaudeCode;
    /**
     * Map Critical Claude task status to Claude Code todo status
     */
    mapStatusToClaudeCode(status: string): 'pending' | 'in_progress' | 'completed';
    /**
     * Map Claude Code todo status back to Critical Claude task status
     */
    mapStatusFromClaudeCode(status: 'pending' | 'in_progress' | 'completed'): string;
    /**
     * Parse natural language elements from task content
     */
    parseNaturalLanguage(content: string): {
        priority?: string;
        labels?: string[];
        storyPoints?: number;
        assignee?: string;
    };
    /**
     * Create Claude Code hooks for automatic task synchronization
     */
    setupClaudeCodeHooks(): Promise<void>;
    /**
     * Generate the shell command for Claude Code hooks
     */
    private generateHookCommand;
    /**
     * Sync from Claude Code todos to Critical Claude tasks
     * This allows users to manage tasks from both systems
     */
    syncFromClaudeCodeTodos(claudeCodeTodos: ClaudeCodeTodo[]): Promise<void>;
    /**
     * Parse Claude Code todo format back to our task structure
     */
    private parseClaudeCodeTodo;
    /**
     * Map Claude Code todo status to our task status
     */
    private mapClaudeCodeStatusToOurs;
    /**
     * Log the sync operation for debugging
     */
    private logSyncOperation;
    /**
     * Get sync status and statistics
     */
    getSyncStatus(): Promise<{
        criticalClaudeTasks: number;
        claudeCodeTodos: number;
        lastSync: Date | null;
        syncEnabled: boolean;
    }>;
}
/**
 * Example usage and integration points
 */
export declare class ClaudeCodeHookHandler {
    private integration;
    constructor(backlogManager: BacklogManager);
    /**
     * Handle Claude Code PreToolUse hook
     * This runs before Claude Code executes any tool
     */
    handlePreToolUse(toolName: string, args: any): Promise<{
        allow: boolean;
        feedback?: string;
    }>;
    /**
     * Handle Claude Code PostToolUse hook
     * This runs after Claude Code completes a tool
     */
    handlePostToolUse(toolName: string, result: any): Promise<void>;
    /**
     * Handle Claude Code Stop hook
     * This runs when Claude Code finishes responding
     */
    handleStop(): Promise<void>;
    /**
     * Perform automatic synchronization
     */
    private autoSync;
}
export {};
//# sourceMappingURL=claude-code-integration.d.ts.map