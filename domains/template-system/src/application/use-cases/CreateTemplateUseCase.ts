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

export interface CreateTemplateResponse extends Result<Template> {}

export class CreateTemplateUseCase {
  constructor(
    private readonly templateRepository: ITemplateRepository
  ) {}

  async execute(request: CreateTemplateRequest): Promise<CreateTemplateResponse> {
    try {
      // Validate business rules
      if (!request.name?.trim()) {
        return {
          success: false,
          error: 'Template name is required'
        };
      }

      if (!request.description?.trim()) {
        return {
          success: false,
          error: 'Template description is required'
        };
      }

      if (!request.tasks || request.tasks.length === 0) {
        return {
          success: false,
          error: 'Template must have at least one task'
        };
      }

      // Check if template with same name already exists
      const existingTemplate = await this.templateRepository.findByName(request.name.trim());
      if (existingTemplate) {
        return {
          success: false,
          error: `Template with name '${request.name}' already exists`
        };
      }

      // Create template entity
      const template = Template.create(
        request.name.trim(),
        request.description.trim(),
        request.tasks,
        request.variables || {},
        {
          author: request.author,
          tags: request.tags || []
        }
      );

      // Persist via repository
      await this.templateRepository.save(template);

      return {
        success: true,
        data: template
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}