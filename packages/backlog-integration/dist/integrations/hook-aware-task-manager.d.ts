/**
 * Hook-Aware Task Manager - Manages task state transitions based on Claude Code hooks
 */
export interface HookEvent {
    type: 'PostToolUse' | 'Stop';
    tool?: string;
    file?: string;
    timestamp: Date;
    context?: Record<string, any>;
}
export interface TaskStateTransition {
    taskId: string;
    fromStatus: string;
    toStatus: string;
    trigger: string;
    timestamp: Date;
}
export declare class HookAwareTaskManager {
    private backlogManager;
    private transitionHistory;
    constructor();
    initialize(): Promise<void>;
    /**
     * Process a hook event and update relevant task states
     */
    processHookEvent(event: HookEvent): Promise<TaskStateTransition[]>;
    /**
     * Get tasks that might be relevant to this hook event
     */
    private getRelevantTasks;
    /**
     * Check if task references a specific file
     */
    private taskReferencesFile;
    /**
     * Check if task relates to a specific tool
     */
    private taskRelatesToTool;
    /**
     * Extract a meaningful file reference from a full path
     */
    private extractFileReference;
    /**
     * Evaluate if a task should transition based on the hook event
     */
    private evaluateTaskTransition;
    /**
     * Evaluate transitions for PostToolUse events
     */
    private evaluatePostToolUseTransition;
    /**
     * Evaluate transitions for Stop events
     */
    private evaluateStopTransition;
    /**
     * Check if a tool represents active work
     */
    private isActiveWorkTool;
    /**
     * Apply a transition to update the task
     */
    private applyTransition;
    /**
     * Get transition history for a specific task
     */
    getTaskTransitionHistory(taskId: string): TaskStateTransition[];
    /**
     * Get all recent transitions
     */
    getRecentTransitions(limit?: number): TaskStateTransition[];
    /**
     * Clear old transition history
     */
    clearOldTransitions(olderThanDays?: number): void;
}
//# sourceMappingURL=hook-aware-task-manager.d.ts.map