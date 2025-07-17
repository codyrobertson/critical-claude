/**
 * CLI Interface for Markdown Task Management
 * Provides Backlog.md-style commands for Critical Claude
 */

import { MarkdownTaskManager, MarkdownTask } from './markdown-task-manager.js';
import { logger } from '../logger.js';

export interface TaskCLIResult {
  success: boolean;
  message: string;
  data?: any;
  output?: string;
}

export class TaskCLI {
  private taskManager: MarkdownTaskManager;

  constructor(taskManager: MarkdownTaskManager) {
    this.taskManager = taskManager;
  }

  async executeCommand(command: string, args: Record<string, any> = {}): Promise<TaskCLIResult> {
    try {
      switch (command) {
        case 'init':
          return await this.initProject(args);
          
        case 'task.create':
          return await this.createTask(args);
          
        case 'task.list':
          return await this.listTasks(args);
          
        case 'task.view':
          return await this.viewTask(args);
          
        case 'task.edit':
          return await this.editTask(args);
          
        case 'task.archive':
          return await this.archiveTask(args);
          
        case 'board.view':
          return await this.viewBoard(args);
          
        case 'board.export':
          return await this.exportBoard(args);
          
        default:
          return {
            success: false,
            message: `Unknown command: ${command}`
          };
      }
    } catch (error) {
      logger.error('CLI command failed', { command, error: (error as Error).message });
      return {
        success: false,
        message: `Command failed: ${(error as Error).message}`
      };
    }
  }

  private async initProject(args: any): Promise<TaskCLIResult> {
    await this.taskManager.initialize();
    
    return {
      success: true,
      message: 'Critical Claude task system initialized successfully!',
      output: `
🚀 Critical Claude Task System Initialized

✅ Created directory structure:
   • critical-claude/tasks/     - Active tasks
   • critical-claude/completed/ - Archived tasks  
   • critical-claude/drafts/    - Draft tasks
   • critical-claude/config.yml - Configuration

📋 Available commands:
   • critical-claude task create "Add feature"
   • critical-claude task list
   • critical-claude board view
   
🎯 Start creating tasks with:
   critical-claude task create "Your first task"
      `
    };
  }

  private async createTask(args: any): Promise<TaskCLIResult> {
    const {
      title,
      description,
      status,
      priority,
      assignee,
      labels,
      parent,
      dependencies,
      plan,
      acceptanceCriteria,
      notes,
      draft
    } = args;

    if (!title) {
      return {
        success: false,
        message: 'Task title is required'
      };
    }

    const task = await this.taskManager.createTask({
      title,
      description,
      status,
      priority,
      assignee,
      labels: typeof labels === 'string' ? labels.split(',').map(l => l.trim()) : labels,
      parent,
      dependencies: typeof dependencies === 'string' ? dependencies.split(',').map(d => d.trim()) : dependencies,
      plan,
      acceptanceCriteria: typeof acceptanceCriteria === 'string' ? acceptanceCriteria.split(',').map(ac => ac.trim()) : acceptanceCriteria,
      notes,
      isDraft: draft
    });

    const taskType = draft ? 'Draft' : 'Task';
    
    return {
      success: true,
      message: `${taskType} created successfully!`,
      data: task,
      output: `
✅ ${taskType} Created: task-${task.id}

📋 **${task.title}**
   Status: ${task.status}
   ${task.priority ? `Priority: ${task.priority}` : ''}
   ${task.assignee ? `Assignee: ${task.assignee}` : ''}
   ${task.labels.length > 0 ? `Labels: ${task.labels.join(', ')}` : ''}
   
📄 File: ${task.filePath}

🎯 Next steps:
   • View: critical-claude task view ${task.id}
   • Edit: critical-claude task edit ${task.id}
   • Board: critical-claude board view
      `
    };
  }

  private async listTasks(args: any): Promise<TaskCLIResult> {
    const {
      status,
      assignee,
      parent,
      labels,
      includeDrafts,
      plain = false
    } = args;

    const filters = {
      status,
      assignee,
      parent,
      labels: typeof labels === 'string' ? labels.split(',').map(l => l.trim()) : labels,
      includeDrafts
    };

    const tasks = await this.taskManager.listTasks(filters);

    if (plain) {
      // AI-friendly plain format
      const taskLines = tasks.map(task => {
        const priorityIcon = this.getPriorityIcon(task.priority);
        const statusIcon = this.getStatusIcon(task.status);
        const assigneeText = task.assignee ? ` (${task.assignee})` : '';
        const labelsText = task.labels.length > 0 ? ` [${task.labels.join(', ')}]` : '';
        
        return `${priorityIcon} ${statusIcon} task-${task.id} - ${task.title}${assigneeText}${labelsText}`;
      });

      return {
        success: true,
        message: `Found ${tasks.length} tasks`,
        data: tasks,
        output: taskLines.join('\n')
      };
    }

    // Rich format for human viewing
    let output = `📋 Critical Claude Tasks (${tasks.length} found)\n`;
    output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    if (tasks.length === 0) {
      output += 'No tasks found.\n\n';
      output += '🎯 Create your first task with:\n';
      output += '   critical-claude task create "Your task title"';
    } else {
      // Group by status
      const tasksByStatus: Record<string, MarkdownTask[]> = {};
      for (const task of tasks) {
        if (!tasksByStatus[task.status]) {
          tasksByStatus[task.status] = [];
        }
        tasksByStatus[task.status].push(task);
      }

      for (const [status, statusTasks] of Object.entries(tasksByStatus)) {
        if (statusTasks.length === 0) continue;
        
        output += `## ${status} (${statusTasks.length})\n\n`;
        
        for (const task of statusTasks) {
          const priorityIcon = this.getPriorityIcon(task.priority);
          const assigneeText = task.assignee ? ` 👤 ${task.assignee}` : '';
          const labelsText = task.labels.length > 0 ? ` 🏷️  ${task.labels.join(', ')}` : '';
          
          output += `${priorityIcon} **task-${task.id}** - ${task.title}${assigneeText}${labelsText}\n`;
          if (task.description) {
            output += `   ${task.description.substring(0, 100)}${task.description.length > 100 ? '...' : ''}\n`;
          }
          output += '\n';
        }
      }
    }

    return {
      success: true,
      message: `Found ${tasks.length} tasks`,
      data: tasks,
      output
    };
  }

  private async viewTask(args: any): Promise<TaskCLIResult> {
    const { id, plain = false } = args;

    if (!id) {
      return {
        success: false,
        message: 'Task ID is required'
      };
    }

    const task = await this.taskManager.getTask(id);
    if (!task) {
      return {
        success: false,
        message: `Task ${id} not found`
      };
    }

    if (plain) {
      // AI-friendly format
      let output = `Task: task-${task.id} - ${task.title}\n`;
      output += `Status: ${task.status}\n`;
      if (task.priority) output += `Priority: ${task.priority}\n`;
      if (task.assignee) output += `Assignee: ${task.assignee}\n`;
      if (task.labels.length > 0) output += `Labels: ${task.labels.join(', ')}\n`;
      if (task.description) output += `Description: ${task.description}\n`;
      if (task.plan) output += `Plan: ${task.plan}\n`;
      if (task.notes) output += `Notes: ${task.notes}\n`;

      return {
        success: true,
        message: 'Task retrieved',
        data: task,
        output
      };
    }

    // Rich format
    const priorityIcon = this.getPriorityIcon(task.priority);
    const statusIcon = this.getStatusIcon(task.status);
    
    let output = `${priorityIcon} ${statusIcon} **task-${task.id}** - ${task.title}\n`;
    output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    
    // Metadata
    output += '📊 **Metadata**\n';
    output += `   Status: ${task.status}\n`;
    if (task.priority) output += `   Priority: ${task.priority}\n`;
    if (task.assignee) output += `   Assignee: ${task.assignee}\n`;
    if (task.labels.length > 0) output += `   Labels: ${task.labels.join(', ')}\n`;
    if (task.parent) output += `   Parent: task-${task.parent}\n`;
    if (task.dependencies.length > 0) output += `   Dependencies: ${task.dependencies.map(d => `task-${d}`).join(', ')}\n`;
    output += `   Created: ${new Date(task.createdAt).toLocaleString()}\n`;
    output += `   Updated: ${new Date(task.updatedAt).toLocaleString()}\n`;
    if (task.dueDate) output += `   Due: ${task.dueDate}\n`;
    output += '\n';

    // Description
    if (task.description) {
      output += '📝 **Description**\n';
      output += `${task.description}\n\n`;
    }

    // Plan
    if (task.plan) {
      output += '📋 **Plan**\n';
      output += `${task.plan}\n\n`;
    }

    // Acceptance Criteria
    if (task.acceptanceCriteria.length > 0) {
      output += '✅ **Acceptance Criteria**\n';
      for (const criterion of task.acceptanceCriteria) {
        output += `   • ${criterion}\n`;
      }
      output += '\n';
    }

    // Notes
    if (task.notes) {
      output += '📔 **Notes**\n';
      output += `${task.notes}\n\n`;
    }

    // File path
    output += `📄 **File**: ${task.filePath}\n`;

    return {
      success: true,
      message: 'Task retrieved',
      data: task,
      output
    };
  }

  private async editTask(args: any): Promise<TaskCLIResult> {
    const { id, ...updates } = args;

    if (!id) {
      return {
        success: false,
        message: 'Task ID is required'
      };
    }

    // Process arrays from strings
    if (updates.labels && typeof updates.labels === 'string') {
      updates.labels = updates.labels.split(',').map((l: string) => l.trim());
    }
    if (updates.dependencies && typeof updates.dependencies === 'string') {
      updates.dependencies = updates.dependencies.split(',').map((d: string) => d.trim());
    }
    if (updates.acceptanceCriteria && typeof updates.acceptanceCriteria === 'string') {
      updates.acceptanceCriteria = updates.acceptanceCriteria.split(',').map((ac: string) => ac.trim());
    }

    const task = await this.taskManager.updateTask(id, updates);
    if (!task) {
      return {
        success: false,
        message: `Task ${id} not found`
      };
    }

    const changedFields = Object.keys(updates).join(', ');

    return {
      success: true,
      message: `Task ${id} updated successfully!`,
      data: task,
      output: `
✅ Task Updated: task-${task.id}

📋 **${task.title}**
   Status: ${task.status}
   ${task.priority ? `Priority: ${task.priority}` : ''}
   ${task.assignee ? `Assignee: ${task.assignee}` : ''}
   
🔄 Fields changed: ${changedFields}
📄 File: ${task.filePath}
      `
    };
  }

  private async archiveTask(args: any): Promise<TaskCLIResult> {
    const { id } = args;

    if (!id) {
      return {
        success: false,
        message: 'Task ID is required'
      };
    }

    const task = await this.taskManager.getTask(id);
    if (!task) {
      return {
        success: false,
        message: `Task ${id} not found`
      };
    }

    const success = await this.taskManager.archiveTask(id);
    if (!success) {
      return {
        success: false,
        message: `Failed to archive task ${id}`
      };
    }

    return {
      success: true,
      message: `Task ${id} archived successfully!`,
      output: `
🗄️  Task Archived: task-${task.id}

📋 **${task.title}** has been moved to the completed folder.

💡 Archived tasks can still be viewed but won't appear in active lists.
      `
    };
  }

  private async viewBoard(args: any): Promise<TaskCLIResult> {
    const board = await this.taskManager.generateKanbanBoard();

    return {
      success: true,
      message: 'Kanban board generated',
      output: board
    };
  }

  private async exportBoard(args: any): Promise<TaskCLIResult> {
    const { outputPath = 'critical-claude-board.md', force = false } = args;
    const board = await this.taskManager.generateKanbanBoard();

    // Check if file exists and force flag
    try {
      await import('fs').then(fs => fs.promises.access(outputPath));
      if (!force) {
        return {
          success: false,
          message: `File ${outputPath} already exists. Use --force to overwrite.`
        };
      }
    } catch {
      // File doesn't exist, proceed
    }

    await import('fs').then(fs => fs.promises.writeFile(outputPath, board));

    return {
      success: true,
      message: `Board exported to ${outputPath}`,
      output: `
📊 Kanban board exported successfully!

📄 File: ${outputPath}
📏 Size: ${board.length} characters

💡 Share this file with your team or include it in documentation.
      `
    };
  }

  private getPriorityIcon(priority?: string): string {
    switch (priority) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'To Do': return '📋';
      case 'In Progress': return '⚡';
      case 'Done': return '✅';
      case 'Blocked': return '🚫';
      default: return '📄';
    }
  }
}