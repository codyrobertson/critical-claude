/**
 * Simple Task UI - No complex terminal handling, just works
 */
import { CommandHandler } from '../command-registry.js';
export declare class SimpleTaskUICommand implements CommandHandler {
    private backlogManager;
    constructor();
    execute(action: string, input: any, options: any): Promise<void>;
    private listTasks;
    private showTask;
    private showMenu;
    private getTaskStats;
    private getPriorityBadge;
    private getStatusBadge;
    private getStatusWithColor;
    private getPriorityWithColor;
}
//# sourceMappingURL=simple-task-ui.d.ts.map