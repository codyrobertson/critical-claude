/**
 * Research Service
 * Simplified research service that delegates to legacy implementation
 */

import { Result } from '../../shared/types.js';

export interface ResearchRequest {
  query: string;
  files?: string[];
  outputFormat?: 'tasks' | 'report' | 'both';
  maxDepth?: number;
  teamSize?: number;
}

export interface ResearchResponse extends Result<string> {
  reportPath?: string;
  tasksCreated?: number;
}

export class ResearchService {
  async executeResearch(request: ResearchRequest): Promise<ResearchResponse> {
    // For now, delegate to legacy implementation
    return {
      success: false,
      error: 'Research system not yet migrated. Use legacy CLI: npm run build:legacy && node packages/critical-claude/dist/cli/cc-main.js research'
    };
  }

  async getResearchHistory(): Promise<Result<string[]>> {
    return {
      success: false,
      error: 'Research history not yet migrated. Use legacy CLI for research operations.'
    };
  }
}