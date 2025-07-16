/**
 * Simple Task UI - No complex terminal handling, just works
 */
import chalk from 'chalk';
import { BacklogManager } from '../backlog-manager.js';
export class SimpleTaskUICommand {
    backlogManager;
    constructor() {
        this.backlogManager = new BacklogManager();
    }
    async execute(action, input, options) {
        await this.backlogManager.initialize();
        if (action === 'list' || action === 'ls') {
            await this.listTasks();
            return;
        }
        if (action === 'show' && input) {
            await this.showTask(input);
            return;
        }
        // Interactive menu
        await this.showMenu();
    }
    async listTasks() {
        const tasks = await this.backlogManager.listTasks();
        if (tasks.length === 0) {
            console.log(chalk.yellow('📭 No tasks found'));
            return;
        }
        console.log(chalk.cyan('\n📋 Tasks'));
        console.log(chalk.gray('─'.repeat(60)));
        tasks.forEach((task, index) => {
            const priority = this.getPriorityBadge(task.priority);
            const status = this.getStatusBadge(task.status);
            const id = task.id.substring(0, 8);
            console.log(`${index + 1}. ${status} ${priority} ${chalk.bold(task.title)}`);
            console.log(chalk.dim(`    ${id} • ${task.storyPoints} pts • ${task.assignee || 'unassigned'}`));
            if (task.description && task.description.length > 0) {
                const desc = task.description.length > 80 ?
                    task.description.substring(0, 77) + '...' :
                    task.description;
                console.log(chalk.gray(`    ${desc}`));
            }
            console.log();
        });
        console.log(chalk.dim(`\nTotal: ${tasks.length} tasks`));
    }
    async showTask(taskId) {
        const tasks = await this.backlogManager.listTasks();
        const searchId = Array.isArray(taskId) ? taskId[0] : taskId;
        const task = tasks.find(t => t.id.startsWith(searchId) || t.title.toLowerCase().includes(searchId.toLowerCase()));
        if (!task) {
            console.log(chalk.red(`❌ Task not found: ${searchId}`));
            return;
        }
        console.log(chalk.cyan('\n📝 Task Details'));
        console.log(chalk.gray('─'.repeat(60)));
        console.log(chalk.bold.white(task.title));
        console.log();
        console.log(`${chalk.blue('Status:')} ${this.getStatusBadge(task.status)} ${this.getStatusWithColor(task.status)}`);
        console.log(`${chalk.blue('Priority:')} ${this.getPriorityBadge(task.priority)} ${this.getPriorityWithColor(task.priority)}`);
        console.log(`${chalk.blue('Points:')} ${task.storyPoints}`);
        console.log(`${chalk.blue('Assignee:')} ${task.assignee || chalk.gray('unassigned')}`);
        console.log(`${chalk.blue('Created:')} ${new Date(task.createdAt).toLocaleDateString()}`);
        console.log(`${chalk.blue('ID:')} ${chalk.dim(task.id)}`);
        if (task.labels && task.labels.length > 0) {
            console.log(`${chalk.blue('Labels:')} ${task.labels.map(l => chalk.cyan('#' + l)).join(' ')}`);
        }
        if (task.description) {
            console.log(`\n${chalk.blue('Description:')}`);
            console.log(task.description);
        }
    }
    async showMenu() {
        const tasks = await this.backlogManager.listTasks();
        console.log(chalk.cyan('\n🚀 Critical Claude Task Manager'));
        console.log(chalk.gray('═'.repeat(50)));
        // Quick stats
        const stats = this.getTaskStats(tasks);
        console.log(`📊 ${chalk.bold(stats.total)} tasks • ${chalk.green(stats.done)} done • ${chalk.blue(stats.active)} active`);
        console.log();
        // Recent tasks
        const recentTasks = tasks.slice(0, 5);
        if (recentTasks.length > 0) {
            console.log(chalk.yellow('📋 Recent Tasks:'));
            recentTasks.forEach((task, index) => {
                const priority = this.getPriorityBadge(task.priority);
                const status = this.getStatusBadge(task.status);
                const id = task.id.substring(0, 8);
                console.log(`  ${index + 1}. ${status} ${priority} ${task.title} ${chalk.dim('(' + id + ')')}`);
            });
            console.log();
        }
        // Simple commands
        console.log(chalk.cyan('📖 Available Commands:'));
        console.log('  cc task list                    # List all tasks');
        console.log('  cc task show <id>               # Show task details');
        console.log('  cc backlog task-ui              # Launch full UI (if working)');
        console.log('  cc backlog status               # Project overview');
        console.log();
        console.log(chalk.dim('💡 Tip: Use cc task list to see all tasks, then cc task show <id> for details'));
    }
    getTaskStats(tasks) {
        return {
            total: tasks.length,
            done: tasks.filter(t => t.status === 'done').length,
            active: tasks.filter(t => t.status === 'in-progress' || t.status === 'focused').length,
            todo: tasks.filter(t => t.status === 'todo').length
        };
    }
    getPriorityBadge(priority) {
        switch (priority) {
            case 'critical': return chalk.bgRed.white(' CRIT ');
            case 'high': return chalk.bgYellow.black(' HIGH ');
            case 'medium': return chalk.bgBlue.white(' MED ');
            case 'low': return chalk.bgGray.white(' LOW ');
            default: return chalk.bgGray.white(' ??? ');
        }
    }
    getStatusBadge(status) {
        switch (status) {
            case 'todo': return chalk.gray('○');
            case 'in-progress': return chalk.blue('◐');
            case 'focused': return chalk.cyan('●');
            case 'done': return chalk.green('●');
            case 'blocked': return chalk.red('✖');
            default: return chalk.gray('?');
        }
    }
    getStatusWithColor(status) {
        switch (status) {
            case 'todo': return chalk.gray('todo');
            case 'in-progress': return chalk.blue('in-progress');
            case 'focused': return chalk.cyan('focused');
            case 'done': return chalk.green('done');
            case 'blocked': return chalk.red('blocked');
            default: return chalk.gray(status);
        }
    }
    getPriorityWithColor(priority) {
        switch (priority) {
            case 'critical': return chalk.red.bold('critical');
            case 'high': return chalk.yellow('high');
            case 'medium': return chalk.blue('medium');
            case 'low': return chalk.gray('low');
            default: return chalk.gray(priority);
        }
    }
}
//# sourceMappingURL=simple-task-ui.js.map