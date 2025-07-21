/**
 * Unified Task Command - Single entry point for all task management
 * Replaces BacklogManager, SimpleTaskManager, and MCP-task-simple commands
 */

import chalk from 'chalk';
import { CommandHandler } from '../command-registry.js';
import { UnifiedStorageManager } from '../../core/unified-storage.js';
import { AITaskManager } from '../../core/ai-task-manager.js';
import { UnifiedHookManager } from '../../core/unified-hook-manager.js';
import { CommonTask, CreateTaskInput, UpdateTaskInput, TaskFilter, TaskListOptions } from '../../types/common-task.js';

export class UnifiedTaskCommand implements CommandHandler {
  private storage: UnifiedStorageManager;
  private aiManager: AITaskManager;
  private hookManager: UnifiedHookManager;
  
  constructor() {
    this.storage = new UnifiedStorageManager({
      migrationEnabled: true,
      backupEnabled: true,
      autoCleanup: false
    });
    this.aiManager = new AITaskManager(this.storage);
    this.hookManager = new UnifiedHookManager(this.storage);
  }
  
  async execute(action: string, input: any, options: any): Promise<void> {
    try {
      await this.storage.initialize();
      await this.hookManager.initialize();
      
      switch (action) {
        case 'create':
        case 'add':
        case 'new':
          await this.createTask(input, options);
          break;
          
        case 'list':
        case 'ls':
        case '':
          await this.listTasks(options);
          break;
          
        case 'view':
        case 'show':
        case 'get':
          await this.viewTask(input, options);
          break;
          
        case 'edit':
        case 'update':
        case 'modify':
          await this.editTask(input, options);
          break;
          
        case 'delete':
        case 'remove':
        case 'rm':
          await this.deleteTask(input, options);
          break;
          
        case 'archive':
          await this.archiveTask(input, options);
          break;
          
        case 'ai':
        case 'ai-create':
          await this.createAITask(input, options);
          break;
          
        case 'expand':
        case 'ai-expand':
          await this.expandTask(input, options);
          break;
          
        case 'estimate':
        case 'ai-estimate':
          await this.estimateTask(input, options);
          break;
          
        case 'dependencies':
        case 'deps':
          await this.analyzeDependencies(options);
          break;
          
        case 'stats':
        case 'status':
          await this.showStats(options);
          break;
          
        case 'init':
          await this.initializeSystem(options);
          break;
          
        case 'backup':
          await this.createBackup(options);
          break;
          
        default:
          console.log(this.getUsageHelp());
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), (error as Error).message);
    }
  }
  
  private async createTask(titleInput: any, options: any): Promise<void> {
    const title = Array.isArray(titleInput) ? titleInput.join(' ') : titleInput || '';
    
    if (!title.trim()) {
      throw new Error('Task title is required');
    }
    
    // Parse natural language if enabled
    const parsedInput = this.parseNaturalLanguage(title, options);
    
    const input: CreateTaskInput = {
      title: parsedInput.title,
      description: options.description || parsedInput.description,
      priority: options.priority || parsedInput.priority || 'medium',
      status: options.status || 'todo',
      assignee: options.assignee || parsedInput.assignee,
      labels: options.labels || parsedInput.labels || [],
      storyPoints: options.points || parsedInput.storyPoints,
      estimatedHours: options.hours,
      draft: options.draft || false,
      aiGenerated: options.ai || false,
      source: options.ai ? 'ai' : 'manual'
    };
    
    const task = await this.storage.createTask(input);
    
    // Trigger hook sync to Claude Code
    await this.hookManager.syncToClaude();
    
    console.log(chalk.green(`✅ Created task: ${task.title} (${task.id})`));
    
    if (!options.plain) {
      console.log(this.formatTaskSummary(task));
    }
  }
  
  private async listTasks(options: any): Promise<void> {
    const filter: TaskFilter = {
      status: options.status ? this.normalizeStatus(options.status) : undefined,
      priority: options.priority,
      assignee: options.assignee,
      labels: options.labels,
      sprintId: options.sprint,
      epicId: options.epic,
      phaseId: options.phase,
      includeDrafts: options.includeDrafts || false,
      includeArchived: options.includeArchived || false,
      aiGenerated: options.aiOnly ? true : undefined
    };
    
    const listOptions: TaskListOptions = {
      filter,
      limit: options.limit || options.count || 20,
      sortBy: options.sortBy || 'updatedAt',
      sortOrder: options.sortOrder || 'desc',
      plain: options.plain || false
    };
    
    const tasks = await this.storage.listTasks(listOptions);
    
    if (tasks.length === 0) {
      console.log(this.getEmptyStateMessage());
      return;
    }
    
    if (options.plain) {
      tasks.forEach(task => {
        console.log(`${task.id} ${task.title}`);
      });
    } else {
      console.log(chalk.cyan(`📋 Found ${tasks.length} tasks:\n`));
      
      for (const task of tasks) {
        console.log(this.formatTaskListItem(task));
      }
      
      console.log(chalk.gray(`\nUse "cc task view <id>" to see details`));
    }
  }
  
  private async viewTask(taskIdInput: any, options: any): Promise<void> {
    const taskId = Array.isArray(taskIdInput) ? taskIdInput[0] : taskIdInput;
    
    if (!taskId) {
      throw new Error('Task ID is required');
    }
    
    const task = await this.storage.getTask(taskId);
    
    if (!task) {
      console.log(chalk.red(`❌ Task not found: ${taskId}`));
      return;
    }
    
    if (options.plain) {
      console.log(JSON.stringify(task, null, 2));
    } else {
      console.log(this.formatTaskDetails(task));
    }
  }
  
  private async editTask(taskIdInput: any, options: any): Promise<void> {
    const taskId = Array.isArray(taskIdInput) ? taskIdInput[0] : taskIdInput;
    
    if (!taskId) {
      throw new Error('Task ID is required');
    }
    
    const updateInput: UpdateTaskInput = {
      id: taskId,
      title: options.title,
      description: options.description,
      status: options.status ? this.normalizeStatus(options.status) : undefined,
      priority: options.priority,
      assignee: options.assignee,
      labels: options.labels,
      storyPoints: options.points,
      estimatedHours: options.hours,
      actualHours: options.actualHours
    };
    
    // Remove undefined values
    Object.keys(updateInput).forEach(key => {
      if (updateInput[key as keyof UpdateTaskInput] === undefined) {
        delete updateInput[key as keyof UpdateTaskInput];
      }
    });
    
    const updatedTask = await this.storage.updateTask(updateInput);
    
    if (!updatedTask) {
      console.log(chalk.red(`❌ Task not found: ${taskId}`));
      return;
    }
    
    // Trigger hook sync to Claude Code
    await this.hookManager.syncToClaude();
    
    console.log(chalk.green(`✅ Updated task: ${updatedTask.title} (${taskId})`));
    
    if (!options.plain) {
      console.log(this.formatTaskSummary(updatedTask));
    }
  }
  
  private async deleteTask(taskIdInput: any, options: any): Promise<void> {
    const taskId = Array.isArray(taskIdInput) ? taskIdInput[0] : taskIdInput;
    
    if (!taskId) {
      throw new Error('Task ID is required');
    }
    
    const task = await this.storage.getTask(taskId);
    if (!task) {
      console.log(chalk.red(`❌ Task not found: ${taskId}`));
      return;
    }
    
    const success = await this.storage.deleteTask(taskId);
    
    if (success) {
      console.log(chalk.green(`🗑️  Deleted task: ${task.title} (${taskId})`));
    } else {
      console.log(chalk.red(`❌ Failed to delete task: ${taskId}`));
    }
  }
  
  private async archiveTask(taskIdInput: any, options: any): Promise<void> {
    const taskId = Array.isArray(taskIdInput) ? taskIdInput[0] : taskIdInput;
    
    if (!taskId) {
      throw new Error('Task ID is required');
    }
    
    const archivedTask = await this.storage.archiveTask(taskId);
    
    if (archivedTask) {
      console.log(chalk.green(`📦 Archived task: ${archivedTask.title} (${taskId})`));
    } else {
      console.log(chalk.red(`❌ Task not found: ${taskId}`));
    }
  }
  
  private async createAITask(textInput: any, options: any): Promise<void> {
    const text = Array.isArray(textInput) ? textInput.join(' ') : textInput || '';
    
    if (!text.trim()) {
      throw new Error('Text is required for AI task creation');
    }
    
    console.log(chalk.cyan('🤖 Generating tasks with AI...'));
    
    try {
      const tasks = await this.aiManager.generateTasks(text, {
        maxTasks: options.maxTasks || 8,
        includeDepencencies: !options.noDeps,
        includeEstimation: !options.noEstimate,
        targetTeamSize: options.teamSize,
        experienceLevel: options.experience || 'intermediate',
        timeConstraint: options.timeline
      });
      
      if (tasks.length === 0) {
        console.log(chalk.yellow('⚠️  No tasks generated. Try providing more specific requirements.'));
        return;
      }
      
      console.log(chalk.green(`✅ Generated ${tasks.length} AI tasks:\n`));
      
      for (const task of tasks) {
        console.log(this.formatTaskListItem(task));
        
        if (!options.plain && task.aiEstimation) {
          console.log(chalk.gray(`   📊 Estimated: ${task.aiEstimation.storyPoints}pts, ${task.aiEstimation.estimatedHours}h, ${task.aiEstimation.complexity} complexity`));
        }
      }
      
      if (tasks.some(t => t.dependencies && t.dependencies.length > 0)) {
        console.log(chalk.cyan('\n🔗 Dependencies detected and applied automatically'));
      }
      
      console.log(chalk.gray('\n💡 Use "cc task deps" to analyze task dependencies'));
      
    } catch (error) {
      console.error(chalk.red('❌ AI task generation failed:'), (error as Error).message);
      
      // Fallback to simple AI parsing
      const aiParsed = this.parseAIText(text);
      const input: CreateTaskInput = {
        title: aiParsed.title,
        description: aiParsed.description,
        priority: aiParsed.priority || 'medium',
        labels: [...(aiParsed.labels || []), 'ai-generated'],
        storyPoints: aiParsed.storyPoints,
        aiGenerated: true,
        source: 'ai'
      };
      
      const task = await this.storage.createTask(input);
      console.log(chalk.green(`✅ Created fallback AI task: ${task.title} (${task.id})`));
    }
  }
  
  private async expandTask(taskIdInput: any, options: any): Promise<void> {
    const taskId = Array.isArray(taskIdInput) ? taskIdInput[0] : taskIdInput;
    
    if (!taskId) {
      throw new Error('Task ID is required for expansion');
    }
    
    console.log(chalk.cyan(`🤖 Expanding task with AI: ${taskId}`));
    
    try {
      const result = await this.aiManager.expandTask(taskId, {
        maxTasks: options.maxTasks || 12,
        includeDepencencies: !options.noDeps,
        includeEstimation: !options.noEstimate,
        targetTeamSize: options.teamSize,
        experienceLevel: options.experience || 'intermediate',
        timeConstraint: options.timeline
      });
      
      console.log(chalk.green(`✅ Expanded "${result.parentTask.title}" into ${result.subtasks.length} subtasks:\n`));
      
      for (const subtask of result.subtasks) {
        console.log(this.formatTaskListItem(subtask));
      }
      
      console.log(chalk.cyan(`\n📅 Estimated Timeline: ${result.estimatedTimeline}`));
      
      if (result.riskFactors.length > 0) {
        console.log(chalk.yellow('\n⚠️  Risk Factors:'));
        result.riskFactors.forEach(risk => {
          console.log(chalk.yellow(`   • ${risk}`));
        });
      }
      
      if (result.dependencies.length > 0) {
        console.log(chalk.blue('\n🔗 Dependencies created automatically'));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Task expansion failed:'), (error as Error).message);
    }
  }
  
  private async estimateTask(taskIdInput: any, options: any): Promise<void> {
    const taskId = Array.isArray(taskIdInput) ? taskIdInput[0] : taskIdInput;
    
    if (!taskId) {
      throw new Error('Task ID is required for estimation');
    }
    
    const task = await this.storage.getTask(taskId);
    if (!task) {
      console.log(chalk.red(`❌ Task not found: ${taskId}`));
      return;
    }
    
    console.log(chalk.cyan(`🤖 Analyzing task: ${task.title}`));
    
    const estimation = await this.aiManager.estimateTask(task);
    
    console.log(chalk.green('\n📊 AI Estimation Results:'));
    console.log(`Story Points: ${estimation.storyPoints}`);
    console.log(`Estimated Hours: ${estimation.estimatedHours}`);
    console.log(`Complexity: ${estimation.complexity}`);
    console.log(`Confidence: ${Math.round(estimation.confidence * 100)}%`);
    
    if (estimation.factors.length > 0) {
      console.log(chalk.cyan('\n💡 Factors considered:'));
      estimation.factors.forEach(factor => {
        console.log(chalk.gray(`   • ${factor}`));
      });
    }
    
    // Optionally update the task with AI estimation
    if (options.apply) {
      await this.storage.updateTask({
        id: taskId,
        storyPoints: estimation.storyPoints,
        estimatedHours: estimation.estimatedHours,
        aiEstimation: estimation
      });
      
      console.log(chalk.green('\n✅ Task updated with AI estimation'));
    } else {
      console.log(chalk.gray('\n💡 Use --apply to update the task with these estimates'));
    }
  }
  
  private async analyzeDependencies(options: any): Promise<void> {
    console.log(chalk.cyan('🤖 Analyzing task dependencies...'));
    
    try {
      const analysis = await this.aiManager.analyzeTaskDependencies();
      
      console.log(chalk.green('\n📊 Dependency Analysis Results:\n'));
      
      if (analysis.criticalPath.length > 0) {
        console.log(chalk.red('🎯 Critical Path:'));
        analysis.criticalPath.forEach((taskId, index) => {
          console.log(chalk.red(`   ${index + 1}. ${taskId}`));
        });
        console.log('');
      }
      
      if (analysis.bottlenecks.length > 0) {
        console.log(chalk.yellow('🚧 Bottlenecks:'));
        analysis.bottlenecks.forEach(bottleneck => {
          console.log(chalk.yellow(`   • ${bottleneck}`));
        });
        console.log('');
      }
      
      if (analysis.conflicts.length > 0) {
        console.log(chalk.red('⚠️  Conflicts:'));
        analysis.conflicts.forEach(conflict => {
          console.log(chalk.red(`   • ${conflict}`));
        });
        console.log('');
      }
      
      if (analysis.suggestions.length > 0) {
        console.log(chalk.blue('💡 Optimization Suggestions:'));
        analysis.suggestions.forEach(suggestion => {
          console.log(chalk.blue(`   • ${suggestion}`));
        });
      }
      
      if (analysis.conflicts.length === 0 && analysis.bottlenecks.length === 0) {
        console.log(chalk.green('✅ No major dependency issues detected'));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Dependency analysis failed:'), (error as Error).message);
    }
  }
  
  private async showStats(options: any): Promise<void> {
    const stats = await this.storage.getStats();
    
    if (options.plain) {
      console.log(JSON.stringify(stats, null, 2));
    } else {
      console.log(chalk.cyan('📊 Task Statistics\n'));
      console.log(`Total Tasks: ${stats.totalTasks}`);
      console.log(`Archived Tasks: ${stats.archivedTasks}\n`);
      
      console.log(chalk.yellow('By Status:'));
      Object.entries(stats.tasksByStatus).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });
      
      console.log(chalk.yellow('\nBy Priority:'));
      Object.entries(stats.tasksByPriority).forEach(([priority, count]) => {
        console.log(`  ${priority}: ${count}`);
      });
    }
  }
  
  private async initializeSystem(options: any): Promise<void> {
    await this.storage.initialize();
    console.log(chalk.green('✅ Unified task system initialized!'));
    console.log(chalk.gray('\nTry these commands:'));
    console.log('  cc task create "My first task"');
    console.log('  cc task ai "Build login system"');
    console.log('  cc task list');
  }
  
  private async createBackup(options: any): Promise<void> {
    const backupPath = await this.storage.backup();
    console.log(chalk.green(`✅ Backup created: ${backupPath}`));
  }
  
  // Utility methods
  private parseNaturalLanguage(title: string, options: any): any {
    const parsed = {
      title: title,
      description: '',
      priority: 'medium',
      assignee: undefined as string | undefined,
      labels: [] as string[],
      storyPoints: undefined as number | undefined
    };
    
    // Extract priority markers (@high, @critical, etc.)
    const priorityMatch = title.match(/@(critical|high|medium|low)/i);
    if (priorityMatch) {
      parsed.priority = priorityMatch[1].toLowerCase();
      parsed.title = title.replace(priorityMatch[0], '').trim();
    }
    
    // Extract hashtag labels (#bug, #feature, etc.)
    const labelMatches = title.match(/#(\w+)/g);
    if (labelMatches) {
      parsed.labels = labelMatches.map(match => match.slice(1));
      parsed.title = title.replace(/#\w+/g, '').trim();
    }
    
    // Extract story points (5pts, [3pts], etc.)
    const pointsMatch = title.match(/\[?(\d+)pts?\]?/i);
    if (pointsMatch) {
      parsed.storyPoints = parseInt(pointsMatch[1]);
      parsed.title = title.replace(pointsMatch[0], '').trim();
    }
    
    // Extract assignee (for:alice, assigned:bob, etc.)
    const assigneeMatch = title.match(/(?:for|assigned|assignee):(\w+)/i);
    if (assigneeMatch) {
      parsed.assignee = assigneeMatch[1];
      parsed.title = title.replace(assigneeMatch[0], '').trim();
    }
    
    return parsed;
  }
  
  private parseAIText(text: string): any {
    // Simple AI text parsing - can be enhanced with actual AI
    return {
      title: text.length > 50 ? text.substring(0, 47) + '...' : text,
      description: text,
      priority: text.toLowerCase().includes('urgent') || text.toLowerCase().includes('critical') ? 'high' : 'medium',
      labels: this.extractLabelsFromText(text),
      storyPoints: this.estimateStoryPoints(text)
    };
  }
  
  private extractLabelsFromText(text: string): string[] {
    const labels: string[] = [];
    
    if (text.toLowerCase().includes('bug') || text.toLowerCase().includes('fix')) {
      labels.push('bug');
    }
    if (text.toLowerCase().includes('feature') || text.toLowerCase().includes('implement')) {
      labels.push('feature');
    }
    if (text.toLowerCase().includes('test')) {
      labels.push('testing');
    }
    if (text.toLowerCase().includes('doc') || text.toLowerCase().includes('documentation')) {
      labels.push('docs');
    }
    if (text.toLowerCase().includes('ui') || text.toLowerCase().includes('interface')) {
      labels.push('ui');
    }
    if (text.toLowerCase().includes('api')) {
      labels.push('api');
    }
    if (text.toLowerCase().includes('security') || text.toLowerCase().includes('auth')) {
      labels.push('security');
    }
    
    return labels;
  }
  
  private estimateStoryPoints(text: string): number {
    const length = text.length;
    const complexity = text.toLowerCase();
    
    let points = 2; // Default
    
    if (length > 200) points += 1;
    if (length > 500) points += 2;
    
    if (complexity.includes('complex') || complexity.includes('integration')) points += 2;
    if (complexity.includes('simple') || complexity.includes('minor')) points -= 1;
    if (complexity.includes('major') || complexity.includes('system')) points += 3;
    
    return Math.max(1, Math.min(13, points)); // Keep in Fibonacci range
  }
  
  private normalizeStatus(status: string): any {
    const statusMap: Record<string, string> = {
      'todo': 'todo',
      'to-do': 'todo',
      'pending': 'todo',
      'in-progress': 'in_progress',
      'inprogress': 'in_progress',
      'progress': 'in_progress',
      'doing': 'in_progress',
      'done': 'done',
      'completed': 'done',
      'finished': 'done',
      'blocked': 'blocked',
      'archived': 'archived',
      'archive': 'archived'
    };
    
    return statusMap[status.toLowerCase()] || status;
  }
  
  private formatTaskListItem(task: CommonTask): string {
    const statusIcon = this.getStatusIcon(task.status);
    const priorityColor = this.getPriorityColor(task.priority);
    const labelsText = task.labels.length > 0 ? ` ${chalk.gray(task.labels.map(l => `#${l}`).join(' '))}` : '';
    const assigneeText = task.assignee ? ` ${chalk.blue(`@${task.assignee}`)}` : '';
    const pointsText = task.storyPoints ? ` ${chalk.cyan(`[${task.storyPoints}pts]`)}` : '';
    
    return `${statusIcon} ${priorityColor(task.title)} ${chalk.gray(`(${task.id})`)}${labelsText}${assigneeText}${pointsText}`;
  }
  
  private formatTaskSummary(task: CommonTask): string {
    let summary = '';
    summary += `ID: ${task.id}\n`;
    summary += `Status: ${task.status}\n`;
    summary += `Priority: ${task.priority}\n`;
    if (task.assignee) summary += `Assignee: ${task.assignee}\n`;
    if (task.labels.length > 0) summary += `Labels: ${task.labels.join(', ')}\n`;
    if (task.storyPoints) summary += `Story Points: ${task.storyPoints}\n`;
    summary += `Created: ${new Date(task.createdAt).toLocaleDateString()}\n`;
    return chalk.gray(summary);
  }
  
  private formatTaskDetails(task: CommonTask): string {
    const statusIcon = this.getStatusIcon(task.status);
    const priorityColor = this.getPriorityColor(task.priority);
    
    let output = chalk.cyan('\n📋 Task Details:\n');
    output += `${statusIcon} ${priorityColor(task.title)}\n`;
    output += `ID: ${task.id}\n`;
    output += `Status: ${task.status}\n`;
    output += `Priority: ${task.priority}\n`;
    
    if (task.assignee) output += `Assignee: ${task.assignee}\n`;
    if (task.description) output += `Description: ${task.description}\n`;
    if (task.labels.length > 0) output += `Labels: ${task.labels.join(', ')}\n`;
    if (task.storyPoints) output += `Story Points: ${task.storyPoints}\n`;
    if (task.estimatedHours) output += `Estimated Hours: ${task.estimatedHours}\n`;
    if (task.actualHours) output += `Actual Hours: ${task.actualHours}\n`;
    
    if (task.sprintId) output += `Sprint: ${task.sprintId}\n`;
    if (task.epicId) output += `Epic: ${task.epicId}\n`;
    if (task.phaseId) output += `Phase: ${task.phaseId}\n`;
    
    if (task.dependencies && task.dependencies.length > 0) {
      output += `Dependencies: ${task.dependencies.join(', ')}\n`;
    }
    
    output += `Created: ${new Date(task.createdAt).toLocaleDateString()}\n`;
    output += `Updated: ${new Date(task.updatedAt).toLocaleDateString()}\n`;
    
    if (task.archivedAt) {
      output += `Archived: ${new Date(task.archivedAt).toLocaleDateString()}\n`;
    }
    
    if (task.aiGenerated) {
      output += chalk.yellow('🤖 AI Generated\n');
    }
    
    if (task.draft) {
      output += chalk.gray('📝 Draft\n');
    }
    
    return output;
  }
  
  private getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'todo': '📝',
      'in_progress': '🔄',
      'done': '✅',
      'blocked': '🚫',
      'archived': '📦'
    };
    
    return icons[status] || '❓';
  }
  
  private getPriorityColor(priority: string): (text: string) => string {
    const colors: Record<string, (text: string) => string> = {
      'critical': chalk.red,
      'high': chalk.red,
      'medium': chalk.yellow,
      'low': chalk.gray
    };
    
    return colors[priority] || chalk.white;
  }
  
  private getEmptyStateMessage(): string {
    return `📭 No tasks found.

🚀 Quick Start:
  cc task create "My first task"     - Create a simple task
  cc task ai "Build login system"   - AI generates tasks from description
  
💡 The unified task system supports both simple and complex AGILE workflows.`;
  }
  
  private getUsageHelp(): string {
    return `🛠️  Critical Claude - Unified Task Management

Usage: cc task [action] [args...] [options]

Actions:
  create, add, new        Create a new task
  list, ls               List tasks
  view, show, get        View task details
  edit, update, modify   Update a task
  delete, remove, rm     Delete a task
  archive                Archive a task
  ai, ai-create          Create tasks using AI
  expand, ai-expand      Expand task into subtasks using AI
  estimate, ai-estimate  Get AI estimation for task complexity
  dependencies, deps     Analyze task dependencies and critical path
  stats, status          Show task statistics
  init                   Initialize the system
  backup                 Create a backup

Options:
  -m, --mode <mode>      Mode: simple|agile|auto (default: auto)
  -p, --priority <pri>   Task priority (critical|high|medium|low)
  -s, --status <status>  Task status (todo|in_progress|done|blocked)
  -a, --assignee <user>  Task assignee
  --labels <labels...>   Task labels/tags
  --description <desc>   Task description
  --points <num>         Story points
  --hours <num>          Estimated hours
  --ai                   Enable AI assistance
  --plain               Plain text output
  --includeDrafts       Include draft tasks
  --includeArchived     Include archived tasks

Examples:
  cc task create "Fix login bug" --priority high --labels bug security
  cc task ai "Build user authentication system with OAuth2"
  cc task expand task-123456789 --maxTasks 8 --teamSize 3
  cc task estimate task-123456789 --apply
  cc task deps
  cc task list --status in_progress --assignee alice
  cc task view task-123456789
  cc task edit task-123456789 --status done
  
Natural Language:
  cc task create "Fix urgent bug @high #security 3pts for:alice"
  
For more help: https://critical-claude.dev/docs/tasks`;
  }
}