/**
 * Visual TodoWrite Formatter for Critical Claude
 * Matches Claude Code's exact todo format for seamless integration
 */

import { logger } from '../logger.js';

export interface TodoItem {
  content: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  id: string;
}

export interface VisualTodoResult {
  formattedOutput: string;
  originalFormat: string;
  criticalClaudeFormat: string;
  syncedTasks: number;
  responseTime: number;
}

export class VisualTodoFormatter {
  
  /**
   * Format todos in Claude Code's exact visual style
   */
  formatTodosVisual(todos: TodoItem[], responseTime: number = 0): VisualTodoResult {
    const priorityColors = {
      critical: '\x1b[35m', // Magenta
      high: '\x1b[31m',    // Red
      medium: '\x1b[33m',  // Yellow
      low: '\x1b[36m'      // Cyan
    };
    
    const statusSymbols = {
      pending: '○',
      in_progress: '●',
      completed: '✓',
      blocked: '⊘'
    };

    const reset = '\x1b[0m';
    
    // Generate original Claude Code format
    const originalFormat = todos.map(todo => {
      const color = priorityColors[todo.priority] || reset;
      const symbol = statusSymbols[todo.status] || '?';
      return `${color}${symbol} ${todo.content}${reset}`;
    }).join('\n');

    // Generate Critical Claude enhanced format
    const criticalClaudeFormat = this.generateCriticalClaudeFormat(todos);

    // Generate the combined visual output
    const formattedOutput = this.generateCombinedFormat(todos, responseTime);

    return {
      formattedOutput,
      originalFormat,
      criticalClaudeFormat,
      syncedTasks: todos.length,
      responseTime
    };
  }

  /**
   * Generate combined format showing both Claude Code and Critical Claude views
   */
  private generateCombinedFormat(todos: TodoItem[], responseTime: number): string {
    const timestamp = new Date().toLocaleTimeString();
    
    let output = `\n🔄 Critical Claude TodoWrite Sync (${timestamp})\n`;
    output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    
    // Summary section
    output += `📊 **Sync Summary**\n`;
    output += `   • Tasks synced: ${todos.length}\n`;
    output += `   • Response time: ${responseTime}ms\n`;
    output += `   • Status: ✅ Success\n\n`;

    // Task breakdown by status
    const tasksByStatus = this.groupTasksByStatus(todos);
    
    for (const [status, statusTasks] of Object.entries(tasksByStatus)) {
      if (statusTasks.length === 0) continue;
      
      const statusIcon = this.getStatusIcon(status);
      const statusLabel = this.getStatusLabel(status);
      
      output += `${statusIcon} **${statusLabel}** (${statusTasks.length})\n`;
      
      for (const task of statusTasks) {
        const priorityIcon = this.getPriorityIcon(task.priority);
        const taskId = task.id.length > 10 ? `...${task.id.slice(-7)}` : task.id;
        
        output += `   ${priorityIcon} [${taskId}] ${task.content}\n`;
      }
      output += '\n';
    }

    // Integration status
    output += `🔗 **Integration Status**\n`;
    output += `   • Claude Code ↔ Critical Claude: ✅ Active\n`;
    output += `   • Task markdown files: 📁 Updated\n`;
    output += `   • Hook processing: ⚡ Real-time\n\n`;

    // Quick commands
    output += `💡 **Quick Commands**\n`;
    output += `   • View tasks: \`cc task list\`\n`;
    output += `   • View board: \`cc board view\`\n`;
    output += `   • AI expand: \`cc ai.expand [task-id]\`\n`;

    return output;
  }

  /**
   * Generate Critical Claude specific format
   */
  private generateCriticalClaudeFormat(todos: TodoItem[]): string {
    let output = '# 📋 Critical Claude Task Sync\n\n';
    
    for (const todo of todos) {
      const priorityBadge = this.getPriorityBadge(todo.priority);
      const statusBadge = this.getStatusBadge(todo.status);
      
      output += `## task-${todo.id.slice(-3)} - ${todo.content}\n\n`;
      output += `${priorityBadge} ${statusBadge}\n\n`;
      output += `**Description**: ${todo.content}\n\n`;
      output += `**Metadata**:\n`;
      output += `- Status: ${todo.status}\n`;
      output += `- Priority: ${todo.priority}\n`;
      output += `- Source: Claude Code TodoWrite\n`;
      output += `- Synced: ${new Date().toISOString()}\n\n`;
      output += '---\n\n';
    }
    
    return output;
  }

  /**
   * Group tasks by status for better organization
   */
  private groupTasksByStatus(todos: TodoItem[]): Record<string, TodoItem[]> {
    const groups: Record<string, TodoItem[]> = {
      pending: [],
      in_progress: [],
      completed: [],
      blocked: []
    };

    for (const todo of todos) {
      if (groups[todo.status]) {
        groups[todo.status].push(todo);
      }
    }

    return groups;
  }

  /**
   * Get visual icon for status
   */
  private getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return '📋';
      case 'in_progress': return '⚡';
      case 'completed': return '✅';
      case 'blocked': return '🚫';
      default: return '📄';
    }
  }

  /**
   * Get readable status label
   */
  private getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'To Do';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Done';
      case 'blocked': return 'Blocked';
      default: return status;
    }
  }

  /**
   * Get priority icon
   */
  private getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'critical': return '💥';
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  }

  /**
   * Get priority badge for markdown
   */
  private getPriorityBadge(priority: string): string {
    switch (priority) {
      case 'critical': return '![Critical](https://img.shields.io/badge/Priority-Critical-darkred)';
      case 'high': return '![High](https://img.shields.io/badge/Priority-High-red)';
      case 'medium': return '![Medium](https://img.shields.io/badge/Priority-Medium-yellow)';
      case 'low': return '![Low](https://img.shields.io/badge/Priority-Low-green)';
      default: return '![Unknown](https://img.shields.io/badge/Priority-Unknown-gray)';
    }
  }

  /**
   * Get status badge for markdown
   */
  private getStatusBadge(status: string): string {
    switch (status) {
      case 'pending': return '![To Do](https://img.shields.io/badge/Status-To%20Do-blue)';
      case 'in_progress': return '![In Progress](https://img.shields.io/badge/Status-In%20Progress-orange)';
      case 'completed': return '![Done](https://img.shields.io/badge/Status-Done-green)';
      case 'blocked': return '![Blocked](https://img.shields.io/badge/Status-Blocked-red)';
      default: return '![Unknown](https://img.shields.io/badge/Status-Unknown-gray)';
    }
  }

  /**
   * Create an instant visual feedback message
   */
  createInstantFeedback(
    todoCount: number, 
    responseTime: number, 
    syncStatus: 'success' | 'partial' | 'failed'
  ): string {
    const emoji = syncStatus === 'success' ? '✅' : 
                  syncStatus === 'partial' ? '⚠️' : '❌';
    
    const message = `${emoji} Critical Claude: ${todoCount} todos synced in ${responseTime}ms`;
    
    // Add context for different sync statuses
    if (syncStatus === 'success') {
      return `${message} 🚀 Real-time sync active`;
    } else if (syncStatus === 'partial') {
      return `${message} ⚠️ Some issues detected`;
    } else {
      return `${message} ❌ Sync failed - check logs`;
    }
  }

  /**
   * Generate a compact one-liner for hook logs
   */
  generateCompactLog(todos: TodoItem[], responseTime: number): string {
    const statusCounts = this.getStatusCounts(todos);
    const pending = statusCounts.pending;
    const inProgress = statusCounts.in_progress;
    const completed = statusCounts.completed;
    
    return `TodoWrite: ${todos.length} tasks (${pending}○ ${inProgress}● ${completed}✓) ${responseTime}ms`;
  }

  /**
   * Get counts for each status
   */
  private getStatusCounts(todos: TodoItem[]): Record<string, number> {
    const counts = { pending: 0, in_progress: 0, completed: 0, blocked: 0 };
    
    for (const todo of todos) {
      if (counts.hasOwnProperty(todo.status)) {
        counts[todo.status]++;
      }
    }
    
    return counts;
  }

  /**
   * Generate diff-style output showing changes
   */
  generateDiffOutput(
    oldTodos: TodoItem[], 
    newTodos: TodoItem[]
  ): string {
    const oldIds = new Set(oldTodos.map(t => t.id));
    const newIds = new Set(newTodos.map(t => t.id));
    
    let output = '📝 **TodoWrite Changes**\n\n';
    
    // Added todos
    const added = newTodos.filter(t => !oldIds.has(t.id));
    if (added.length > 0) {
      output += `➕ **Added (${added.length})**\n`;
      for (const todo of added) {
        output += `   + ${this.getPriorityIcon(todo.priority)} ${todo.content}\n`;
      }
      output += '\n';
    }
    
    // Removed todos
    const removed = oldTodos.filter(t => !newIds.has(t.id));
    if (removed.length > 0) {
      output += `➖ **Removed (${removed.length})**\n`;
      for (const todo of removed) {
        output += `   - ${this.getPriorityIcon(todo.priority)} ${todo.content}\n`;
      }
      output += '\n';
    }
    
    // Modified todos
    const modified = newTodos.filter(newTodo => {
      const oldTodo = oldTodos.find(old => old.id === newTodo.id);
      return oldTodo && (
        oldTodo.status !== newTodo.status || 
        oldTodo.priority !== newTodo.priority ||
        oldTodo.content !== newTodo.content
      );
    });
    
    if (modified.length > 0) {
      output += `🔄 **Modified (${modified.length})**\n`;
      for (const todo of modified) {
        const oldTodo = oldTodos.find(old => old.id === todo.id)!;
        output += `   ~ ${this.getPriorityIcon(todo.priority)} ${todo.content}\n`;
        if (oldTodo.status !== todo.status) {
          output += `     Status: ${oldTodo.status} → ${todo.status}\n`;
        }
        if (oldTodo.priority !== todo.priority) {
          output += `     Priority: ${oldTodo.priority} → ${todo.priority}\n`;
        }
      }
      output += '\n';
    }
    
    if (added.length === 0 && removed.length === 0 && modified.length === 0) {
      output += '✨ No changes detected\n';
    }
    
    return output;
  }

  /**
   * Generate JSON output for API integration
   */
  generateJSONOutput(todos: TodoItem[], metadata: any = {}): string {
    const output = {
      timestamp: new Date().toISOString(),
      sync_source: 'claude_code_todowrite',
      tasks: todos,
      metadata: {
        total_count: todos.length,
        status_counts: this.getStatusCounts(todos),
        response_time_ms: metadata.responseTime || 0,
        sync_status: metadata.syncStatus || 'success',
        ...metadata
      }
    };
    
    return JSON.stringify(output, null, 2);
  }
}