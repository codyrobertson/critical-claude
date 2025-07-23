/**
 * Template Service
 * High-level application service orchestrating template operations
 */

import {
  ListTemplatesUseCase,
  ApplyTemplateUseCase,
  CreateTemplateUseCase,
  ViewTemplateUseCase,
  type ListTemplatesRequest,
  type ListTemplatesResponse,
  type ApplyTemplateRequest,
  type ApplyTemplateResponse,
  type CreateTemplateRequest,
  type CreateTemplateResponse,
  type ViewTemplateRequest,
  type ViewTemplateResponse
} from '../use-cases/index.js';
import { ITemplateRepository } from '../../domain/repositories/ITemplateRepository.js';
import { Template } from '../../domain/entities/Template.js';
import { Result } from '../../shared/types.js';

export class TemplateService {
  private listTemplatesUseCase: ListTemplatesUseCase;
  private applyTemplateUseCase: ApplyTemplateUseCase;
  private createTemplateUseCase: CreateTemplateUseCase;
  private viewTemplateUseCase: ViewTemplateUseCase;

  constructor(templateRepository: ITemplateRepository) {
    this.listTemplatesUseCase = new ListTemplatesUseCase(templateRepository);
    this.applyTemplateUseCase = new ApplyTemplateUseCase(templateRepository);
    this.createTemplateUseCase = new CreateTemplateUseCase(templateRepository);
    this.viewTemplateUseCase = new ViewTemplateUseCase(templateRepository);
  }

  // Core template operations
  async listTemplates(request?: ListTemplatesRequest): Promise<ListTemplatesResponse> {
    return this.listTemplatesUseCase.execute(request);
  }

  async applyTemplate(request: ApplyTemplateRequest): Promise<ApplyTemplateResponse> {
    return this.applyTemplateUseCase.execute(request);
  }

  async createTemplate(request: CreateTemplateRequest): Promise<CreateTemplateResponse> {
    return this.createTemplateUseCase.execute(request);
  }

  async viewTemplate(request: ViewTemplateRequest): Promise<ViewTemplateResponse> {
    return this.viewTemplateUseCase.execute(request);
  }

  // Convenience methods
  async getTemplateByName(name: string): Promise<Result<Template>> {
    const response = await this.viewTemplate({ nameOrId: name });
    return {
      success: response.success,
      data: response.data,
      error: response.error
    };
  }

  async getBuiltInTemplates(): Promise<Result<Template[]>> {
    const response = await this.listTemplates({ category: 'builtin' });
    return {
      success: response.success,
      data: response.data,
      error: response.error
    };
  }

  async getUserTemplates(): Promise<Result<Template[]>> {
    const response = await this.listTemplates({ category: 'user' });
    return {
      success: response.success,
      data: response.data,
      error: response.error
    };
  }

  async executeTemplate(request: { templateName: string; variables?: Record<string, string> }): Promise<ApplyTemplateResponse> {
    return this.applyTemplate({
      templateName: request.templateName,
      variables: request.variables
    });
  }
}