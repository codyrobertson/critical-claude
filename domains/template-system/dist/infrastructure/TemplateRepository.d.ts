/**
 * Template Repository Implementation
 * File-based storage implementation for templates
 */
import { Template } from '../domain/entities/Template.js';
import { ITemplateRepository } from '../domain/repositories/ITemplateRepository.js';
export declare class TemplateRepository implements ITemplateRepository {
    private readonly storageBasePath;
    constructor(storageBasePath: string);
    findById(id: string): Promise<Template | null>;
    findAll(): Promise<Template[]>;
    findByName(name: string): Promise<Template | null>;
    save(template: Template): Promise<void>;
    delete(id: string): Promise<boolean>;
    findByTag(tag: string): Promise<Template[]>;
    findBuiltIn(): Promise<Template[]>;
    findUserCreated(): Promise<Template[]>;
    private getTemplatePath;
    private ensureTemplatesDirectory;
    private mapToStorage;
    private mapFromStorage;
    private getDefaultTemplates;
}
//# sourceMappingURL=TemplateRepository.d.ts.map