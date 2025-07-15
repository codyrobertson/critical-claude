/**
 * Brutal Task State Management Engine
 * Zero tolerance for invalid state transitions and business rule violations
 */

import { v4 as uuidv4 } from 'uuid';
import { CriticalClaudeClient } from './critical-claude-client.js';
import { 
  EnhancedTask, 
  TaskStatus, 
  StateValidationResult, 
  TaskStateTransition,
  StateAction,
  AcceptanceCriterion,
  TaskDependency
} from '../types/agile.js';

// Simple logger for now
const logger = {
  info: (msg: string, data?: any) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg: string, error?: Error) => console.error(`[ERROR] ${msg}`, error?.message || ''),
  warn: (msg: string, data?: any) => console.warn(`[WARN] ${msg}`, data || '')
};

export class TaskStateManager {
  private criticalClaude: CriticalClaudeClient;
  private config: {
    maxFocusedTasks: number;
    maxInProgressTasks: number;
    autoArchiveDays: number;
    blockerEscalationDays: number;
  };
  
  // State transition matrix - brutal enforcement
  private readonly validTransitions: Record<TaskStatus, TaskStatus[]> = {
    'todo': ['focused', 'blocked', 'dimmed', 'archived_dimmed'],
    'focused': ['in-progress', 'blocked', 'dimmed', 'done'],
    'in-progress': ['focused', 'blocked', 'dimmed', 'done'],
    'blocked': ['focused', 'in-progress', 'dimmed', 'archived_blocked'],
    'dimmed': ['focused', 'in-progress', 'blocked', 'archived_dimmed'],
    'done': ['archived_done'],
    'archived_done': [],
    'archived_blocked': [],
    'archived_dimmed': ['todo', 'dimmed'] // Can be revived
  };
  
  constructor(config?: Partial<typeof this.config>) {
    this.criticalClaude = new CriticalClaudeClient();
    this.config = {
      maxFocusedTasks: 2, // Default: allow 2 focused tasks per developer
      maxInProgressTasks: 5, // Default: allow 5 in-progress tasks per developer
      autoArchiveDays: 30,
      blockerEscalationDays: 5,
      ...config
    };
    logger.info('TaskStateManager initialized with brutal enforcement enabled', this.config);
  }
  
  /**
   * Validate and execute a state transition with Critical Claude integration
   */
  async changeTaskState(
    task: EnhancedTask,
    newState: TaskStatus,
    changedBy: string,
    reason?: string,
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; validation: StateValidationResult; updatedTask?: EnhancedTask }> {
    
    logger.info(`Attempting state change: ${task.id} from ${task.status} to ${newState}`);
    
    // Step 1: Basic transition validation
    const basicValidation = this.validateBasicTransition(task.status, newState);
    if (!basicValidation.valid) {
      return { success: false, validation: basicValidation };
    }
    
    // Step 2: State-specific business rule validation
    const businessRuleValidation = await this.validateBusinessRules(task, newState, changedBy, metadata);
    if (!businessRuleValidation.valid) {
      return { success: false, validation: businessRuleValidation };
    }
    
    // Step 3: Critical Claude analysis for risky transitions
    const criticalClaudeAnalysis = await this.runCriticalClaudeAnalysis(task, newState);
    
    // Step 4: Execute the transition
    const stateTransition: TaskStateTransition = {
      id: uuidv4(),
      fromState: task.status,
      toState: newState,
      changedBy,
      changedAt: new Date(),
      reason,
      validationResult: businessRuleValidation,
      criticalClaudeAnalysis
    };
    
    const updatedTask = await this.executeStateTransition(task, newState, stateTransition, metadata);
    
    // Step 5: Execute required actions
    await this.executeRequiredActions(businessRuleValidation.requiredActions || [], updatedTask);
    
    logger.info(`State change successful: ${task.id} -> ${newState}`);
    
    return {
      success: true,
      validation: businessRuleValidation,
      updatedTask
    };
  }
  
  /**
   * Basic state transition matrix validation
   */
  private validateBasicTransition(fromState: TaskStatus, toState: TaskStatus): StateValidationResult {
    const allowedTransitions = this.validTransitions[fromState];
    
    if (!allowedTransitions.includes(toState)) {
      return {
        valid: false,
        reason: `Invalid transition from ${fromState} to ${toState}. Allowed: ${allowedTransitions.join(', ')}`
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Business rule validation - THE BRUTAL PART
   */
  private async validateBusinessRules(
    task: EnhancedTask,
    newState: TaskStatus,
    changedBy: string,
    metadata?: Record<string, any>
  ): Promise<StateValidationResult> {
    
    const warnings: string[] = [];
    const requiredActions: StateAction[] = [];
    const recommendations: string[] = [];
    
    switch (newState) {
      case 'focused':
        return await this.validateFocusTransition(task, changedBy, warnings, requiredActions);
        
      case 'blocked':
        return await this.validateBlockedTransition(task, metadata, warnings, requiredActions);
        
      case 'done':
        return await this.validateDoneTransition(task, warnings, requiredActions, recommendations);
        
      case 'in-progress':
        return await this.validateInProgressTransition(task, changedBy, warnings, requiredActions);
        
      case 'dimmed':
        return await this.validateDimmedTransition(task, warnings, requiredActions);
        
      default:
        return { valid: true, warnings, requiredActions, criticalClaudeRecommendations: recommendations };
    }
  }
  
  /**
   * FOCUSED state validation - Only ONE task per developer
   */
  private async validateFocusTransition(
    task: EnhancedTask,
    changedBy: string,
    warnings: string[],
    requiredActions: StateAction[]
  ): Promise<StateValidationResult> {
    
    // Rule 1: Check if developer has reached max focused tasks
    const currentFocused = await this.getFocusedTasksByDeveloper(changedBy);
    if (currentFocused.length >= this.config.maxFocusedTasks && !currentFocused.find(t => t.id === task.id)) {
      return {
        valid: false,
        reason: `Developer ${changedBy} already has ${currentFocused.length} focused tasks (max: ${this.config.maxFocusedTasks}). Complete or unfocus existing tasks first.`
      };
    }
    
    // Rule 2: Validate dependencies are not blocked
    const blockedDependencies = await this.getBlockedDependencies(task.dependencies);
    if (blockedDependencies.length > 0) {
      return {
        valid: false,
        reason: `Cannot focus on task with blocked dependencies: ${blockedDependencies.map(d => d.taskId).join(', ')}`,
        requiredActions: [{
          type: 'escalate',
          target: 'tech-lead',
          metadata: { blockedDependencies, taskId: task.id }
        }]
      };
    }
    
    // Rule 3: Task must be properly estimated
    if (!task.storyPoints || task.storyPoints === 0) {
      return {
        valid: false,
        reason: 'Task must be estimated (story points > 0) before focusing'
      };
    }
    
    // Rule 4: Warn if task is too large
    if (task.storyPoints > 8) {
      warnings.push('Large task (>8 points) - consider breaking down');
      requiredActions.push({
        type: 'create_task',
        target: 'subtask-breakdown',
        metadata: { parentTaskId: task.id, reason: 'Large task breakdown' }
      });
    }
    
    return { valid: true, warnings, requiredActions };
  }
  
  /**
   * BLOCKED state validation - Must have proper reason and escalation
   */
  private async validateBlockedTransition(
    task: EnhancedTask,
    metadata?: Record<string, any>,
    warnings: string[] = [],
    requiredActions: StateAction[] = []
  ): Promise<StateValidationResult> {
    
    const blockerReason = metadata?.blockerReason as string;
    
    // Rule 1: Must have blocker reason
    if (!blockerReason || blockerReason.trim().length < 10) {
      return {
        valid: false,
        reason: 'Blocker reason must be at least 10 characters and descriptive'
      };
    }
    
    // Rule 2: Auto-escalate architectural issues
    if (this.isArchitecturalBlocker(blockerReason)) {
      requiredActions.push({
        type: 'escalate',
        target: 'architecture-review',
        metadata: { 
          taskId: task.id, 
          reason: blockerReason,
          urgency: task.priority === 'critical' ? 'immediate' : 'normal'
        }
      });
      
      requiredActions.push({
        type: 'run_analysis',
        target: 'cc_system_design_analyze',
        metadata: { 
          taskId: task.id,
          focusArea: 'dependencies'
        }
      });
    }
    
    // Rule 3: Schedule blocker review
    requiredActions.push({
      type: 'create_task',
      target: 'blocker-review',
      metadata: {
        parentTaskId: task.id,
        reviewDate: this.calculateBlockerReviewDate(task.priority),
        blockerReason
      }
    });
    
    return { valid: true, warnings, requiredActions };
  }
  
  /**
   * DONE state validation - BRUTAL acceptance criteria enforcement
   */
  private async validateDoneTransition(
    task: EnhancedTask,
    warnings: string[],
    requiredActions: StateAction[],
    recommendations: string[]
  ): Promise<StateValidationResult> {
    
    // Rule 1: All acceptance criteria must be verified
    const unverifiedCriteria = task.acceptanceCriteria.filter(ac => !ac.verified);
    if (unverifiedCriteria.length > 0) {
      return {
        valid: false,
        reason: `Unverified acceptance criteria: ${unverifiedCriteria.map(ac => ac.description).join(', ')}`
      };
    }
    
    // Rule 2: No acceptance criteria is a red flag
    if (task.acceptanceCriteria.length === 0) {
      return {
        valid: false,
        reason: 'Task has no acceptance criteria defined - cannot mark as done'
      };
    }
    
    // Rule 3: Code quality validation for tasks with code changes
    if (task.codeReferences.length > 0) {
      requiredActions.push({
        type: 'run_analysis',
        target: 'cc_crit_code',
        metadata: {
          taskId: task.id,
          codeReferences: task.codeReferences,
          requirementLevel: 'must_pass'
        }
      });
      
      // This would normally be async, but for demo we'll assume it passes
      recommendations.push('Run final code quality analysis before marking done');
    }
    
    // Rule 4: Performance validation for critical tasks
    if (task.priority === 'critical') {
      requiredActions.push({
        type: 'run_analysis',
        target: 'cc_data_flow_analyze',
        metadata: {
          taskId: task.id,
          analysisType: 'performance_impact'
        }
      });
    }
    
    return { valid: true, warnings, requiredActions, criticalClaudeRecommendations: recommendations };
  }
  
  /**
   * IN-PROGRESS state validation - Prevent work fragmentation
   */
  private async validateInProgressTransition(
    task: EnhancedTask,
    changedBy: string,
    warnings: string[],
    requiredActions: StateAction[]
  ): Promise<StateValidationResult> {
    
    // Rule 1: Check for too many in-progress tasks
    const inProgressTasks = await this.getInProgressTasksByDeveloper(changedBy);
    if (inProgressTasks.length >= this.config.maxInProgressTasks) {
      return {
        valid: false,
        reason: `Developer ${changedBy} already has ${inProgressTasks.length} in-progress tasks (max: ${this.config.maxInProgressTasks}). Complete or focus on existing tasks first.`
      };
    }
    
    if (inProgressTasks.length >= Math.floor(this.config.maxInProgressTasks * 0.8)) {
      warnings.push(`Developer approaching max in-progress tasks (${inProgressTasks.length}/${this.config.maxInProgressTasks})`);
      
      requiredActions.push({
        type: 'notify',
        target: 'tech-lead',
        metadata: {
          developerId: changedBy,
          inProgressCount: inProgressTasks.length,
          message: 'Developer approaching max in-progress tasks - consider focusing efforts'
        }
      });
    }
    
    // Rule 2: Must have some activity to enter in-progress
    if (!task.timeTracking.lastActivity && task.codeReferences.length === 0) {
      warnings.push('Task marked in-progress without any recorded activity');
    }
    
    return { valid: true, warnings, requiredActions };
  }
  
  /**
   * DIMMED state validation - Ensure proper prioritization
   */
  private async validateDimmedTransition(
    task: EnhancedTask,
    warnings: string[],
    requiredActions: StateAction[]
  ): Promise<StateValidationResult> {
    
    // Rule 1: Critical tasks should not be dimmed without approval
    if (task.priority === 'critical') {
      return {
        valid: false,
        reason: 'Critical priority tasks cannot be dimmed without product owner approval'
      };
    }
    
    // Rule 2: Schedule auto-archival
    requiredActions.push({
      type: 'create_task',
      target: 'auto-archive-check',
      metadata: {
        taskId: task.id,
        scheduleDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        reason: 'Auto-archive dimmed task'
      }
    });
    
    return { valid: true, warnings, requiredActions };
  }
  
  /**
   * Critical Claude analysis for complex transitions
   */
  private async runCriticalClaudeAnalysis(
    task: EnhancedTask,
    newState: TaskStatus
  ): Promise<Record<string, any>> {
    
    try {
      if (newState === 'focused' && task.codeReferences.length > 0) {
        // Analyze code complexity before focusing
        const analysis = await this.criticalClaude.analyzeCodeForTasks(task.codeReferences[0].filePath);
        return {
          type: 'code_complexity',
          results: analysis,
          recommendations: analysis.map(a => a.reasoning)
        };
      }
      
      if (newState === 'blocked') {
        // Analyze architectural patterns for blocking issues
        const analysis = await this.criticalClaude.analyzeArchitectureForTasks('.');
        return {
          type: 'architectural_analysis',
          results: analysis,
          blockingPatterns: 'Would identify common blocking patterns'
        };
      }
      
      return { type: 'none', message: 'No analysis required for this transition' };
      
    } catch (error) {
      logger.error('Critical Claude analysis failed', error as Error);
      return { 
        type: 'error', 
        error: (error as Error).message,
        fallback: 'Analysis skipped due to error'
      };
    }
  }
  
  /**
   * Execute the actual state transition
   */
  private async executeStateTransition(
    task: EnhancedTask,
    newState: TaskStatus,
    transition: TaskStateTransition,
    metadata?: Record<string, any>
  ): Promise<EnhancedTask> {
    
    const updatedTask: EnhancedTask = {
      ...task,
      status: newState,
      updatedAt: new Date(),
      stateHistory: [...task.stateHistory, transition]
    };
    
    // State-specific updates
    switch (newState) {
      case 'focused':
        updatedTask.focusMetadata = {
          focusedAt: new Date(),
          estimatedCompletion: new Date(Date.now() + (task.storyPoints * 4 * 60 * 60 * 1000)), // 4h per point
        };
        break;
        
      case 'blocked':
        updatedTask.blockerInfo = {
          reason: metadata?.blockerReason || 'Reason not specified',
          expectedResolution: metadata?.expectedResolution,
          blockedBy: transition.changedBy
        };
        break;
        
      case 'done':
        updatedTask.completedAt = new Date();
        updatedTask.focusMetadata = undefined; // Clear focus data
        break;
        
      case 'archived_done':
      case 'archived_blocked':
      case 'archived_dimmed':
        updatedTask.archivedAt = new Date();
        updatedTask.archivedReason = metadata?.archiveReason || `Auto-archived from ${task.status}`;
        break;
    }
    
    return updatedTask;
  }
  
  /**
   * Execute required actions from validation
   */
  private async executeRequiredActions(
    actions: StateAction[],
    task: EnhancedTask
  ): Promise<void> {
    
    for (const action of actions) {
      try {
        await this.executeAction(action, task);
      } catch (error) {
        logger.error(`Failed to execute action ${action.type}`, error as Error);
        // Continue with other actions even if one fails
      }
    }
  }
  
  private async executeAction(action: StateAction, task: EnhancedTask): Promise<void> {
    switch (action.type) {
      case 'escalate':
        logger.info(`ESCALATION: ${action.target}`, action.metadata);
        // Would integrate with notification system
        break;
        
      case 'create_task':
        logger.info(`AUTO-CREATE TASK: ${action.target}`, action.metadata);
        // Would create related tasks
        break;
        
      case 'notify':
        logger.info(`NOTIFICATION: ${action.target}`, action.metadata);
        // Would send notifications
        break;
        
      case 'run_analysis':
        logger.info(`RUNNING ANALYSIS: ${action.target}`, action.metadata);
        // Would trigger Critical Claude analysis
        break;
    }
  }
  
  // Helper methods for business rule validation
  
  private async getFocusedTasksByDeveloper(developerId: string): Promise<EnhancedTask[]> {
    // Would query database for focused tasks by developer
    return []; // Mock implementation - return actual focused tasks
  }
  
  private async getBlockedDependencies(dependencies: TaskDependency[]): Promise<TaskDependency[]> {
    // Would check status of dependency tasks
    return []; // Mock implementation
  }
  
  private async getInProgressTasksByDeveloper(developerId: string): Promise<EnhancedTask[]> {
    // Would query database for in-progress tasks by developer
    return []; // Mock implementation
  }
  
  private isArchitecturalBlocker(reason: string): boolean {
    const architecturalKeywords = [
      'architecture', 'design', 'dependency', 'integration',
      'api', 'database', 'schema', 'service', 'infrastructure'
    ];
    
    return architecturalKeywords.some(keyword => 
      reason.toLowerCase().includes(keyword)
    );
  }
  
  private calculateBlockerReviewDate(priority: string): Date {
    const daysToAdd = priority === 'critical' ? 1 : priority === 'high' ? 3 : 5;
    return new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
  }
}

export default TaskStateManager;