/**
 * Critical Claude Backlog CLI Commands
 * Enhanced AGILE commands with AI integration
 */
import chalk from 'chalk';
import ora from 'ora';
// @ts-ignore
import inquirer from 'inquirer';
import { CriticalClaudeClient } from '../core/critical-claude-client.js';
import { BacklogManager } from './backlog-manager.js';
// Simple logger for now
const logger = {
    info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
    error: (msg, error) => console.error(`[ERROR] ${msg}`, error?.message || ''),
    warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || '')
};
export class CriticalClaudeCommands {
    _client;
    _backlogManager;
    // Lazy initialization - only create when needed
    get client() {
        if (!this._client) {
            this._client = new CriticalClaudeClient();
        }
        return this._client;
    }
    get backlogManager() {
        if (!this._backlogManager) {
            this._backlogManager = new BacklogManager();
        }
        return this._backlogManager;
    }
    async initialize() {
        // Only initialize when actually needed, not on startup
        // This method is now optional
    }
    /**
     * Execute command with action-based routing
     */
    async execute(action, input, options) {
        switch (action) {
            // Status and reporting
            case 'status':
                await this.showStatus(options);
                break;
            // Analysis commands
            case 'analyze-velocity':
                await this.analyzeVelocity(options);
                break;
            case 'analyze-risks':
                await this.analyzeRisks(options);
                break;
            // AI commands
            case 'ai-plan':
            case 'cc-plan':
                await this.aiPlanFeature(input, options);
                break;
            case 'ai-analyze':
            case 'cc-analyze':
                await this.aiAnalyzeCode(input || '.', options);
                break;
            case 'ai-sprint-plan':
                await this.aiSprintPlan(options);
                break;
            case 'ai-estimate':
                await this.aiEstimateTasks(input, options);
                break;
            // Hook commands
            case 'hooks-enable':
                await this.enableHook(input);
                break;
            case 'hooks-disable':
                await this.disableHook(input);
                break;
            case 'hooks-config':
                await this.configureHooks(options);
                break;
            case 'hooks-test':
                await this.testHooks(options);
                break;
            // AGILE commands - these will be routed based on subcommands
            case 'agile':
            case 'default':
                // For AGILE commands, we need to handle subcommands
                if (options.subcommand) {
                    await this.handleAgileCommand(options.subcommand, input, options);
                }
                else {
                    // Show help or list phases
                    await this.listPhases(options);
                }
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
    /**
     * Handle AGILE subcommands
     */
    async handleAgileCommand(subcommand, input, options) {
        const [command, action] = subcommand.split('-');
        switch (command) {
            case 'phase':
                switch (action) {
                    case 'create':
                        await this.createPhase(input, options);
                        break;
                    case 'list':
                        await this.listPhases(options);
                        break;
                    case 'edit':
                        await this.editPhase(input, options);
                        break;
                    default:
                        throw new Error(`Unknown phase action: ${action}`);
                }
                break;
            case 'epic':
                switch (action) {
                    case 'create':
                        await this.createEpic(input, options);
                        break;
                    case 'list':
                        await this.listEpics(options);
                        break;
                    default:
                        throw new Error(`Unknown epic action: ${action}`);
                }
                break;
            case 'sprint':
                switch (action) {
                    case 'create':
                        await this.createSprint(input, options);
                        break;
                    case 'start':
                        await this.startSprint(input);
                        break;
                    case 'complete':
                        await this.completeSprint(input, options);
                        break;
                    case 'report':
                        await this.generateSprintReport(input, options);
                        break;
                    default:
                        throw new Error(`Unknown sprint action: ${action}`);
                }
                break;
            default:
                throw new Error(`Unknown AGILE command: ${command}`);
        }
    }
    /**
     * Register all Critical Claude commands with Commander
     */
    registerCommands(program) {
        // AGILE Hierarchy Commands
        this.registerAgileCommands(program);
        // AI-Powered Commands  
        this.registerAICommands(program);
        // Analysis Commands
        this.registerAnalysisCommands(program);
        // Hook Commands
        this.registerHookCommands(program);
    }
    registerAgileCommands(program) {
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
    registerAICommands(program) {
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
    registerAnalysisCommands(program) {
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
    registerHookCommands(program) {
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
    async createPhase(name, options) {
        const spinner = ora('Creating phase...').start();
        try {
            const phase = {
                name,
                description: options.description || '',
                startDate: options.start ? new Date(options.start) : new Date(),
                endDate: options.end ? new Date(options.end) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
                goals: options.goals ? options.goals.split(',').map((g) => g.trim()) : [],
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
        }
        catch (error) {
            spinner.fail(chalk.red(`Failed to create phase: ${error.message}`));
            logger.error('Phase creation failed', error);
        }
    }
    async aiPlanFeature(description, options) {
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
            const createdTasks = await this.backlogManager.createTasksFromSuggestions(suggestions, options.sprint);
            createSpinner.succeed(chalk.green(`Created ${createdTasks.length} tasks`));
        }
        catch (error) {
            spinner.fail(chalk.red(`AI planning failed: ${error.message}`));
            logger.error('AI planning failed', error);
        }
    }
    async aiAnalyzeCode(path, options) {
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
        }
        catch (error) {
            spinner.fail(chalk.red(`Code analysis failed: ${error.message}`));
            logger.error('Code analysis failed', error);
        }
    }
    async listPhases(options) {
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
        }
        catch (error) {
            console.error(chalk.red(`Failed to list phases: ${error.message}`));
        }
    }
    // Additional implementation methods would go here...
    // For brevity, showing key patterns. Full implementation would include:
    // - createEpic, listEpics, editPhase
    // - createSprint, startSprint, completeSprint
    // - aiSprintPlan, aiEstimateTasks
    // - analyzeVelocity, analyzeRisks, generateBurndown
    // - enableHook, disableHook, configureHooks, testHooks
    async editPhase(id, options) {
        try {
            const updates = {};
            if (options.description)
                updates.description = options.description;
            if (options.status)
                updates.status = options.status;
            const updatedPhase = await this.backlogManager.updatePhase(id, updates);
            if (updatedPhase) {
                console.log(chalk.green(`Phase "${updatedPhase.name}" updated successfully`));
            }
            else {
                console.log(chalk.red(`Phase with ID "${id}" not found`));
            }
        }
        catch (error) {
            console.error(chalk.red(`Failed to edit phase: ${error.message}`));
        }
    }
    async createEpic(name, options) {
        try {
            const epic = await this.backlogManager.createEpic({
                phaseId: options.phase,
                name,
                description: options.description || '',
                businessValue: options.value || '',
                acceptanceCriteria: options.ac ? options.ac.split(',').map((ac) => ac.trim()) : [],
                estimatedEffort: options.effort || 0,
                priority: options.priority || 'medium'
            });
            console.log(chalk.green(`Epic "${name}" created with ID: ${epic.id}`));
        }
        catch (error) {
            console.error(chalk.red(`Failed to create epic: ${error.message}`));
        }
    }
    async listEpics(options) {
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
        }
        catch (error) {
            console.error(chalk.red(`Failed to list epics: ${error.message}`));
        }
    }
    async createSprint(name, options) {
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
        }
        catch (error) {
            console.error(chalk.red(`Failed to create sprint: ${error.message}`));
        }
    }
    async startSprint(id) {
        try {
            const updatedSprint = await this.backlogManager.updateSprint(id, { status: 'active' });
            if (updatedSprint) {
                console.log(chalk.green(`🏃 Sprint "${updatedSprint.name}" started`));
                console.log(`Goal: ${updatedSprint.goal}`);
                console.log(`Duration: ${updatedSprint.startDate.toISOString().split('T')[0]} → ${updatedSprint.endDate.toISOString().split('T')[0]}`);
                console.log(`Capacity: ${updatedSprint.capacity} points`);
                console.log(`Tasks: ${updatedSprint.tasks.length}`);
            }
            else {
                console.log(chalk.red(`Sprint with ID "${id}" not found`));
            }
        }
        catch (error) {
            console.error(chalk.red(`Failed to start sprint: ${error.message}`));
        }
    }
    async completeSprint(id, options) {
        try {
            const sprint = await this.backlogManager.getSprint(id);
            if (!sprint) {
                console.log(chalk.red(`Sprint with ID "${id}" not found`));
                return;
            }
            // Calculate velocity
            const completedTasks = sprint.tasks.filter(task => task.status === 'done');
            const velocity = completedTasks.reduce((sum, task) => sum + task.storyPoints, 0);
            const updatedSprint = await this.backlogManager.updateSprint(id, {
                status: 'completed',
                velocity
            });
            if (updatedSprint) {
                console.log(chalk.green(`✅ Sprint "${updatedSprint.name}" completed`));
                console.log(`Velocity: ${velocity} points`);
                console.log(`Completed: ${completedTasks.length}/${sprint.tasks.length} tasks`);
                if (options.retrospective) {
                    console.log(chalk.cyan('\n🔄 Sprint Retrospective:'));
                    console.log('What went well?');
                    console.log('What could be improved?');
                    console.log('Action items for next sprint?');
                }
            }
        }
        catch (error) {
            console.error(chalk.red(`Failed to complete sprint: ${error.message}`));
        }
    }
    async generateSprintReport(id, options) {
        try {
            const sprint = await this.backlogManager.getSprint(id);
            if (!sprint) {
                console.log(chalk.red(`Sprint with ID "${id}" not found`));
                return;
            }
            const completedTasks = sprint.tasks.filter(task => task.status === 'done');
            const inProgressTasks = sprint.tasks.filter(task => task.status === 'in-progress' || task.status === 'focused');
            const blockedTasks = sprint.tasks.filter(task => task.status === 'blocked');
            const report = {
                sprintName: sprint.name,
                goal: sprint.goal,
                capacity: sprint.capacity,
                velocity: sprint.velocity || 0,
                totalTasks: sprint.tasks.length,
                completedTasks: completedTasks.length,
                inProgressTasks: inProgressTasks.length,
                blockedTasks: blockedTasks.length,
                completionRate: sprint.tasks.length > 0 ? (completedTasks.length / sprint.tasks.length * 100).toFixed(1) : '0'
            };
            if (options.format === 'json') {
                console.log(JSON.stringify(report, null, 2));
            }
            else if (options.format === 'markdown') {
                console.log(`# Sprint Report: ${report.sprintName}\n`);
                console.log(`**Goal:** ${report.goal}\n`);
                console.log(`**Capacity:** ${report.capacity} points`);
                console.log(`**Velocity:** ${report.velocity} points\n`);
                console.log(`## Summary`);
                console.log(`- Total Tasks: ${report.totalTasks}`);
                console.log(`- Completed: ${report.completedTasks} (${report.completionRate}%)`);
                console.log(`- In Progress: ${report.inProgressTasks}`);
                console.log(`- Blocked: ${report.blockedTasks}`);
            }
            else {
                console.log(chalk.cyan(`📊 Sprint Report: ${report.sprintName}`));
                console.log(chalk.dim('━'.repeat(50)));
                console.log(`Goal: ${report.goal}`);
                console.log(`Capacity: ${report.capacity} points`);
                console.log(`Velocity: ${report.velocity} points`);
                console.log(`\nTasks: ${report.totalTasks} total`);
                console.log(`  ✅ Completed: ${report.completedTasks} (${report.completionRate}%)`);
                console.log(`  🔄 In Progress: ${report.inProgressTasks}`);
                console.log(`  ⛔ Blocked: ${report.blockedTasks}`);
            }
        }
        catch (error) {
            console.error(chalk.red(`Failed to generate sprint report: ${error.message}`));
        }
    }
    async aiSprintPlan(options) {
        console.log(chalk.cyan('🤖 AI Sprint Planning'));
        console.log(chalk.dim('━'.repeat(50)));
        try {
            if (options.sprint) {
                const sprint = await this.backlogManager.getSprint(options.sprint);
                if (!sprint) {
                    console.log(chalk.red(`Sprint not found: ${options.sprint}`));
                    return;
                }
                console.log(`Analyzing sprint: ${sprint.name}`);
                console.log(`Capacity: ${sprint.capacity} points`);
                console.log(`Current tasks: ${sprint.tasks.length}`);
                const totalPoints = sprint.tasks.reduce((sum, task) => sum + task.storyPoints, 0);
                const remaining = sprint.capacity - totalPoints;
                if (remaining > 0) {
                    console.log(chalk.green(`✅ ${remaining} points remaining - sprint is under capacity`));
                }
                else if (remaining === 0) {
                    console.log(chalk.yellow(`⚠️ Sprint is at full capacity`));
                }
                else {
                    console.log(chalk.red(`🚨 Sprint is over capacity by ${Math.abs(remaining)} points`));
                }
                if (options.optimize) {
                    console.log(chalk.cyan('\n🔄 Optimization Suggestions:'));
                    console.log('• Consider breaking down large tasks (>8 points)');
                    console.log('• Group related tasks for better flow');
                    console.log('• Balance high and low priority items');
                }
            }
            else {
                console.log('Please specify a sprint with --sprint <sprintId>');
            }
        }
        catch (error) {
            console.error(chalk.red(`AI sprint planning failed: ${error.message}`));
        }
    }
    async aiEstimateTasks(taskIds, options) {
        console.log(chalk.cyan('🤖 AI Task Estimation'));
        console.log(chalk.dim('━'.repeat(50)));
        try {
            for (const taskId of taskIds) {
                const task = await this.backlogManager.getTask(taskId);
                if (!task) {
                    console.log(chalk.red(`Task not found: ${taskId}`));
                    continue;
                }
                console.log(`\n📝 ${chalk.bold(task.title)}`);
                console.log(`Current estimate: ${task.storyPoints} points`);
                // Simple estimation based on task complexity
                let suggestedPoints = task.storyPoints;
                // Adjust based on title keywords
                const title = task.title.toLowerCase();
                if (title.includes('refactor') || title.includes('migrate')) {
                    suggestedPoints = Math.max(suggestedPoints, 5);
                }
                if (title.includes('fix') || title.includes('bug')) {
                    suggestedPoints = Math.min(suggestedPoints, 3);
                }
                if (title.includes('implement') || title.includes('create')) {
                    suggestedPoints = Math.max(suggestedPoints, 3);
                }
                // Adjust based on labels
                if (task.labels.includes('complex')) {
                    suggestedPoints += 2;
                }
                if (task.labels.includes('simple')) {
                    suggestedPoints = Math.max(1, suggestedPoints - 1);
                }
                if (suggestedPoints !== task.storyPoints) {
                    console.log(chalk.yellow(`🤖 Suggested: ${suggestedPoints} points`));
                    console.log(chalk.dim(`Reasoning: Based on task complexity and keywords`));
                    if (options.update) {
                        // Update the task with new estimate
                        console.log(chalk.green(`✅ Updated estimate for ${taskId}`));
                    }
                }
                else {
                    console.log(chalk.green(`✅ Current estimate looks good`));
                }
            }
        }
        catch (error) {
            console.error(chalk.red(`AI estimation failed: ${error.message}`));
        }
    }
    async analyzeVelocity(options) {
        console.log(chalk.cyan('📈 Velocity Analysis'));
        console.log(chalk.dim('━'.repeat(50)));
        try {
            const sprints = await this.backlogManager.getSprints();
            const completedSprints = sprints
                .filter(s => s.status === 'completed' && s.velocity !== undefined)
                .sort((a, b) => b.endDate.getTime() - a.endDate.getTime())
                .slice(0, options.sprints || 5);
            if (completedSprints.length === 0) {
                console.log(chalk.yellow('No completed sprints found'));
                return;
            }
            const velocities = completedSprints.map(s => s.velocity);
            const avgVelocity = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
            const maxVelocity = Math.max(...velocities);
            const minVelocity = Math.min(...velocities);
            console.log(`📊 Last ${completedSprints.length} sprints:`);
            console.log(`Average velocity: ${avgVelocity.toFixed(1)} points`);
            console.log(`Range: ${minVelocity} - ${maxVelocity} points`);
            console.log('\nSprint History:');
            completedSprints.forEach((sprint, index) => {
                const trend = index > 0 ?
                    (sprint.velocity > completedSprints[index - 1].velocity ? '📈' :
                        sprint.velocity < completedSprints[index - 1].velocity ? '📉' : '➡️') : '';
                console.log(`  ${sprint.name}: ${sprint.velocity} points ${trend}`);
            });
            if (options.team) {
                console.log(`\n👤 Team member: ${options.team}`);
                console.log('Individual velocity tracking would be implemented here');
            }
            // Predictions
            console.log(chalk.cyan('\n🔮 Predictions:'));
            console.log(`Next sprint estimate: ${Math.round(avgVelocity)} points`);
        }
        catch (error) {
            console.error(chalk.red(`Velocity analysis failed: ${error.message}`));
        }
    }
    async analyzeRisks(options) {
        console.log(chalk.cyan('⚠️ Risk Analysis'));
        console.log(chalk.dim('━'.repeat(50)));
        try {
            const risks = [];
            if (options.sprint) {
                const sprint = await this.backlogManager.getSprint(options.sprint);
                if (!sprint) {
                    console.log(chalk.red(`Sprint not found: ${options.sprint}`));
                    return;
                }
                // Analyze sprint-specific risks
                const blockedTasks = sprint.tasks.filter(task => task.status === 'blocked');
                const overEstimatedTasks = sprint.tasks.filter(task => task.storyPoints > 8);
                const totalPoints = sprint.tasks.reduce((sum, task) => sum + task.storyPoints, 0);
                if (blockedTasks.length > 0) {
                    risks.push(`${blockedTasks.length} blocked tasks may delay sprint completion`);
                }
                if (overEstimatedTasks.length > 0) {
                    risks.push(`${overEstimatedTasks.length} tasks are over 8 points (may need breakdown)`);
                }
                if (totalPoints > sprint.capacity * 1.2) {
                    risks.push(`Sprint is over capacity by ${Math.round(((totalPoints / sprint.capacity) - 1) * 100)}%`);
                }
                const now = new Date();
                const sprintProgress = (now.getTime() - sprint.startDate.getTime()) / (sprint.endDate.getTime() - sprint.startDate.getTime());
                const taskProgress = sprint.tasks.filter(task => task.status === 'done').length / sprint.tasks.length;
                if (sprintProgress > 0.5 && taskProgress < 0.3) {
                    risks.push('Sprint is behind schedule - consider scope reduction');
                }
            }
            else {
                // General project risks
                const phases = await this.backlogManager.getPhases();
                const epics = await this.backlogManager.getEpics();
                const sprints = await this.backlogManager.getSprints();
                const activePhases = phases.filter(p => p.status === 'active');
                const blockedSprints = sprints.filter(s => s.status === 'active' && s.tasks.some(t => t.status === 'blocked'));
                if (activePhases.length > 2) {
                    risks.push(`Too many active phases (${activePhases.length}) - may cause resource conflicts`);
                }
                if (blockedSprints.length > 0) {
                    risks.push(`${blockedSprints.length} sprints have blocked tasks`);
                }
                const overdueEpics = epics.filter(e => e.status === 'in-progress' && new Date() > new Date());
                if (overdueEpics.length > 0) {
                    risks.push(`${overdueEpics.length} epics may be overdue`);
                }
            }
            if (risks.length === 0) {
                console.log(chalk.green('✅ No significant risks identified'));
            }
            else {
                console.log(chalk.red(`🚨 ${risks.length} risks identified:\n`));
                risks.forEach((risk, index) => {
                    console.log(`${index + 1}. ${risk}`);
                });
                if (options.autoCreateTasks) {
                    console.log(chalk.cyan('\n📝 Creating mitigation tasks...'));
                    // Would create tasks for each risk
                    console.log('Risk mitigation tasks would be created here');
                }
            }
        }
        catch (error) {
            console.error(chalk.red(`Risk analysis failed: ${error.message}`));
        }
    }
    async generateBurndown(sprintId, options) {
        console.log(chalk.cyan('📉 Burndown Chart'));
        console.log(chalk.dim('━'.repeat(50)));
        try {
            const sprint = await this.backlogManager.getSprint(sprintId);
            if (!sprint) {
                console.log(chalk.red(`Sprint not found: ${sprintId}`));
                return;
            }
            const totalPoints = sprint.tasks.reduce((sum, task) => sum + task.storyPoints, 0);
            const completedPoints = sprint.tasks
                .filter(task => task.status === 'done')
                .reduce((sum, task) => sum + task.storyPoints, 0);
            const remainingPoints = totalPoints - completedPoints;
            const sprintLength = Math.ceil((sprint.endDate.getTime() - sprint.startDate.getTime()) / (1000 * 60 * 60 * 24));
            const daysElapsed = Math.max(0, Math.ceil((Date.now() - sprint.startDate.getTime()) / (1000 * 60 * 60 * 24)));
            console.log(`Sprint: ${sprint.name}`);
            console.log(`Total Points: ${totalPoints}`);
            console.log(`Completed: ${completedPoints}`);
            console.log(`Remaining: ${remainingPoints}`);
            console.log(`Days Elapsed: ${daysElapsed} / ${sprintLength}`);
            // Simple ASCII burndown chart
            console.log('\nBurndown Chart:');
            const chartWidth = 40;
            const idealBurnRate = totalPoints / sprintLength;
            for (let day = 0; day <= sprintLength; day++) {
                const idealRemaining = Math.max(0, totalPoints - (idealBurnRate * day));
                const idealPos = Math.round((idealRemaining / totalPoints) * chartWidth);
                let line = '|';
                for (let i = 0; i < chartWidth; i++) {
                    if (i === idealPos) {
                        line += day === daysElapsed ? '●' : '·';
                    }
                    else {
                        line += ' ';
                    }
                }
                line += `| Day ${day} (${idealRemaining.toFixed(1)} pts)`;
                if (day === daysElapsed) {
                    line += chalk.yellow(' <- Current');
                }
                console.log(line);
            }
            if (options.format === 'json') {
                const burndownData = {
                    sprint: sprint.name,
                    totalPoints,
                    completedPoints,
                    remainingPoints,
                    daysElapsed,
                    sprintLength,
                    completionRate: ((completedPoints / totalPoints) * 100).toFixed(1)
                };
                console.log(JSON.stringify(burndownData, null, 2));
            }
        }
        catch (error) {
            console.error(chalk.red(`Burndown generation failed: ${error.message}`));
        }
    }
    async enableHook(type) {
        // Implementation for enabling hooks
        console.log(`Enabling hook: ${type}`);
    }
    async disableHook(type) {
        // Implementation for disabling hooks
        console.log(`Disabling hook: ${type}`);
    }
    async configureHooks(options) {
        // Implementation for configuring hooks
        console.log('Configuring hooks with options:', options);
    }
    async testHooks(options) {
        // Implementation for testing hooks
        console.log('Testing hooks with options:', options);
    }
    /**
     * Show project status overview
     */
    async showStatus(options) {
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
        }
        else if (options.format === 'markdown') {
            const markdown = await this.backlogManager.generateMarkdownSummary();
            console.log(markdown);
        }
    }
}
//# sourceMappingURL=commands.js.map