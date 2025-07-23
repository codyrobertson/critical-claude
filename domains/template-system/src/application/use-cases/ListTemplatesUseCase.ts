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

export class ListTemplatesUseCase {
  constructor(
    private readonly templateRepository: ITemplateRepository
  ) {}

  async execute(request: ListTemplatesRequest = {}): Promise<ListTemplatesResponse> {
    try {
      let templates: Template[];

      switch (request.category) {
        case 'builtin':
          templates = await this.templateRepository.findBuiltIn();
          break;
        case 'user':
          templates = await this.templateRepository.findUserCreated();
          break;
        case 'all':
        default:
          templates = await this.templateRepository.findAll();
          break;
      }

      // Filter by tag if specified
      if (request.tag) {
        templates = templates.filter(template => 
          template.metadata.tags && template.metadata.tags.includes(request.tag!)
        );
      }

      // Get counts for summary
      const [builtIn, user] = await Promise.all([
        this.templateRepository.findBuiltIn(),
        this.templateRepository.findUserCreated()
      ]);

      return {
        success: true,
        data: templates,
        builtInCount: builtIn.length,
        userCount: user.length
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}