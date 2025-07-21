/**
 * AI Task Manager - Real AI-powered task management
 * Uses actual language models instead of pattern matching
 */
import { CommonTask, TaskDependency } from '../types/common-task.js';
import { UnifiedStorageManager } from './unified-storage.js';
import { AIConfig } from './ai-service.js';
export interface AITaskExpansionResult {
    parentTask: CommonTask;
    subtasks: CommonTask[];
    dependencies: TaskDependency[];
    estimatedTimeline: string;
    riskFactors: string[];
}
export interface AITaskGenerationOptions {
    maxTasks?: number;
    includeDepencencies?: boolean;
    includeEstimation?: boolean;
    targetTeamSize?: number;
    experienceLevel?: 'junior' | 'intermediate' | 'senior';
    timeConstraint?: string;
}
export interface TaskDependencyMap {
    [taskId: string]: {
        dependsOn: string[];
        blockedBy: string[];
        blocks: string[];
    };
}
export declare class AITaskManager {
    private storage;
    private aiService;
    constructor(storage: UnifiedStorageManager, aiConfig?: AIConfig);
    /**
     * Expand a task into subtasks using AI analysis
     */
    expandTask(taskId: string, options?: AITaskGenerationOptions): Promise<AITaskExpansionResult>;
    /**
     * Generate multiple related tasks from AI text analysis
     */
    generateTasks(description: string, options?: AITaskGenerationOptions): Promise<CommonTask[]>;
    /**
     * Analyze existing tasks and suggest optimizations using AI
     */
    analyzeTaskDependencies(): Promise<{
        conflicts: string[];
        suggestions: string[];
        criticalPath: string[];
        bottlenecks: string[];
    }>;
    /**
     * Estimate task complexity and effort using AI
     */
    estimateTask(task: CommonTask): Promise<{
        storyPoints: number;
        estimatedHours: number;
        complexity: 'low' | 'medium' | 'high' | 'very-high';
        confidence: number;
        factors: string[];
    }>;
    private calculateTimelineFromAI;
    private extractRiskFactorsFromAI;
    private applyAIDependencies;
    private buildDependencyMap;
    private detectConflicts;
    private generateOptimizationSuggestions;
    private calculateCriticalPath;
    private identifyBottlenecks;
}
//# sourceMappingURL=ai-task-manager.d.ts.map