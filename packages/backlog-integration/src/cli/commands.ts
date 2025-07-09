/**
 * Critical Claude Backlog CLI Commands
 * Enhanced AGILE commands with AI integration
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
// @ts-ignore
import inquirer from 'inquirer';
import { CriticalClaudeClient } from '../core/critical-claude-client.js';
import { Phase, Epic, Sprint, EnhancedTask, AITaskSuggestion } from '../types/agile.js';
import { BacklogManager } from './backlog-manager.js';
// Simple logger for now
const logger = {
  info: (msg: string, data?: any) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg: string, error?: Error) => console.error(`[ERROR] ${msg}`, error?.message || ''),
  warn: (msg: string, data?: any) => console.warn(`[WARN] ${msg}`, data || '')
};

export class CriticalClaudeCommands {
  private _client?: CriticalClaudeClient;
  private _backlogManager?: BacklogManager;
  
  // Lazy initialization - only create when needed
  private get client(): CriticalClaudeClient {
    if (!this._client) {
      this._client = new CriticalClaudeClient();
    }
    return this._client;
  }
  
  private get backlogManager(): BacklogManager {
    if (!this._backlogManager) {
      this._backlogManager = new BacklogManager();
    }
    return this._backlogManager;
  }
  
  async initialize(): Promise<void> {
    // Only initialize when actually needed, not on startup
    // This method is now optional
  }
  
  /**
   * Execute command with action-based routing
   */
  async execute(action: string, input: any, options: any): Promise<void> {
    switch (action) {
      case 'status':
        await this.showStatus(options);
        break;
      case 'analyze-velocity':
        await this.analyzeVelocity(options);
        break;
      case 'analyze-risks':
        await this.analyzeRisks(options);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
  
  /**
   * Register all Critical Claude commands with Commander
   */
  registerCommands(program: Command): void {
    // AGILE Hierarchy Commands
    this.registerAgileCommands(program);
    
    // AI-Powered Commands  
    this.registerAICommands(program);
    
    // Analysis Commands
    this.registerAnalysisCommands(program);
    
    // Hook Commands
    this.registerHookCommands(program);
  }
  
  private registerAgileCommands(program: Command): void {
    const agile = program
      .command('agile')
      .description('AGILE hierarchy management (Phase > Epic > Sprint > Task)');
    
    // Phase commands
    const phase = agile
      .command('phase')
      .description('Manage development phases');
    
    phase
      .command('create <name>')
      .description('Create a new phase')
      .option('-d, --description <desc>', 'Phase description')
      .option('--start <date>', 'Start date (YYYY-MM-DD)')
      .option('--end <date>', 'End date (YYYY-MM-DD)')
      .option('--goals <goals>', 'Comma-separated goals')
      .action(async (name, options) => {
        await this.createPhase(name, options);
      });
    
    phase
      .command('list')
      .description('List all phases')
      .option('-s, --status <status>', 'Filter by status')
      .action(async (options) => {
        await this.listPhases(options);
      });
    
    phase
      .command('edit <id>')
      .description('Edit a phase')
      .option('-d, --description <desc>', 'Update description')
      .option('--status <status>', 'Update status')
      .action(async (id, options) => {
        await this.editPhase(id, options);
      });
    
    // Epic commands
    const epic = agile
      .command('epic')
      .description('Manage epics within phases');
    
    epic
      .command('create <name>')
      .description('Create a new epic')
      .requiredOption('--phase <phaseId>', 'Phase ID')
      .option('-d, --description <desc>', 'Epic description')
      .option('-v, --value <value>', 'Business value statement')
      .option('--ac <criteria>', 'Acceptance criteria (comma-separated)')
      .option('--effort <points>', 'Estimated effort in story points', parseInt)
      .option('--priority <priority>', 'Priority level', 'medium')
      .action(async (name, options) => {
        await this.createEpic(name, options);
      });
    
    epic
      .command('list')
      .description('List epics')
      .option('--phase <phaseId>', 'Filter by phase')
      .option('-s, --status <status>', 'Filter by status')
      .action(async (options) => {
        await this.listEpics(options);
      });
    
    // Sprint commands
    const sprint = agile
      .command('sprint')
      .description('Manage sprints within epics');
    
    sprint
      .command('create <name>')
      .description('Create a new sprint')
      .requiredOption('--epic <epicId>', 'Epic ID')
      .option('-g, --goal <goal>', 'Sprint goal')
      .option('--capacity <points>', 'Sprint capacity in story points', parseInt)
      .option('--start <date>', 'Start date (YYYY-MM-DD)')
      .option('--end <date>', 'End date (YYYY-MM-DD)')
      .action(async (name, options) => {
        await this.createSprint(name, options);
      });
    
    sprint
      .command('start <id>')
      .description('Start a sprint')
      .action(async (id) => {
        await this.startSprint(id);
      });
    
    sprint
      .command('complete <id>')
      .description('Complete a sprint')
      .option('--retrospective', 'Include retrospective questions')
      .action(async (id, options) => {
        await this.completeSprint(id, options);
      });
    
    sprint
      .command('report <id>')
      .description('Generate sprint report')
      .option('--format <format>', 'Report format (text|json|markdown)', 'text')
      .action(async (id, options) => {
        await this.generateSprintReport(id, options);
      });
  }
  
  private registerAICommands(program: Command): void {
    // AI-powered planning command
    program
      .command('cc-plan <description>')
      .description('Generate tasks from feature description using AI')
      .option('-t, --team-size <size>', 'Team size', parseInt, 2)
      .option('-s, --sprint-length <days>', 'Sprint length in days', parseInt, 14)
      .option('--sprint <sprintId>', 'Target sprint for tasks')
      .option('--auto-create', 'Automatically create tasks without confirmation')
      .action(async (description, options) => {
        await this.aiPlanFeature(description, options);
      });
    
    // Code analysis command
    program
      .command('cc-analyze [path]')
      .description('Analyze code and generate improvement tasks')
      .option('-c, --create-tasks', 'Auto-create tasks from analysis')
      .option('--priority <priority>', 'Default priority for generated tasks', 'medium')
      .option('--assignee <assignee>', 'Default assignee for tasks')
      .action(async (path, options) => {
        await this.aiAnalyzeCode(path || '.', options);
      });
    
    // Sprint planning assistant
    program
      .command('cc-sprint-plan')
      .description('AI-assisted sprint planning')
      .option('--sprint <sprintId>', 'Sprint ID for planning')
      .option('--optimize', 'Optimize task distribution')
      .option('--capacity <points>', 'Override sprint capacity', parseInt)
      .action(async (options) => {
        await this.aiSprintPlan(options);
      });
    
    // Task estimation
    program
      .command('cc-estimate <taskIds...>')
      .description('Estimate task effort using AI')
      .option('--update', 'Update task estimates')
      .action(async (taskIds, options) => {
        await this.aiEstimateTasks(taskIds, options);
      });
  }
  
  private registerAnalysisCommands(program: Command): void {
    const analyze = program
      .command('analyze')
      .description('Analysis and reporting commands');
    
    analyze
      .command('velocity')
      .description('Analyze team velocity trends')
      .option('--sprints <count>', 'Number of recent sprints to analyze', parseInt, 5)
      .option('--team <member>', 'Analyze specific team member')
      .action(async (options) => {
        await this.analyzeVelocity(options);
      });
    
    analyze
      .command('risks')
      .description('Identify project risks')
      .option('--sprint <sprintId>', 'Analyze specific sprint')
      .option('--auto-create-tasks', 'Create mitigation tasks')
      .action(async (options) => {
        await this.analyzeRisks(options);
      });
    
    analyze
      .command('burndown <sprintId>')
      .description('Generate burndown chart data')
      .option('--format <format>', 'Output format (json|csv|chart)', 'json')
      .action(async (sprintId, options) => {
        await this.generateBurndown(sprintId, options);
      });
  }
  
  private registerHookCommands(program: Command): void {
    const hooks = program
      .command('hooks')
      .description('Manage Claude Code hooks integration');
    
    hooks
      .command('enable <type>')
      .description('Enable hook type (git-commit|pr-analysis|ci-failure)')
      .action(async (type) => {
        await this.enableHook(type);
      });
    
    hooks
      .command('disable <type>')
      .description('Disable hook type')
      .action(async (type) => {
        await this.disableHook(type);
      });
    
    hooks
      .command('config')
      .description('Configure hooks')
      .option('--edit', 'Open hooks config in editor')
      .action(async (options) => {
        await this.configureHooks(options);
      });
    
    hooks
      .command('test')
      .description('Test hook configuration')
      .option('--commit <message>', 'Test commit hook with message')
      .option('--pr <number>', 'Test PR hook with PR number')
      .action(async (options) => {
        await this.testHooks(options);
      });
  }
  
  // Implementation methods
  
  private async createPhase(name: string, options: any): Promise<void> {
    const spinner = ora('Creating phase...').start();
    
    try {
      const phase: Partial<Phase> = {
        name,
        description: options.description || '',
        startDate: options.start ? new Date(options.start) : new Date(),
        endDate: options.end ? new Date(options.end) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        goals: options.goals ? options.goals.split(',').map((g: string) => g.trim()) : [],
        status: 'planning',
        epics: []
      };
      
      const createdPhase = await this.backlogManager.createPhase(phase);
      
      spinner.succeed(chalk.green(`Phase "${name}" created with ID: ${createdPhase.id}`));
      
      console.log(chalk.cyan('\\n📋 Phase Details:'));
      console.log(`ID: ${createdPhase.id}`);
      console.log(`Name: ${createdPhase.name}`);
      console.log(`Description: ${createdPhase.description}`);
      console.log(`Start: ${createdPhase.startDate.toISOString().split('T')[0]}`);
      console.log(`End: ${createdPhase.endDate.toISOString().split('T')[0]}`);
      
    } catch (error) {
      spinner.fail(chalk.red(`Failed to create phase: ${(error as Error).message}`));
      logger.error('Phase creation failed', error as Error);
    }
  }
  
  private async aiPlanFeature(description: string, options: any): Promise<void> {
    const spinner = ora('🤖 Generating AI task breakdown...').start();
    
    try {
      // Generate tasks using Critical Claude
      const suggestions = await this.client.generateTasksFromFeature(description, {
        teamSize: options.teamSize,
        sprintLength: options.sprintLength
      });
      
      spinner.succeed(chalk.green(`Generated ${suggestions.length} task suggestions`));
      
      console.log(chalk.cyan('\\n🤖 AI Task Breakdown:'));
      console.log(chalk.dim('━'.repeat(60)));
      
      suggestions.forEach((task, index) => {
        console.log(`\\n${index + 1}. ${chalk.bold(task.title)}`);
        console.log(`   ${task.description}`);
        console.log(`   ${chalk.blue('Effort:')} ${task.estimatedEffort} points`);
        console.log(`   ${chalk.yellow('Priority:')} ${task.priority}`);
        console.log(`   ${chalk.green('Confidence:')} ${Math.round(task.confidence * 100)}%`);
        if (task.acceptanceCriteria.length > 0) {
          console.log(`   ${chalk.magenta('AC:')} ${task.acceptanceCriteria.join(', ')}`);
        }
      });
      
      if (!options.autoCreate) {
        const answers = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'createTasks',
            message: 'Create these tasks in your backlog?',
            default: true
          }
        ]);
        
        if (!answers.createTasks) {
          console.log(chalk.yellow('Tasks not created.'));
          return;
        }
      }
      
      // Create tasks
      const createSpinner = ora('Creating tasks...').start();
      const createdTasks = await this.backlogManager.createTasksFromSuggestions(
        suggestions,
        options.sprint
      );
      
      createSpinner.succeed(chalk.green(`Created ${createdTasks.length} tasks`));
      
    } catch (error) {
      spinner.fail(chalk.red(`AI planning failed: ${(error as Error).message}`));
      logger.error('AI planning failed', error as Error);
    }
  }
  
  private async aiAnalyzeCode(path: string, options: any): Promise<void> {
    const spinner = ora(`🔍 Analyzing code at ${path}...`).start();
    
    try {
      const suggestions = await this.client.analyzeCodeForTasks(path);
      
      spinner.succeed(chalk.green(`Found ${suggestions.length} improvement opportunities`));
      
      if (suggestions.length === 0) {
        console.log(chalk.green('✨ No issues found! Code looks good.'));
        return;
      }
      
      console.log(chalk.cyan('\\n🔍 Code Analysis Results:'));
      console.log(chalk.dim('━'.repeat(60)));
      
      suggestions.forEach((task, index) => {
        const priorityColor = task.priority === 'critical' ? chalk.red : 
                             task.priority === 'high' ? chalk.yellow : chalk.blue;
        
        console.log(`\\n${index + 1}. ${priorityColor(task.priority.toUpperCase())} - ${chalk.bold(task.title)}`);
        console.log(`   ${task.description}`);
        console.log(`   ${chalk.blue('Effort:')} ${task.estimatedEffort} points`);
        console.log(`   ${chalk.green('Reasoning:')} ${task.reasoning}`);
      });
      
      if (options.createTasks) {
        const createSpinner = ora('Creating improvement tasks...').start();
        
        const tasksToCreate = suggestions.map(suggestion => ({
          ...suggestion,
          assignee: options.assignee,
          priority: options.priority
        }));
        
        const createdTasks = await this.backlogManager.createTasksFromSuggestions(tasksToCreate);
        createSpinner.succeed(chalk.green(`Created ${createdTasks.length} improvement tasks`));
      }
      
    } catch (error) {
      spinner.fail(chalk.red(`Code analysis failed: ${(error as Error).message}`));
      logger.error('Code analysis failed', error as Error);
    }
  }
  
  private async listPhases(options: any): Promise<void> {
    try {
      const phases = await this.backlogManager.getPhases(options.status);
      
      if (phases.length === 0) {
        console.log(chalk.yellow('No phases found.'));
        return;
      }
      
      console.log(chalk.cyan('\\n📋 Development Phases:'));
      console.log(chalk.dim('━'.repeat(60)));
      
      phases.forEach(phase => {
        const statusColor = phase.status === 'active' ? chalk.green : 
                           phase.status === 'completed' ? chalk.blue : chalk.yellow;
        
        console.log(`\\n${chalk.bold(phase.name)} (${phase.id})`);
        console.log(`Status: ${statusColor(phase.status)}`);
        console.log(`Period: ${phase.startDate.toISOString().split('T')[0]} → ${phase.endDate.toISOString().split('T')[0]}`);
        console.log(`Epics: ${phase.epics.length}`);
        if (phase.description) {
          console.log(`Description: ${phase.description}`);
        }
      });
      
    } catch (error) {
      console.error(chalk.red(`Failed to list phases: ${(error as Error).message}`));
    }
  }
  
  // Additional implementation methods would go here...
  // For brevity, showing key patterns. Full implementation would include:
  // - createEpic, listEpics, editPhase
  // - createSprint, startSprint, completeSprint
  // - aiSprintPlan, aiEstimateTasks
  // - analyzeVelocity, analyzeRisks, generateBurndown
  // - enableHook, disableHook, configureHooks, testHooks
  
  private async editPhase(id: string, options: any): Promise<void> {
    try {
      const updates: Partial<Phase> = {};
      if (options.description) updates.description = options.description;
      if (options.status) updates.status = options.status;
      
      const updatedPhase = await this.backlogManager.updatePhase(id, updates);
      
      if (updatedPhase) {
        console.log(chalk.green(`Phase "${updatedPhase.name}" updated successfully`));
      } else {
        console.log(chalk.red(`Phase with ID "${id}" not found`));
      }
    } catch (error) {
      console.error(chalk.red(`Failed to edit phase: ${(error as Error).message}`));
    }
  }

  private async createEpic(name: string, options: any): Promise<void> {
    try {
      const epic = await this.backlogManager.createEpic({
        phaseId: options.phase,
        name,
        description: options.description || '',
        businessValue: options.value || '',
        acceptanceCriteria: options.ac ? options.ac.split(',').map((ac: string) => ac.trim()) : [],
        estimatedEffort: options.effort || 0,
        priority: options.priority || 'medium'
      });
      
      console.log(chalk.green(`Epic "${name}" created with ID: ${epic.id}`));
    } catch (error) {
      console.error(chalk.red(`Failed to create epic: ${(error as Error).message}`));
    }
  }
  
  private async listEpics(options: any): Promise<void> {
    try {
      const epics = await this.backlogManager.getEpics(options.phase, options.status);
      
      if (epics.length === 0) {
        console.log(chalk.yellow('No epics found.'));
        return;
      }
      
      console.log(chalk.cyan('\n📋 Epics:'));
      console.log(chalk.dim('━'.repeat(60)));
      
      epics.forEach(epic => {
        const statusColor = epic.status === 'in-progress' ? chalk.green : 
                           epic.status === 'completed' ? chalk.blue : chalk.yellow;
        const priorityColor = epic.priority === 'critical' ? chalk.red : 
                             epic.priority === 'high' ? chalk.yellow : chalk.blue;
        
        console.log(`\n${chalk.bold(epic.name)} (${epic.id})`);
        console.log(`Status: ${statusColor(epic.status)} | Priority: ${priorityColor(epic.priority)}`);
        console.log(`Effort: ${epic.estimatedEffort} points | Sprints: ${epic.sprints.length}`);
        if (epic.description) {
          console.log(`Description: ${epic.description}`);
        }
        if (epic.businessValue) {
          console.log(`Business Value: ${epic.businessValue}`);
        }
      });
    } catch (error) {
      console.error(chalk.red(`Failed to list epics: ${(error as Error).message}`));
    }
  }
  
  private async createSprint(name: string, options: any): Promise<void> {
    try {
      const sprint = await this.backlogManager.createSprint({
        epicId: options.epic,
        name,
        goal: options.goal || '',
        capacity: options.capacity || 20,
        startDate: options.start ? new Date(options.start) : new Date(),
        endDate: options.end ? new Date(options.end) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      });
      
      console.log(chalk.green(`Sprint "${name}" created with ID: ${sprint.id}`));
      console.log(chalk.cyan('\n📋 Sprint Details:'));
      console.log(`ID: ${sprint.id}`);
      console.log(`Goal: ${sprint.goal}`);
      console.log(`Capacity: ${sprint.capacity} points`);
      console.log(`Duration: ${sprint.startDate.toISOString().split('T')[0]} → ${sprint.endDate.toISOString().split('T')[0]}`);
    } catch (error) {
      console.error(chalk.red(`Failed to create sprint: ${(error as Error).message}`));
    }
  }
  
  private async startSprint(id: string): Promise<void> {
    // Implementation for starting sprint
    console.log(`Starting sprint: ${id}`);
  }
  
  private async completeSprint(id: string, options: any): Promise<void> {
    // Implementation for completing sprint
    console.log(`Completing sprint: ${id}`);
  }
  
  private async generateSprintReport(id: string, options: any): Promise<void> {
    // Implementation for sprint reporting
    console.log(`Generating report for sprint: ${id}`);
  }
  
  private async aiSprintPlan(options: any): Promise<void> {
    // Implementation for AI sprint planning
    console.log('AI Sprint Planning with options:', options);
  }
  
  private async aiEstimateTasks(taskIds: string[], options: any): Promise<void> {
    // Implementation for AI task estimation
    console.log('Estimating tasks:', taskIds);
  }
  
  private async analyzeVelocity(options: any): Promise<void> {
    // Implementation for velocity analysis
    console.log('Analyzing velocity with options:', options);
  }
  
  private async analyzeRisks(options: any): Promise<void> {
    // Implementation for risk analysis
    console.log('Analyzing risks with options:', options);
  }
  
  private async generateBurndown(sprintId: string, options: any): Promise<void> {
    // Implementation for burndown generation
    console.log(`Generating burndown for sprint: ${sprintId}`);
  }
  
  private async enableHook(type: string): Promise<void> {
    // Implementation for enabling hooks
    console.log(`Enabling hook: ${type}`);
  }
  
  private async disableHook(type: string): Promise<void> {
    // Implementation for disabling hooks
    console.log(`Disabling hook: ${type}`);
  }
  
  private async configureHooks(options: any): Promise<void> {
    // Implementation for configuring hooks
    console.log('Configuring hooks with options:', options);
  }
  
  private async testHooks(options: any): Promise<void> {
    // Implementation for testing hooks
    console.log('Testing hooks with options:', options);
  }
  
  /**
   * Show project status overview
   */
  private async showStatus(options: any): Promise<void> {
    await this.backlogManager.initialize();
    
    const stats = await this.backlogManager.getProjectStats();
    
    console.log(chalk.cyan('📊 Project Status Overview'));
    console.log(chalk.dim('━'.repeat(60)));
    
    console.log(`📋 Phases: ${stats.totalPhases}`);
    console.log(`📖 Epics: ${stats.totalEpics}`);
    console.log(`🏃 Sprints: ${stats.totalSprints}`);
    console.log(`✅ Tasks: ${stats.totalTasks}`);
    console.log(`🤖 AI Generated: ${stats.aiGeneratedTasks}`);
    
    if (options.detailed) {
      console.log(chalk.dim('━'.repeat(60)));
      
      const phases = await this.backlogManager.getPhases();
      for (const phase of phases) {
        const statusColor = phase.status === 'active' ? chalk.green : 
                           phase.status === 'completed' ? chalk.blue : chalk.yellow;
        
        console.log(`\n📋 ${chalk.bold(phase.name)} (${statusColor(phase.status)})`);
        console.log(`   ${phase.startDate.toISOString().split('T')[0]} → ${phase.endDate.toISOString().split('T')[0]}`);
        console.log(`   Epics: ${phase.epics.length}`);
      }
    }
    
    if (options.format === 'json') {
      console.log(JSON.stringify(stats, null, 2));
    } else if (options.format === 'markdown') {
      const markdown = await this.backlogManager.generateMarkdownSummary();
      console.log(markdown);
    }
  }
}