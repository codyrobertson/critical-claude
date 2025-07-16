/**
 * 🔥 BADASS PERSISTENT TASK UI - Semantic Commands & Real-time Sync
 * Production-ready interface with visual excellence and semantic commands
 */
import chalk from 'chalk';
import { BacklogManager } from '../backlog-manager.js';
import { spawn } from 'child_process';
export class PersistentTaskUICommand {
    backlogManager;
    state;
    isRunning = false;
    refreshInterval;
    syncInterval;
    constructor() {
        this.backlogManager = new BacklogManager();
        this.state = {
            tasks: [],
            selectedIndex: 0,
            viewMode: 'list',
            lastSync: new Date(),
            needsRefresh: true,
            showHelp: false,
            semanticMode: true,
            animationFrame: 0
        };
    }
    async execute(action, input, options) {
        await this.backlogManager.initialize();
        await this.startUI();
    }
    async startUI() {
        this.isRunning = true;
        // Setup terminal for raw input (if available)
        try {
            if (process.stdin.isTTY && typeof process.stdin.setRawMode === 'function') {
                process.stdin.setRawMode(true);
            }
            process.stdin.resume();
            process.stdin.setEncoding('utf8');
        }
        catch (error) {
            // Fallback to simple mode without raw input
            console.log(chalk.yellow('⚠️ Raw mode not available, using simple interface'));
            await this.runSimpleMode();
            return;
        }
        // Hide cursor
        process.stdout.write('\x1B[?25l');
        // Clear screen
        console.clear();
        // Setup cleanup handlers
        process.on('SIGINT', () => this.cleanup());
        process.on('SIGTERM', () => this.cleanup());
        process.on('exit', () => this.cleanup());
        // Setup intervals
        this.refreshInterval = setInterval(() => {
            this.state.needsRefresh = true;
            this.render();
        }, 2000); // Refresh every 2 seconds
        this.syncInterval = setInterval(() => {
            this.syncWithClaudeCode();
        }, 10000); // Sync every 10 seconds
        // Initial data load
        await this.loadTasks();
        // Setup input handling
        process.stdin.on('data', (key) => this.handleInput(key.toString()));
        // Initial render
        this.render();
        // Keep running
        while (this.isRunning) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    async loadTasks() {
        try {
            let tasks = await this.backlogManager.listTasks();
            // Apply filters
            if (this.state.filterStatus) {
                tasks = tasks.filter(t => t.status === this.state.filterStatus);
            }
            if (this.state.filterPriority) {
                tasks = tasks.filter(t => t.priority === this.state.filterPriority);
            }
            if (this.state.searchQuery) {
                const query = this.state.searchQuery.toLowerCase();
                tasks = tasks.filter(t => t.title.toLowerCase().includes(query) ||
                    t.description?.toLowerCase().includes(query));
            }
            this.state.tasks = tasks;
            this.state.needsRefresh = true;
            // Ensure selectedIndex is valid
            if (this.state.selectedIndex >= tasks.length) {
                this.state.selectedIndex = Math.max(0, tasks.length - 1);
            }
        }
        catch (error) {
            console.error('Failed to load tasks:', error);
        }
    }
    async syncWithClaudeCode() {
        try {
            // Call Claude Code sync
            const child = spawn('cc-backlog', ['sync-claude-code', '--execute', '--direction', 'both'], {
                stdio: 'pipe'
            });
            child.on('close', (code) => {
                this.state.lastSync = new Date();
                if (code === 0) {
                    this.loadTasks(); // Reload tasks after successful sync
                }
            });
        }
        catch (error) {
            // Sync failed, continue normally
        }
    }
    handleInput(key) {
        switch (key) {
            // Navigation
            case '\u001b[A': // Up arrow
                this.state.selectedIndex = Math.max(0, this.state.selectedIndex - 1);
                this.render();
                break;
            case '\u001b[B': // Down arrow
                this.state.selectedIndex = Math.min(this.state.tasks.length - 1, this.state.selectedIndex + 1);
                this.render();
                break;
            case '\u001b[C': // Right arrow - Enter detail view
                if (this.state.viewMode === 'list' && this.state.tasks[this.state.selectedIndex]) {
                    this.state.viewMode = 'detail';
                    this.state.selectedTask = this.state.tasks[this.state.selectedIndex];
                    this.render();
                }
                break;
            case '\u001b[D': // Left arrow - Back to list
                if (this.state.viewMode === 'detail') {
                    this.state.viewMode = 'list';
                    this.render();
                }
                break;
            // Actions
            case '\r': // Enter - Toggle task status
            case '\n':
                this.toggleTaskStatus();
                break;
            case ' ': // Space - Focus/unfocus task
                this.toggleTaskFocus();
                break;
            case 'r': // Refresh
            case 'R':
                this.loadTasks();
                this.render();
                break;
            case 's': // Sync
            case 'S':
                this.syncWithClaudeCode();
                this.render();
                break;
            case 'f': // Filter
            case 'F':
                this.showFilterOptions();
                break;
            case 'c': // Clear filters
            case 'C':
                this.clearFilters();
                break;
            case 'h': // Help
            case 'H':
            case '?':
                this.state.showHelp = !this.state.showHelp;
                this.render();
                break;
            case 'q': // Quit
            case 'Q':
            case '\u0003': // Ctrl+C
                this.cleanup();
                break;
            // Priority filters
            case '1':
                this.state.filterPriority = 'critical';
                this.loadTasks();
                this.render();
                break;
            case '2':
                this.state.filterPriority = 'high';
                this.loadTasks();
                this.render();
                break;
            case '3':
                this.state.filterPriority = 'medium';
                this.loadTasks();
                this.render();
                break;
            case '4':
                this.state.filterPriority = 'low';
                this.loadTasks();
                this.render();
                break;
            // Status filters
            case 't':
                this.state.filterStatus = 'todo';
                this.loadTasks();
                this.render();
                break;
            case 'p':
                this.state.filterStatus = 'in-progress';
                this.loadTasks();
                this.render();
                break;
            case 'd':
                this.state.filterStatus = 'done';
                this.loadTasks();
                this.render();
                break;
            case 'b':
                this.state.filterStatus = 'blocked';
                this.loadTasks();
                this.render();
                break;
        }
    }
    async toggleTaskStatus() {
        const task = this.state.tasks[this.state.selectedIndex];
        if (!task)
            return;
        const statusCycle = ['todo', 'in-progress', 'focused', 'done'];
        const currentIndex = statusCycle.indexOf(task.status);
        const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
        try {
            await this.backlogManager.changeTaskState(task.id, nextStatus, 'user', 'Status changed via UI');
            await this.loadTasks();
            this.render();
        }
        catch (error) {
            // Error handling - show briefly then continue
        }
    }
    async toggleTaskFocus() {
        const task = this.state.tasks[this.state.selectedIndex];
        if (!task)
            return;
        try {
            const newStatus = task.status === 'focused' ? 'in-progress' : 'focused';
            await this.backlogManager.changeTaskState(task.id, newStatus, 'user', 'Focus toggled via UI');
            await this.loadTasks();
            this.render();
        }
        catch (error) {
            // Error handling
        }
    }
    showFilterOptions() {
        // Simple filter cycling for now
        const filters = [undefined, 'todo', 'in-progress', 'focused', 'done', 'blocked'];
        const currentIndex = filters.indexOf(this.state.filterStatus);
        this.state.filterStatus = filters[(currentIndex + 1) % filters.length];
        this.loadTasks();
        this.render();
    }
    clearFilters() {
        this.state.filterStatus = undefined;
        this.state.filterPriority = undefined;
        this.state.searchQuery = undefined;
        this.loadTasks();
        this.render();
    }
    render() {
        if (!this.state.needsRefresh && this.state.viewMode === 'list')
            return;
        console.clear();
        // Header
        this.renderHeader();
        if (this.state.showHelp) {
            this.renderHelp();
            return;
        }
        // Main content
        switch (this.state.viewMode) {
            case 'list':
                this.renderTaskList();
                break;
            case 'detail':
                this.renderTaskDetail();
                break;
        }
        // Footer
        this.renderFooter();
        this.state.needsRefresh = false;
    }
    renderHeader() {
        const title = chalk.cyan.bold('🚀 Critical Claude Task Manager');
        const sync = chalk.dim(`Last sync: ${this.state.lastSync.toLocaleTimeString()}`);
        const filters = this.getFilterString();
        console.log(title);
        console.log(chalk.gray('═'.repeat(60)));
        console.log(`${sync}${filters ? '  ' + filters : ''}`);
        console.log();
    }
    getFilterString() {
        const parts = [];
        if (this.state.filterStatus) {
            parts.push(chalk.blue(`Status: ${this.state.filterStatus}`));
        }
        if (this.state.filterPriority) {
            parts.push(chalk.yellow(`Priority: ${this.state.filterPriority}`));
        }
        return parts.length > 0 ? `[${parts.join(', ')}]` : '';
    }
    renderTaskList() {
        if (this.state.tasks.length === 0) {
            console.log(chalk.dim('No tasks found. Press R to refresh or C to clear filters.'));
            return;
        }
        console.log(chalk.cyan(`📋 ${this.state.tasks.length} Tasks`));
        console.log(chalk.gray('─'.repeat(60)));
        const visibleStart = Math.max(0, this.state.selectedIndex - 10);
        const visibleEnd = Math.min(this.state.tasks.length, visibleStart + 20);
        for (let i = visibleStart; i < visibleEnd; i++) {
            const task = this.state.tasks[i];
            const isSelected = i === this.state.selectedIndex;
            const prefix = isSelected ? chalk.bgBlue.white(' → ') : '   ';
            const status = this.getStatusIcon(task.status);
            const priority = this.getPriorityBadge(task.priority);
            const title = isSelected ? chalk.bold(task.title) : task.title;
            console.log(`${prefix}${status} ${priority} ${title}`);
            if (isSelected && task.description) {
                const desc = task.description.substring(0, 80);
                console.log(`      ${chalk.dim(desc)}${desc.length < task.description.length ? '...' : ''}`);
            }
        }
        if (visibleStart > 0 || visibleEnd < this.state.tasks.length) {
            console.log(chalk.dim(`\n   Showing ${visibleStart + 1}-${visibleEnd} of ${this.state.tasks.length} tasks`));
        }
    }
    renderTaskDetail() {
        const task = this.state.selectedTask;
        if (!task) {
            this.state.viewMode = 'list';
            this.render();
            return;
        }
        console.log(chalk.cyan.bold(`📄 Task Details`));
        console.log(chalk.gray('─'.repeat(60)));
        console.log(`${chalk.bold('Title:')} ${task.title}`);
        console.log(`${chalk.bold('Status:')} ${this.getStatusIcon(task.status)} ${task.status}`);
        console.log(`${chalk.bold('Priority:')} ${this.getPriorityBadge(task.priority)} ${task.priority}`);
        console.log(`${chalk.bold('Points:')} ${task.storyPoints || 1}`);
        console.log(`${chalk.bold('Assignee:')} ${task.assignee || 'Unassigned'}`);
        console.log(`${chalk.bold('Created:')} ${task.createdAt.toLocaleDateString()}`);
        if (task.description) {
            console.log(`\n${chalk.bold('Description:')}`);
            console.log(task.description);
        }
        if (task.labels && task.labels.length > 0) {
            console.log(`\n${chalk.bold('Labels:')} ${task.labels.join(', ')}`);
        }
        if (task.acceptanceCriteria && task.acceptanceCriteria.length > 0) {
            console.log(`\n${chalk.bold('Acceptance Criteria:')}`);
            task.acceptanceCriteria.forEach((criteria, i) => {
                const checked = criteria.verified ? '✅' : '⬜';
                console.log(`  ${checked} ${criteria.description}`);
            });
        }
        if (task.stateHistory && task.stateHistory.length > 1) {
            console.log(`\n${chalk.bold('Recent History:')}`);
            task.stateHistory.slice(-3).forEach(history => {
                console.log(`  ${history.changedAt.toLocaleDateString()} - ${history.fromState} → ${history.toState}`);
            });
        }
    }
    renderHelp() {
        console.log(chalk.cyan.bold('🎮 Keyboard Controls'));
        console.log(chalk.gray('─'.repeat(60)));
        console.log();
        console.log(chalk.yellow('Navigation:'));
        console.log('  ↑/↓ arrows    Navigate tasks');
        console.log('  → arrow       View task details');
        console.log('  ← arrow       Back to list');
        console.log();
        console.log(chalk.yellow('Actions:'));
        console.log('  Enter         Toggle task status (todo → in-progress → focused → done)');
        console.log('  Space         Toggle focus (focused ↔ in-progress)');
        console.log('  R             Refresh tasks');
        console.log('  S             Sync with Claude Code');
        console.log();
        console.log(chalk.yellow('Filters:'));
        console.log('  F             Cycle status filter');
        console.log('  C             Clear all filters');
        console.log('  1,2,3,4       Filter by priority (critical, high, medium, low)');
        console.log('  T,P,D,B       Filter by status (todo, in-progress, done, blocked)');
        console.log();
        console.log(chalk.yellow('Other:'));
        console.log('  H or ?        Toggle this help');
        console.log('  Q             Quit');
        console.log();
        console.log(chalk.dim('Press any key to continue...'));
    }
    renderFooter() {
        console.log();
        if (this.state.viewMode === 'list') {
            console.log(chalk.dim('↑↓: Navigate  →: Details  Enter: Toggle Status  Space: Focus  R: Refresh  S: Sync  H: Help  Q: Quit'));
        }
        else {
            console.log(chalk.dim('←: Back to List  Enter: Toggle Status  Space: Focus  R: Refresh  S: Sync  H: Help  Q: Quit'));
        }
    }
    getStatusIcon(status) {
        switch (status) {
            case 'todo': return chalk.gray('○');
            case 'in-progress': return chalk.blue('◐');
            case 'focused': return chalk.cyan('●');
            case 'done': return chalk.green('●');
            case 'blocked': return chalk.red('✖');
            default: return chalk.gray('?');
        }
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
    async runSimpleMode() {
        // Simple fallback interface without raw mode
        await this.loadTasks();
        console.clear();
        console.log(chalk.cyan.bold('🚀 Critical Claude Task Manager (Simple Mode)'));
        console.log(chalk.gray('═'.repeat(60)));
        console.log();
        console.log(chalk.cyan(`📋 ${this.state.tasks.length} Tasks`));
        console.log(chalk.gray('─'.repeat(60)));
        this.state.tasks.forEach((task, i) => {
            const status = this.getStatusIcon(task.status);
            const priority = this.getPriorityBadge(task.priority);
            console.log(`${i + 1}. ${status} ${priority} ${task.title}`);
            if (task.description) {
                const desc = task.description.substring(0, 80);
                console.log(`   ${chalk.dim(desc)}${desc.length < task.description.length ? '...' : ''}`);
            }
        });
        console.log();
        console.log(chalk.dim('Use "cc task list" for full task management'));
        console.log(chalk.dim('Use "cc task show <id>" for task details'));
        console.log(chalk.dim('Use "cc-backlog task-ui" for interactive interface'));
        process.exit(0);
    }
    cleanup() {
        this.isRunning = false;
        // Clear intervals
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        // Restore terminal (if raw mode was set)
        try {
            if (process.stdin.isTTY && typeof process.stdin.setRawMode === 'function') {
                process.stdin.setRawMode(false);
            }
            process.stdin.pause();
        }
        catch (error) {
            // Ignore cleanup errors
        }
        // Show cursor
        process.stdout.write('\x1B[?25h');
        // Clear screen and exit
        console.clear();
        console.log(chalk.cyan('👋 Task Manager closed. Tasks synced with Claude Code.'));
        process.exit(0);
    }
}
//# sourceMappingURL=persistent-task-ui.js.map