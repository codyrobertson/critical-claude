/**
 * Critical Claude MCP client for AI-powered task management
 */
import { AITaskSuggestion, SprintAnalysis, Sprint, CodeReference } from '../types/agile.js';
import { ProviderConfig } from './ai-provider-factory.js';
export declare class CriticalClaudeClient {
    private aiProvider;
    constructor(providerConfig?: ProviderConfig);
    /**
     * Generate tasks from a feature description using AI planning
     */
    generateTasksFromFeature(featureDescription: string, projectContext: {
        teamSize: number;
        sprintLength: number;
        techStack?: string[];
    }): Promise<AITaskSuggestion[]>;
    /**
     * Analyze code file and suggest improvement tasks
     */
    analyzeCodeForTasks(filePath: string): Promise<AITaskSuggestion[]>;
    /**
     * Analyze system architecture and suggest improvement tasks
     */
    analyzeArchitectureForTasks(rootPath: string): Promise<AITaskSuggestion[]>;
    /**
     * Generate data flow analysis tasks
     */
    analyzeDataFlowForTasks(rootPath: string): Promise<AITaskSuggestion[]>;
    /**
     * Analyze sprint progress and provide insights
     */
    analyzeSprintProgress(sprint: Sprint): Promise<SprintAnalysis>;
    /**
     * Estimate task effort using AI
     */
    estimateTaskEffort(taskDescription: string, acceptanceCriteria: string[], codeReferences: CodeReference[]): Promise<{
        estimatedPoints: number;
        confidence: number;
        reasoning: string;
        riskFactors: string[];
    }>;
    private extractTasksFromPlan;
    private extractTasksFromAnalysis;
    private extractTasksFromArchitectureAnalysis;
    private extractTasksFromDataFlowAnalysis;
    private estimateEffortFromTitle;
    private inferPriorityFromTitle;
    private analyzeTaskComplexity;
    private calculatePredictedCompletion;
    private identifyRiskFactors;
    private generateSprintSuggestions;
    private calculateConfidenceLevel;
    private identifyBlockers;
    private generateMockTasks;
}
//# sourceMappingURL=critical-claude-client.d.ts.map