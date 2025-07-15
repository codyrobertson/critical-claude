/**
 * Claude Code Provider for Critical Claude Backlog
 * Uses Claude Code CLI as the model provider for AI-powered task generation
 */
import { AITaskSuggestion } from '../types/agile.js';
interface ClaudeCodeConfig {
    modelId: 'opus' | 'sonnet';
    maxTokens: number;
    temperature: number;
    maxTurns: number;
    permissionMode: 'default' | 'acceptEdits' | 'plan' | 'bypassPermissions';
    allowedTools?: string[];
    disallowedTools?: string[];
}
export declare class ClaudeCodeProvider {
    private config;
    constructor(config?: Partial<ClaudeCodeConfig>);
    /**
     * Generate tasks from feature description using Claude Code
     */
    generateTasksFromFeature(featureDescription: string, projectContext: {
        teamSize: number;
        sprintLength: number;
        techStack?: string[];
    }): Promise<AITaskSuggestion[]>;
    /**
     * Analyze code for improvement tasks using Claude Code
     */
    analyzeCodeForTasks(filePath: string): Promise<AITaskSuggestion[]>;
    /**
     * Build comprehensive prompt for task generation
     */
    private buildTaskGenerationPrompt;
    /**
     * Build prompt for code analysis
     */
    private buildCodeAnalysisPrompt;
    /**
     * Call Claude Code CLI with the given prompt
     */
    private callClaudeCode;
    /**
     * Parse Claude Code response for task generation
     */
    private parseTaskResponse;
    /**
     * Parse Claude Code response for code analysis
     */
    private parseCodeAnalysisResponse;
    /**
     * Fallback task generation when Claude Code fails
     */
    private generateFallbackTasks;
}
export {};
//# sourceMappingURL=claude-code-provider.d.ts.map