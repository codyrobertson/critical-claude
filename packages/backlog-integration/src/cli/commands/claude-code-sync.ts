/**
 * Claude Code Sync Command - Real bidirectional sync between Critical Claude and Claude Code
 */

import chalk from 'chalk';
import { BacklogManager } from '../backlog-manager.js';
import { ClaudeCodeIntegration } from '../../integrations/claude-code-integration.js';
import { RealClaudeCodeIntegration, ClaudeCodeTodo } from '../../integrations/claude-code-real-integration.js';
import { HookAwareTaskManager, HookEvent } from '../../integrations/hook-aware-task-manager.js';
import { ConflictResolver } from '../../integrations/conflict-resolver.js';
import { CommandHandler } from '../command-registry.js';

const logger = {
  info: (msg: string, data?: any) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg: string, error?: Error) => console.error(`[ERROR] ${msg}`, error?.message || ''),
  warn: (msg: string, data?: any) => console.warn(`[WARN] ${msg}`, data || '')
};

export class ClaudeCodeSyncCommand implements CommandHandler {
  private backlogManager: BacklogManager;
  private integration: ClaudeCodeIntegration;
  private realIntegration: RealClaudeCodeIntegration;
  private hookAwareManager: HookAwareTaskManager;
  private conflictResolver: ConflictResolver;
  
  constructor() {
    this.backlogManager = new BacklogManager();
    this.integration = new ClaudeCodeIntegration(this.backlogManager);
    this.realIntegration = new RealClaudeCodeIntegration();
    this.hookAwareManager = new HookAwareTaskManager();
    this.conflictResolver = new ConflictResolver({
      defaultStrategy: 'last_write_wins',
      autoResolveTypes: ['status_mismatch', 'priority_mismatch', 'missing_in_source', 'missing_in_target'],
      manualReviewRequired: ['content_mismatch']
    });
  }
  
  async execute(action: string, input: any, options: any): Promise<void> {
    await this.backlogManager.initialize();
    await this.realIntegration.initialize();
    await this.hookAwareManager.initialize();
    
    const direction = options.direction || 'both';
    const executeSync = options.execute || false;
    const testMode = options.test || false;
    
    if (testMode) {
      await this.testIntegrationMethods();
      return;
    }
    
    if (!executeSync) {
      console.log(chalk.yellow('🔍 Preview mode - use --execute to perform actual sync'));
    }
    
    console.log(chalk.cyan('\n🔄 Critical Claude ↔ Claude Code Sync'));
    console.log(chalk.gray('═════════════════════════════════════════'));
    
    try {
      // Process any pending hook events first
      await this.processHookEvents();
      
      switch (direction) {
        case 'to-claude-code':
          await this.syncToClaudeCode(executeSync);
          break;
        case 'from-claude-code':
          await this.syncFromClaudeCode(executeSync);
          break;
        case 'both':
        default:
          await this.performBidirectionalSync(executeSync);
          break;
      }
      
      console.log(chalk.green('\n✅ Sync completed successfully!'));
      
    } catch (error) {
      console.log(chalk.red(`\n❌ Sync failed: ${(error as Error).message}`));
      logger.error('Sync operation failed', error as Error);
    }
  }
  
  private async syncToClaudeCode(execute: boolean): Promise<void> {
    console.log(chalk.blue('\n📤 Syncing Critical Claude tasks to Claude Code todos...'));
    
    const tasks = await this.backlogManager.listTasks();
    const activeTasks = tasks.filter(task => 
      !['done', 'archived_done', 'archived_blocked', 'archived_dimmed'].includes(task.status)
    );
    
    if (activeTasks.length === 0) {
      console.log(chalk.gray('   No active tasks to sync'));
      return;
    }
    
    console.log(chalk.gray(`   Found ${activeTasks.length} active tasks to sync`));
    
    if (execute) {
      // Real TodoWrite integration
      const claudeCodeTodos = activeTasks.map(task => ({
        content: task.title,
        status: this.mapTaskStatusToTodoStatus(task.status),
        priority: task.priority,
        id: task.id
      }));
      
      await this.executeClaudeCodeTodoWrite(claudeCodeTodos);
      console.log(chalk.green(`   ✅ Synced ${activeTasks.length} tasks to Claude Code`));
    } else {
      // Preview what would be synced
      activeTasks.forEach(task => {
        const statusEmoji = this.getStatusEmoji(task.status);
        const priorityColor = this.getPriorityColor(task.priority);
        console.log(`   ${statusEmoji} ${priorityColor(task.priority.toUpperCase())} ${task.title}`);
      });
    }
  }
  
  private async syncFromClaudeCode(execute: boolean): Promise<void> {
    console.log(chalk.blue('\n📥 Syncing Claude Code todos to Critical Claude tasks...'));
    
    if (execute) {
      // Read from Claude Code (would need actual TodoRead integration)
      const claudeCodeTodos = await this.executeClaudeCodeTodoRead();
      
      if (claudeCodeTodos.length === 0) {
        console.log(chalk.gray('   No Claude Code todos found'));
        return;
      }
      
      let syncedCount = 0;
      for (const todo of claudeCodeTodos) {
        try {
          // Check if task already exists
          const existingTask = await this.backlogManager.getTask(todo.id);
          
          if (existingTask) {
            // Update existing task
            await this.backlogManager.updateTask(todo.id, {
              title: todo.content,
              status: this.mapTodoStatusToTaskStatus(todo.status),
              priority: todo.priority || 'medium'
            });
          } else {
            // Create new task
            await this.backlogManager.createTask({
              id: todo.id,
              title: todo.content,
              status: this.mapTodoStatusToTaskStatus(todo.status),
              priority: todo.priority || 'medium',
              generatedBy: 'hook'
            });
          }
          syncedCount++;
        } catch (error) {
          logger.warn(`Failed to sync todo: ${todo.content}`, error);
        }
      }
      
      console.log(chalk.green(`   ✅ Synced ${syncedCount} todos from Claude Code`));
    } else {
      console.log(chalk.gray('   Would sync todos from Claude Code (preview mode)'));
    }
  }
  
  private async performBidirectionalSync(execute: boolean): Promise<void> {
    console.log(chalk.blue('\n🔄 Performing bidirectional sync...'));
    
    // First sync from Claude Code to get latest todos
    await this.syncFromClaudeCode(execute);
    
    // Then sync our tasks to Claude Code
    await this.syncToClaudeCode(execute);
    
    // Handle conflicts if any exist
    if (execute) {
      await this.resolveConflicts();
    }
  }
  
  private async executeClaudeCodeTodoWrite(todos: any[]): Promise<void> {
    // Real integration with Claude Code's TodoWrite
    logger.info('Executing REAL TodoWrite with todos', { count: todos.length });
    
    const claudeCodeTodos: ClaudeCodeTodo[] = todos.map(todo => ({
      content: todo.content,
      status: todo.status,
      priority: todo.priority,
      id: todo.id
    }));
    
    const success = await this.realIntegration.executeRealTodoWrite(claudeCodeTodos);
    
    if (success) {
      console.log(chalk.green(`   ✅ Successfully executed TodoWrite for ${todos.length} todos`));
    } else {
      console.log(chalk.yellow(`   ⚠️ TodoWrite execution partially successful (check logs)`));
    }
    
    // Log the operation for debugging
    logger.info('Real TodoWrite operation completed', { 
      success,
      todos: todos.map(t => ({ id: t.id, content: t.content, status: t.status }))
    });
  }
  
  private async executeClaudeCodeTodoRead(): Promise<any[]> {
    // Real integration with Claude Code's TodoRead
    logger.info('Executing REAL TodoRead to get current todos');
    
    const claudeCodeTodos = await this.realIntegration.executeRealTodoRead();
    
    logger.info('Real TodoRead operation completed', { count: claudeCodeTodos.length });
    
    if (claudeCodeTodos.length > 0) {
      console.log(chalk.green(`   ✅ Successfully read ${claudeCodeTodos.length} todos from Claude Code`));
    } else {
      console.log(chalk.gray('   📭 No todos found in Claude Code'));
    }
    
    return claudeCodeTodos;
  }
  
  private async resolveConflicts(): Promise<void> {
    logger.info('Checking for sync conflicts...');
    
    try {
      // Get current state from both systems
      const criticalClaudeTasks = await this.backlogManager.listTasks();
      const claudeCodeTodos = await this.realIntegration.executeRealTodoRead();
      
      // Detect conflicts
      const conflicts = this.conflictResolver.detectConflicts(criticalClaudeTasks, claudeCodeTodos);
      
      if (conflicts.length === 0) {
        console.log(chalk.gray('   No conflicts detected'));
        return;
      }
      
      console.log(chalk.yellow(`\n⚠️  Found ${conflicts.length} conflict(s) to resolve`));
      
      // Resolve conflicts automatically
      const resolutions = await this.conflictResolver.resolveConflicts(conflicts);
      
      // Apply resolutions
      let appliedCount = 0;
      for (const conflict of conflicts) {
        if (conflict.resolved && conflict.resolution) {
          await this.applyConflictResolution(conflict);
          appliedCount++;
        }
      }
      
      console.log(chalk.green(`   ✅ Auto-resolved ${appliedCount}/${conflicts.length} conflicts`));
      
      // Report any remaining unresolved conflicts
      const unresolved = this.conflictResolver.getUnresolvedConflicts();
      if (unresolved.length > 0) {
        console.log(chalk.yellow(`   📋 ${unresolved.length} conflict(s) require manual review`));
        unresolved.forEach(conflict => {
          console.log(chalk.gray(`      • ${conflict.description}`));
        });
      }
      
      // Show conflict statistics
      const stats = this.conflictResolver.getConflictStats();
      logger.info('Conflict resolution completed', stats);
      
    } catch (error) {
      logger.error('Conflict resolution failed', error as Error);
      console.log(chalk.red('   ❌ Failed to resolve conflicts'));
    }
  }
  
  /**
   * Apply a conflict resolution to the actual systems
   */
  private async applyConflictResolution(conflict: any): Promise<void> {
    try {
      const resolution = conflict.resolution;
      
      switch (resolution.strategy) {
        case 'critical_claude_wins':
          // Update Claude Code with Critical Claude data
          if (conflict.type === 'missing_in_target') {
            // Create new todo in Claude Code
            const taskData = conflict.criticalClaudeData;
            const newTodo: ClaudeCodeTodo = {
              content: taskData.title,
              status: this.mapTaskStatusToTodoStatus(taskData.status) as 'pending' | 'in_progress' | 'completed',
              priority: taskData.priority as 'low' | 'medium' | 'high' | 'critical',
              id: taskData.id
            };
            await this.realIntegration.executeRealTodoWrite([newTodo]);
          }
          break;
          
        case 'claude_code_wins':
          // Update Critical Claude with Claude Code data
          if (conflict.type === 'missing_in_source') {
            // Create new task in Critical Claude
            const todoData = conflict.claudeCodeData;
            await this.backlogManager.createTask({
              id: todoData.id,
              title: todoData.content,
              status: this.mapTodoStatusToTaskStatus(todoData.status),
              priority: todoData.priority || 'medium',
              generatedBy: 'sync_conflict_resolution'
            });
          }
          break;
          
        case 'last_write_wins':
        case 'priority_wins':
          // Update both systems with resolved data
          if (conflict.type === 'status_mismatch' || conflict.type === 'priority_mismatch') {
            const resolvedData = resolution.resolvedData;
            await this.backlogManager.updateTask(conflict.taskId, resolvedData);
            // Also update Claude Code
            const updatedTodo: ClaudeCodeTodo = {
              content: resolvedData.title || conflict.criticalClaudeData?.title,
              status: (resolvedData.status ? this.mapTaskStatusToTodoStatus(resolvedData.status) : conflict.claudeCodeData?.status) as 'pending' | 'in_progress' | 'completed',
              priority: (resolvedData.priority || conflict.claudeCodeData?.priority) as 'low' | 'medium' | 'high' | 'critical',
              id: conflict.taskId
            };
            await this.realIntegration.executeRealTodoWrite([updatedTodo]);
          }
          break;
      }
      
      logger.info('Conflict resolution applied', {
        conflictId: conflict.id,
        strategy: resolution.strategy
      });
      
    } catch (error) {
      logger.error(`Failed to apply resolution for conflict ${conflict.id}`, error as Error);
    }
  }
  
  private mapTaskStatusToTodoStatus(status: string): string {
    const mapping: Record<string, string> = {
      'todo': 'pending',
      'focused': 'in_progress', 
      'in-progress': 'in_progress',
      'blocked': 'pending',
      'dimmed': 'pending',
      'done': 'completed'
    };
    return mapping[status] || 'pending';
  }
  
  private mapTodoStatusToTaskStatus(status: string): any {
    const mapping: Record<string, string> = {
      'pending': 'todo',
      'in_progress': 'in-progress',
      'completed': 'done'
    };
    return mapping[status] || 'todo';
  }
  
  private getStatusEmoji(status: string): string {
    const emojis: Record<string, string> = {
      'todo': '📝',
      'focused': '🎯',
      'in-progress': '🚀',
      'blocked': '🚫',
      'dimmed': '💤',
      'done': '✅'
    };
    return emojis[status] || '❓';
  }
  
  private getPriorityColor(priority: string): any {
    const colors: Record<string, any> = {
      'critical': chalk.red.bold,
      'high': chalk.red,
      'medium': chalk.yellow,
      'low': chalk.gray
    };
    return colors[priority] || chalk.white;
  }
  
  private async testIntegrationMethods(): Promise<void> {
    console.log(chalk.cyan('\n🧪 Testing Claude Code Integration Methods'));
    console.log(chalk.gray('═══════════════════════════════════════════'));
    
    const results = await this.realIntegration.testIntegration();
    
    console.log(chalk.blue('\n📋 Integration Test Results:'));
    console.log(`   Direct API Integration: ${results.direct ? chalk.green('✅ Available') : chalk.red('❌ Not Available')}`);
    console.log(`   File-Based Integration: ${results.fileBased ? chalk.green('✅ Available') : chalk.red('❌ Not Available')}`);
    console.log(`   Process-Based Integration: ${results.processBased ? chalk.green('✅ Available') : chalk.red('❌ Not Available')}`);
    
    const availableCount = Object.values(results).filter(Boolean).length;
    
    if (availableCount === 0) {
      console.log(chalk.red('\n⚠️ No integration methods available - sync will be limited'));
    } else {
      console.log(chalk.green(`\n✅ ${availableCount} integration method(s) available`));
    }
    
    console.log(chalk.cyan('\n💡 Recommendations:'));
    if (!results.direct) {
      console.log('   • Install Claude Code CLI for direct integration');
    }
    if (!results.fileBased) {
      console.log('   • Check file system permissions for temp directory access');
    }
    if (!results.processBased) {
      console.log('   • Ensure Claude Code is in system PATH');
    }
    
    if (availableCount > 0) {
      console.log('\n🚀 Ready to perform real sync operations!');
    }
  }
  
  /**
   * Process hook events that may have triggered task state changes
   */
  private async processHookEvents(): Promise<void> {
    try {
      // Detect hook events from environment or context
      const hookEvent = this.detectHookEvent();
      
      if (hookEvent) {
        console.log(chalk.blue(`\n🔗 Processing hook event: ${hookEvent.type} (${hookEvent.tool})`));
        
        const transitions = await this.hookAwareManager.processHookEvent(hookEvent);
        
        if (transitions.length > 0) {
          console.log(chalk.green(`   ✅ Applied ${transitions.length} task state transition(s)`));
          transitions.forEach(t => {
            console.log(chalk.gray(`      ${t.taskId}: ${t.fromStatus} → ${t.toStatus}`));
          });
        } else {
          console.log(chalk.gray('   No task transitions needed'));
        }
      }
    } catch (error) {
      logger.warn('Hook event processing failed', error);
    }
  }
  
  /**
   * Detect hook event from environment variables or other context
   */
  private detectHookEvent(): HookEvent | null {
    // Check environment variables that hooks might set
    const hookType = process.env.CC_HOOK_EVENT;
    const hookTool = process.env.CC_HOOK_TOOL;
    const hookFile = process.env.CC_HOOK_FILE;
    
    if (hookType) {
      return {
        type: hookType as 'PostToolUse' | 'Stop',
        tool: hookTool,
        file: hookFile,
        timestamp: new Date()
      };
    }
    
    // If no explicit hook context, infer from sync being called
    // (This happens when hooks trigger the sync)
    return {
      type: 'PostToolUse',
      tool: 'TodoWrite', // Assume TodoWrite triggered this sync
      timestamp: new Date()
    };
  }
}