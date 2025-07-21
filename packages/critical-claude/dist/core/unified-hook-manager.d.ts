/**
 * Unified Hook Manager - Single centralized hook system for Critical Claude
 * Integrates with Claude Code TodoWrite/TodoRead and unified task storage
 */
import { UnifiedStorageManager } from './unified-storage.js';
export interface TodoHookEvent {
    type: 'TodoWrite' | 'TodoRead';
    timestamp: Date;
    todos: ClaudeCodeTodo[];
    source: 'claude-code' | 'critical-claude';
    sessionId?: string;
}
export interface ClaudeCodeTodo {
    content: string;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'high' | 'medium' | 'low';
    id: string;
}
export declare class UnifiedHookManager {
    private storage;
    private isEnabled;
    private syncInProgress;
    constructor(storage: UnifiedStorageManager);
    /**
     * Detect if Claude Code hooks are available and configured
     */
    private detectHookCapability;
    /**
     * Handle TodoWrite events from Claude Code
     */
    handleTodoWrite(todos: ClaudeCodeTodo[]): Promise<void>;
    /**
     * Sync Critical Claude tasks back to Claude Code
     */
    syncToClaude(): Promise<void>;
    /**
     * Initialize hook system and set up monitoring
     */
    initialize(): Promise<void>;
    private extractTitle;
    private extractDescription;
    private mapPriority;
    private mapStatus;
    private mapToClaudeStatus;
    private mapToClaudePriority;
    private formatTodoContent;
    /**
     * Check if hooks are working properly
     */
    healthCheck(): Promise<{
        enabled: boolean;
        working: boolean;
        lastSync?: Date;
    }>;
}
//# sourceMappingURL=unified-hook-manager.d.ts.map