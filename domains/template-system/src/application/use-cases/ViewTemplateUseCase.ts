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

export class ViewTemplateUseCase {
  constructor(
    private readonly templateRepository: ITemplateRepository
  ) {}

  async execute(request: ViewTemplateRequest): Promise<ViewTemplateResponse> {
    try {
      // Validate input
      if (!request.nameOrId?.trim()) {
        return {
          success: false,
          error: 'Template name or ID is required'
        };
      }

      // Try to find by name first, then by ID
      let template = await this.templateRepository.findByName(request.nameOrId.trim());
      
      if (!template) {
        template = await this.templateRepository.findById(request.nameOrId.trim());
      }

      if (!template) {
        return {
          success: false,
          error: `Template not found: ${request.nameOrId}`
        };
      }

      return {
        success: true,
        data: template,
        taskCount: template.getTaskCount()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}