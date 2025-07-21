/**
 * Unified Task Command - Single entry point for all task management
 * Replaces BacklogManager, SimpleTaskManager, and MCP-task-simple commands
 */
import { CommandHandler } from '../command-registry.js';
export declare class UnifiedTaskCommand implements CommandHandler {
    private storage;
    private aiManager;
    private hookManager;
    constructor();
    execute(action: string, input: any, options: any): Promise<void>;
    private createTask;
    private listTasks;
    private viewTask;
    private editTask;
    private deleteTask;
    private archiveTask;
    private createAITask;
    private expandTask;
    private estimateTask;
    private analyzeDependencies;
    private showStats;
    private initializeSystem;
    private createBackup;
    private parseNaturalLanguage;
    private parseAIText;
    private extractLabelsFromText;
    private estimateStoryPoints;
    private normalizeStatus;
    private formatTaskListItem;
    private formatTaskSummary;
    private formatTaskDetails;
    private getStatusIcon;
    private getPriorityColor;
    private getEmptyStateMessage;
    private getUsageHelp;
    private handleTemplate;
    private getTemplatesDir;
    private listTemplates;
    private showTemplate;
    private loadTemplate;
    private loadTemplateData;
    private mergeTemplates;
    private replaceVariables;
    private resolveDependencies;
    private createTemplate;
}
//# sourceMappingURL=unified-task.d.ts.map