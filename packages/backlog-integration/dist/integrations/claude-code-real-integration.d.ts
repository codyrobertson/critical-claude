/**
 * Real Claude Code Integration - Actual TodoWrite/TodoRead calls
 * This replaces the mock implementation with real integration
 */
export interface ClaudeCodeTodo {
    content: string;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    id: string;
}
export interface ParsedTask {
    priority?: 'low' | 'medium' | 'high' | 'critical';
    labels?: string[];
    storyPoints?: number;
    assignee?: string;
}
export declare class RealClaudeCodeIntegration {
    private tempDir;
    constructor();
    /**
     * Parse natural language elements from task content
     */
    parseNaturalLanguage(content: string): ParsedTask;
    initialize(): Promise<void>;
    /**
     * Execute real TodoWrite by calling Claude Code's TodoWrite tool
     */
    executeRealTodoWrite(todos: ClaudeCodeTodo[]): Promise<boolean>;
    /**
     * Execute real TodoRead by calling Claude Code's TodoRead tool
     */
    executeRealTodoRead(): Promise<ClaudeCodeTodo[]>;
    /**
     * Attempt direct TodoWrite integration
     */
    private tryDirectTodoWrite;
    /**
     * Attempt direct TodoRead integration
     */
    private tryDirectTodoRead;
    /**
     * File-based TodoWrite - writes to a file that Claude Code can monitor
     */
    private tryFileBasedTodoWrite;
    /**
     * File-based TodoRead - reads from a file that Claude Code might write to
     */
    private tryFileBasedTodoRead;
    /**
     * Process-based integration - spawn Claude Code as subprocess
     */
    tryProcessBasedIntegration(command: string, data?: any): Promise<any>;
    /**
     * Test the integration to see which methods work
     */
    testIntegration(): Promise<{
        direct: boolean;
        fileBased: boolean;
        processBased: boolean;
    }>;
    /**
     * Cleanup temporary files
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=claude-code-real-integration.d.ts.map