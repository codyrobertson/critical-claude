/**
 * Context Manager - Maintains context for smart defaults and better DX
 * Remembers active sprint, recent labels, team members, etc.
 */
export interface ProjectContext {
    activeSprint?: string;
    activeSprintName?: string;
    currentEpic?: string;
    currentEpicName?: string;
    currentPhase?: string;
    currentPhaseName?: string;
    currentUser?: string;
    defaultPriority?: string;
    defaultLabels?: string[];
    lastTaskId?: string;
    recentLabels: string[];
    recentAssignees: string[];
    focusedTasks: string[];
    teamMembers: string[];
    tasksCreatedToday: number;
    lastActivityDate: string;
    cacheTimestamps: {
        activeSprint?: number;
        teamMembers?: number;
    };
}
export declare class ContextManager {
    private contextPath;
    private context;
    private cacheExpiry;
    private initialized;
    constructor(projectPath?: string);
    /**
     * Initialize context manager (lazy - only when needed)
     */
    initialize(): Promise<void>;
    /**
     * Get current context with smart defaults
     */
    getCurrentContext(): Promise<ProjectContext>;
    /**
     * Update context with new information
     */
    updateContext(updates: Partial<ProjectContext>): Promise<void>;
    /**
     * Add a label to recent labels (maintaining uniqueness and order)
     */
    addRecentLabel(label: string): Promise<void>;
    /**
     * Add an assignee to recent assignees
     */
    addRecentAssignee(assignee: string): Promise<void>;
    /**
     * Mark a task as focused
     */
    focusTask(taskId: string): Promise<void>;
    /**
     * Increment today's task count
     */
    incrementTaskCount(): Promise<void>;
    /**
     * Check if cached data is still valid
     */
    isCacheValid(cacheType: keyof ProjectContext['cacheTimestamps']): boolean;
    /**
     * Clear specific cache
     */
    invalidateCache(cacheType: keyof ProjectContext['cacheTimestamps']): Promise<void>;
    /**
     * Get smart label suggestions based on context
     */
    getSuggestedLabels(taskTitle: string): Promise<string[]>;
    /**
     * Load context from disk
     */
    private loadContext;
    /**
     * Save context to disk
     */
    private saveContext;
    /**
     * Get default context
     */
    private getDefaultContext;
}
//# sourceMappingURL=context-manager.d.ts.map