/**
 * Research Service - Migrated from legacy research system
 * 100% AI-Driven Multi-Agent Research System
 */

import { ExecuteResearchUseCase, ExecuteResearchResponse } from '../use-cases/ExecuteResearchUseCase.js';
import { ResearchRequest } from '../../domain/entities/ResearchTypes.js';

export interface ResearchResponse {
  success: boolean;
  data?: string;
  error?: string;
  reportPath?: string;
  tasksCreated?: number;
}

export class ResearchService {
  private executeResearchUseCase: ExecuteResearchUseCase | null = null;

  constructor() {
    // Lazy-load the use case only when needed for AI operations
  }

  private getExecuteResearchUseCase(): ExecuteResearchUseCase {
    if (!this.executeResearchUseCase) {
      this.executeResearchUseCase = new ExecuteResearchUseCase();
    }
    return this.executeResearchUseCase;
  }

  async executeResearch(request: ResearchRequest): Promise<ResearchResponse> {
    try {
      const result = await this.getExecuteResearchUseCase().execute(request);
      
      if (result.success && result.data) {
        return {
          success: true,
          data: result.data.executive_summary || 'Research completed successfully',
          reportPath: result.reportPath,
          tasksCreated: result.tasksCreated
        };
      } else {
        return {
          success: false,
          error: result.error || 'Research execution failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getResearchHistory(): Promise<{ success: boolean; data?: string[]; error?: string }> {
    // This would integrate with research repository to get history
    // For now, return empty history
    return {
      success: true,
      data: []
    };
  }

  async getResearchStatus(): Promise<{ success: boolean; data?: any; error?: string }> {
    return {
      success: true,
      data: {
        system: 'AI-Driven Multi-Agent Research System',
        status: 'operational',
        agents: ['Planner', 'Coordinator', 'Researchers', 'Analyst', 'Synthesizer']
      }
    };
  }
}