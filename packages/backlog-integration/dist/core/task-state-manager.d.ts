/**
 * Brutal Task State Management Engine
 * Zero tolerance for invalid state transitions and business rule violations
 */
import { EnhancedTask, TaskStatus, StateValidationResult } from '../types/agile.js';
export declare class TaskStateManager {
    private criticalClaude;
    private config;
    private readonly validTransitions;
    constructor(config?: Partial<typeof this.config>);
    /**
     * Validate and execute a state transition with Critical Claude integration
     */
    changeTaskState(task: EnhancedTask, newState: TaskStatus, changedBy: string, reason?: string, metadata?: Record<string, any>): Promise<{
        success: boolean;
        validation: StateValidationResult;
        updatedTask?: EnhancedTask;
    }>;
    /**
     * Basic state transition matrix validation
     */
    private validateBasicTransition;
    /**
     * Business rule validation - THE BRUTAL PART
     */
    private validateBusinessRules;
    /**
     * FOCUSED state validation - Only ONE task per developer
     */
    private validateFocusTransition;
    /**
     * BLOCKED state validation - Must have proper reason and escalation
     */
    private validateBlockedTransition;
    /**
     * DONE state validation - BRUTAL acceptance criteria enforcement
     */
    private validateDoneTransition;
    /**
     * IN-PROGRESS state validation - Prevent work fragmentation
     */
    private validateInProgressTransition;
    /**
     * DIMMED state validation - Ensure proper prioritization
     */
    private validateDimmedTransition;
    /**
     * Critical Claude analysis for complex transitions
     */
    private runCriticalClaudeAnalysis;
    /**
     * Execute the actual state transition
     */
    private executeStateTransition;
    /**
     * Execute required actions from validation
     */
    private executeRequiredActions;
    private executeAction;
    private getFocusedTasksByDeveloper;
    private getBlockedDependencies;
    private getInProgressTasksByDeveloper;
    private isArchitecturalBlocker;
    private calculateBlockerReviewDate;
}
export default TaskStateManager;
//# sourceMappingURL=task-state-manager.d.ts.map