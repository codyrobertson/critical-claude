/**
 * Apply Template Use Case
 * Application service for applying templates to create tasks
 */
import { ITemplateRepository } from '../../domain/repositories/ITemplateRepository.js';
import { Result } from '../../shared/types.js';
export interface ApplyTemplateRequest {
    templateName: string;
    variables?: Record<string, string>;
    outputFormat?: 'json' | 'summary';
}
export interface CreatedTask {
    title: string;
    description?: string;
    priority?: string;
    labels?: string[];
    hours?: number;
    subtasks?: CreatedTask[];
}
export interface ApplyTemplateResponse extends Result<CreatedTask[]> {
    templateName?: string;
    tasksCreated?: number;
    variablesUsed?: Record<string, string>;
}
export declare class ApplyTemplateUseCase {
    private readonly templateRepository;
    constructor(templateRepository: ITemplateRepository);
    execute(request: ApplyTemplateRequest): Promise<ApplyTemplateResponse>;
    private convertTemplateTasksToCreated;
    private countTasks;
}
//# sourceMappingURL=ApplyTemplateUseCase.d.ts.map