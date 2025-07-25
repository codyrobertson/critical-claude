/**
 * Research Service - Migrated from legacy research system
 * 100% AI-Driven Multi-Agent Research System
 */

import { ExecuteResearchUseCase, ExecuteResearchResponse } from '../use-cases/ExecuteResearchUseCase.js';
import { ResearchRequest } from '../../domain/entities/ResearchTypes.js';
import { IAIProvider } from '../../domain/services/IAIProvider.js';
import { ILogger } from '../../domain/services/ILogger.js';
import { AIService } from '../../infrastructure/services/AIService.js';

export interface ResearchResponse {
  success: boolean;
  data?: string;
  error?: string;
  reportPath?: string;
  tasksCreated?: number;
}

/**
 * Console Logger Implementation
 */
class ConsoleLogger implements ILogger {
  debug(message: string, context?: Record<string, unknown>): void {
    console.debug(`[DEBUG] ${message}`, context || '');
  }
  
  info(message: string, context?: Record<string, unknown>): void {
    console.log(`ℹ️ ${message}`, context ? JSON.stringify(context) : '');
  }
  
  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(`⚠️ ${message}`, context ? JSON.stringify(context) : '');
  }
  
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    console.error(`❌ ${message}`, error || '', context ? JSON.stringify(context) : '');
  }
}

export class ResearchService {
  private executeResearchUseCase: ExecuteResearchUseCase | null = null;
  private aiProvider: IAIProvider;
  private logger: ILogger;

  constructor(aiProvider?: IAIProvider, logger?: ILogger) {
    this.logger = logger || new ConsoleLogger();
    
    // Provider priority: Claude Code CLI first, then API keys if user explicitly opts out
    const forceClaudeCode = process.env.CC_AI_PROVIDER === 'claude-code';
    const forceApiKeys = process.env.CC_AI_PROVIDER === 'api-keys';
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
    
    let defaultConfig;
    if (forceApiKeys && (hasAnthropic || hasOpenAI)) {
      // User explicitly wants API keys
      defaultConfig = hasAnthropic 
        ? { provider: 'anthropic' as const, apiKey: process.env.ANTHROPIC_API_KEY }
        : { provider: 'openai' as const, apiKey: process.env.OPENAI_API_KEY };
    } else {
      // Default to Claude Code CLI (preferred)
      defaultConfig = { provider: 'claude-code' as const, model: process.env.CC_AI_MODEL || 'sonnet' };
    }
    this.aiProvider = aiProvider || new AIService(defaultConfig, this.logger);
  }

  private getExecuteResearchUseCase(): ExecuteResearchUseCase {
    if (!this.executeResearchUseCase) {
      this.executeResearchUseCase = new ExecuteResearchUseCase(this.aiProvider, this.logger);
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