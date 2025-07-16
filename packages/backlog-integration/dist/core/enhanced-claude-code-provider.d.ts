import { AITaskSuggestion } from '../types/agile.js';
interface ClaudeCodeConfig {
    modelId: 'opus' | 'sonnet' | 'haiku';
    temperature?: number;
    maxTokens?: number;
    maxTurns?: number;
    permissionMode?: 'default' | 'acceptEdits' | 'plan' | 'bypassPermissions';
    allowedTools?: string[];
    disallowedTools?: string[];
    outputFormat?: 'text' | 'json' | 'stream-json';
    sessionId?: string;
    mcpConfig?: string;
}
export declare class EnhancedClaudeCodeProvider {
    private config;
    private sessionCache;
    private tempDir;
    private initialized;
    private initializationPromise;
    constructor(config: ClaudeCodeConfig);
    private ensureInitialized;
    private performInitialization;
    /**
     * Validate and sanitize tool schema for Claude CLI compatibility
     * Removes oneOf/allOf/anyOf at top level which cause CLI errors
     */
    private validateToolSchema;
    /**
     * Sanitize tools configuration before passing to Claude CLI
     */
    private sanitizeToolsConfig;
    private ensureTempDir;
    /**
     * Generate tasks from feature description using Claude Code
     */
    generateTasksFromFeature(featureDescription: string, projectContext?: any): Promise<AITaskSuggestion[]>;
    /**
     * Analyze code for improvement tasks
     */
    analyzeCodeForTasks(filePath: string): Promise<AITaskSuggestion[]>;
    /**
     * Execute Claude command with robust error handling
     */
    private executeClaudeCommand;
    /**
     * Test Claude CLI functionality with minimal configuration
     * Used to diagnose MCP tool schema issues
     */
    testClaudeConnection(): Promise<{
        success: boolean;
        error?: string;
        output?: string;
    }>;
    /**
     * Execute simple Claude command without complex configurations
     */
    private executeSimpleClaudeCommand;
    /**
     * Find Claude binary in system PATH
     */
    private findClaudeBinary;
    /**
     * Build feature breakdown prompt
     */
    private buildFeaturePrompt;
    /**
     * Parse tasks from Claude response
     */
    private parseTasksFromResponse;
    /**
     * Validate and normalize task structure
     */
    private validateAndNormalizeTask;
    /**
     * Normalize effort to valid story points
     */
    private normalizeEffort;
    /**
     * Normalize priority to valid values
     */
    private normalizePriority;
    /**
     * Get fallback tasks when AI generation fails
     */
    private getFallbackTasks;
}
export {};
//# sourceMappingURL=enhanced-claude-code-provider.d.ts.map