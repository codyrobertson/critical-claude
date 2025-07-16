/**
 * Simple Task Command - Lightweight task management for small teams
 * Bypasses complex AGILE hierarchy for direct task operations
 */
import chalk from 'chalk';
import { SimpleTaskManager } from '../simple-task-manager.js';
export class SimpleTaskCommand {
    taskManager;
    constructor() {
        this.taskManager = new SimpleTaskManager();
    }
    async execute(action, input, options) {
        await this.taskManager.initialize();
        switch (action) {
            case 'create':
                await this.createTask(input, options);
                break;
            case 'list':
                await this.listTasks(options);
                break;
            case 'update':
                await this.updateTask(input, options);
                break;
            case 'delete':
                await this.deleteTask(input);
                break;
            case 'stats':
                await this.showStats();
                break;
            case 'archive':
                await this.archiveOldTasks();
                break;
            case 'assign':
                await this.showTasksByAssignee();
                break;
            default:
                await this.listTasks(options);
        }
    }
    async createTask(input, options) {
        const title = Array.isArray(input) ? input.join(' ') : input || 'New Task';
        // Parse priority from title (e.g., "Fix bug @high")
        const priorityMatch = title.match(/@(critical|high|medium|low)/i);
        const priority = priorityMatch ? priorityMatch[1].toLowerCase() : options.priority || 'medium';
        const cleanTitle = title.replace(/@(critical|high|medium|low)/gi, '').trim();
        const taskData = {
            title: cleanTitle,
            description: options.description || '',
            priority,
            assignee: options.assignee,
            storyPoints: parseInt(options.points) || 1,
            labels: options.labels || [],
            dueDate: options.due ? new Date(options.due) : undefined
        };
        const task = await this.taskManager.createTask(taskData);
        console.log(chalk.green('✅ Task created successfully!'));
        console.log(chalk.blue(`   ID: ${task.id}`));
        console.log(chalk.blue(`   Title: ${task.title}`));
        console.log(chalk.blue(`   Priority: ${task.priority}`));
        console.log(chalk.blue(`   Story Points: ${task.storyPoints}`));
        if (task.assignee) {
            console.log(chalk.blue(`   Assignee: ${task.assignee}`));
        }
        if (task.dueDate) {
            console.log(chalk.blue(`   Due: ${task.dueDate.toDateString()}`));
        }
    }
    async listTasks(options) {
        const filters = {};
        if (options.status)
            filters.status = options.status;
        if (options.assignee)
            filters.assignee = options.assignee;
        if (options.priority)
            filters.priority = options.priority;
        if (options.labels)
            filters.labels = Array.isArray(options.labels) ? options.labels : [options.labels];
        const tasks = await this.taskManager.listTasks(filters);
        if (tasks.length === 0) {
            console.log(chalk.yellow('📭 No tasks found'));
            if (Object.keys(filters).length > 0) {
                console.log(chalk.gray('   Try removing some filters'));
            }
            return;
        }
        console.log(chalk.bold.cyan(`\n📋 Tasks (${tasks.length} found)`));
        console.log(chalk.gray('═══════════════════════════════════════════════'));
        const statusEmoji = {
            todo: '📝',
            'in-progress': '🚀',
            blocked: '🚫',
            done: '✅',
            archived: '📦'
        };
        const priorityColor = {
            critical: chalk.red.bold,
            high: chalk.red,
            medium: chalk.yellow,
            low: chalk.gray
        };
        for (const task of tasks) {
            const emoji = statusEmoji[task.status] || '❓';
            const priorityText = priorityColor[task.priority](`[${task.priority.toUpperCase()}]`);
            const pointsText = chalk.cyan(`(${task.storyPoints}pt)`);
            const assigneeText = task.assignee ? chalk.blue(`@${task.assignee}`) : '';
            const dueDateText = task.dueDate ?
                (task.dueDate < new Date() ? chalk.red(`⏰ ${task.dueDate.toDateString()}`) : chalk.green(`📅 ${task.dueDate.toDateString()}`)) : '';
            console.log(`${emoji} ${priorityText} ${pointsText} ${task.title} ${assigneeText} ${dueDateText}`);
            if (options.verbose && task.description) {
                console.log(chalk.gray(`   ${task.description}`));
            }
            if (task.labels.length > 0) {
                console.log(chalk.gray(`   Tags: ${task.labels.map(l => `#${l}`).join(' ')}`));
            }
            console.log(chalk.gray(`   ID: ${task.id} | Created: ${task.createdAt.toDateString()}`));
            console.log('');
        }
    }
    async updateTask(input, options) {
        const taskId = input[0];
        if (!taskId) {
            console.log(chalk.red('❌ Task ID required'));
            return;
        }
        const updates = {};
        if (options.title)
            updates.title = options.title;
        if (options.description)
            updates.description = options.description;
        if (options.status)
            updates.status = options.status;
        if (options.priority)
            updates.priority = options.priority;
        if (options.assignee)
            updates.assignee = options.assignee;
        if (options.points)
            updates.storyPoints = parseInt(options.points);
        if (options.due)
            updates.dueDate = new Date(options.due);
        if (options.labels)
            updates.labels = Array.isArray(options.labels) ? options.labels : [options.labels];
        try {
            const updatedTask = await this.taskManager.updateTask(taskId, updates);
            console.log(chalk.green('✅ Task updated successfully!'));
            console.log(chalk.blue(`   ${updatedTask.title}`));
            console.log(chalk.blue(`   Status: ${updatedTask.status}`));
            console.log(chalk.blue(`   Priority: ${updatedTask.priority}`));
        }
        catch (error) {
            console.log(chalk.red(`❌ ${error.message}`));
        }
    }
    async deleteTask(input) {
        const taskId = input[0];
        if (!taskId) {
            console.log(chalk.red('❌ Task ID required'));
            return;
        }
        try {
            await this.taskManager.deleteTask(taskId);
            console.log(chalk.green('✅ Task deleted successfully!'));
        }
        catch (error) {
            console.log(chalk.red(`❌ ${error.message}`));
        }
    }
    async showStats() {
        const stats = await this.taskManager.getStats();
        console.log(chalk.bold.cyan('\n📊 Task Statistics'));
        console.log(chalk.gray('═══════════════════════'));
        console.log(chalk.blue(`Total Tasks: ${stats.totalTasks}`));
        console.log(chalk.yellow(`📝 Todo: ${stats.todoTasks}`));
        console.log(chalk.cyan(`🚀 In Progress: ${stats.inProgressTasks}`));
        console.log(chalk.green(`✅ Done: ${stats.doneTasks}`));
        console.log(chalk.red(`🚫 Blocked: ${stats.blockedTasks}`));
        if (stats.overdueTasks > 0) {
            console.log(chalk.red.bold(`⏰ Overdue: ${stats.overdueTasks}`));
        }
        console.log(chalk.gray(`📈 Avg Story Points: ${stats.averageStoryPoints.toFixed(1)}`));
    }
    async archiveOldTasks() {
        const archivedCount = await this.taskManager.archiveOldTasks();
        console.log(chalk.green(`✅ Archived ${archivedCount} old completed tasks`));
    }
    async showTasksByAssignee() {
        const tasksByAssignee = await this.taskManager.getTasksByAssignee();
        console.log(chalk.bold.cyan('\n👥 Tasks by Assignee'));
        console.log(chalk.gray('═══════════════════════'));
        for (const [assignee, tasks] of Object.entries(tasksByAssignee)) {
            console.log(chalk.bold.blue(`\n${assignee} (${tasks.length} tasks):`));
            for (const task of tasks) {
                const priorityColor = {
                    critical: chalk.red.bold,
                    high: chalk.red,
                    medium: chalk.yellow,
                    low: chalk.gray
                };
                const priorityText = priorityColor[task.priority](`[${task.priority}]`);
                console.log(`  • ${priorityText} ${task.title} (${task.storyPoints}pt)`);
            }
        }
    }
}
//# sourceMappingURL=simple-task.js.map