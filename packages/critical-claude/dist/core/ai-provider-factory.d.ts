/**
 * AI Provider Factory - Simplified to use unified AI service
 */
import { AIService, AIConfig } from './ai-service.js';
export declare class AIProviderFactory {
    static createAIService(config?: Partial<AIConfig>): AIService;
    /**
     * Create AI service with Claude Code auto-detection
     */
    static createWithAutoDetection(): AIService;
    /**
     * Create AI service for specific provider
     */
    static createForProvider(provider: 'claude-code' | 'openai' | 'anthropic' | 'local' | 'mock'): AIService;
}
//# sourceMappingURL=ai-provider-factory.d.ts.map