/**
 * AI Provider Factory - Simplified to use unified AI service
 */
import { AIService } from './ai-service.js';
export class AIProviderFactory {
    static createAIService(config) {
        const defaultConfig = {
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
    static createWithAutoDetection() {
        return new AIService(); // Will auto-detect Claude Code context
    }
    /**
     * Create AI service for specific provider
     */
    static createForProvider(provider) {
        return new AIService({ provider });
    }
}
//# sourceMappingURL=ai-provider-factory.js.map