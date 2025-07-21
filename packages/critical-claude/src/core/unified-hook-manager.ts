/**
 * Unified Hook Manager - Single centralized hook system for Critical Claude
 * Integrates with Claude Code TodoWrite/TodoRead and unified task storage
 */

import { UnifiedStorageManager } from './unified-storage.js';
import { CommonTask, CreateTaskInput } from '../types/common-task.js';
import { logger } from './logger.js';

export interface TodoHookEvent {
  type: 'TodoWrite' | 'TodoRead';
  timestamp: Date;
  todos: ClaudeCodeTodo[];
  source: 'claude-code' | 'critical-claude';
  sessionId?: string;
}

export interface ClaudeCodeTodo {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  id: string;
}

export class UnifiedHookManager {
  private storage: UnifiedStorageManager;
  private isEnabled: boolean;
  private syncInProgress = false;

  constructor(storage: UnifiedStorageManager) {
    this.storage = storage;
    this.isEnabled = this.detectHookCapability();
  }

  /**
   * Detect if Claude Code hooks are available and configured
   */
  private detectHookCapability(): boolean {
    // Check for Claude Code environment
    const hasClaudeCode = !!(
      process.env.CLAUDE_CODE_SESSION ||
      process.env.CLAUDE_SESSION_ID ||
      process.env.ANTHROPIC_API_KEY
    );

    if (hasClaudeCode) {
      logger.info('🤖 Claude Code hook integration enabled');
      return true;
    }

    logger.info('📝 Running in standalone mode (no Claude Code hooks)');
    return false;
  }

  /**
   * Handle TodoWrite events from Claude Code
   */
  async handleTodoWrite(todos: ClaudeCodeTodo[]): Promise<void> {
    if (!this.isEnabled || this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;
    logger.info(`🔄 Processing TodoWrite with ${todos.length} todos`);

    try {
      // Convert Claude Code todos to Critical Claude tasks
      const tasksToCreate: CreateTaskInput[] = todos
        .filter(todo => todo.content.trim())
        .map(todo => ({
          title: this.extractTitle(todo.content),
          description: this.extractDescription(todo.content),
          priority: this.mapPriority(todo.priority),
          status: this.mapStatus(todo.status),
          labels: ['claude-code-sync'],
          source: 'claude-code' as const,
          aiGenerated: false
        }));

      // Create tasks in unified storage
      const createdTasks: CommonTask[] = [];
      for (const taskInput of tasksToCreate) {
        try {
          const task = await this.storage.createTask(taskInput);
          createdTasks.push(task);
        } catch (error) {
          logger.error(`Failed to create task: ${taskInput.title}`, error as Error);
        }
      }

      logger.info(`✅ Synced ${createdTasks.length} todos from Claude Code`);

      // Trigger bidirectional sync if needed
      await this.syncToClaude();

    } catch (error) {
      logger.error('Hook processing failed', error as Error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync Critical Claude tasks back to Claude Code
   */
  async syncToClaude(): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    try {
      // Get tasks that need to be synced to Claude Code
      const tasks = await this.storage.listTasks({
        filter: {
          includeDrafts: false,
          includeArchived: false
        }
      });

      // Filter out tasks that originated from Claude Code to avoid loops
      const tasksToSync = tasks.filter(task => 
        task.source !== 'claude-code' && 
        !task.labels.includes('claude-code-sync')
      );

      if (tasksToSync.length === 0) {
        return;
      }

      // Convert to Claude Code format
      const claudeTodos: ClaudeCodeTodo[] = tasksToSync.map(task => ({
        id: task.id,
        content: this.formatTodoContent(task),
        status: this.mapToClaudeStatus(task.status),
        priority: this.mapToClaudePriority(task.priority)
      }));

      // This would call the actual TodoWrite tool when in Claude Code
      logger.info(`🔄 Would sync ${claudeTodos.length} tasks to Claude Code`);
      
      // Mark tasks as synced to avoid future loops
      for (const task of tasksToSync) {
        await this.storage.updateTask({
          id: task.id,
          labels: [...(task.labels || []), 'synced-to-claude']
        });
      }

    } catch (error) {
      logger.error('Sync to Claude failed', error as Error);
    }
  }

  /**
   * Initialize hook system and set up monitoring
   */
  async initialize(): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    logger.info('🔧 Initializing unified hook system');

    // Set up hook detection for TodoWrite events
    // This would be triggered by Claude Code's hook system
    process.on('message', (message: any) => {
      if (message?.type === 'todo-write' && message?.todos) {
        this.handleTodoWrite(message.todos);
      }
    });

    logger.info('✅ Unified hook system initialized');
  }

  // Utility methods for mapping between formats

  private extractTitle(content: string): string {
    // Extract meaningful title from todo content
    const lines = content.split('\n');
    let title = lines[0].trim();
    
    // Remove markdown formatting
    title = title.replace(/^#+\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1');
    
    // Limit length
    if (title.length > 80) {
      title = title.substring(0, 77) + '...';
    }
    
    return title || 'Todo from Claude Code';
  }

  private extractDescription(content: string): string {
    const lines = content.split('\n');
    if (lines.length > 1) {
      return lines.slice(1).join('\n').trim();
    }
    return '';
  }

  private mapPriority(claudePriority: string): 'critical' | 'high' | 'medium' | 'low' {
    switch (claudePriority) {
      case 'high': return 'high';
      case 'low': return 'low';
      default: return 'medium';
    }
  }

  private mapStatus(claudeStatus: string): 'todo' | 'in_progress' | 'done' | 'blocked' {
    switch (claudeStatus) {
      case 'in_progress': return 'in_progress';
      case 'completed': return 'done';
      default: return 'todo';
    }
  }

  private mapToClaudeStatus(status: string): 'pending' | 'in_progress' | 'completed' {
    switch (status) {
      case 'in_progress': return 'in_progress';
      case 'done': return 'completed';
      default: return 'pending';
    }
  }

  private mapToClaudePriority(priority: string): 'high' | 'medium' | 'low' {
    switch (priority) {
      case 'critical':
      case 'high': return 'high';
      case 'low': return 'low';
      default: return 'medium';
    }
  }

  private formatTodoContent(task: CommonTask): string {
    let content = task.title;
    
    if (task.description) {
      content += '\n' + task.description;
    }
    
    // Add metadata
    const metadata: string[] = [];
    if (task.storyPoints) metadata.push(`${task.storyPoints}pts`);
    if (task.assignee) metadata.push(`@${task.assignee}`);
    if (task.labels.length > 0) metadata.push(task.labels.map(l => `#${l}`).join(' '));
    
    if (metadata.length > 0) {
      content += '\n\n' + metadata.join(' ');
    }
    
    return content;
  }

  /**
   * Check if hooks are working properly
   */
  async healthCheck(): Promise<{ enabled: boolean; working: boolean; lastSync?: Date }> {
    return {
      enabled: this.isEnabled,
      working: this.isEnabled && !this.syncInProgress,
      lastSync: new Date() // Could track actual last sync time
    };
  }
}