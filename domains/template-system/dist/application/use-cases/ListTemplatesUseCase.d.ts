/**
 * List Templates Use Case
 * Application service for retrieving and filtering templates
 */
import { Template } from '../../domain/entities/Template.js';
import { ITemplateRepository } from '../../domain/repositories/ITemplateRepository.js';
import { Result } from '../../shared/types.js';
export interface ListTemplatesRequest {
    category?: 'all' | 'builtin' | 'user';
    tag?: string;
}
export interface ListTemplatesResponse extends Result<Template[]> {
    builtInCount?: number;
    userCount?: number;
}
export declare class ListTemplatesUseCase {
    private readonly templateRepository;
    constructor(templateRepository: ITemplateRepository);
    execute(request?: ListTemplatesRequest): Promise<ListTemplatesResponse>;
}
//# sourceMappingURL=ListTemplatesUseCase.d.ts.map