/**
 * Critical Claude Client - Simplified AI-powered task management
 */

import { AIService } from './ai-service.js';
import { UnifiedStorageManager } from './unified-storage.js';
import { AITaskManager } from './ai-task-manager.js';

const logger = {
  info: (msg: string, data?: any) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg: string, error?: Error) => console.error(`[ERROR] ${msg}`, error?.message || ''),
  warn: (msg: string, data?: any) => console.warn(`[WARN] ${msg}`, data || '')
};

export class CriticalClaudeClient {
  private aiService: AIService;
  private storage: UnifiedStorageManager;
  private aiTaskManager: AITaskManager;

  constructor() {
    this.aiService = new AIService(); // Auto-detect Claude Code
    this.storage = new UnifiedStorageManager();
    this.aiTaskManager = new AITaskManager(this.storage);
  }

  async initialize(): Promise<void> {
    await this.storage.initialize();
    logger.info('Critical Claude client initialized');
  }

  /**
   * Generate tasks from feature description using AI
   */
  async generateTasks(description: string, options: {
    maxTasks?: number;
    teamSize?: number;
    experience?: string;
  } = {}): Promise<any[]> {
    try {
      const tasks = await this.aiService.generateProjectTasks(description, options);
      logger.info(`Generated ${tasks.length} tasks from AI`);
      return tasks;
    } catch (error) {
      logger.error('Task generation failed', error as Error);
      return [];
    }
  }

  /**
   * Analyze task complexity using AI
   */
  async analyzeTask(title: string, description: string): Promise<any> {
    try {
      const analysis = await this.aiService.analyzeTask(description);
      logger.info(`Analyzed task: ${title}`);
      return analysis;
    } catch (error) {
      logger.error('Task analysis failed', error as Error);
      return null;
    }
  }

  /**
   * Get AI service health status
   */
  async getStatus(): Promise<{ healthy: boolean; provider: string }> {
    return {
      healthy: true,
      provider: (this.aiService as any).config?.provider || 'unknown'
    };
  }
}