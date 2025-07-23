/**
 * AI Service - 1:1 Migration from legacy core/ai-service.ts
 * Real AI integration using OpenAI, Anthropic, and Claude Code APIs
 */
export interface AIConfig {
    provider: 'openai' | 'anthropic' | 'claude-code' | 'local' | 'mock';
    apiKey?: string;
    model?: string;
    baseUrl?: string;
    maxTokens?: number;
    temperature?: number;
    claudeCodeEndpoint?: string;
}
export declare class AIService {
    private config;
    private initialized;
    constructor(config?: AIConfig);
    private loadEnvConfigSync;
    initialize(): Promise<void>;
    private initializeOpenAI;
    private initializeAnthropic;
    private initializeClaudeCode;
    private initializeLocal;
    private initializeMock;
    private callAI;
    private cleanJsonResponse;
    private callOpenAI;
    private callAnthropic;
    private callClaudeCode;
    private callLocal;
    private callMock;
    analyzeResearchQuery(query: string, context?: string): Promise<any>;
    conductResearchAnalysis(area: string, queries: string[], searchResults: any[]): Promise<any>;
    generateStructured<T>(prompt: string, schema: any): Promise<T>;
}
//# sourceMappingURL=AIService.d.ts.map