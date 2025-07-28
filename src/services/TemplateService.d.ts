/**
 * Simplified Template Service
 * Consolidates TemplateService + 4 UseCase classes into direct service methods
 */
import { Template, CreateTemplateData, ApplyTemplateData, Task, Result } from '../models/index.js';
import { FileStorage } from '../storage/index.js';
export interface ApplyTemplateResult {
    success: boolean;
    data?: Task[];
    templateName?: string;
    tasksCreated?: number;
    error?: string;
}
export interface TemplateListResult {
    success: boolean;
    data?: Template[];
    error?: string;
}
export interface TemplateViewResult {
    success: boolean;
    data?: Template;
    taskCount?: number;
    error?: string;
}
export declare class TemplateService {
    private storage;
    private readonly COLLECTION;
    private readonly TASKS_COLLECTION;
    constructor(storage: FileStorage);
    private getBuiltInTemplates;
    listTemplates(): Promise<TemplateListResult>;
    viewTemplate(options: {
        nameOrId: string;
    }): Promise<TemplateViewResult>;
    applyTemplate(options: ApplyTemplateData): Promise<ApplyTemplateResult>;
    createTemplate(data: CreateTemplateData): Promise<Result<Template>>;
    deleteTemplate(nameOrId: string): Promise<Result<boolean>>;
    private processTemplateVariables;
}
//# sourceMappingURL=TemplateService.d.ts.map