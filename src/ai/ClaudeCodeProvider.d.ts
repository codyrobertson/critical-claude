/**
 * Claude Code AI Provider
 * Uses the official Claude Code SDK for AI operations
 */
import { type SDKMessage } from '@anthropic-ai/claude-code';
interface ILogger {
    debug(message: string, context?: Record<string, unknown>): void;
    info(message: string, context?: Record<string, unknown>): void;
    warn(message: string, context?: Record<string, unknown>): void;
    error(message: string, error?: Error, context?: Record<string, unknown>): void;
}
export interface ClaudeCodeConfig {
    maxTurns?: number;
    cwd?: string;
    executable?: 'node' | 'bun';
    executableArgs?: string[];
    pathToClaudeCodeExecutable?: string;
    timeout?: number;
}
export interface ClaudeCodeResponse {
    content: string;
    success: boolean;
    error?: string;
}
export declare class ClaudeCodeProvider {
    private config;
    private logger;
    constructor(config: ClaudeCodeConfig | undefined, logger: ILogger);
    /**
     * Test if Claude Code SDK is available and working
     */
    isAvailable(): Promise<boolean>;
    /**
     * Execute a prompt using Claude Code SDK
     */
    execute(prompt: string): Promise<ClaudeCodeResponse>;
    /**
     * Generate structured content using Claude Code
     */
    generateStructured<T>(prompt: string, schema?: any): Promise<T | null>;
    /**
     * Run Claude Code SDK with the given prompt
     */
    private runClaudeCodeSDK;
    /**
     * Build a structured prompt for JSON responses
     */
    private buildStructuredPrompt;
    /**
     * Get current configuration
     */
    getConfig(): ClaudeCodeConfig;
    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<ClaudeCodeConfig>): void;
    /**
     * Get all messages from a query (useful for debugging)
     */
    getFullConversation(prompt: string): Promise<SDKMessage[]>;
}
export {};
//# sourceMappingURL=ClaudeCodeProvider.d.ts.map