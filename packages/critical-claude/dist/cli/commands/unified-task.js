/**
 * Unified Task Command - Single entry point for all task management
 * Replaces BacklogManager, SimpleTaskManager, and MCP-task-simple commands
 */
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as toml from 'toml';
import { UnifiedStorageManager } from '../../core/unified-storage.js';
import { AITaskManager } from '../../core/ai-task-manager.js';
import { UnifiedHookManager } from '../../core/unified-hook-manager.js';
export class UnifiedTaskCommand {
    storage;
    aiManager;
    hookManager;
    constructor() {
        this.storage = new UnifiedStorageManager({
            migrationEnabled: true,
            backupEnabled: true,
            autoCleanup: false
        });
        this.aiManager = new AITaskManager(this.storage);
        this.hookManager = new UnifiedHookManager(this.storage);
    }
    async execute(action, input, options) {
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
                case 'template':
                    await this.handleTemplate(input, options);
                    break;
                default:
                    console.log(this.getUsageHelp());
            }
        }
        catch (error) {
            console.error(chalk.red('❌ Error:'), error.message);
        }
    }
    async createTask(titleInput, options) {
        const title = Array.isArray(titleInput) ? titleInput.join(' ') : titleInput || '';
        if (!title.trim()) {
            throw new Error('Task title is required');
        }
        // Parse natural language if enabled
        const parsedInput = this.parseNaturalLanguage(title, options);
        const input = {
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
    async listTasks(options) {
        const filter = {
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
        const listOptions = {
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
        }
        else {
            console.log(chalk.cyan(`📋 Found ${tasks.length} tasks:\n`));
            for (const task of tasks) {
                console.log(this.formatTaskListItem(task));
            }
            console.log(chalk.gray(`\nUse "cc task view <id>" to see details`));
        }
    }
    async viewTask(taskIdInput, options) {
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
        }
        else {
            console.log(this.formatTaskDetails(task));
        }
    }
    async editTask(taskIdInput, options) {
        const taskId = Array.isArray(taskIdInput) ? taskIdInput[0] : taskIdInput;
        if (!taskId) {
            throw new Error('Task ID is required');
        }
        const updateInput = {
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
            if (updateInput[key] === undefined) {
                delete updateInput[key];
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
    async deleteTask(taskIdInput, options) {
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
        }
        else {
            console.log(chalk.red(`❌ Failed to delete task: ${taskId}`));
        }
    }
    async archiveTask(taskIdInput, options) {
        const taskId = Array.isArray(taskIdInput) ? taskIdInput[0] : taskIdInput;
        if (!taskId) {
            throw new Error('Task ID is required');
        }
        const archivedTask = await this.storage.archiveTask(taskId);
        if (archivedTask) {
            console.log(chalk.green(`📦 Archived task: ${archivedTask.title} (${taskId})`));
        }
        else {
            console.log(chalk.red(`❌ Task not found: ${taskId}`));
        }
    }
    async createAITask(textInput, options) {
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
        }
        catch (error) {
            console.error(chalk.red('❌ AI task generation failed:'), error.message);
            // Fallback to simple AI parsing
            const aiParsed = this.parseAIText(text);
            const input = {
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
    async expandTask(taskIdInput, options) {
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
        }
        catch (error) {
            console.error(chalk.red('❌ Task expansion failed:'), error.message);
        }
    }
    async estimateTask(taskIdInput, options) {
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
        }
        else {
            console.log(chalk.gray('\n💡 Use --apply to update the task with these estimates'));
        }
    }
    async analyzeDependencies(options) {
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
        }
        catch (error) {
            console.error(chalk.red('❌ Dependency analysis failed:'), error.message);
        }
    }
    async showStats(options) {
        const stats = await this.storage.getStats();
        if (options.plain) {
            console.log(JSON.stringify(stats, null, 2));
        }
        else {
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
    async initializeSystem(options) {
        await this.storage.initialize();
        console.log(chalk.green('✅ Unified task system initialized!'));
        console.log(chalk.gray('\nTry these commands:'));
        console.log('  cc task create "My first task"');
        console.log('  cc task ai "Build login system"');
        console.log('  cc task list');
    }
    async createBackup(options) {
        const backupPath = await this.storage.backup();
        console.log(chalk.green(`✅ Backup created: ${backupPath}`));
    }
    // Utility methods
    parseNaturalLanguage(title, options) {
        const parsed = {
            title: title,
            description: '',
            priority: 'medium',
            assignee: undefined,
            labels: [],
            storyPoints: undefined
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
    parseAIText(text) {
        // Simple AI text parsing - can be enhanced with actual AI
        return {
            title: text.length > 50 ? text.substring(0, 47) + '...' : text,
            description: text,
            priority: text.toLowerCase().includes('urgent') || text.toLowerCase().includes('critical') ? 'high' : 'medium',
            labels: this.extractLabelsFromText(text),
            storyPoints: this.estimateStoryPoints(text)
        };
    }
    extractLabelsFromText(text) {
        const labels = [];
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
    estimateStoryPoints(text) {
        const length = text.length;
        const complexity = text.toLowerCase();
        let points = 2; // Default
        if (length > 200)
            points += 1;
        if (length > 500)
            points += 2;
        if (complexity.includes('complex') || complexity.includes('integration'))
            points += 2;
        if (complexity.includes('simple') || complexity.includes('minor'))
            points -= 1;
        if (complexity.includes('major') || complexity.includes('system'))
            points += 3;
        return Math.max(1, Math.min(13, points)); // Keep in Fibonacci range
    }
    normalizeStatus(status) {
        const statusMap = {
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
    formatTaskListItem(task) {
        const statusIcon = this.getStatusIcon(task.status);
        const priorityColor = this.getPriorityColor(task.priority);
        const labelsText = task.labels.length > 0 ? ` ${chalk.gray(task.labels.map(l => `#${l}`).join(' '))}` : '';
        const assigneeText = task.assignee ? ` ${chalk.blue(`@${task.assignee}`)}` : '';
        const pointsText = task.storyPoints ? ` ${chalk.cyan(`[${task.storyPoints}pts]`)}` : '';
        return `${statusIcon} ${priorityColor(task.title)} ${chalk.gray(`(${task.id})`)}${labelsText}${assigneeText}${pointsText}`;
    }
    formatTaskSummary(task) {
        let summary = '';
        summary += `ID: ${task.id}\n`;
        summary += `Status: ${task.status}\n`;
        summary += `Priority: ${task.priority}\n`;
        if (task.assignee)
            summary += `Assignee: ${task.assignee}\n`;
        if (task.labels.length > 0)
            summary += `Labels: ${task.labels.join(', ')}\n`;
        if (task.storyPoints)
            summary += `Story Points: ${task.storyPoints}\n`;
        summary += `Created: ${new Date(task.createdAt).toLocaleDateString()}\n`;
        return chalk.gray(summary);
    }
    formatTaskDetails(task) {
        const statusIcon = this.getStatusIcon(task.status);
        const priorityColor = this.getPriorityColor(task.priority);
        let output = chalk.cyan('\n📋 Task Details:\n');
        output += `${statusIcon} ${priorityColor(task.title)}\n`;
        output += `ID: ${task.id}\n`;
        output += `Status: ${task.status}\n`;
        output += `Priority: ${task.priority}\n`;
        if (task.assignee)
            output += `Assignee: ${task.assignee}\n`;
        if (task.description)
            output += `Description: ${task.description}\n`;
        if (task.labels.length > 0)
            output += `Labels: ${task.labels.join(', ')}\n`;
        if (task.storyPoints)
            output += `Story Points: ${task.storyPoints}\n`;
        if (task.estimatedHours)
            output += `Estimated Hours: ${task.estimatedHours}\n`;
        if (task.actualHours)
            output += `Actual Hours: ${task.actualHours}\n`;
        if (task.sprintId)
            output += `Sprint: ${task.sprintId}\n`;
        if (task.epicId)
            output += `Epic: ${task.epicId}\n`;
        if (task.phaseId)
            output += `Phase: ${task.phaseId}\n`;
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
    getStatusIcon(status) {
        const icons = {
            'todo': '📝',
            'in_progress': '🔄',
            'done': '✅',
            'blocked': '🚫',
            'archived': '📦'
        };
        return icons[status] || '❓';
    }
    getPriorityColor(priority) {
        const colors = {
            'critical': chalk.red,
            'high': chalk.red,
            'medium': chalk.yellow,
            'low': chalk.gray
        };
        return colors[priority] || chalk.white;
    }
    getEmptyStateMessage() {
        return `📭 No tasks found.

🚀 Quick Start:
  cc task create "My first task"     - Create a simple task
  cc task ai "Build login system"   - AI generates tasks from description
  
💡 The unified task system supports both simple and complex AGILE workflows.`;
    }
    getUsageHelp() {
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
  template               Load project task templates

Template Commands:
  template list          List available templates
  template <name>        Load template with default variables
  template show <name>   View template details
  template create <name> Create a new template

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
  
Template Examples:
  cc task template webapp --framework react --database postgres
  cc task template api --auth_method oauth2
  cc task template mobile-app --platform flutter
  
Natural Language:
  cc task create "Fix urgent bug @high #security 3pts for:alice"
  
For more help: https://critical-claude.dev/docs/tasks`;
    }
    // Template System Implementation
    async handleTemplate(input, options) {
        const subCommand = Array.isArray(input) ? input[0] : input;
        const templateName = Array.isArray(input) && input.length > 1 ? input[1] : undefined;
        switch (subCommand) {
            case 'list':
            case 'ls':
                await this.listTemplates(options);
                break;
            case 'show':
            case 'view':
                if (!templateName) {
                    throw new Error('Template name required. Usage: cc task template show <name>');
                }
                await this.showTemplate(templateName, options);
                break;
            case 'create':
                if (!templateName) {
                    throw new Error('Template name required. Usage: cc task template create <name>');
                }
                await this.createTemplate(templateName, options);
                break;
            default:
                // If no subcommand, treat input as template name to load
                if (!subCommand) {
                    throw new Error('Template name required. Usage: cc task template <name>');
                }
                await this.loadTemplate(subCommand, options);
                break;
        }
    }
    getTemplatesDir() {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        return path.join(__dirname, '..', '..', '..', 'templates');
    }
    async listTemplates(options) {
        const templatesDir = this.getTemplatesDir();
        if (!fs.existsSync(templatesDir)) {
            console.log(chalk.yellow('No templates directory found.'));
            return;
        }
        const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.toml'));
        if (files.length === 0) {
            console.log(chalk.yellow('No templates found.'));
            console.log(chalk.gray('Create templates in: ' + templatesDir));
            return;
        }
        console.log(chalk.cyan('📚 Available Task Templates:\n'));
        for (const file of files) {
            const templatePath = path.join(templatesDir, file);
            try {
                const content = fs.readFileSync(templatePath, 'utf8');
                const template = toml.parse(content);
                const name = path.basename(file, '.toml');
                console.log(chalk.green(`  ${name}`));
                if (template.metadata) {
                    console.log(chalk.gray(`    ${template.metadata.description || 'No description'}`));
                    if (template.metadata.tags) {
                        console.log(chalk.gray(`    Tags: ${template.metadata.tags.join(', ')}`));
                    }
                }
                console.log('');
            }
            catch (error) {
                console.log(chalk.red(`  ${file} (invalid template)`));
            }
        }
        console.log(chalk.gray('Usage: cc task template <name> [--var=value ...]'));
    }
    async showTemplate(name, options) {
        const templatePath = path.join(this.getTemplatesDir(), `${name}.toml`);
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template not found: ${name}`);
        }
        const content = fs.readFileSync(templatePath, 'utf8');
        const template = toml.parse(content);
        console.log(chalk.cyan(`📋 Template: ${name}\n`));
        if (template.metadata) {
            console.log(chalk.yellow('Metadata:'));
            console.log(`  Description: ${template.metadata.description || 'None'}`);
            console.log(`  Version: ${template.metadata.version || '1.0.0'}`);
            console.log(`  Difficulty: ${template.metadata.difficulty || 'intermediate'}`);
            console.log(`  Estimated: ${template.metadata.estimated_weeks || '?'} weeks`);
            console.log(`  Team Size: ${template.metadata.team_size || '?'} developers`);
            if (template.metadata.extends) {
                console.log(`  Extends: ${template.metadata.extends}`);
            }
            console.log('');
        }
        if (template.variables) {
            console.log(chalk.yellow('Variables:'));
            for (const [key, defaultValue] of Object.entries(template.variables)) {
                console.log(`  ${key}: ${defaultValue}`);
            }
            console.log('');
        }
        if (template.phases) {
            console.log(chalk.yellow('Phases:'));
            for (const [key, description] of Object.entries(template.phases)) {
                console.log(`  ${key}: ${description}`);
            }
            console.log('');
        }
        let taskCount = 0;
        if (template.tasks) {
            for (const [phase, tasks] of Object.entries(template.tasks)) {
                if (Array.isArray(tasks)) {
                    taskCount += tasks.length;
                }
            }
        }
        console.log(chalk.yellow(`Total Tasks: ${taskCount}`));
        console.log(chalk.gray('\nUsage: cc task template ' + name + ' [--var=value ...]'));
    }
    async loadTemplate(name, options) {
        const templatePath = path.join(this.getTemplatesDir(), `${name}.toml`);
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template not found: ${name}. Use 'cc task template list' to see available templates.`);
        }
        console.log(chalk.cyan(`📋 Loading template: ${name}`));
        const content = fs.readFileSync(templatePath, 'utf8');
        let template = toml.parse(content);
        // Handle template inheritance
        if (template.metadata?.extends) {
            console.log(chalk.gray(`  Extending: ${template.metadata.extends}`));
            const baseTemplate = await this.loadTemplateData(template.metadata.extends);
            template = this.mergeTemplates(baseTemplate, template);
        }
        // Prepare variables
        const variables = { ...template.variables };
        // Override with command-line variables
        for (const [key, value] of Object.entries(options)) {
            if (key !== '_' && key !== 'plain' && key !== 'mode') {
                variables[key] = value;
            }
        }
        console.log(chalk.cyan('\n🔧 Using variables:'));
        for (const [key, value] of Object.entries(variables)) {
            console.log(chalk.gray(`  ${key}: ${value}`));
        }
        // Create tasks from template
        const createdTasks = [];
        const phaseTaskMap = {};
        // Process tasks by phase
        if (template.tasks) {
            for (const [phase, tasks] of Object.entries(template.tasks)) {
                if (!Array.isArray(tasks))
                    continue;
                phaseTaskMap[phase] = [];
                for (let i = 0; i < tasks.length; i++) {
                    const taskTemplate = tasks[i];
                    const taskId = `${phase}-${i + 1}`;
                    // Replace variables in task fields
                    const processedTask = this.replaceVariables(taskTemplate, variables);
                    // Create task input
                    const createInput = {
                        title: processedTask.title,
                        description: processedTask.description,
                        priority: processedTask.priority || 'medium',
                        status: 'todo',
                        labels: [...(processedTask.labels || []), 'template', `template:${name}`],
                        storyPoints: processedTask.story_points,
                        estimatedHours: processedTask.estimated_hours,
                        aiGenerated: false,
                        source: 'manual'
                    };
                    // Create the task
                    const task = await this.storage.createTask(createInput);
                    createdTasks.push(task);
                    phaseTaskMap[phase].push(task);
                    // Store mapping for dependency resolution
                    processedTask._taskId = task.id;
                    processedTask._phaseTaskId = taskId;
                }
            }
        }
        // Resolve and apply dependencies
        await this.resolveDependencies(template, phaseTaskMap);
        // Trigger hook sync
        await this.hookManager.syncToClaude();
        // Display summary
        console.log(chalk.green(`\n✅ Created ${createdTasks.length} tasks from template: ${name}`));
        if (template.phases) {
            console.log(chalk.cyan('\n📊 Tasks by phase:'));
            for (const [phase, description] of Object.entries(template.phases)) {
                const phaseTasks = phaseTaskMap[phase] || [];
                console.log(chalk.yellow(`\n${description} (${phaseTasks.length} tasks):`));
                phaseTasks.forEach(task => {
                    console.log(`  ${this.formatTaskListItem(task)}`);
                });
            }
        }
        else {
            console.log(chalk.cyan('\n📝 Created tasks:'));
            createdTasks.forEach(task => {
                console.log(`  ${this.formatTaskListItem(task)}`);
            });
        }
        console.log(chalk.gray('\nUse "cc task list" to see all tasks'));
    }
    async loadTemplateData(name) {
        const templatePath = path.join(this.getTemplatesDir(), `${name}.toml`);
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Base template not found: ${name}`);
        }
        const content = fs.readFileSync(templatePath, 'utf8');
        return toml.parse(content);
    }
    mergeTemplates(base, extension) {
        const merged = JSON.parse(JSON.stringify(base)); // Deep clone
        if (extension.metadata) {
            merged.metadata = { ...merged.metadata, ...extension.metadata };
        }
        if (extension.variables) {
            merged.variables = { ...merged.variables, ...extension.variables };
        }
        if (extension.phases) {
            merged.phases = { ...merged.phases, ...extension.phases };
        }
        if (extension.tasks) {
            if (!merged.tasks)
                merged.tasks = {};
            for (const [phase, tasks] of Object.entries(extension.tasks)) {
                if (!merged.tasks[phase]) {
                    merged.tasks[phase] = [];
                }
                if (Array.isArray(tasks)) {
                    merged.tasks[phase] = [...(merged.tasks[phase] || []), ...tasks];
                }
            }
        }
        return merged;
    }
    replaceVariables(obj, variables) {
        if (typeof obj === 'string') {
            return obj.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
                return variables[varName] !== undefined ? variables[varName] : match;
            });
        }
        else if (Array.isArray(obj)) {
            return obj.map(item => this.replaceVariables(item, variables));
        }
        else if (typeof obj === 'object' && obj !== null) {
            const result = {};
            for (const [key, value] of Object.entries(obj)) {
                result[key] = this.replaceVariables(value, variables);
            }
            return result;
        }
        return obj;
    }
    async resolveDependencies(template, phaseTaskMap) {
        if (!template.tasks)
            return;
        const taskIdMap = {};
        // Build task ID mapping
        for (const [phase, tasks] of Object.entries(phaseTaskMap)) {
            tasks.forEach((task, index) => {
                taskIdMap[`${phase}-${index + 1}`] = task.id;
            });
        }
        // Also support simple numeric IDs
        let globalIndex = 1;
        for (const tasks of Object.values(phaseTaskMap)) {
            for (const task of tasks) {
                taskIdMap[globalIndex.toString()] = task.id;
                globalIndex++;
            }
        }
        // Apply dependencies
        for (const [phase, templateTasks] of Object.entries(template.tasks)) {
            if (!Array.isArray(templateTasks))
                continue;
            const phaseTasks = phaseTaskMap[phase] || [];
            for (let i = 0; i < templateTasks.length; i++) {
                const taskTemplate = templateTasks[i];
                const task = phaseTasks[i];
                if (!task || !taskTemplate.dependencies)
                    continue;
                const resolvedDeps = [];
                for (const dep of taskTemplate.dependencies) {
                    const resolvedId = taskIdMap[dep];
                    if (resolvedId) {
                        resolvedDeps.push(resolvedId);
                    }
                    else {
                        console.warn(chalk.yellow(`⚠️  Could not resolve dependency: ${dep}`));
                    }
                }
                if (resolvedDeps.length > 0) {
                    await this.storage.updateTask({
                        id: task.id,
                        dependencies: resolvedDeps
                    });
                }
            }
        }
    }
    async createTemplate(name, options) {
        const templatePath = path.join(this.getTemplatesDir(), `${name}.toml`);
        if (fs.existsSync(templatePath) && !options.force) {
            throw new Error(`Template already exists: ${name}. Use --force to overwrite.`);
        }
        const template = `# ${name} Template
[metadata]
name = "${name}"
description = "TODO: Add description"
version = "1.0.0"
difficulty = "intermediate"
estimated_weeks = 4
team_size = 3
tags = ["custom"]

[variables]
project_name = "${name}"
# Add more variables as needed

[phases]
planning = "Planning & Design"
implementation = "Core Implementation"
testing = "Testing & Polish"

[tasks]

[[tasks.planning]]
title = "Define project requirements"
description = "Gather and document all project requirements"
priority = "critical"
labels = ["planning", "requirements"]
phase = "planning"
story_points = 3
estimated_hours = 5

[[tasks.planning]]
title = "Create technical design"
description = "Design system architecture and technical approach"
priority = "high"
labels = ["planning", "architecture"]
phase = "planning"
story_points = 5
estimated_hours = 8
dependencies = ["planning-1"]

# Add more tasks as needed
`;
        // Ensure templates directory exists
        const templatesDir = this.getTemplatesDir();
        if (!fs.existsSync(templatesDir)) {
            fs.mkdirSync(templatesDir, { recursive: true });
        }
        fs.writeFileSync(templatePath, template);
        console.log(chalk.green(`✅ Created template: ${name}`));
        console.log(chalk.gray(`Edit template at: ${templatePath}`));
    }
}
//# sourceMappingURL=unified-task.js.map