/**
 * AI Provider Factory - Simplified to use unified AI service
 */

import { AIService, AIConfig } from './ai-service.js';

export class AIProviderFactory {
  static createAIService(config?: Partial<AIConfig>): AIService {
    const defaultConfig: AIConfig = {
      provider: 'mock',
      temperature: 0.7,
      maxTokens: 4000,
      ...config
    };

    return new AIService(defaultConfig);
  }

  /**
   * Create AI service with Claude Code auto-detection
   */
  static createWithAutoDetection(): AIService {
    return new AIService(); // Will auto-detect Claude Code context
  }

  /**
   * Create AI service for specific provider
   */
  static createForProvider(provider: 'claude-code' | 'openai' | 'anthropic' | 'local' | 'mock'): AIService {
    return new AIService({ provider });
  }
}