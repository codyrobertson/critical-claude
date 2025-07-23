/**
 * View Template Use Case
 * Application service for retrieving a single template by name or ID
 */
import { Template } from '../../domain/entities/Template.js';
import { ITemplateRepository } from '../../domain/repositories/ITemplateRepository.js';
import { Result } from '../../shared/types.js';
export interface ViewTemplateRequest {
    nameOrId: string;
}
export interface ViewTemplateResponse extends Result<Template> {
    taskCount?: number;
}
export declare class ViewTemplateUseCase {
    private readonly templateRepository;
    constructor(templateRepository: ITemplateRepository);
    execute(request: ViewTemplateRequest): Promise<ViewTemplateResponse>;
}
//# sourceMappingURL=ViewTemplateUseCase.d.ts.map