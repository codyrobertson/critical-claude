/**
 * Quick Task Command - Natural language task creation with smart defaults
 * Makes task creation as simple as: cc task "fix login bug"
 */

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { CommandHandler } from '../command-registry.js';
import { ContextManager } from '../../core/context-manager.js';
import { BacklogManager } from '../backlog-manager.js';
import { TaskParser } from '../../core/task-parser.js';
import { EnhancedTask, TaskPriority } from '../../types/agile.js';
import { logger } from '../../core/logger.js';

export class QuickTaskCommand implements CommandHandler {
  private contextManager: ContextManager;
  private backlogManager: BacklogManager;
  private taskParser: TaskParser;
  
  constructor() {
    // Lazy initialization - don't connect to services yet
    this.contextManager = new ContextManager();
    this.backlogManager = new BacklogManager();
    this.taskParser = new TaskParser();
  }
  
  async execute(action: string, input: any, options: any): Promise<void> {
    try {
      switch (action) {
        case 'create':
        case 'default':
          await this.handleCreateAction(input, options);
          break;
        case 'list':
          await this.listTasks(options);
          break;
        case 'focus':
          await this.focusTask(input, options);
          break;
        case 'quick':
          await this.quickCreate(input, options);
          break;
        case 'context':
          await this.manageContext(options);
          break;
        default:
          // Legacy support for array input
          if (Array.isArray(input)) {
            await this.handleCreateAction(input, options);
          } else {
            throw new Error(`Unknown action: ${action}`);
          }
      }
    } catch (error) {
      logger.error('Task command failed', error as Error);
      console.error(chalk.red(`❌ ${(error as Error).message}`));
    }
  }
  
  private async handleCreateAction(input: any, options: any): Promise<void> {
    const descriptionParts = Array.isArray(input) ? input : [input];
    
    // Handle different input modes
    if (options.interactive) {
      await this.interactiveMode();
    } else if (options.bulk) {
      await this.bulkMode();
    } else if (descriptionParts.length === 0 || !descriptionParts[0]) {
      // No description provided, go interactive
      await this.interactiveMode();
    } else {
      // Quick one-liner mode
      const description = descriptionParts.join(' ');
      await this.quickCreate(description, options);
    }
  }
  
  /**
   * Quick one-liner task creation with natural language parsing
   */
  private async quickCreate(input: string, options: any): Promise<void> {
    const spinner = ora('Creating task...').start();
    
    try {
      // Initialize services only when needed
      await this.contextManager.initialize();
      const context = await this.contextManager.getCurrentContext();
      
      // Parse natural language input
      const parsed = this.taskParser.parse(input);
      
      // Merge parsed data with CLI options
      const taskData = {
        title: parsed.title,
        description: parsed.description || '',
        priority: options.priority || parsed.priority || context.defaultPriority || 'medium',
        storyPoints: options.points || parsed.points || 2,
        labels: [...(options.labels || []), ...(parsed.labels || [])],
        assignee: options.assignee || parsed.assignee || context.currentUser,
        sprintId: options.sprint || context.activeSprint,
        epicId: options.epic || context.currentEpic,
        dueDate: parsed.dueDate
      };
      
      // Create task immediately
      spinner.text = 'Creating task...';
      const task = await this.createTask(taskData);
      
      spinner.succeed(chalk.green(`✅ Created: ${chalk.bold(task.id)} - ${task.title}`));
      
      // Show task details
      this.displayTaskSummary(task);
      
      // Update context for next time
      await this.contextManager.updateContext({
        lastTaskId: task.id,
        recentLabels: [...new Set([...context.recentLabels, ...parsed.labels])].slice(-10)
      });
      
      // Progressive enhancement - enhance with AI in background if requested
      if (options.ai) {
        console.log(chalk.dim('🤖 Enhancing with AI suggestions...'));
        this.enhanceWithAI(task.id).catch(err => {
          logger.warn('AI enhancement failed', err);
        });
      }
      
    } catch (error) {
      spinner.fail(chalk.red('Task creation failed'));
      throw error;
    }
  }
  
  /**
   * Interactive mode for detailed task creation
   */
  private async interactiveMode(): Promise<void> {
    console.log(chalk.cyan('📝 Interactive Task Creation\n'));
    
    // Initialize context
    await this.contextManager.initialize();
    const context = await this.contextManager.getCurrentContext();
    
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'title',
        message: 'Task title:',
        validate: (input) => input.trim().length > 0 || 'Title is required'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description (optional):'
      },
      {
        type: 'list',
        name: 'priority',
        message: 'Priority:',
        choices: ['low', 'medium', 'high', 'critical'],
        default: context.defaultPriority || 'medium'
      },
      {
        type: 'number',
        name: 'storyPoints',
        message: 'Story points:',
        default: 2,
        validate: (input) => input > 0 || 'Must be greater than 0'
      },
      {
        type: 'input',
        name: 'labels',
        message: 'Labels (comma-separated):',
        default: context.recentLabels.slice(0, 3).join(', '),
        filter: (input) => input.split(',').map(l => l.trim()).filter(l => l)
      },
      {
        type: 'input',
        name: 'assignee',
        message: 'Assign to:',
        default: context.currentUser || 'me'
      },
      {
        type: 'confirm',
        name: 'useActiveSprint',
        message: `Add to active sprint${context.activeSprint ? ` (${context.activeSprintName})` : ''}?`,
        default: true,
        when: () => !!context.activeSprint
      }
    ]);
    
    const taskData = {
      ...answers,
      sprintId: answers.useActiveSprint ? context.activeSprint : undefined
    };
    
    const spinner = ora('Creating task...').start();
    
    try {
      const task = await this.createTask(taskData);
      spinner.succeed(chalk.green(`✅ Created: ${chalk.bold(task.id)} - ${task.title}`));
      this.displayTaskSummary(task);
    } catch (error) {
      spinner.fail(chalk.red('Task creation failed'));
      throw error;
    }
  }
  
  /**
   * Bulk mode - create multiple tasks from input
   */
  private async bulkMode(): Promise<void> {
    console.log(chalk.cyan('📝 Bulk Task Creation'));
    console.log(chalk.dim('Enter tasks (one per line), press Ctrl+D when done:\n'));
    
    // Read from stdin
    const lines: string[] = [];
    process.stdin.setEncoding('utf8');
    
    for await (const chunk of process.stdin) {
      lines.push(...chunk.split('\n').filter(line => line.trim()));
    }
    
    if (lines.length === 0) {
      console.log(chalk.yellow('No tasks provided'));
      return;
    }
    
    console.log(chalk.cyan(`\nCreating ${lines.length} tasks...\n`));
    
    await this.contextManager.initialize();
    const context = await this.contextManager.getCurrentContext();
    
    const results = [];
    for (const line of lines) {
      const spinner = ora(`Creating: ${line.substring(0, 50)}...`).start();
      
      try {
        const parsed = this.taskParser.parse(line);
        const task = await this.createTask({
          title: parsed.title,
          description: parsed.description || '',
          priority: parsed.priority || context.defaultPriority || 'medium',
          storyPoints: parsed.points || 2,
          labels: parsed.labels || [],
          assignee: parsed.assignee || context.currentUser,
          sprintId: context.activeSprint
        });
        
        spinner.succeed(chalk.green(`✅ ${task.id} - ${task.title}`));
        results.push({ success: true, task });
      } catch (error) {
        spinner.fail(chalk.red(`❌ Failed: ${line}`));
        results.push({ success: false, error: (error as Error).message });
      }
    }
    
    // Summary
    const successful = results.filter(r => r.success).length;
    console.log(chalk.cyan(`\n📊 Summary: ${successful}/${lines.length} tasks created`));
  }
  
  /**
   * Create task with smart defaults
   */
  private async createTask(taskData: any): Promise<EnhancedTask> {
    // Ensure backlog is initialized
    if (!this.backlogManager.isInitialized()) {
      await this.backlogManager.initialize();
    }
    
    // Auto-create sprint if needed and no sprint specified
    if (!taskData.sprintId) {
      const context = await this.contextManager.getCurrentContext();
      if (!context.activeSprint) {
        // Find or create a default sprint
        taskData.sprintId = await this.findOrCreateDefaultSprint();
      } else {
        taskData.sprintId = context.activeSprint;
      }
    }
    
    return await this.backlogManager.createTask(taskData);
  }
  
  /**
   * Find or create a default sprint for quick task creation
   */
  private async findOrCreateDefaultSprint(): Promise<string> {
    // Try to find an active sprint
    const sprints = await this.backlogManager.getSprints();
    const activeSprint = sprints.find(s => s.status === 'active');
    
    if (activeSprint) {
      return activeSprint.id;
    }
    
    // Try to find a planning sprint
    const planningSprint = sprints.find(s => s.status === 'planning');
    if (planningSprint) {
      return planningSprint.id;
    }
    
    // Create a default sprint
    logger.info('Creating default sprint for quick task creation');
    const sprint = await this.backlogManager.createSprint({
      name: `Sprint ${new Date().toISOString().split('T')[0]}`,
      goal: 'Default sprint for quick tasks',
      capacity: 20,
      epicId: await this.findOrCreateDefaultEpic()
    });
    
    return sprint.id;
  }
  
  /**
   * Find or create a default epic
   */
  private async findOrCreateDefaultEpic(): Promise<string> {
    const epics = await this.backlogManager.getEpics();
    
    // Look for a general/default epic
    const defaultEpic = epics.find(e => 
      e.name.toLowerCase().includes('general') || 
      e.name.toLowerCase().includes('default') ||
      e.name.toLowerCase().includes('backlog')
    );
    
    if (defaultEpic) {
      return defaultEpic.id;
    }
    
    // Create default epic
    const phase = await this.findOrCreateDefaultPhase();
    const epic = await this.backlogManager.createEpic({
      phaseId: phase.id,
      name: 'General Backlog',
      description: 'Default epic for quick task creation',
      priority: 'medium'
    });
    
    return epic.id;
  }
  
  /**
   * Find or create a default phase
   */
  private async findOrCreateDefaultPhase(): Promise<any> {
    const phases = await this.backlogManager.getPhases();
    
    if (phases.length > 0) {
      // Return the first active or planning phase
      return phases.find(p => p.status === 'active' || p.status === 'planning') || phases[0];
    }
    
    // Create default phase
    return await this.backlogManager.createPhase({
      name: 'Current Development',
      description: 'Default phase for quick task creation',
      status: 'active'
    });
  }
  
  /**
   * Display task summary after creation
   */
  private displayTaskSummary(task: EnhancedTask): void {
    console.log(chalk.dim('─'.repeat(50)));
    console.log(`📋 ${chalk.bold('Task:')} ${task.title}`);
    if (task.description) {
      console.log(`📝 ${chalk.bold('Description:')} ${task.description}`);
    }
    console.log(`🎯 ${chalk.bold('Priority:')} ${this.getPriorityColor(task.priority)(task.priority)}`);
    console.log(`📊 ${chalk.bold('Points:')} ${task.storyPoints}`);
    if (task.labels.length > 0) {
      console.log(`🏷️  ${chalk.bold('Labels:')} ${task.labels.join(', ')}`);
    }
    if (task.assignee) {
      console.log(`👤 ${chalk.bold('Assignee:')} ${task.assignee}`);
    }
    console.log(chalk.dim('─'.repeat(50)));
  }
  
  private getPriorityColor(priority: TaskPriority) {
    switch (priority) {
      case 'critical': return chalk.red;
      case 'high': return chalk.yellow;
      case 'medium': return chalk.blue;
      case 'low': return chalk.gray;
      default: return chalk.white;
    }
  }
  
  /**
   * List recent tasks
   */
  private async listTasks(options: any): Promise<void> {
    await this.contextManager.initialize();
    const context = await this.contextManager.getCurrentContext();
    
    console.log(chalk.cyan('📋 Recent Tasks'));
    console.log(chalk.dim('─'.repeat(50)));
    
    // Show focused tasks first
    if (context.focusedTasks.length > 0) {
      console.log(chalk.yellow('🎯 Focused Tasks:'));
      for (const taskId of context.focusedTasks.slice(-3)) {
        const task = await this.backlogManager.getTask(taskId);
        if (task) {
          console.log(`  ${chalk.bold(task.id)} - ${task.title}`);
        }
      }
      console.log('');
    }
    
    // Show recent activity
    if (context.lastTaskId) {
      const lastTask = await this.backlogManager.getTask(context.lastTaskId);
      if (lastTask) {
        console.log(chalk.green('📌 Last Created:'));
        console.log(`  ${chalk.bold(lastTask.id)} - ${lastTask.title}`);
      }
    }
    
    // Show today's stats
    console.log(chalk.cyan(`📊 Today: ${context.tasksCreatedToday} tasks created`));
  }
  
  /**
   * Focus on a specific task
   */
  private async focusTask(taskId: string, options: any): Promise<void> {
    await this.contextManager.initialize();
    
    const task = await this.backlogManager.getTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    
    await this.contextManager.focusTask(taskId);
    console.log(chalk.green(`🎯 Focused on task: ${chalk.bold(task.id)} - ${task.title}`));
  }
  
  /**
   * Manage project context
   */
  private async manageContext(options: any): Promise<void> {
    await this.contextManager.initialize();
    
    if (options.show) {
      const context = await this.contextManager.getCurrentContext();
      console.log(chalk.cyan('📊 Project Context'));
      console.log(chalk.dim('─'.repeat(50)));
      
      if (context.activeSprint) {
        console.log(`🏃 Active Sprint: ${context.activeSprintName || context.activeSprint}`);
      }
      if (context.currentEpic) {
        console.log(`📖 Current Epic: ${context.currentEpicName || context.currentEpic}`);
      }
      if (context.currentUser) {
        console.log(`👤 Current User: ${context.currentUser}`);
      }
      
      console.log(`🏷️  Recent Labels: ${context.recentLabels.join(', ')}`);
      console.log(`👥 Team Members: ${context.teamMembers.join(', ')}`);
      console.log(`📅 Tasks Today: ${context.tasksCreatedToday}`);
      
      if (context.focusedTasks.length > 0) {
        console.log(`🎯 Focused Tasks: ${context.focusedTasks.join(', ')}`);
      }
    }
    
    if (options.reset) {
      // Reset context (implementation would clear cache)
      console.log(chalk.yellow('🔄 Context reset'));
    }
  }
  
  /**
   * Enhance task with AI in the background
   */
  private async enhanceWithAI(taskId: string): Promise<void> {
    try {
      // This runs in the background, so we don't await it
      const { AIEnhancer } = await import('../../core/ai-enhancer.js');
      const enhancer = new AIEnhancer();
      await enhancer.enhanceTask(taskId);
      
      console.log(chalk.green('✨ Task enhanced with AI suggestions'));
    } catch (error) {
      // Don't fail the main operation if AI enhancement fails
      logger.warn('AI enhancement failed', error as Error);
    }
  }
}