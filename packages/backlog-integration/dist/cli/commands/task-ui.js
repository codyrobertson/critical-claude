/**
 * Task UI Command - Ranger-like task management interface with keyboard navigation
 */
import chalk from 'chalk';
import { BacklogManager } from '../backlog-manager.js';
import * as readline from 'readline';
export class TaskUICommand {
    backlogManager;
    rl; // Will be initialized in setupTerminal
    currentFilter = 'all';
    currentSort = 'priority';
    state = {
        selectedIndex: 0,
        scrollOffset: 0,
        mode: 'browse',
        activePanel: 'tree',
        searchQuery: '',
        currentPath: [],
        tree: [],
        flatTree: [],
        tasks: [],
        loading: true
    };
    PAGE_SIZE = 10;
    terminalWidth = 80;
    terminalHeight = 24;
    constructor() {
        this.backlogManager = new BacklogManager();
        this.setupTerminal();
    }
    setupTerminal() {
        // Get terminal dimensions
        this.updateTerminalSize();
        // Enable raw mode for immediate key detection
        if (process.stdin.setRawMode) {
            process.stdin.setRawMode(true);
        }
        // Hide cursor and enable mouse tracking
        process.stdout.write('\x1b[?25l'); // Hide cursor
        process.stdout.write('\x1b[?1000h'); // Enable mouse tracking
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        // Handle terminal resize
        process.stdout.on('resize', () => {
            this.updateTerminalSize();
            this.render();
        });
    }
    updateTerminalSize() {
        this.terminalWidth = process.stdout.columns || 80;
        this.terminalHeight = process.stdout.rows || 24;
    }
    cleanup() {
        // Restore terminal
        if (process.stdin.setRawMode) {
            process.stdin.setRawMode(false);
        }
        process.stdout.write('\x1b[?25h'); // Show cursor
        process.stdout.write('\x1b[?1000l'); // Disable mouse tracking
        this.rl.close();
    }
    async execute(action, input, options) {
        // Show UI immediately for responsiveness
        this.render();
        // Initialize and load tasks in background
        this.initializeAsync();
        await this.showRangerUI();
    }
    async initializeAsync() {
        try {
            await this.backlogManager.initialize();
            await this.refreshTasks();
            this.state.loading = false;
            this.render(); // Re-render with loaded tasks
        }
        catch (error) {
            // Silent fail for now, show empty state
            this.state.tasks = [];
            this.state.loading = false;
            this.render();
        }
    }
    async showRangerUI() {
        this.render();
        // Handle key presses
        process.stdin.on('data', async (data) => {
            await this.handleInput(data);
        });
        // Handle process exit
        process.on('SIGINT', () => {
            this.cleanup();
            process.exit(0);
        });
        // Keep the process alive
        return new Promise((resolve) => {
            this.rl.on('close', resolve);
        });
    }
    async refreshTasks() {
        this.state.tasks = await this.getFilteredTasks();
        // Ensure selected index is valid for task list
        const maxIndex = this.state.tasks.length - 1;
        if (this.state.selectedIndex > maxIndex) {
            this.state.selectedIndex = Math.max(0, maxIndex);
        }
        // If we have tasks but no selection, select the first one
        if (this.state.tasks.length > 0 && this.state.selectedIndex < 0) {
            this.state.selectedIndex = 0;
        }
    }
    buildTree() {
        const tasks = this.state.tasks;
        // Group tasks by priority
        const priorityGroups = {
            critical: tasks.filter(t => t.priority === 'critical'),
            high: tasks.filter(t => t.priority === 'high'),
            medium: tasks.filter(t => t.priority === 'medium'),
            low: tasks.filter(t => t.priority === 'low')
        };
        // Group tasks by status
        const statusGroups = {
            todo: tasks.filter(t => t.status === 'todo'),
            'in-progress': tasks.filter(t => t.status === 'in-progress' || t.status === 'focused'),
            done: tasks.filter(t => t.status === 'done'),
            blocked: tasks.filter(t => t.status === 'blocked')
        };
        this.state.tree = [
            // Priority folders
            {
                id: 'priority-critical',
                type: 'folder',
                name: `📁 Critical Priority (${priorityGroups.critical.length})`,
                expanded: true,
                level: 0,
                children: priorityGroups.critical.map(task => ({
                    id: `task-${task.id}`,
                    type: 'task',
                    name: task.title,
                    task,
                    level: 1,
                    parent: 'priority-critical'
                }))
            },
            {
                id: 'priority-high',
                type: 'folder',
                name: `📁 High Priority (${priorityGroups.high.length})`,
                expanded: false,
                level: 0,
                children: priorityGroups.high.map(task => ({
                    id: `task-${task.id}`,
                    type: 'task',
                    name: task.title,
                    task,
                    level: 1,
                    parent: 'priority-high'
                }))
            },
            {
                id: 'priority-medium',
                type: 'folder',
                name: `📁 Medium Priority (${priorityGroups.medium.length})`,
                expanded: false,
                level: 0,
                children: priorityGroups.medium.map(task => ({
                    id: `task-${task.id}`,
                    type: 'task',
                    name: task.title,
                    task,
                    level: 1,
                    parent: 'priority-medium'
                }))
            },
            {
                id: 'priority-low',
                type: 'folder',
                name: `📁 Low Priority (${priorityGroups.low.length})`,
                expanded: false,
                level: 0,
                children: priorityGroups.low.map(task => ({
                    id: `task-${task.id}`,
                    type: 'task',
                    name: task.title,
                    task,
                    level: 1,
                    parent: 'priority-low'
                }))
            },
            // Status folders
            {
                id: 'status-separator',
                type: 'folder',
                name: '',
                level: 0,
                children: []
            },
            {
                id: 'status-todo',
                type: 'folder',
                name: `📋 Todo (${statusGroups.todo.length})`,
                expanded: false,
                level: 0,
                children: statusGroups.todo.map(task => ({
                    id: `task-${task.id}`,
                    type: 'task',
                    name: task.title,
                    task,
                    level: 1,
                    parent: 'status-todo'
                }))
            },
            {
                id: 'status-progress',
                type: 'folder',
                name: `🔄 In Progress (${statusGroups['in-progress'].length})`,
                expanded: false,
                level: 0,
                children: statusGroups['in-progress'].map(task => ({
                    id: `task-${task.id}`,
                    type: 'task',
                    name: task.title,
                    task,
                    level: 1,
                    parent: 'status-progress'
                }))
            },
            {
                id: 'status-done',
                type: 'folder',
                name: `✅ Completed (${statusGroups.done.length})`,
                expanded: false,
                level: 0,
                children: statusGroups.done.map(task => ({
                    id: `task-${task.id}`,
                    type: 'task',
                    name: task.title,
                    task,
                    level: 1,
                    parent: 'status-done'
                }))
            },
            {
                id: 'status-blocked',
                type: 'folder',
                name: `🚫 Blocked (${statusGroups.blocked.length})`,
                expanded: false,
                level: 0,
                children: statusGroups.blocked.map(task => ({
                    id: `task-${task.id}`,
                    type: 'task',
                    name: task.title,
                    task,
                    level: 1,
                    parent: 'status-blocked'
                }))
            }
        ];
    }
    rebuildFlatTree() {
        this.state.flatTree = [];
        const flattenNode = (node) => {
            // Skip empty separator nodes
            if (node.name === '')
                return;
            this.state.flatTree.push(node);
            if (node.expanded && node.children) {
                node.children.forEach(child => flattenNode(child));
            }
        };
        this.state.tree.forEach(node => flattenNode(node));
    }
    async handleInput(data) {
        const input = data.toString();
        if (this.state.mode === 'search') {
            await this.handleSearchInput(input);
            return;
        }
        // Ranger-style navigation
        if (input === '\x1b[A' || input === 'k') { // Up arrow or k
            this.moveSelection(-1);
        }
        else if (input === '\x1b[B' || input === 'j') { // Down arrow or j  
            this.moveSelection(1);
        }
        else if (input === 'h' || input === '\x1b[D') { // h or Left Arrow
            await this.handleLeftKey();
        }
        else if (input === 'l' || input === '\x1b[C') { // l or Right Arrow
            await this.handleRightKey();
        }
        else if (input === '\x1b[5~') { // Page Up
            this.moveSelection(-this.PAGE_SIZE);
        }
        else if (input === '\x1b[6~') { // Page Down
            this.moveSelection(this.PAGE_SIZE);
        }
        else if (input === '\x1b[H' || input === 'g') { // Home or g
            this.state.selectedIndex = 0;
            this.state.scrollOffset = 0;
        }
        else if (input === '\x1b[F' || input === 'G') { // End or G
            const maxIndex = this.state.tasks.length - 1;
            if (maxIndex >= 0) {
                this.state.selectedIndex = maxIndex;
                this.adjustScrollOffset();
            }
        }
        else if (input === '\r' || input === '\n') { // Enter
            await this.handleEnterKey();
        }
        else if (input === ' ') { // Space - toggle completion
            await this.toggleTaskCompletion();
        }
        else if (input === 'd') { // Delete
            await this.deleteSelectedTask();
        }
        else if (input === 'f') { // Focus
            await this.focusSelectedTask();
        }
        else if (input === 'c') { // Create
            await this.createNewTask();
        }
        else if (input === 'r') { // Refresh
            await this.refreshTasks();
        }
        else if (input === '/') { // Search
            this.startSearch();
        }
        else if (input === '\x1b[11~') { // F1 - Help
            this.state.mode = 'help';
        }
        else if (input === '\x1b[12~') { // F2 - Create  
            await this.createNewTask();
        }
        else if (input === '\x1b[15~') { // F5 - Sync
            await this.syncTasks();
        }
        else if (input === '\x1b' || input === 'q') { // Escape or q - quit
            this.cleanup();
            process.exit(0);
        }
        this.render();
    }
    async handleLeftKey() {
        // Simple left key handling - could be used for additional functionality
        // For now, just keep existing selection
    }
    async handleRightKey() {
        // Simple right key handling - could be used for additional functionality
        // For now, just keep existing selection
    }
    async handleEnterKey() {
        const selectedTask = this.getSelectedTask();
        if (selectedTask) {
            await this.editSelectedTask();
        }
    }
    toggleFolder(folderId) {
        const folder = this.findNodeInTree(folderId);
        if (folder && folder.type === 'folder') {
            folder.expanded = !folder.expanded;
            this.rebuildFlatTree();
            // Ensure selection stays valid
            if (this.state.selectedIndex >= this.state.flatTree.length) {
                this.state.selectedIndex = Math.max(0, this.state.flatTree.length - 1);
            }
        }
    }
    findNodeInTree(nodeId) {
        const search = (nodes) => {
            for (const node of nodes) {
                if (node.id === nodeId)
                    return node;
                if (node.children) {
                    const found = search(node.children);
                    if (found)
                        return found;
                }
            }
            return undefined;
        };
        return search(this.state.tree);
    }
    startSearch() {
        this.state.mode = 'search';
        this.state.searchQuery = '';
    }
    exitSearch() {
        this.state.mode = 'browse';
        this.state.searchQuery = '';
        this.rebuildFlatTree(); // Restore full tree
    }
    async handleSearchInput(input) {
        if (input === '\x1b' || input === '\r') { // Escape or Enter
            this.exitSearch();
        }
        else if (input === '\x7f' || input === '\b') { // Backspace
            this.state.searchQuery = this.state.searchQuery.slice(0, -1);
            this.performSearch();
        }
        else if (input.length === 1 && input >= ' ' && input <= '~') { // Printable character
            this.state.searchQuery += input;
            this.performSearch();
        }
    }
    performSearch() {
        if (this.state.searchQuery === '') {
            this.rebuildFlatTree();
            return;
        }
        const query = this.state.searchQuery.toLowerCase();
        this.state.flatTree = [];
        const searchInTree = (nodes) => {
            for (const node of nodes) {
                if (node.type === 'task' && node.name.toLowerCase().includes(query)) {
                    this.state.flatTree.push({
                        ...node,
                        name: `📄 ${node.name}` // Add file icon for search results
                    });
                }
                if (node.children) {
                    searchInTree(node.children);
                }
            }
        };
        searchInTree(this.state.tree);
        this.state.selectedIndex = Math.min(this.state.selectedIndex, this.state.flatTree.length - 1);
    }
    moveSelection(delta) {
        // Use task list length for simple list navigation
        const maxIndex = this.state.tasks.length - 1;
        if (maxIndex >= 0) {
            this.state.selectedIndex = Math.max(0, Math.min(maxIndex, this.state.selectedIndex + delta));
            this.adjustScrollOffset();
        }
    }
    adjustScrollOffset() {
        if (this.state.selectedIndex < this.state.scrollOffset) {
            this.state.scrollOffset = this.state.selectedIndex;
        }
        else if (this.state.selectedIndex >= this.state.scrollOffset + this.PAGE_SIZE) {
            this.state.scrollOffset = this.state.selectedIndex - this.PAGE_SIZE + 1;
        }
    }
    render() {
        console.clear();
        switch (this.state.mode) {
            case 'browse':
                this.renderRangerView();
                break;
            case 'search':
                this.renderSearchView();
                break;
            case 'help':
                this.renderHelpView();
                break;
            case 'edit':
                this.renderEditView();
                break;
            case 'create':
                this.renderCreateView();
                break;
        }
    }
    renderRangerView() {
        const width = this.terminalWidth;
        if (this.state.loading) {
            this.renderLoadingScreen();
            return;
        }
        this.renderDashboardHeader(width);
        this.renderQuickStats(width);
        this.renderTaskTable(width);
        this.renderTaskDetails(width);
        this.renderBottomControls(width);
    }
    renderDashboardHeader(width) {
        // Clear and simple header
        console.log();
        console.log(chalk.bold.cyan('  ✨ CRITICAL CLAUDE TASK MANAGER'));
        console.log(chalk.gray('  ═══════════════════════════════════'));
        console.log();
    }
    renderQuickStats(width) {
        const stats = this.getTaskStats();
        const total = stats.total;
        const completed = stats.done;
        const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
        // Clean, simple stats layout
        console.log(chalk.bold.yellow('  📊 Overview'));
        console.log();
        // Progress bar
        const barWidth = Math.min(30, width - 20);
        const filled = Math.floor((completionPercent / 100) * barWidth);
        const empty = barWidth - filled;
        const progressBar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
        console.log(`  Total Tasks: ${chalk.bold.white(total)}`);
        console.log(`  Progress:    ${progressBar} ${chalk.bold(completionPercent)}%`);
        console.log(`  Active:      ${chalk.blue(stats.todo + stats.inProgress)}   Completed: ${chalk.green(completed)}`);
        // Priority breakdown in a clean row
        const criticalCount = this.state.tasks.filter(t => t.priority === 'critical').length;
        const highCount = this.state.tasks.filter(t => t.priority === 'high').length;
        const mediumCount = this.state.tasks.filter(t => t.priority === 'medium').length;
        const lowCount = this.state.tasks.filter(t => t.priority === 'low').length;
        console.log(`  Priority:    ${chalk.red('🚨')} ${criticalCount}  ${chalk.yellow('🔥')} ${highCount}  ${chalk.blue('📋')} ${mediumCount}  ${chalk.gray('📝')} ${lowCount}`);
        console.log();
    }
    renderTaskTable(width) {
        console.log(chalk.bold.yellow('  📋 Tasks'));
        console.log(chalk.gray('  ─────────'));
        console.log();
        if (this.state.tasks.length === 0) {
            console.log(chalk.gray('  No tasks found. Press F2 to create one.'));
            console.log();
            return;
        }
        // Show tasks in a clean, simple list with proper selection handling
        const visibleTasks = this.state.tasks.slice(0, 10);
        visibleTasks.forEach((task, index) => {
            // Selection should match the current selectedIndex for the task list
            const isSelected = index === this.state.selectedIndex;
            const priority = this.getPriorityIcon(task.priority);
            const status = this.getStatusIcon(task.status);
            const selector = isSelected ? chalk.cyan('▶') : ' ';
            // Clean task line format with selector
            const taskLine = `${selector} ${priority} ${status} ${task.title}`;
            const truncated = taskLine.length > width - 5 ? taskLine.substring(0, width - 8) + '...' : taskLine;
            if (isSelected) {
                console.log(chalk.bgBlue.white(truncated));
            }
            else {
                console.log(truncated);
            }
        });
        if (this.state.tasks.length > 10) {
            console.log(chalk.gray(`  ... and ${this.state.tasks.length - 10} more tasks`));
        }
        console.log();
    }
    renderTaskDetails(width) {
        const selectedTask = this.getSelectedTask();
        if (!selectedTask) {
            console.log(chalk.bold.yellow('  📝 Task Details'));
            console.log(chalk.gray('  ────────────────'));
            console.log();
            console.log(chalk.gray('  Select a task to view details'));
            console.log();
            return;
        }
        console.log(chalk.bold.yellow('  📝 Task Details'));
        console.log(chalk.gray('  ────────────────'));
        console.log();
        // Clean, readable task details
        console.log(`  ${chalk.bold.white(selectedTask.title)}`);
        console.log();
        const priority = this.getPriorityWithColor(selectedTask.priority);
        const status = this.getStatusWithIcon(selectedTask.status);
        console.log(`  Status:     ${status}`);
        console.log(`  Priority:   ${priority}`);
        console.log(`  Points:     ${chalk.blue(selectedTask.storyPoints)}`);
        console.log(`  Assignee:   ${selectedTask.assignee || chalk.gray('unassigned')}`);
        console.log(`  Created:    ${chalk.gray(new Date(selectedTask.createdAt).toLocaleDateString())}`);
        console.log(`  Updated:    ${chalk.gray(new Date(selectedTask.updatedAt).toLocaleDateString())}`);
        console.log(`  ID:         ${chalk.dim(selectedTask.id.substring(0, 8))}...`);
        if (selectedTask.labels && selectedTask.labels.length > 0) {
            console.log(`  Labels:     ${selectedTask.labels.map(l => chalk.cyan('#' + l)).join(' ')}`);
        }
        // Time tracking metadata
        if (selectedTask.timeTracking) {
            console.log(`  Time Est:   ${chalk.blue(selectedTask.timeTracking.estimated || 0)}h`);
            console.log(`  Time Spent: ${chalk.yellow(selectedTask.timeTracking.actual || 0)}h`);
        }
        // State history count
        if (selectedTask.stateHistory && selectedTask.stateHistory.length > 1) {
            console.log(`  Changes:    ${chalk.dim(selectedTask.stateHistory.length)} state changes`);
        }
        console.log();
        if (selectedTask.description) {
            console.log(chalk.yellow('  Description:'));
            const desc = selectedTask.description;
            const maxWidth = Math.min(80, width - 4);
            const lines = this.wrapText(desc, maxWidth);
            lines.slice(0, 4).forEach(line => {
                console.log(`  ${chalk.gray(line)}`);
            });
            console.log();
        }
        // Acceptance criteria
        if (selectedTask.acceptanceCriteria && selectedTask.acceptanceCriteria.length > 0) {
            console.log(chalk.yellow('  Acceptance Criteria:'));
            selectedTask.acceptanceCriteria.slice(0, 3).forEach(ac => {
                const check = ac.verified ? chalk.green('✓') : chalk.gray('○');
                console.log(`  ${check} ${ac.description}`);
            });
            console.log();
        }
    }
    renderBottomControls(width) {
        console.log(chalk.gray('  ───────────────────────────────────────────────────────'));
        console.log();
        console.log(chalk.dim('  ↑↓ Navigate  ENTER Edit  SPACE Toggle  F2 New  F5 Sync  F Focus  R Refresh  Q Quit'));
        console.log();
    }
    renderLoadingScreen() {
        console.log();
        console.log(chalk.bold.cyan('  ✨ CRITICAL CLAUDE TASK MANAGER'));
        console.log(chalk.gray('  ═══════════════════════════════════'));
        console.log();
        console.log(chalk.yellow('  ⏳ Loading tasks...'));
        console.log();
    }
    formatTaskTableRow(task, id, isSelected) {
        const priorityIcon = this.getPriorityIcon(task.priority);
        const statusIcon = this.getStatusIcon(task.status);
        const progress = this.getSimpleProgressBar(task);
        const idCol = String(id).padStart(3, '0');
        let nameCol = `${priorityIcon} ${task.title}`;
        if (nameCol.length > 36)
            nameCol = nameCol.substring(0, 33) + '...';
        nameCol = nameCol.padEnd(36);
        const priorityCol = task.priority.toUpperCase().padEnd(8);
        const statusCol = `${statusIcon} ${task.status}`.padEnd(11);
        const progressCol = progress.padEnd(13);
        const row = `│ ${idCol} │ ${nameCol} │ ${priorityCol} │ ${statusCol} │ ${progressCol} │`;
        if (isSelected) {
            return chalk.bgBlue(row);
        }
        return row;
    }
    getPriorityIcon(priority) {
        switch (priority) {
            case 'critical': return chalk.red('🚨');
            case 'high': return chalk.yellow('🔥');
            case 'medium': return chalk.blue('📋');
            case 'low': return chalk.gray('📝');
            default: return chalk.gray('❔');
        }
    }
    getStatusIcon(status) {
        switch (status) {
            case 'todo': return chalk.gray('⏳');
            case 'in-progress': return chalk.blue('🔄');
            case 'focused': return chalk.cyan('🎯');
            case 'done': return chalk.green('✅');
            case 'blocked': return chalk.red('🚫');
            default: return chalk.gray('❓');
        }
    }
    getSimpleProgressBar(task) {
        const progress = task.status === 'done' ? 100 :
            task.status === 'in-progress' || task.status === 'focused' ? 60 :
                20;
        const barLength = 10;
        const filled = Math.floor((progress / 100) * barLength);
        return '█'.repeat(filled) + '░'.repeat(barLength - filled) + ` ${progress}%`;
    }
    getProgressBar(task) {
        const progress = task.status === 'done' ? 100 :
            task.status === 'in-progress' || task.status === 'focused' ? 80 :
                40;
        const barLength = 10;
        const filled = Math.floor((progress / 100) * barLength);
        return '█'.repeat(filled) + '░'.repeat(barLength - filled) + ` ${progress}%`;
    }
    wrapText(text, width) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        for (const word of words) {
            if ((currentLine + word).length <= width) {
                currentLine += (currentLine ? ' ' : '') + word;
            }
            else {
                if (currentLine)
                    lines.push(currentLine);
                currentLine = word;
            }
        }
        if (currentLine)
            lines.push(currentLine);
        return lines.length > 0 ? lines : [''];
    }
    formatRangerTreeLine(node, isSelected, maxWidth) {
        const indent = '  '.repeat(node.level);
        let icon = '';
        let name = node.name;
        let color = (x) => x;
        if (node.type === 'folder') {
            // Keep original folder icons but clean up names
            if (node.name.includes('Critical Priority')) {
                icon = node.expanded ? '📂' : '📁';
                name = node.name;
                color = chalk.red;
            }
            else if (node.name.includes('High Priority')) {
                icon = node.expanded ? '📂' : '📁';
                name = node.name;
                color = chalk.yellow;
            }
            else if (node.name.includes('Medium Priority')) {
                icon = node.expanded ? '📂' : '📁';
                name = node.name;
                color = chalk.blue;
            }
            else if (node.name.includes('Low Priority')) {
                icon = node.expanded ? '📂' : '📁';
                name = node.name;
                color = chalk.gray;
            }
            else {
                // Status folders
                icon = node.expanded ? '📂' : '📁';
                name = node.name;
                color = chalk.cyan;
            }
        }
        else {
            // Tasks get file icons with priority colors
            icon = '📄';
            name = node.name;
            if (node.task) {
                if (node.task.priority === 'critical')
                    color = chalk.red.bold;
                else if (node.task.priority === 'high')
                    color = chalk.yellow.bold;
                else if (node.task.priority === 'medium')
                    color = chalk.blue;
                else
                    color = chalk.gray;
            }
        }
        const prefix = isSelected ? chalk.white.bold('► ') : '  ';
        let line = `${prefix}${indent}${icon} ${color(name)}`;
        // Truncate if too long
        if (line.length > maxWidth) {
            line = line.substring(0, maxWidth - 2) + '..';
        }
        // Apply background for selected item
        if (isSelected) {
            return chalk.bgBlue(line.padEnd(maxWidth));
        }
        return line.padEnd(maxWidth);
    }
    formatRangerDetails(task, lineIndex, maxWidth) {
        const lines = [
            `Title: ${chalk.bold.white(task.title)}`,
            `Status: ${this.getStatusWithIcon(task.status)}`,
            `Priority: ${this.getPriorityWithColor(task.priority)}`,
            `Points: ${chalk.blue(task.storyPoints)}`,
            `Assignee: ${task.assignee || chalk.gray('unassigned')}`,
            `Created: ${new Date(task.createdAt).toLocaleDateString()}`,
            '',
            chalk.yellow('Description:'),
            task.description || chalk.gray('No description'),
            '',
            chalk.yellow('Acceptance Criteria:'),
            ...(task.acceptanceCriteria?.slice(0, 3).map(ac => `${ac.verified ? '☑' : '☐'} ${ac.description}`) || [chalk.gray('None defined')]),
            '',
            chalk.yellow('Labels:') + ' ' + (task.labels.length > 0 ?
                task.labels.map(l => chalk.cyan('#' + l)).join(' ') :
                chalk.gray('none'))
        ];
        if (lineIndex < lines.length) {
            let line = lines[lineIndex];
            // Remove ANSI codes for length calculation, then truncate
            const plainLine = line.replace(/\u001b\[[0-9;]*m/g, '');
            if (plainLine.length > maxWidth) {
                line = line.substring(0, maxWidth - 2) + '..';
            }
            return line.padEnd(maxWidth);
        }
        return ' '.repeat(maxWidth);
    }
    getStatusWithIcon(status) {
        switch (status) {
            case 'todo': return chalk.gray('⏳ todo');
            case 'in-progress': return chalk.blue('🔄 in-progress');
            case 'focused': return chalk.cyan('🎯 focused');
            case 'done': return chalk.green('✅ done');
            case 'blocked': return chalk.red('🚫 blocked');
            default: return chalk.gray(`❓ ${status}`);
        }
    }
    getPriorityWithColor(priority) {
        switch (priority) {
            case 'critical': return chalk.red.bold('🚨 critical');
            case 'high': return chalk.yellow('🔥 high');
            case 'medium': return chalk.blue('📋 medium');
            case 'low': return chalk.gray('📝 low');
            default: return chalk.gray(`❔ ${priority}`);
        }
    }
    formatDetailsPanelLine(task, lineIndex, maxWidth) {
        const lines = [
            `Title: ${task.title}`,
            `ID: ${task.id.substring(0, 8)}...`,
            `Status: ${task.status}`,
            `Priority: ${task.priority}`,
            `Story Points: ${task.storyPoints}`,
            `Assignee: ${task.assignee || 'unassigned'}`,
            `Sprint: ${task.sprintId || 'Backlog'}`,
            '',
            'Description:',
            task.description || 'No description',
            '',
            'Time Tracking:',
            `Estimated: ${task.timeTracking?.estimated || 0}h`,
            `Actual: ${task.timeTracking?.actual || 0}h`,
            `Remaining: ${task.timeTracking?.remaining || 0}h`,
            '',
            `Last Updated: ${new Date(task.updatedAt).toLocaleDateString()}`
        ];
        if (lineIndex < lines.length) {
            const line = lines[lineIndex];
            return line.length > maxWidth ? line.substring(0, maxWidth - 2) + '..' : line.padEnd(maxWidth);
        }
        return ' '.repeat(maxWidth);
    }
    getSelectedTask() {
        // Since we're rendering a simple task list, use direct task list selection
        if (this.state.tasks.length > 0 && this.state.selectedIndex >= 0 && this.state.selectedIndex < this.state.tasks.length) {
            return this.state.tasks[this.state.selectedIndex];
        }
        return undefined;
    }
    renderSearchView() {
        console.log(chalk.bold('Search'));
        console.log('─'.repeat(this.terminalWidth));
        const searchLine = `/${this.state.searchQuery}_`;
        console.log(searchLine);
        console.log('');
        if (this.state.flatTree.length === 0 && this.state.searchQuery) {
            console.log(chalk.gray('No results found'));
        }
        else {
            const visibleNodes = this.state.flatTree.slice(0, this.terminalHeight - 6);
            for (let i = 0; i < visibleNodes.length; i++) {
                const node = visibleNodes[i];
                const isSelected = i === this.state.selectedIndex;
                const prefix = isSelected ? chalk.inverse(' ') : ' ';
                console.log(`${prefix}${node.name}`);
            }
        }
        console.log('');
        console.log('─'.repeat(this.terminalWidth));
        console.log(chalk.dim('ESC:exit ENTER:select'));
    }
    getRangerStatusLine() {
        const activePanel = this.state.activePanel === 'tree' ? 'Tree' : 'Details';
        return chalk.dim(`h/l:panels j/k:nav enter:open space:toggle /:search q:quit | Active: ${chalk.cyan(activePanel)}`);
    }
    renderHelpView() {
        console.log(chalk.cyan('╔══════════════════════════════════════════════════════════════╗'));
        console.log(chalk.cyan('║') + chalk.bold.white('                      📖 Help & Shortcuts                   ') + chalk.cyan('║'));
        console.log(chalk.cyan('╚══════════════════════════════════════════════════════════════╝'));
        console.log('');
        console.log(chalk.yellow('┌─ Navigation ─────────────────────────────────────────────────┐'));
        console.log(chalk.yellow('│') + ' ↑/↓ or j/k      Navigate tasks up/down                      ' + chalk.yellow('│'));
        console.log(chalk.yellow('│') + ' ←/→ or h/l      Switch between List and Details panels      ' + chalk.yellow('│'));
        console.log(chalk.yellow('│') + ' PgUp/PgDn       Navigate by pages                           ' + chalk.yellow('│'));
        console.log(chalk.yellow('│') + ' Home/End or g/G Go to first/last task                       ' + chalk.yellow('│'));
        console.log(chalk.yellow('│') + ' Mouse Click     Select task (if supported)                 ' + chalk.yellow('│'));
        console.log(chalk.yellow('└──────────────────────────────────────────────────────────────┘'));
        console.log('');
        console.log(chalk.green('┌─ Actions ────────────────────────────────────────────────────┐'));
        console.log(chalk.green('│') + ' ENTER           Edit selected task                          ' + chalk.green('│'));
        console.log(chalk.green('│') + ' SPACE           Toggle task completion                      ' + chalk.green('│'));
        console.log(chalk.green('│') + ' d               Delete selected task                        ' + chalk.green('│'));
        console.log(chalk.green('│') + ' f               Focus on task (work mode)                   ' + chalk.green('│'));
        console.log(chalk.green('│') + ' c               Create new task                             ' + chalk.green('│'));
        console.log(chalk.green('│') + ' r               Refresh task list                          ' + chalk.green('│'));
        console.log(chalk.green('│') + ' /               Search tasks (coming soon)                  ' + chalk.green('│'));
        console.log(chalk.green('└──────────────────────────────────────────────────────────────┘'));
        console.log('');
        console.log(chalk.blue('┌─ Function Keys ──────────────────────────────────────────────┐'));
        console.log(chalk.blue('│') + ' F1              Show this help                              ' + chalk.blue('│'));
        console.log(chalk.blue('│') + ' F2              Create new task                             ' + chalk.blue('│'));
        console.log(chalk.blue('│') + ' F3              Filter tasks                                ' + chalk.blue('│'));
        console.log(chalk.blue('│') + ' F5              Sync with Claude Code                       ' + chalk.blue('│'));
        console.log(chalk.blue('│') + ' ESC or q        Quit application                            ' + chalk.blue('│'));
        console.log(chalk.blue('└──────────────────────────────────────────────────────────────┘'));
        console.log('');
        console.log(chalk.dim('[ESC]Back to Task List'));
    }
    renderFilterView() {
        console.log(chalk.cyan('╔══════════════════════════════════════════════════════════════╗'));
        console.log(chalk.cyan('║') + chalk.bold.white('                     🔍 Filter Tasks                        ') + chalk.cyan('║'));
        console.log(chalk.cyan('╚══════════════════════════════════════════════════════════════╝'));
        console.log('');
        console.log(chalk.yellow('┌─ Filter Options ─────────────────────────────────────────────┐'));
        const filterOptions = [
            { key: 'all', label: 'All Tasks', count: this.state.tasks.length },
            { key: 'todo', label: 'Todo Only', count: this.state.tasks.filter(t => t.status === 'todo').length },
            { key: 'in_progress', label: 'In Progress', count: this.state.tasks.filter(t => t.status === 'in-progress' || t.status === 'focused').length },
            { key: 'done', label: 'Completed', count: this.state.tasks.filter(t => t.status === 'done').length },
            { key: 'high', label: 'High Priority', count: this.state.tasks.filter(t => t.priority === 'high').length },
            { key: 'medium', label: 'Medium Priority', count: this.state.tasks.filter(t => t.priority === 'medium').length },
            { key: 'low', label: 'Low Priority', count: this.state.tasks.filter(t => t.priority === 'low').length },
            { key: 'critical', label: 'Critical Priority', count: this.state.tasks.filter(t => t.priority === 'critical').length }
        ];
        filterOptions.forEach(option => {
            const isSelected = this.currentFilter === option.key;
            const prefix = isSelected ? chalk.white.bold('►') : ' ';
            const line = `${prefix} ${option.label.padEnd(35)} (${option.count})`;
            console.log(chalk.yellow('│') + (isSelected ? chalk.bgBlue(line) : line).padEnd(62) + chalk.yellow('│'));
        });
        console.log(chalk.yellow('└──────────────────────────────────────────────────────────────┘'));
        console.log('');
        console.log(chalk.dim('[↑↓]Navigate [ENTER]Select [ESC]Cancel'));
    }
    // Action methods
    async editSelectedTask() {
        const selectedTask = this.getSelectedTask();
        if (!selectedTask) {
            // Just refresh and return if no task selected
            this.render();
            return;
        }
        console.clear();
        console.log();
        console.log(chalk.bold.cyan('  📝 Edit Task'));
        console.log(chalk.gray('  ═══════════'));
        console.log();
        console.log(`  Current: ${chalk.white(selectedTask.title)}`);
        console.log(`  Status:  ${this.getStatusWithIcon(selectedTask.status)}`);
        console.log(`  Priority: ${this.getPriorityWithColor(selectedTask.priority)}`);
        console.log();
        try {
            const readline = await import('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            // Edit title
            const newTitle = await new Promise((resolve) => {
                rl.question(chalk.yellow(`  New title (${selectedTask.title}): `), resolve);
            });
            // Edit priority
            console.log(chalk.gray('  Priority options: critical, high, medium, low'));
            const newPriority = await new Promise((resolve) => {
                rl.question(chalk.yellow(`  New priority (${selectedTask.priority}): `), resolve);
            });
            // Edit status
            console.log(chalk.gray('  Status options: todo, in-progress, focused, done, blocked'));
            const newStatus = await new Promise((resolve) => {
                rl.question(chalk.yellow(`  New status (${selectedTask.status}): `), resolve);
            });
            // Edit story points
            const newPointsStr = await new Promise((resolve) => {
                rl.question(chalk.yellow(`  Story points (${selectedTask.storyPoints}): `), resolve);
            });
            rl.close();
            // Update task with changes
            const updates = {};
            if (newTitle.trim() && newTitle.trim() !== selectedTask.title) {
                updates.title = newTitle.trim();
            }
            if (newPriority.trim() && ['critical', 'high', 'medium', 'low'].includes(newPriority.trim())) {
                updates.priority = newPriority.trim();
            }
            if (newStatus.trim() && ['todo', 'in-progress', 'focused', 'done', 'blocked'].includes(newStatus.trim())) {
                updates.status = newStatus.trim();
            }
            if (newPointsStr.trim() && !isNaN(parseInt(newPointsStr.trim()))) {
                updates.storyPoints = parseInt(newPointsStr.trim());
            }
            if (Object.keys(updates).length > 0) {
                console.log();
                console.log(chalk.blue('  💾 Saving changes...'));
                await this.backlogManager.updateTask(selectedTask.id, updates);
                await this.refreshTasks();
                console.log(chalk.green('  ✅ Task updated successfully!'));
            }
            else {
                console.log(chalk.gray('  No changes made.'));
            }
            console.log();
            console.log(chalk.dim('  Press any key to continue...'));
            await new Promise((resolve) => {
                const onData = () => {
                    process.stdin.removeListener('data', onData);
                    resolve();
                };
                process.stdin.on('data', onData);
            });
        }
        catch (error) {
            console.log(chalk.red('  ❌ Failed to edit task: ' + error.message));
            console.log(chalk.dim('  Press any key to continue...'));
            await new Promise((resolve) => {
                const onData = () => {
                    process.stdin.removeListener('data', onData);
                    resolve();
                };
                process.stdin.on('data', onData);
            });
        }
    }
    async toggleTaskCompletion() {
        const selectedTask = this.getSelectedTask();
        if (!selectedTask) {
            // Just refresh and return if no task selected
            this.render();
            return;
        }
        const newStatus = selectedTask.status === 'done' ? 'todo' : 'done';
        const statusIcon = newStatus === 'done' ? chalk.green('✅') : chalk.gray('⏳');
        const action = newStatus === 'done' ? 'completed' : 'reopened';
        try {
            await this.backlogManager.updateTask(selectedTask.id, { status: newStatus });
            await this.refreshTasks();
            // Show brief feedback on the same line
            this.render();
        }
        catch (error) {
            // Silent fail and just re-render
            this.render();
        }
    }
    async deleteSelectedTask() {
        const selectedTask = this.getSelectedTask();
        if (!selectedTask)
            return;
        console.log(chalk.red(`\nDelete "${selectedTask.title}"? Press 'y' to confirm or any other key to cancel...`));
        // TODO: Implement confirmation and deletion
    }
    async focusSelectedTask() {
        const selectedTask = this.getSelectedTask();
        if (!selectedTask)
            return;
        await this.backlogManager.updateTask(selectedTask.id, { status: 'focused' });
        await this.refreshTasks();
    }
    async createNewTask() {
        console.clear();
        console.log();
        console.log(chalk.bold.cyan('  ✨ Create New Task'));
        console.log(chalk.gray('  ═══════════════════'));
        console.log();
        try {
            // Simple readline interface for task creation
            const readline = await import('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            // Get task title
            const title = await new Promise((resolve) => {
                rl.question(chalk.yellow('  Task title: '), resolve);
            });
            if (!title.trim()) {
                console.log(chalk.red('  ❌ Task title cannot be empty'));
                rl.close();
                return;
            }
            // Get priority
            console.log();
            console.log(chalk.gray('  Priority options: critical, high, medium, low'));
            const priority = await new Promise((resolve) => {
                rl.question(chalk.yellow('  Priority (medium): '), (answer) => {
                    resolve(answer.trim().toLowerCase() || 'medium');
                });
            });
            // Get story points
            const pointsStr = await new Promise((resolve) => {
                rl.question(chalk.yellow('  Story points (3): '), (answer) => {
                    resolve(answer.trim() || '3');
                });
            });
            // Get description
            const description = await new Promise((resolve) => {
                rl.question(chalk.yellow('  Description (optional): '), resolve);
            });
            rl.close();
            // Create the task
            console.log();
            console.log(chalk.blue('  🔨 Creating task...'));
            const taskData = {
                title: title.trim(),
                description: description.trim() || undefined,
                priority: ['critical', 'high', 'medium', 'low'].includes(priority) ? priority : 'medium',
                storyPoints: parseInt(pointsStr) || 3,
                status: 'todo'
            };
            await this.backlogManager.createTask(taskData);
            await this.refreshTasks();
            console.log(chalk.green(`  ✅ Task "${title}" created successfully!`));
            console.log();
            console.log(chalk.dim('  Press any key to continue...'));
            // Wait for key press
            await new Promise((resolve) => {
                const onData = () => {
                    process.stdin.removeListener('data', onData);
                    resolve();
                };
                process.stdin.on('data', onData);
            });
        }
        catch (error) {
            console.log(chalk.red('  ❌ Failed to create task: ' + error.message));
            console.log(chalk.dim('  Press any key to continue...'));
            await new Promise((resolve) => {
                const onData = () => {
                    process.stdin.removeListener('data', onData);
                    resolve();
                };
                process.stdin.on('data', onData);
            });
        }
    }
    async searchTasks() {
        console.log(chalk.yellow('\nSearch functionality coming soon...'));
        // TODO: Implement search
    }
    async syncTasks() {
        console.log(chalk.blue('🔄 Syncing with Claude Code...'));
        try {
            // Import the sync command
            const { ClaudeCodeSyncCommand } = await import('./claude-code-sync.js');
            const syncHandler = new ClaudeCodeSyncCommand();
            await syncHandler.execute('sync', null, { execute: true });
            console.log(chalk.green('✅ Sync completed successfully'));
            // Refresh tasks after sync
            await this.refreshTasks();
            // Show updated stats
            const stats = this.getTaskStats();
            console.log(chalk.gray(`📊 Total tasks: ${stats.total}, Active: ${stats.todo + stats.inProgress}, Done: ${stats.done}`));
        }
        catch (error) {
            console.log(chalk.red('❌ Sync failed: ' + error.message));
        }
        console.log(chalk.dim('Press any key to continue...'));
        // Wait for a key press before returning to normal UI
        await new Promise((resolve) => {
            const onData = () => {
                process.stdin.removeListener('data', onData);
                resolve();
            };
            process.stdin.on('data', onData);
        });
    }
    getTaskStats() {
        const allTasks = this.state.tasks;
        return {
            total: allTasks.length,
            todo: allTasks.filter(t => t.status === 'todo').length,
            inProgress: allTasks.filter(t => t.status === 'in-progress' || t.status === 'focused').length,
            done: allTasks.filter(t => t.status === 'done').length
        };
    }
    getFilterDisplayText() {
        switch (this.currentFilter) {
            case 'all': return 'All Tasks';
            case 'todo': return 'Todo Only';
            case 'in_progress': return 'In Progress';
            case 'done': return 'Completed';
            case 'high': return 'High Priority';
            case 'medium': return 'Medium Priority';
            case 'low': return 'Low Priority';
            case 'critical': return 'Critical Priority';
            default: return 'All Tasks';
        }
    }
    renderEditView() {
        const selectedTask = this.getSelectedTask();
        if (!selectedTask)
            return;
        console.log(chalk.cyan('╔══════════════════════════════════════════════════════════════╗'));
        console.log(chalk.cyan('║') + chalk.bold.white('                     📝 Edit Task                           ') + chalk.cyan('║'));
        console.log(chalk.cyan('╚══════════════════════════════════════════════════════════════╝'));
        console.log('');
        console.log(chalk.yellow('Task: ') + selectedTask.title);
        console.log(chalk.gray('Coming soon: Full task editing interface'));
        console.log('');
        console.log(chalk.dim('[ESC]Back to Task List'));
    }
    renderCreateView() {
        console.log(chalk.cyan('╔══════════════════════════════════════════════════════════════╗'));
        console.log(chalk.cyan('║') + chalk.bold.white('                     ✨ Create New Task                     ') + chalk.cyan('║'));
        console.log(chalk.cyan('╚══════════════════════════════════════════════════════════════╝'));
        console.log('');
        console.log(chalk.gray('Coming soon: Quick task creation interface'));
        console.log('');
        console.log(chalk.dim('[ESC]Back to Task List'));
    }
    // Keep only the getFilteredTasks method from the old implementation
    async getFilteredTasks() {
        let tasks = await this.backlogManager.listTasks();
        // Apply filter
        switch (this.currentFilter) {
            case 'todo':
                tasks = tasks.filter(t => t.status === 'todo');
                break;
            case 'in_progress':
                tasks = tasks.filter(t => t.status === 'in-progress' || t.status === 'focused');
                break;
            case 'done':
                tasks = tasks.filter(t => t.status === 'done');
                break;
            case 'high':
                tasks = tasks.filter(t => t.priority === 'high');
                break;
            case 'medium':
                tasks = tasks.filter(t => t.priority === 'medium');
                break;
            case 'low':
                tasks = tasks.filter(t => t.priority === 'low');
                break;
            case 'critical':
                tasks = tasks.filter(t => t.priority === 'critical');
                break;
        }
        // Apply sort
        switch (this.currentSort) {
            case 'created':
                tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
            case 'priority':
                const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                tasks.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0));
                break;
            case 'status':
                const statusOrder = {
                    todo: 1, focused: 2, 'in-progress': 3, blocked: 4, done: 5, dimmed: 6,
                    archived_done: 7, archived_blocked: 8, archived_dimmed: 9
                };
                tasks.sort((a, b) => (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0));
                break;
            case 'title':
                tasks.sort((a, b) => a.title.localeCompare(b.title));
                break;
        }
        return tasks;
    }
}
//# sourceMappingURL=task-ui.js.map