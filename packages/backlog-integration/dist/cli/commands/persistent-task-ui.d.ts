/**
 * 🔥 BADASS PERSISTENT TASK UI - Semantic Commands & Real-time Sync
 * Production-ready interface with visual excellence and semantic commands
 */
export declare class PersistentTaskUICommand {
    private backlogManager;
    private state;
    private isRunning;
    private refreshInterval?;
    private syncInterval?;
    constructor();
    execute(action: string, input: any, options: any): Promise<void>;
    private startUI;
    private loadTasks;
    private syncWithClaudeCode;
    private handleInput;
    private toggleTaskStatus;
    private toggleTaskFocus;
    private showFilterOptions;
    private clearFilters;
    private render;
    private renderHeader;
    private getFilterString;
    private renderTaskList;
    private renderTaskDetail;
    private renderHelp;
    private renderFooter;
    private getStatusIcon;
    private getPriorityBadge;
    private runSimpleMode;
    private cleanup;
}
//# sourceMappingURL=persistent-task-ui.d.ts.map