/**
 * Critical Claude MCP client for AI-powered task management
 */

import { SystemDesignServer } from '@critical-claude/system-design';
import { DataFlowServer } from '@critical-claude/data-flow';
import { logger } from '@critical-claude/core';
import { AITaskSuggestion, SprintAnalysis, EnhancedTask, Sprint, CodeReference } from '../types/agile.js';

export class CriticalClaudeClient {
  private systemDesign: SystemDesignServer;
  private dataFlow: DataFlowServer;
  
  constructor() {
    this.systemDesign = new SystemDesignServer();
    this.dataFlow = new DataFlowServer();
    
    logger.info('Critical Claude client initialized for backlog management');
  }
  
  /**
   * Generate tasks from a feature description using AI planning
   */
  async generateTasksFromFeature(
    featureDescription: string,
    projectContext: {
      teamSize: number;
      sprintLength: number; // days
      techStack?: string[];
    }
  ): Promise<AITaskSuggestion[]> {
    try {
      logger.info('Generating tasks from feature description', { featureDescription });
      
      const mvpPlan = await this.systemDesign.handleToolCall('cc_mvp_plan', {
        projectName: 'Current Feature',
        description: featureDescription,
        targetUsers: 'Development team',
        constraints: {
          teamSize: projectContext.teamSize,
          timeline: `${projectContext.sprintLength} days`
        }
      });
      
      const planContent = mvpPlan.content[0].text;
      return this.extractTasksFromPlan(planContent, featureDescription);
      
    } catch (error) {
      logger.error('Failed to generate tasks from feature', error as Error);
      throw new Error(`AI task generation failed: ${(error as Error).message}`);
    }
  }
  
  /**
   * Analyze code file and suggest improvement tasks
   */
  async analyzeCodeForTasks(filePath: string): Promise<AITaskSuggestion[]> {
    try {
      logger.info('Analyzing code for task suggestions', { filePath });
      
      const codeAnalysis = await this.systemDesign.handleToolCall('cc_crit_code', {
        filePath
      });
      
      const analysisContent = codeAnalysis.content[0].text;
      return this.extractTasksFromAnalysis(analysisContent, filePath);
      
    } catch (error) {
      logger.error('Failed to analyze code for tasks', error as Error);
      throw new Error(`Code analysis failed: ${(error as Error).message}`);
    }
  }
  
  /**
   * Analyze system architecture and suggest improvement tasks
   */
  async analyzeArchitectureForTasks(rootPath: string): Promise<AITaskSuggestion[]> {
    try {
      logger.info('Analyzing architecture for improvement tasks', { rootPath });
      
      const archAnalysis = await this.systemDesign.handleToolCall('cc_system_design_analyze', {
        rootPath,
        focus: 'all'
      });
      
      const analysisContent = archAnalysis.content[0].text;
      return this.extractTasksFromArchitectureAnalysis(analysisContent);
      
    } catch (error) {
      logger.error('Failed to analyze architecture for tasks', error as Error);
      throw new Error(`Architecture analysis failed: ${(error as Error).message}`);
    }
  }
  
  /**
   * Generate data flow analysis tasks
   */
  async analyzeDataFlowForTasks(rootPath: string): Promise<AITaskSuggestion[]> {
    try {
      logger.info('Analyzing data flow for optimization tasks', { rootPath });
      
      const dataFlowAnalysis = await this.dataFlow.handleToolCall('cc_data_flow_analyze', {
        rootPath
      });
      
      const analysisContent = dataFlowAnalysis.content[0].text;
      return this.extractTasksFromDataFlowAnalysis(analysisContent);
      
    } catch (error) {
      logger.error('Failed to analyze data flow for tasks', error as Error);
      throw new Error(`Data flow analysis failed: ${(error as Error).message}`);
    }
  }
  
  /**
   * Analyze sprint progress and provide insights
   */
  async analyzeSprintProgress(sprint: Sprint): Promise<SprintAnalysis> {
    try {
      logger.info('Analyzing sprint progress', { sprintId: sprint.id });
      
      const completedPoints = sprint.tasks
        .filter(task => task.status === 'done')
        .reduce((sum, task) => sum + task.storyPoints, 0);
      
      const totalPoints = sprint.tasks
        .reduce((sum, task) => sum + task.storyPoints, 0);
      
      const daysElapsed = Math.floor(
        (new Date().getTime() - sprint.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      const sprintLength = Math.floor(
        (sprint.endDate.getTime() - sprint.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      const velocity = daysElapsed > 0 ? completedPoints / daysElapsed : 0;
      const predictedCompletion = this.calculatePredictedCompletion(
        sprint, completedPoints, totalPoints, velocity
      );
      
      const riskFactors = this.identifyRiskFactors(sprint, velocity, daysElapsed, sprintLength);
      const suggestions = this.generateSprintSuggestions(sprint, riskFactors, velocity);
      
      return {
        sprintId: sprint.id,
        velocityTrend: [velocity],
        riskFactors,
        suggestions,
        predictedCompletion,
        confidenceLevel: this.calculateConfidenceLevel(sprint, riskFactors),
        blockers: this.identifyBlockers(sprint)
      };
      
    } catch (error) {
      logger.error('Failed to analyze sprint progress', error as Error);
      throw new Error(`Sprint analysis failed: ${(error as Error).message}`);
    }
  }
  
  /**
   * Estimate task effort using AI
   */
  async estimateTaskEffort(
    taskDescription: string,
    acceptanceCriteria: string[],
    codeReferences: CodeReference[]
  ): Promise<{
    estimatedPoints: number;
    confidence: number;
    reasoning: string;
    riskFactors: string[];
  }> {
    try {
      // For now, use rule-based estimation with AI insights
      const complexity = this.analyzeTaskComplexity(taskDescription, acceptanceCriteria);
      const codeComplexity = codeReferences.length > 0 ? 'medium' : 'low';
      
      let basePoints = 1;
      let riskFactors: string[] = [];
      
      // Complexity-based estimation
      if (complexity === 'high') {
        basePoints = 8;
        riskFactors.push('High complexity task');
      } else if (complexity === 'medium') {
        basePoints = 5;
      } else {
        basePoints = 2;
      }
      
      // Code reference adjustments
      if (codeReferences.length > 3) {
        basePoints += 2;
        riskFactors.push('Multiple code files involved');
      }
      
      // Acceptance criteria adjustments
      if (acceptanceCriteria.length > 5) {
        basePoints += 1;
        riskFactors.push('Many acceptance criteria');
      }
      
      const confidence = riskFactors.length === 0 ? 0.9 : 0.7 - (riskFactors.length * 0.1);
      
      return {
        estimatedPoints: Math.min(basePoints, 21), // Cap at 21 points
        confidence: Math.max(confidence, 0.3),
        reasoning: `Based on ${complexity} complexity, ${codeReferences.length} code references, and ${acceptanceCriteria.length} acceptance criteria`,
        riskFactors
      };
      
    } catch (error) {
      logger.error('Failed to estimate task effort', error as Error);
      throw new Error(`Task estimation failed: ${(error as Error).message}`);
    }
  }
  
  // Private helper methods
  
  private extractTasksFromPlan(planContent: string, originalDescription: string): AITaskSuggestion[] {
    const tasks: AITaskSuggestion[] = [];
    
    // Parse the plan content and extract actionable tasks
    // This is a simplified implementation - in practice, you'd use more sophisticated parsing
    const lines = planContent.split('\n');
    let currentSection = '';
    
    for (const line of lines) {
      if (line.includes('□') || line.includes('- [ ]')) {
        const taskTitle = line.replace(/□|\- \[ \]|\s*-\s*/, '').trim();
        if (taskTitle) {
          tasks.push({
            title: taskTitle,
            description: `Task generated from feature: ${originalDescription}`,
            estimatedEffort: this.estimateEffortFromTitle(taskTitle),
            priority: this.inferPriorityFromTitle(taskTitle),
            labels: ['ai-generated', 'feature'],
            acceptanceCriteria: [`Complete: ${taskTitle}`],
            reasoning: 'Generated from AI feature breakdown',
            confidence: 0.8,
            codeReferences: [],
            dependencies: []
          });
        }
      }
    }
    
    return tasks;
  }
  
  private extractTasksFromAnalysis(analysisContent: string, filePath: string): AITaskSuggestion[] {
    const tasks: AITaskSuggestion[] = [];
    
    // Extract issues from Critical Claude analysis
    if (analysisContent.includes('CRITICAL ISSUES')) {
      tasks.push({
        title: `Fix critical issues in ${filePath}`,
        description: 'Address critical code quality issues identified by analysis',
        estimatedEffort: 8,
        priority: 'critical',
        labels: ['bug', 'critical', 'code-quality'],
        acceptanceCriteria: ['All critical issues resolved', 'Code passes analysis'],
        reasoning: 'Critical issues detected in code analysis',
        confidence: 0.95,
        codeReferences: [{ filePath, type: 'implementation' }],
        dependencies: []
      });
    }
    
    if (analysisContent.includes('HIGH PRIORITY')) {
      tasks.push({
        title: `Improve code quality in ${filePath}`,
        description: 'Address high priority code quality improvements',
        estimatedEffort: 5,
        priority: 'high',
        labels: ['improvement', 'code-quality'],
        acceptanceCriteria: ['High priority issues resolved'],
        reasoning: 'High priority improvements identified',
        confidence: 0.85,
        codeReferences: [{ filePath, type: 'implementation' }],
        dependencies: []
      });
    }
    
    return tasks;
  }
  
  private extractTasksFromArchitectureAnalysis(analysisContent: string): AITaskSuggestion[] {
    const tasks: AITaskSuggestion[] = [];
    
    // Extract architectural improvements
    if (analysisContent.includes('RECOMMENDATIONS')) {
      tasks.push({
        title: 'Implement architectural improvements',
        description: 'Apply recommended architectural changes from system analysis',
        estimatedEffort: 13,
        priority: 'medium',
        labels: ['architecture', 'improvement'],
        acceptanceCriteria: ['Architectural recommendations implemented'],
        reasoning: 'System architecture analysis recommendations',
        confidence: 0.75,
        codeReferences: [],
        dependencies: []
      });
    }
    
    return tasks;
  }
  
  private extractTasksFromDataFlowAnalysis(analysisContent: string): AITaskSuggestion[] {
    const tasks: AITaskSuggestion[] = [];
    
    // Extract data flow optimizations
    if (analysisContent.includes('BOTTLENECKS')) {
      tasks.push({
        title: 'Optimize data flow bottlenecks',
        description: 'Address performance bottlenecks identified in data flow analysis',
        estimatedEffort: 8,
        priority: 'high',
        labels: ['performance', 'optimization'],
        acceptanceCriteria: ['Bottlenecks resolved', 'Performance improved'],
        reasoning: 'Data flow bottlenecks detected',
        confidence: 0.85,
        codeReferences: [],
        dependencies: []
      });
    }
    
    return tasks;
  }
  
  private estimateEffortFromTitle(title: string): number {
    const lowEffortKeywords = ['update', 'fix', 'change', 'add'];
    const highEffortKeywords = ['implement', 'create', 'build', 'design', 'integrate'];
    
    const lowerTitle = title.toLowerCase();
    
    if (highEffortKeywords.some(keyword => lowerTitle.includes(keyword))) {
      return 8;
    } else if (lowEffortKeywords.some(keyword => lowerTitle.includes(keyword))) {
      return 3;
    }
    
    return 5; // default
  }
  
  private inferPriorityFromTitle(title: string): 'critical' | 'high' | 'medium' | 'low' {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('critical') || lowerTitle.includes('urgent') || lowerTitle.includes('fix')) {
      return 'critical';
    } else if (lowerTitle.includes('important') || lowerTitle.includes('security')) {
      return 'high';
    } else if (lowerTitle.includes('improve') || lowerTitle.includes('optimize')) {
      return 'medium';
    }
    
    return 'low';
  }
  
  private analyzeTaskComplexity(description: string, criteria: string[]): 'low' | 'medium' | 'high' {
    const complexityIndicators = description.toLowerCase();
    
    if (complexityIndicators.includes('algorithm') || 
        complexityIndicators.includes('integration') ||
        complexityIndicators.includes('architecture') ||
        criteria.length > 5) {
      return 'high';
    } else if (complexityIndicators.includes('api') ||
               complexityIndicators.includes('database') ||
               criteria.length > 2) {
      return 'medium';
    }
    
    return 'low';
  }
  
  private calculatePredictedCompletion(
    sprint: Sprint, 
    completedPoints: number, 
    totalPoints: number, 
    velocity: number
  ): Date {
    const remainingPoints = totalPoints - completedPoints;
    const daysNeeded = velocity > 0 ? remainingPoints / velocity : 999;
    
    const prediction = new Date();
    prediction.setDate(prediction.getDate() + Math.ceil(daysNeeded));
    
    return prediction;
  }
  
  private identifyRiskFactors(
    sprint: Sprint, 
    velocity: number, 
    daysElapsed: number, 
    sprintLength: number
  ): string[] {
    const risks: string[] = [];
    
    const progressPercent = daysElapsed / sprintLength;
    const completionPercent = sprint.tasks.filter(t => t.status === 'done').length / sprint.tasks.length;
    
    if (progressPercent > 0.5 && completionPercent < 0.3) {
      risks.push('Sprint behind schedule');
    }
    
    if (velocity === 0 && daysElapsed > 2) {
      risks.push('No completed tasks yet');
    }
    
    const blockedTasks = sprint.tasks.filter(t => t.status === 'blocked').length;
    if (blockedTasks > 0) {
      risks.push(`${blockedTasks} blocked tasks`);
    }
    
    return risks;
  }
  
  private generateSprintSuggestions(sprint: Sprint, riskFactors: string[], velocity: number): string[] {
    const suggestions: string[] = [];
    
    if (riskFactors.includes('Sprint behind schedule')) {
      suggestions.push('Consider reducing sprint scope or extending timeline');
      suggestions.push('Review and prioritize remaining tasks');
    }
    
    if (riskFactors.includes('No completed tasks yet')) {
      suggestions.push('Focus on completing smallest tasks first');
      suggestions.push('Review potential blockers with team');
    }
    
    if (velocity < 1) {
      suggestions.push('Consider breaking down large tasks into smaller ones');
    }
    
    return suggestions;
  }
  
  private calculateConfidenceLevel(sprint: Sprint, riskFactors: string[]): number {
    let confidence = 0.8;
    
    confidence -= riskFactors.length * 0.1;
    
    const completionRate = sprint.tasks.filter(t => t.status === 'done').length / sprint.tasks.length;
    if (completionRate > 0.5) confidence += 0.1;
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }
  
  private identifyBlockers(sprint: Sprint): SprintAnalysis['blockers'] {
    return sprint.tasks
      .filter(task => task.status === 'blocked')
      .map(task => ({
        taskId: task.id,
        reason: 'Task marked as blocked',
        suggestedAction: 'Review and resolve blocking dependencies'
      }));
  }
}