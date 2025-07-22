/**
 * Template Service
 * Simplified template service that delegates to legacy implementation
 */

import { Result } from '../../shared/types.js';

export interface TemplateRequest {
  templateName: string;
  outputDir?: string;
  variables?: Record<string, string>;
}

export interface TemplateResponse extends Result<string> {
  outputPath?: string;
}

export class TemplateService {
  async executeTemplate(request: TemplateRequest): Promise<TemplateResponse> {
    // For now, delegate to legacy implementation
    return {
      success: false,
      error: 'Template system not yet migrated. Use legacy CLI: npm run build:legacy && node packages/critical-claude/dist/cli/cc-main.js template'
    };
  }

  async listTemplates(): Promise<Result<string[]>> {
    return {
      success: false,
      error: 'Template listing not yet migrated. Use legacy CLI for template operations.'
    };
  }
}