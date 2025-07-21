/**
 * AI Service - Real AI integration using language models
 * Replaces pattern matching with actual AI-powered analysis
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
export interface AITaskAnalysis {
    title: string;
    description: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    labels: string[];
    assignee?: string;
    storyPoints: number;
    estimatedHours: number;
    complexity: 'low' | 'medium' | 'high' | 'very-high';
    domain: string;
    technologies: string[];
    requirements: string[];
    subtasks?: string[];
    dependencies?: string[];
    riskFactors: string[];
}
export interface AIProjectAnalysis {
    projectType: string;
    domain: string;
    features: AIFeature[];
    technicalRequirements: string[];
    timeline: string;
    complexity: 'low' | 'medium' | 'high' | 'very-high';
    recommendedTeamSize: number;
    phases: AIPhase[];
    risks: string[];
}
export interface AIFeature {
    name: string;
    description: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    complexity: 'low' | 'medium' | 'high' | 'very-high';
    estimatedDays: number;
    dependencies: string[];
    tasks: string[];
}
export interface AIPhase {
    name: string;
    description: string;
    duration: string;
    features: string[];
    deliverables: string[];
}
export declare class AIService {
    private config;
    private initialized;
    constructor(config?: AIConfig);
    private loadEnvConfigSync;
    private isClaudeCodeContext;
    initialize(): Promise<void>;
    /**
     * Analyze task description using AI to extract structured information
     */
    analyzeTask(description: string, context?: any): Promise<AITaskAnalysis>;
    /**
     * Generate multiple related tasks from project description
     */
    generateProjectTasks(description: string, options?: {
        maxTasks?: number;
        teamSize?: number;
        experience?: string;
        timeline?: string;
    }): Promise<AITaskAnalysis[]>;
    /**
     * Expand a task into subtasks using AI reasoning
     */
    expandTask(taskTitle: string, taskDescription: string, options?: {
        maxSubtasks?: number;
        teamSize?: number;
        experience?: string;
    }): Promise<AITaskAnalysis[]>;
    /**
     * Analyze project scope and generate comprehensive breakdown
     */
    analyzeProject(description: string, options?: {
        teamSize?: number;
        timeline?: string;
        budget?: string;
    }): Promise<AIProjectAnalysis>;
    /**
     * Estimate task complexity and effort using AI
     */
    estimateTask(taskTitle: string, taskDescription: string): Promise<{
        storyPoints: number;
        estimatedHours: number;
        complexity: 'low' | 'medium' | 'high' | 'very-high';
        confidence: number;
        factors: string[];
    }>;
    private initializeOpenAI;
    private initializeAnthropic;
    private initializeClaudeCode;
    private initializeLocal;
    private initializeMock;
    private buildTaskAnalysisPrompt;
    private buildProjectTasksPrompt;
    private buildTaskExpansionPrompt;
    private buildProjectAnalysisPrompt;
    private buildEstimationPrompt;
    private callAI;
    private callOpenAI;
    private callAnthropic;
    private callClaudeCode;
    private callLocal;
    private callMock;
    private mockTaskAnalysisResponse;
    private mockProjectTasksResponse;
    private mockTaskExpansionResponse;
    private mockProjectAnalysisResponse;
    private mockEstimationResponse;
    private analyzeDescriptionIntelligently;
    private generateIntelligentTasks;
    private generateIntelligentSubtasks;
    private extractDescription;
    private extractTaskTitle;
    private extractMaxTasks;
    private extractMaxSubtasks;
    private cleanTitle;
    private extractRequirements;
    private identifyRisks;
    private parseTaskAnalysis;
    private parseProjectTasks;
    private parseTaskExpansion;
    private parseProjectAnalysis;
    private parseEstimation;
    private analyzeProjectIntelligently;
    private estimateTaskIntelligently;
    private determineProjectType;
    private extractFeatures;
    private estimateProjectTimeline;
    private recommendTeamSize;
    private generateProjectPhases;
    private calculateProjectTimeline;
    private generatePhases;
    private calculateCriticalPath;
    private identifyProjectRisks;
    private calculateSubtaskTimeline;
    private identifyTaskRisks;
    private generateRecommendations;
}
//# sourceMappingURL=ai-service.d.ts.map