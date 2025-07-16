/**
 * Simple Task Command - Lightweight task management for small teams
 * Bypasses complex AGILE hierarchy for direct task operations
 */
import { CommandHandler } from '../command-registry.js';
export declare class SimpleTaskCommand implements CommandHandler {
    private taskManager;
    constructor();
    execute(action: string, input: any, options: any): Promise<void>;
    private createTask;
    private listTasks;
    private updateTask;
    private deleteTask;
    private showStats;
    private archiveOldTasks;
    private showTasksByAssignee;
}
//# sourceMappingURL=simple-task.d.ts.map