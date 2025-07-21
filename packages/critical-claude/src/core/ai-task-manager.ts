/**
 * AI Task Manager - Real AI-powered task management
 * Uses actual language models instead of pattern matching
 */

import { CommonTask, CreateTaskInput, TaskPriority, TaskDependency } from '../types/common-task.js';
import { UnifiedStorageManager } from './unified-storage.js';
import { logger } from './logger.js';
import { AIService, AIConfig, AITaskAnalysis } from './ai-service.js';

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

export class AITaskManager {
  private storage: UnifiedStorageManager;
  private aiService: AIService;
  
  constructor(storage: UnifiedStorageManager, aiConfig?: AIConfig) {
    this.storage = storage;
    this.aiService = new AIService(aiConfig);
  }

  /**
   * Expand a task into subtasks using AI analysis
   */
  async expandTask(taskId: string, options: AITaskGenerationOptions = {}): Promise<AITaskExpansionResult> {
    const parentTask = await this.storage.getTask(taskId);
    if (!parentTask) {
      throw new Error(`Task not found: ${taskId}`);
    }

    logger.info(`Expanding task with AI: ${parentTask.title}`);

    // Use AI service to expand the task
    const aiSubtasks = await this.aiService.expandTask(
      parentTask.title, 
      parentTask.description || '', 
      {
        maxSubtasks: options.maxTasks || 8,
        teamSize: options.targetTeamSize || 3,
        experience: options.experienceLevel || 'intermediate'
      }
    );
    
    // Convert AI analysis to CommonTask objects
    const subtasks: CommonTask[] = [];
    const dependencies: TaskDependency[] = [];

    for (const aiSubtask of aiSubtasks) {
      const subtask = await this.storage.createTask({
        title: aiSubtask.title,
        description: aiSubtask.description,
        priority: aiSubtask.priority as TaskPriority,
        labels: [...aiSubtask.labels, 'ai-expanded', `parent:${parentTask.id}`],
        storyPoints: aiSubtask.storyPoints,
        estimatedHours: aiSubtask.estimatedHours,
        parentId: parentTask.id,
        aiGenerated: true,
        source: 'ai-expansion',
        dependencies: aiSubtask.dependencies || []
      });
      
      subtasks.push(subtask);
    }

    // Update dependencies based on AI analysis
    for (let i = 0; i < subtasks.length; i++) {
      const subtask = subtasks[i];
      const aiSubtask = aiSubtasks[i];
      
      if (aiSubtask.dependencies && aiSubtask.dependencies.length > 0) {
        // Find dependency task IDs by matching titles
        const depIds: string[] = [];
        for (const depTitle of aiSubtask.dependencies) {
          const depTask = subtasks.find(t => t.title.includes(depTitle) || depTitle.includes(t.title));
          if (depTask) {
            depIds.push(depTask.id);
          }
        }
        
        if (depIds.length > 0) {
          await this.storage.updateTask({
            id: subtask.id,
            dependencies: depIds
          });
        }
      }
    }

    // Update parent task
    const updatedParent = await this.storage.updateTask({
      id: parentTask.id,
      status: 'in_progress',
      labels: [...(parentTask.labels || []), 'expanded'],
      childTasks: subtasks.map(t => t.id)
    });

    return {
      parentTask: updatedParent!,
      subtasks,
      dependencies: dependencies,
      estimatedTimeline: this.calculateTimelineFromAI(aiSubtasks),
      riskFactors: this.extractRiskFactorsFromAI(aiSubtasks)
    };
  }

  /**
   * Generate multiple related tasks from AI text analysis
   */
  async generateTasks(description: string, options: AITaskGenerationOptions = {}): Promise<CommonTask[]> {
    logger.info(`Generating tasks with AI from: ${description.substring(0, 50)}...`);

    // Ensure AI service is initialized
    await this.aiService.initialize();

    // Use AI service for intelligent task generation
    const aiTasks = await this.aiService.generateProjectTasks(description, {
      maxTasks: options.maxTasks || 8,
      teamSize: options.targetTeamSize || 3,
      experience: options.experienceLevel || 'intermediate',
      timeline: options.timeConstraint
    });
    
    const tasks: CommonTask[] = [];
    
    for (const aiTask of aiTasks) {
      const task = await this.storage.createTask({
        title: aiTask.title,
        description: aiTask.description,
        priority: aiTask.priority as TaskPriority,
        labels: [...aiTask.labels, 'ai-generated'],
        storyPoints: aiTask.storyPoints,
        estimatedHours: aiTask.estimatedHours,
        aiGenerated: true,
        source: 'ai-generation',
        dependencies: aiTask.dependencies || []
      });
      
      tasks.push(task);
    }

    // Apply AI-determined dependencies
    if (options.includeDepencencies !== false) {
      await this.applyAIDependencies(tasks, aiTasks);
    }

    return tasks;
  }

  /**
   * Analyze existing tasks and suggest optimizations using AI
   */
  async analyzeTaskDependencies(): Promise<{
    conflicts: string[];
    suggestions: string[];
    criticalPath: string[];
    bottlenecks: string[];
  }> {
    const tasks = await this.storage.listTasks();
    const dependencyMap = this.buildDependencyMap(tasks);
    
    return {
      conflicts: this.detectConflicts(dependencyMap),
      suggestions: this.generateOptimizationSuggestions(tasks, dependencyMap),
      criticalPath: this.calculateCriticalPath(tasks, dependencyMap),
      bottlenecks: this.identifyBottlenecks(tasks, dependencyMap)
    };
  }

  /**
   * Estimate task complexity and effort using AI
   */
  async estimateTask(task: CommonTask): Promise<{
    storyPoints: number;
    estimatedHours: number;
    complexity: 'low' | 'medium' | 'high' | 'very-high';
    confidence: number;
    factors: string[];
  }> {
    logger.info(`AI estimating task: ${task.title}`);

    // Use AI service for intelligent estimation
    const aiEstimation = await this.aiService.estimateTask(
      task.title, 
      task.description || ''
    );

    return {
      storyPoints: aiEstimation.storyPoints,
      estimatedHours: aiEstimation.estimatedHours,
      complexity: aiEstimation.complexity,
      confidence: aiEstimation.confidence,
      factors: aiEstimation.factors
    };
  }

  // Private helper methods for AI integration

  private calculateTimelineFromAI(aiSubtasks: AITaskAnalysis[]): string {
    const totalHours = aiSubtasks.reduce((sum, task) => sum + task.estimatedHours, 0);
    const days = Math.ceil(totalHours / 8); // 8 hours per day
    
    if (days <= 5) return `${days} days`;
    if (days <= 10) return `1-2 weeks`;
    if (days <= 20) return `2-4 weeks`;
    return `1-2 months`;
  }

  private extractRiskFactorsFromAI(aiSubtasks: AITaskAnalysis[]): string[] {
    const risks = new Set<string>();
    
    aiSubtasks.forEach(task => {
      if (task.riskFactors) {
        task.riskFactors.forEach(risk => risks.add(risk));
      }
    });
    
    return Array.from(risks);
  }

  private async applyAIDependencies(tasks: CommonTask[], aiTasks: AITaskAnalysis[]): Promise<void> {
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const aiTask = aiTasks[i];
      
      if (aiTask.dependencies && aiTask.dependencies.length > 0) {
        // Find dependency task IDs by matching titles
        const depIds: string[] = [];
        for (const depTitle of aiTask.dependencies) {
          const depTask = tasks.find(t => 
            t.title.toLowerCase().includes(depTitle.toLowerCase()) || 
            depTitle.toLowerCase().includes(t.title.toLowerCase())
          );
          if (depTask && depTask.id !== task.id) {
            depIds.push(depTask.id);
          }
        }
        
        if (depIds.length > 0) {
          await this.storage.updateTask({
            id: task.id,
            dependencies: depIds
          });
        }
      }
    }
  }

  // Dependency analysis methods (keep these as they're still useful)

  private buildDependencyMap(tasks: CommonTask[]): TaskDependencyMap {
    const map: TaskDependencyMap = {};
    
    tasks.forEach(task => {
      map[task.id] = {
        dependsOn: task.dependencies || [],
        blockedBy: [],
        blocks: []
      };
    });

    // Build reverse dependencies
    Object.entries(map).forEach(([taskId, deps]) => {
      deps.dependsOn.forEach(depId => {
        if (map[depId]) {
          map[depId].blocks.push(taskId);
        }
      });
    });

    return map;
  }

  private detectConflicts(dependencyMap: TaskDependencyMap): string[] {
    const conflicts: string[] = [];
    
    // Detect circular dependencies
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const detectCycle = (taskId: string): boolean => {
      if (recursionStack.has(taskId)) {
        conflicts.push(`Circular dependency detected involving task: ${taskId}`);
        return true;
      }
      
      if (visited.has(taskId)) return false;
      
      visited.add(taskId);
      recursionStack.add(taskId);
      
      const deps = dependencyMap[taskId]?.dependsOn || [];
      for (const depId of deps) {
        if (detectCycle(depId)) return true;
      }
      
      recursionStack.delete(taskId);
      return false;
    };

    Object.keys(dependencyMap).forEach(taskId => {
      if (!visited.has(taskId)) {
        detectCycle(taskId);
      }
    });

    return conflicts;
  }

  private generateOptimizationSuggestions(tasks: CommonTask[], dependencyMap: TaskDependencyMap): string[] {
    const suggestions: string[] = [];
    
    // Find tasks with no dependencies that could be parallelized
    const parallelizable = tasks.filter(task => 
      (dependencyMap[task.id]?.dependsOn.length || 0) === 0
    );
    
    if (parallelizable.length > 3) {
      suggestions.push(`${parallelizable.length} tasks can be worked on in parallel`);
    }

    // Find long dependency chains
    Object.entries(dependencyMap).forEach(([taskId, deps]) => {
      if (deps.dependsOn.length > 3) {
        suggestions.push(`Task ${taskId} has many dependencies - consider breaking it down`);
      }
    });

    return suggestions;
  }

  private calculateCriticalPath(tasks: CommonTask[], dependencyMap: TaskDependencyMap): string[] {
    // Simplified critical path calculation
    const taskEffort: Record<string, number> = {};
    tasks.forEach(task => {
      taskEffort[task.id] = task.storyPoints || 3;
    });

    // Find the longest path through dependencies
    const longestPath: string[] = [];
    let maxEffort = 0;

    const calculatePath = (taskId: string, path: string[], effort: number): void => {
      const newPath = [...path, taskId];
      const newEffort = effort + taskEffort[taskId];
      
      const blockedTasks = dependencyMap[taskId]?.blocks || [];
      if (blockedTasks.length === 0) {
        // End of path
        if (newEffort > maxEffort) {
          maxEffort = newEffort;
          longestPath.splice(0, longestPath.length, ...newPath);
        }
      } else {
        blockedTasks.forEach(blockedId => {
          calculatePath(blockedId, newPath, newEffort);
        });
      }
    };

    // Start from tasks with no dependencies
    tasks.forEach(task => {
      if ((dependencyMap[task.id]?.dependsOn.length || 0) === 0) {
        calculatePath(task.id, [], 0);
      }
    });

    return longestPath;
  }

  private identifyBottlenecks(tasks: CommonTask[], dependencyMap: TaskDependencyMap): string[] {
    const bottlenecks: string[] = [];
    
    // Find tasks that block many other tasks
    Object.entries(dependencyMap).forEach(([taskId, deps]) => {
      if (deps.blocks.length > 2) {
        const task = tasks.find(t => t.id === taskId);
        bottlenecks.push(`Task "${task?.title || taskId}" blocks ${deps.blocks.length} other tasks`);
      }
    });

    return bottlenecks;
  }
}