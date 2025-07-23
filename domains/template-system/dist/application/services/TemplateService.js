/**
 * Template Service
 * High-level application service orchestrating template operations
 */
import { ListTemplatesUseCase, ApplyTemplateUseCase, CreateTemplateUseCase, ViewTemplateUseCase } from '../use-cases/index.js';
export class TemplateService {
    listTemplatesUseCase;
    applyTemplateUseCase;
    createTemplateUseCase;
    viewTemplateUseCase;
    constructor(templateRepository) {
        this.listTemplatesUseCase = new ListTemplatesUseCase(templateRepository);
        this.applyTemplateUseCase = new ApplyTemplateUseCase(templateRepository);
        this.createTemplateUseCase = new CreateTemplateUseCase(templateRepository);
        this.viewTemplateUseCase = new ViewTemplateUseCase(templateRepository);
    }
    // Core template operations
    async listTemplates(request) {
        return this.listTemplatesUseCase.execute(request);
    }
    async applyTemplate(request) {
        return this.applyTemplateUseCase.execute(request);
    }
    async createTemplate(request) {
        return this.createTemplateUseCase.execute(request);
    }
    async viewTemplate(request) {
        return this.viewTemplateUseCase.execute(request);
    }
    // Convenience methods
    async getTemplateByName(name) {
        const response = await this.viewTemplate({ nameOrId: name });
        return {
            success: response.success,
            data: response.data,
            error: response.error
        };
    }
    async getBuiltInTemplates() {
        const response = await this.listTemplates({ category: 'builtin' });
        return {
            success: response.success,
            data: response.data,
            error: response.error
        };
    }
    async getUserTemplates() {
        const response = await this.listTemplates({ category: 'user' });
        return {
            success: response.success,
            data: response.data,
            error: response.error
        };
    }
    async executeTemplate(request) {
        return this.applyTemplate({
            templateName: request.templateName,
            variables: request.variables
        });
    }
}
//# sourceMappingURL=TemplateService.js.map