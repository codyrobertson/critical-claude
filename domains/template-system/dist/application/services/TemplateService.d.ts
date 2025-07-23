/**
 * Template Service
 * High-level application service orchestrating template operations
 */
import { type ListTemplatesRequest, type ListTemplatesResponse, type ApplyTemplateRequest, type ApplyTemplateResponse, type CreateTemplateRequest, type CreateTemplateResponse, type ViewTemplateRequest, type ViewTemplateResponse } from '../use-cases/index.js';
import { ITemplateRepository } from '../../domain/repositories/ITemplateRepository.js';
import { Template } from '../../domain/entities/Template.js';
import { Result } from '../../shared/types.js';
export declare class TemplateService {
    private listTemplatesUseCase;
    private applyTemplateUseCase;
    private createTemplateUseCase;
    private viewTemplateUseCase;
    constructor(templateRepository: ITemplateRepository);
    listTemplates(request?: ListTemplatesRequest): Promise<ListTemplatesResponse>;
    applyTemplate(request: ApplyTemplateRequest): Promise<ApplyTemplateResponse>;
    createTemplate(request: CreateTemplateRequest): Promise<CreateTemplateResponse>;
    viewTemplate(request: ViewTemplateRequest): Promise<ViewTemplateResponse>;
    getTemplateByName(name: string): Promise<Result<Template>>;
    getBuiltInTemplates(): Promise<Result<Template[]>>;
    getUserTemplates(): Promise<Result<Template[]>>;
    executeTemplate(request: {
        templateName: string;
        variables?: Record<string, string>;
    }): Promise<ApplyTemplateResponse>;
}
//# sourceMappingURL=TemplateService.d.ts.map