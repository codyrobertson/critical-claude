/**
 * Task Template Command
 * Generate project scaffolding from task templates
 */
export declare class TemplateCommand {
    private storage;
    private aiManager;
    constructor();
    execute(action: string, args: any[], options: any): Promise<void>;
    private listTemplates;
    private applyTemplate;
    private createTemplate;
    private showTemplate;
    private exportTemplate;
    private getBuiltInTemplates;
    private getUserTemplates;
    private loadTemplate;
    private loadBuiltInTemplate;
    private processVariables;
    private createTasksFromTemplate;
    private createTaskFromTemplate;
    private replaceVariables;
    private selectTasksForTemplate;
    private convertTaskToTemplate;
    private saveTemplate;
    private printTemplateTasks;
    getUsageHelp(): string;
}
//# sourceMappingURL=template.d.ts.map