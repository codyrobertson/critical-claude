/**
 * Create Template Use Case
 * Application service for creating new templates
 */
import { Template, TemplateTask } from '../../domain/entities/Template.js';
import { ITemplateRepository } from '../../domain/repositories/ITemplateRepository.js';
import { Result } from '../../shared/types.js';
export interface CreateTemplateRequest {
    name: string;
    description: string;
    tasks: TemplateTask[];
    variables?: Record<string, string>;
    tags?: string[];
    author?: string;
}
export interface CreateTemplateResponse extends Result<Template> {
}
export declare class CreateTemplateUseCase {
    private readonly templateRepository;
    constructor(templateRepository: ITemplateRepository);
    execute(request: CreateTemplateRequest): Promise<CreateTemplateResponse>;
}
//# sourceMappingURL=CreateTemplateUseCase.d.ts.map