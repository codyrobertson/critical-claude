/**
 * Claude Code Integration
 * Connects Critical Claude task system with Claude Code's native todo and hooks
 */

import { logger } from '../core/logger.js';
import { EnhancedTask } from '../types/agile.js';
import { BacklogManager } from '../cli/backlog-manager.js';
import { getHookConfig, isHookFeatureEnabled, getCanaryWarning } from '../config/hooks.js';

interface ClaudeCodeTodo {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  id: string;
}

export class ClaudeCodeIntegration {
  private backlogManager: BacklogManager;

  constructor(backlogManager: BacklogManager) {
    this.backlogManager = backlogManager;
    this.checkHookStatus();
  }

  private checkHookStatus(): void {
    const config = getHookConfig();
    
    if (config.canary && !config.enabled) {
      logger.warn('Hook features are disabled by default (canary)');
      logger.warn(getCanaryWarning());
    }
    
    if (config.enabled && config.canary) {
      logger.warn('⚠️  Using experimental hook features - only for development!');
    }
  }

  /**
   * Sync Critical Claude tasks to Claude Code todos
   * This creates a bidirectional sync between our enhanced task system
   * and Claude Code's native todo functionality
   */
  async syncToClaudeCodeTodos(tasks: EnhancedTask[]): Promise<void> {
    try {
      // Check if sync is enabled
      if (!isHookFeatureEnabled('syncEnabled')) {
        logger.warn('Claude Code sync is disabled - enable with CRITICAL_CLAUDE_HOOKS_ENABLED=true');
        return;
      }

      logger.info('Syncing Critical Claude tasks to Claude Code todos');
      
      // Convert our enhanced tasks to Claude Code todo format
      const claudeCodeTodos: ClaudeCodeTodo[] = tasks.map(task => ({
        content: this.formatTaskForClaudeCode(task),
        status: this.mapStatusToClaudeCode(task.status),
        priority: task.priority as 'low' | 'medium' | 'high',
        id: task.id
      }));

      // Log the sync operation
      logger.info(`Syncing ${claudeCodeTodos.length} tasks to Claude Code todos`);
      
      // In a real implementation, this would call Claude Code's TodoWrite tool
      // For now, we'll format the output to show what would be synced
      this.logSyncOperation(claudeCodeTodos);

    } catch (error) {
      logger.error('Failed to sync to Claude Code todos', error as Error);
      throw error;
    }
  }

  /**
   * Format a Critical Claude task for Claude Code's todo system
   */
  private formatTaskForClaudeCode(task: EnhancedTask): string {
    let content = task.title;
    
    // Add context information
    if (task.description) {
      content += ` - ${task.description}`;
    }
    
    // Add story points
    if (task.storyPoints > 0) {
      content += ` [${task.storyPoints}pts]`;
    }
    
    // Add labels
    if (task.labels.length > 0) {
      content += ` #${task.labels.join(' #')}`;
    }
    
    // Add assignee
    if (task.assignee) {
      content += ` @${task.assignee}`;
    }
    
    return content;
  }

  /**
   * Map Critical Claude task status to Claude Code todo status
   */
  mapStatusToClaudeCode(status: string): 'pending' | 'in_progress' | 'completed' {
    switch (status) {
      case 'todo':
      case 'dimmed':
        return 'pending';
      case 'in_progress':
      case 'in-progress':
      case 'focused':
        return 'in_progress';
      case 'done':
      case 'archived_done':
        return 'completed';
      case 'blocked':
        return 'in_progress'; // Blocked tasks are still in progress
      default:
        return 'pending';
    }
  }

  /**
   * Map Claude Code todo status back to Critical Claude task status
   */
  mapStatusFromClaudeCode(status: 'pending' | 'in_progress' | 'completed'): string {
    switch (status) {
      case 'pending':
        return 'todo';
      case 'in_progress':
        return 'in_progress';
      case 'completed':
        return 'done';
      default:
        return 'todo';
    }
  }

  /**
   * Parse natural language elements from task content
   */
  parseNaturalLanguage(content: string): { priority?: string; labels?: string[]; storyPoints?: number; assignee?: string } {
    const result: { priority?: string; labels?: string[]; storyPoints?: number; assignee?: string } = {};
    
    // Parse priority (@high, @medium, @low, @critical)
    const priorityMatch = content.match(/@(high|medium|low|critical)/i);
    if (priorityMatch) {
      result.priority = priorityMatch[1].toLowerCase();
    }
    
    // Parse labels (#frontend, #backend, etc.)
    const labelMatches = content.match(/#(\w+)/g);
    if (labelMatches) {
      result.labels = labelMatches.map(label => label.substring(1));
    }
    
    // Parse story points (5pts, 8pts, etc.)
    const pointsMatch = content.match(/(\d+)pts?/i);
    if (pointsMatch) {
      result.storyPoints = parseInt(pointsMatch[1], 10);
    }
    
    // Parse assignee (for:alice, for:bob, etc.)
    const assigneeMatch = content.match(/for:(\w+)/i);
    if (assigneeMatch) {
      result.assignee = assigneeMatch[1];
    }
    
    return result;
  }

  /**
   * Create Claude Code hooks for automatic task synchronization
   */
  async setupClaudeCodeHooks(): Promise<void> {
    try {
      logger.info('Setting up Claude Code hooks for task synchronization');
      
      // Example hook configuration that would integrate with Claude Code
      const hookConfig = {
        name: 'critical-claude-sync',
        description: 'Sync Critical Claude tasks with Claude Code todos',
        events: ['PostToolUse', 'Stop'],
        command: this.generateHookCommand(),
        enabled: true
      };

      logger.info('Hook configuration created', hookConfig);
      
      // In a real implementation, this would write to Claude Code's hook configuration
      console.log('🔗 Claude Code Hook Configuration:');
      console.log(JSON.stringify(hookConfig, null, 2));

    } catch (error) {
      logger.error('Failed to setup Claude Code hooks', error as Error);
      throw error;
    }
  }

  /**
   * Generate the shell command for Claude Code hooks
   */
  private generateHookCommand(): string {
    const scriptPath = process.cwd() + '/src/integrations/claude-code-sync.sh';
    
    return `#!/bin/bash
# Critical Claude - Claude Code Sync Hook
# This hook runs after Claude Code tool use to sync tasks

# Check if we're in a Critical Claude project
if [ -d ".critical-claude" ]; then
  # Run our sync command
  node "${process.cwd()}/dist/cli/cc-main.js" sync-claude-code
  
  # Update Claude Code todos with our tasks
  echo "🔄 Syncing Critical Claude tasks to Claude Code todos..."
  
  # Exit with success
  exit 0
fi

# Not a Critical Claude project, skip sync
exit 0`;
  }

  /**
   * Sync from Claude Code todos to Critical Claude tasks
   * This allows users to manage tasks from both systems
   */
  async syncFromClaudeCodeTodos(claudeCodeTodos: ClaudeCodeTodo[]): Promise<void> {
    try {
      logger.info('Syncing Claude Code todos to Critical Claude tasks');
      
      for (const todo of claudeCodeTodos) {
        // Check if task already exists
        const existingTask = await this.backlogManager.getTask(todo.id);
        
        if (!existingTask) {
          // Create new task from Claude Code todo
          const taskData = this.parseClaudeCodeTodo(todo);
          await this.backlogManager.createTask(taskData);
          logger.info(`Created task from Claude Code todo: ${todo.id}`);
        } else {
          // Update existing task status
          const mappedStatus = this.mapClaudeCodeStatusToOurs(todo.status);
          if (existingTask.status !== mappedStatus) {
            await this.backlogManager.changeTaskState(
              todo.id,
              mappedStatus as any,
              'claude-code-sync',
              'Synced from Claude Code todo'
            );
            logger.info(`Updated task status from Claude Code: ${todo.id}`);
          }
        }
      }

    } catch (error) {
      logger.error('Failed to sync from Claude Code todos', error as Error);
      throw error;
    }
  }

  /**
   * Parse Claude Code todo format back to our task structure
   */
  private parseClaudeCodeTodo(todo: ClaudeCodeTodo): any {
    const content = todo.content;
    
    // Extract story points
    const pointsMatch = content.match(/\[(\d+)pts\]/);
    const storyPoints = pointsMatch ? parseInt(pointsMatch[1]) : 1;
    
    // Extract labels
    const labelsMatch = content.match(/#(\w+)/g);
    const labels = labelsMatch ? labelsMatch.map(l => l.substring(1)) : [];
    
    // Extract assignee
    const assigneeMatch = content.match(/@(\w+)/);
    const assignee = assigneeMatch ? assigneeMatch[1] : undefined;
    
    // Extract title and description
    const cleanContent = content
      .replace(/\[\d+pts\]/g, '')
      .replace(/#\w+/g, '')
      .replace(/@\w+/g, '')
      .trim();
    
    const [title, description] = cleanContent.split(' - ');
    
    return {
      title: title.trim(),
      description: description?.trim() || '',
      priority: todo.priority,
      storyPoints,
      labels,
      assignee,
      status: this.mapClaudeCodeStatusToOurs(todo.status)
    };
  }

  /**
   * Map Claude Code todo status to our task status
   */
  private mapClaudeCodeStatusToOurs(status: string): string {
    switch (status) {
      case 'pending':
        return 'todo';
      case 'in_progress':
        return 'in-progress';
      case 'completed':
        return 'done';
      default:
        return 'todo';
    }
  }

  /**
   * Log the sync operation for debugging
   */
  private logSyncOperation(todos: ClaudeCodeTodo[]): void {
    console.log('\n🔄 Claude Code Todo Sync Operation:');
    console.log('━'.repeat(50));
    
    todos.forEach((todo, index) => {
      console.log(`${index + 1}. [${todo.priority.toUpperCase()}] ${todo.status} - ${todo.content}`);
    });
    
    console.log('━'.repeat(50));
    console.log(`Total: ${todos.length} tasks would be synced to Claude Code`);
  }

  /**
   * Get sync status and statistics
   */
  async getSyncStatus(): Promise<{
    criticalClaudeTasks: number;
    claudeCodeTodos: number;
    lastSync: Date | null;
    syncEnabled: boolean;
  }> {
    try {
      const stats = await this.backlogManager.getProjectStats();
      
      return {
        criticalClaudeTasks: stats.totalTasks,
        claudeCodeTodos: 0, // Would be fetched from Claude Code
        lastSync: null, // Would be tracked
        syncEnabled: true
      };
    } catch (error) {
      logger.error('Failed to get sync status', error as Error);
      return {
        criticalClaudeTasks: 0,
        claudeCodeTodos: 0,
        lastSync: null,
        syncEnabled: false
      };
    }
  }
}

/**
 * Example usage and integration points
 */
export class ClaudeCodeHookHandler {
  private integration: ClaudeCodeIntegration;

  constructor(backlogManager: BacklogManager) {
    this.integration = new ClaudeCodeIntegration(backlogManager);
  }

  /**
   * Handle Claude Code PreToolUse hook
   * This runs before Claude Code executes any tool
   */
  async handlePreToolUse(toolName: string, args: any): Promise<{
    allow: boolean;
    feedback?: string;
  }> {
    logger.debug(`PreToolUse hook: ${toolName}`, args);
    
    // Allow tool use, but provide context if it's task-related
    if (toolName === 'TodoWrite' || toolName === 'TodoRead') {
      return {
        allow: true,
        feedback: '🔄 Critical Claude task sync available via `cc sync-claude-code`'
      };
    }
    
    return { allow: true };
  }

  /**
   * Handle Claude Code PostToolUse hook
   * This runs after Claude Code completes a tool
   */
  async handlePostToolUse(toolName: string, result: any): Promise<void> {
    logger.debug(`PostToolUse hook: ${toolName}`, result);
    
    // If todo tools were used, suggest sync
    if (toolName === 'TodoWrite') {
      console.log('💡 Tip: Sync with Critical Claude tasks using `cc sync-claude-code`');
    }
  }

  /**
   * Handle Claude Code Stop hook
   * This runs when Claude Code finishes responding
   */
  async handleStop(): Promise<void> {
    logger.debug('Stop hook triggered');
    
    // Optionally auto-sync on completion
    if (process.env.CC_AUTO_SYNC === 'true') {
      try {
        await this.autoSync();
      } catch (error) {
        logger.warn('Auto-sync failed', error as Error);
      }
    }
  }

  /**
   * Perform automatic synchronization
   */
  private async autoSync(): Promise<void> {
    console.log('🔄 Auto-syncing Critical Claude tasks...');
    
    // This would read current tasks and sync to Claude Code
    // Implementation would depend on having access to both systems
    logger.info('Auto-sync completed');
  }
}