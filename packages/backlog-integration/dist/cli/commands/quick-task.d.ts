/**
 * Quick Task Command - Natural language task creation with smart defaults
 * Makes task creation as simple as: cc task "fix login bug"
 */
import { CommandHandler } from '../command-registry.js';
export declare class QuickTaskCommand implements CommandHandler {
    private contextManager;
    private backlogManager;
    private taskParser;
    constructor();
    execute(action: string, input: any, options: any): Promise<void>;
    private handleCreateAction;
    /**
     * Quick one-liner task creation with natural language parsing
     */
    private quickCreate;
    /**
     * Interactive mode for detailed task creation
     */
    private interactiveMode;
    /**
     * Bulk mode - create multiple tasks from input
     */
    private bulkMode;
    /**
     * Create task with smart defaults
     */
    private createTask;
    /**
     * Find or create a default sprint for quick task creation
     */
    private findOrCreateDefaultSprint;
    /**
     * Find or create a default epic
     */
    private findOrCreateDefaultEpic;
    /**
     * Find or create a default phase
     */
    private findOrCreateDefaultPhase;
    /**
     * Display task summary after creation
     */
    private displayTaskSummary;
    private getPriorityColor;
    /**
     * List recent tasks
     */
    private listTasks;
    /**
     * Focus on a specific task
     */
    private focusTask;
    /**
     * Manage project context
     */
    private manageContext;
    /**
     * Enhance task with AI in the background
     */
    private enhanceWithAI;
}
//# sourceMappingURL=quick-task.d.ts.map