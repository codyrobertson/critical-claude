/**
 * Task List View
 * Main view for displaying tasks in a list format
 */
import { BaseView } from './IView.js';
export class TaskListView extends BaseView {
    terminalUI;
    logger;
    tasks = [];
    selectedIndex = 0;
    scrollOffset = 0;
    options;
    constructor(terminalUI, logger, options) {
        super();
        this.terminalUI = terminalUI;
        this.logger = logger;
        this.options = {
            showLineNumbers: true,
            showPriority: true,
            showStatus: true,
            showTags: true,
            wrapText: false,
            highlightCurrentLine: true,
            ...options
        };
    }
    async initialize() {
        this.logger.info('Initializing TaskListView');
    }
    setTasks(tasks) {
        this.tasks = tasks;
        this.selectedIndex = Math.min(this.selectedIndex, Math.max(0, tasks.length - 1));
        this.invalidate();
    }
    getSelectedTask() {
        return this.tasks[this.selectedIndex] || null;
    }
    render() {
        if (!this.state.isVisible || !this.state.needsRedraw) {
            return;
        }
        this.terminalUI.clear();
        // Draw border if focused
        if (this.state.isFocused) {
            this.drawBorder();
        }
        // Draw header
        this.drawHeader();
        // Draw tasks
        const visibleTasks = this.getVisibleTasks();
        let y = this.position.y + 2; // Account for header
        visibleTasks.forEach((task, index) => {
            const isSelected = this.scrollOffset + index === this.selectedIndex;
            this.drawTask(task, y, isSelected);
            y++;
        });
        // Draw scrollbar if needed
        if (this.tasks.length > this.getVisibleLines()) {
            this.drawScrollbar();
        }
        // Draw status line
        this.drawStatusLine();
        this.markAsDrawn();
    }
    onKeyPress(key, modifiers) {
        if (!this.state.isFocused)
            return false;
        switch (key) {
            case 'j':
            case 'ArrowDown':
                this.moveDown();
                return true;
            case 'k':
            case 'ArrowUp':
                this.moveUp();
                return true;
            case 'g':
                if (modifiers.shift) {
                    this.moveToEnd();
                }
                else {
                    this.moveToStart();
                }
                return true;
            case 'PageDown':
                this.pageDown();
                return true;
            case 'f':
                if (modifiers.ctrl) {
                    this.pageDown();
                    return true;
                }
                return false;
            case 'PageUp':
                this.pageUp();
                return true;
            case 'b':
                if (modifiers.ctrl) {
                    this.pageUp();
                    return true;
                }
                return false;
            case 'Enter':
            case 'o':
                this.openSelectedTask();
                return true;
            case 'Space':
                this.toggleTaskStatus();
                return true;
            default:
                return false;
        }
    }
    drawBorder() {
        const style = {
            foreground: this.state.isFocused ? 'cyan' : 'gray'
        };
        this.terminalUI.drawBox(this.position, this.dimensions.width, this.dimensions.height, style);
    }
    drawHeader() {
        const headerStyle = {
            foreground: 'white',
            background: 'blue',
            bold: true
        };
        let header = '';
        if (this.options.showLineNumbers) {
            header += ' # ';
        }
        if (this.options.showStatus) {
            header += 'S ';
        }
        if (this.options.showPriority) {
            header += 'P ';
        }
        header += 'Title';
        if (this.options.showTags) {
            header = header.padEnd(this.dimensions.width - 10) + 'Tags';
        }
        this.terminalUI.writeLine(header.padEnd(this.dimensions.width), { x: this.position.x, y: this.position.y }, headerStyle);
    }
    drawTask(task, y, isSelected) {
        const style = {
            foreground: isSelected ? 'black' : 'white',
            background: isSelected ? 'cyan' : undefined,
            bold: isSelected
        };
        let line = '';
        if (this.options.showLineNumbers) {
            line += ` ${(this.tasks.indexOf(task) + 1).toString().padStart(2)} `;
        }
        if (this.options.showStatus) {
            line += `${task.statusIcon} `;
        }
        if (this.options.showPriority) {
            line += `${task.priorityIcon} `;
        }
        // Truncate or wrap title
        const remainingWidth = this.dimensions.width - line.length -
            (this.options.showTags ? 15 : 0);
        const title = this.options.wrapText
            ? task.title
            : this.truncate(task.title, remainingWidth);
        line += title;
        if (this.options.showTags && task.tags.length > 0) {
            const tagsStr = task.tags.slice(0, 2).join(',');
            line = line.padEnd(this.dimensions.width - 15) +
                this.truncate(tagsStr, 14);
        }
        this.terminalUI.writeLine(line.padEnd(this.dimensions.width), { x: this.position.x, y }, style);
    }
    drawScrollbar() {
        const scrollbarHeight = Math.max(1, Math.floor((this.getVisibleLines() / this.tasks.length) * this.getVisibleLines()));
        const scrollbarPosition = Math.floor((this.scrollOffset / (this.tasks.length - this.getVisibleLines())) *
            (this.getVisibleLines() - scrollbarHeight));
        const x = this.position.x + this.dimensions.width - 1;
        for (let i = 0; i < this.getVisibleLines(); i++) {
            const y = this.position.y + 2 + i;
            const isScrollbar = i >= scrollbarPosition &&
                i < scrollbarPosition + scrollbarHeight;
            this.terminalUI.write(isScrollbar ? '█' : '│', { x, y }, { foreground: isScrollbar ? 'cyan' : 'gray' });
        }
    }
    drawStatusLine() {
        const current = this.selectedIndex + 1;
        const total = this.tasks.length;
        const status = `${current}/${total}`;
        const style = {
            foreground: 'gray',
            italic: true
        };
        this.terminalUI.write(status, {
            x: this.position.x + this.dimensions.width - status.length - 1,
            y: this.position.y + this.dimensions.height - 1
        }, style);
    }
    getVisibleTasks() {
        const visibleLines = this.getVisibleLines();
        return this.tasks.slice(this.scrollOffset, this.scrollOffset + visibleLines);
    }
    getVisibleLines() {
        return this.dimensions.height - 3; // Header + border
    }
    moveDown() {
        if (this.selectedIndex < this.tasks.length - 1) {
            this.selectedIndex++;
            this.ensureVisible();
            this.invalidate();
        }
    }
    moveUp() {
        if (this.selectedIndex > 0) {
            this.selectedIndex--;
            this.ensureVisible();
            this.invalidate();
        }
    }
    moveToStart() {
        this.selectedIndex = 0;
        this.scrollOffset = 0;
        this.invalidate();
    }
    moveToEnd() {
        this.selectedIndex = this.tasks.length - 1;
        this.ensureVisible();
        this.invalidate();
    }
    pageDown() {
        const pageSize = this.getVisibleLines();
        this.selectedIndex = Math.min(this.selectedIndex + pageSize, this.tasks.length - 1);
        this.ensureVisible();
        this.invalidate();
    }
    pageUp() {
        const pageSize = this.getVisibleLines();
        this.selectedIndex = Math.max(this.selectedIndex - pageSize, 0);
        this.ensureVisible();
        this.invalidate();
    }
    ensureVisible() {
        const visibleLines = this.getVisibleLines();
        if (this.selectedIndex < this.scrollOffset) {
            this.scrollOffset = this.selectedIndex;
        }
        else if (this.selectedIndex >= this.scrollOffset + visibleLines) {
            this.scrollOffset = this.selectedIndex - visibleLines + 1;
        }
    }
    openSelectedTask() {
        const task = this.getSelectedTask();
        if (task) {
            this.logger.info('Opening task', { taskId: task.id });
            // Emit event or call controller
        }
    }
    truncate(text, maxLength) {
        if (text.length <= maxLength)
            return text;
        return text.substring(0, maxLength - 3) + '...';
    }
    toggleTaskStatus() {
        const task = this.getSelectedTask();
        if (task) {
            this.logger.info('Toggling task status', { taskId: task.id });
            // TODO: Emit event to toggle status
            // For now, just log
        }
    }
}
//# sourceMappingURL=TaskListView.js.map