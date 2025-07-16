/**
 * Conflict Resolver - Handles conflicts between Critical Claude tasks and Claude Code todos
 */
import { EnhancedTask } from '../types/agile.js';
import { ClaudeCodeTodo } from './claude-code-real-integration.js';
export interface Conflict {
    id: string;
    type: 'status_mismatch' | 'content_mismatch' | 'priority_mismatch' | 'missing_in_source' | 'missing_in_target';
    taskId: string;
    description: string;
    criticalClaudeData?: Partial<EnhancedTask>;
    claudeCodeData?: Partial<ClaudeCodeTodo>;
    detectedAt: Date;
    resolved: boolean;
    resolution?: ConflictResolution;
}
export interface ConflictResolution {
    strategy: 'last_write_wins' | 'priority_wins' | 'manual_merge' | 'claude_code_wins' | 'critical_claude_wins';
    appliedAt: Date;
    resolvedData: any;
    notes?: string;
}
export interface ConflictResolutionOptions {
    defaultStrategy: 'last_write_wins' | 'priority_wins' | 'claude_code_wins' | 'critical_claude_wins';
    autoResolveTypes: string[];
    manualReviewRequired: string[];
}
export declare class ConflictResolver {
    private conflicts;
    private resolutionOptions;
    constructor(options?: Partial<ConflictResolutionOptions>);
    /**
     * Detect conflicts between Critical Claude tasks and Claude Code todos
     */
    detectConflicts(criticalClaudeTasks: EnhancedTask[], claudeCodeTodos: ClaudeCodeTodo[]): Conflict[];
    /**
     * Compare a task and todo to find specific conflicts
     */
    private compareTaskAndTodo;
    /**
     * Resolve conflicts automatically based on configured strategies
     */
    resolveConflicts(conflicts: Conflict[]): Promise<ConflictResolution[]>;
    /**
     * Auto-resolve a conflict based on its type
     */
    private autoResolveConflict;
    /**
     * Resolve status conflicts by preferring the most recent change
     */
    private resolveStatusConflict;
    /**
     * Resolve priority conflicts by preferring higher priority
     */
    private resolvePriorityConflict;
    /**
     * Resolve missing in source (exists in Claude Code but not Critical Claude)
     */
    private resolveMissingInSource;
    /**
     * Resolve missing in target (exists in Critical Claude but not Claude Code)
     */
    private resolveMissingInTarget;
    /**
     * Create a manual resolution (requires human intervention)
     */
    private createManualResolution;
    /**
     * Apply the default resolution strategy
     */
    private applyDefaultStrategy;
    /**
     * Select data based on resolution strategy
     */
    private selectDataByStrategy;
    /**
     * Get conflict type counts for reporting
     */
    private getConflictTypeCounts;
    /**
     * Map task status to todo status for comparison
     */
    private mapTaskStatusToTodoStatus;
    /**
     * Get all unresolved conflicts
     */
    getUnresolvedConflicts(): Conflict[];
    /**
     * Get conflict statistics
     */
    getConflictStats(): {
        total: number;
        resolved: number;
        unresolved: number;
        byType: Record<string, number>;
    };
    /**
     * Clear old resolved conflicts
     */
    clearOldConflicts(olderThanDays?: number): void;
}
//# sourceMappingURL=conflict-resolver.d.ts.map