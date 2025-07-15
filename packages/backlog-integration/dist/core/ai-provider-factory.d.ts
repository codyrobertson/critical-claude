/**
 * AI Provider Factory for Critical Claude Backlog
 * Supports multiple AI providers: Claude Code, OpenAI, Anthropic API
 */
import { AITaskSuggestion } from '../types/agile.js';
export interface AIProvider {
    generateTasksFromFeature(featureDescription: string, projectContext?: any): Promise<AITaskSuggestion[]>;
    analyzeCodeForTasks(filePath: string): Promise<AITaskSuggestion[]>;
}
export type ProviderType = 'claude-code' | 'openai' | 'anthropic';
export interface ProviderConfig {
    type: ProviderType;
    modelId?: string;
    apiKey?: string;
    temperature?: number;
    maxTokens?: number;
    baseURL?: string;
    permissionMode?: 'default' | 'acceptEdits' | 'plan' | 'bypassPermissions';
    allowedTools?: string[];
    disallowedTools?: string[];
}
export declare class AIProviderFactory {
    static createProvider(config: ProviderConfig): AIProvider;
}
//# sourceMappingURL=ai-provider-factory.d.ts.map