/**
 * Task Detail View
 * Displays detailed information about a single task
 */
import { BaseView } from './IView';
export class TaskDetailView extends BaseView {
    terminalUI;
    logger;
    task = null;
    scrollOffset = 0;
    sections = ['overview', 'description', 'metadata', 'subtasks'];
    currentSection = 0;
    constructor(terminalUI, logger) {
        super();
        this.terminalUI = terminalUI;
        this.logger = logger;
    }
    async initialize() {
        this.logger.info('Initializing TaskDetailView');
    }
    setTask(task) {
        this.task = task;
        this.scrollOffset = 0;
        this.currentSection = 0;
        this.invalidate();
    }
    render() {
        if (!this.state.isVisible || !this.state.needsRedraw || !this.task) {
            return;
        }
        this.terminalUI.clear();
        // Draw border
        this.drawBorder();
        // Draw header
        this.drawHeader();
        // Draw content based on current section
        switch (this.sections[this.currentSection]) {
            case 'overview':
                this.drawOverview();
                break;
            case 'description':
                this.drawDescription();
                break;
            case 'metadata':
                this.drawMetadata();
                break;
            case 'subtasks':
                this.drawSubtasks();
                break;
        }
        // Draw section tabs
        this.drawSectionTabs();
        this.markAsDrawn();
    }
    onKeyPress(key, modifiers) {
        if (!this.state.isFocused)
            return false;
        switch (key) {
            case 'Tab':
                this.nextSection();
                return true;
            case 'shift+Tab':
                this.previousSection();
                return true;
            case 'j':
            case 'ArrowDown':
                this.scrollDown();
                return true;
            case 'k':
            case 'ArrowUp':
                this.scrollUp();
                return true;
            case 'q':
            case 'Escape':
                this.close();
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
        if (!this.task)
            return;
        const headerStyle = {
            foreground: 'white',
            background: 'blue',
            bold: true
        };
        const header = ` ${this.task.priorityIcon} ${this.task.title} ${this.task.statusIcon}`;
        this.terminalUI.writeLine(header.padEnd(this.dimensions.width), { x: this.position.x, y: this.position.y }, headerStyle);
    }
    drawSectionTabs() {
        const y = this.position.y + 2;
        let x = this.position.x + 2;
        this.sections.forEach((section, index) => {
            const isActive = index === this.currentSection;
            const style = {
                foreground: isActive ? 'black' : 'white',
                background: isActive ? 'cyan' : undefined,
                bold: isActive
            };
            const text = ` ${section.toUpperCase()} `;
            this.terminalUI.write(text, { x, y }, style);
            x += text.length + 1;
        });
    }
    drawOverview() {
        if (!this.task)
            return;
        const startY = this.position.y + 4;
        let y = startY;
        this.drawField('ID', this.task.id, y++);
        this.drawField('Status', `${this.task.statusIcon} ${this.task.status}`, y++);
        this.drawField('Priority', `${this.task.priorityIcon} ${this.task.priority}`, y++);
        this.drawField('Created', this.task.createdAt, y++);
        this.drawField('Updated', this.task.updatedAt, y++);
        if (this.task.completedAt) {
            this.drawField('Completed', this.task.completedAt, y++);
        }
        if (this.task.duration) {
            this.drawField('Duration', this.task.duration, y++);
        }
        if (this.task.tags.length > 0) {
            this.drawField('Tags', this.task.tags.join(', '), y++);
        }
        if (this.task.hasSubtasks) {
            this.drawField('Subtasks', `${this.task.subtaskCount} tasks`, y++);
        }
        // Progress bar
        y++;
        this.drawProgressBar(y);
    }
    drawDescription() {
        if (!this.task)
            return;
        const startY = this.position.y + 4;
        const maxWidth = this.dimensions.width - 4;
        const lines = this.wrapText(this.task.description, maxWidth);
        lines.slice(this.scrollOffset).forEach((line, index) => {
            const y = startY + index;
            if (y < this.position.y + this.dimensions.height - 2) {
                this.terminalUI.writeLine(line, { x: this.position.x + 2, y });
            }
        });
    }
    drawMetadata() {
        // Implementation for metadata display
        const y = this.position.y + 4;
        this.terminalUI.writeLine('Metadata section (to be implemented)', { x: this.position.x + 2, y });
    }
    drawSubtasks() {
        // Implementation for subtasks display
        const y = this.position.y + 4;
        this.terminalUI.writeLine('Subtasks section (to be implemented)', { x: this.position.x + 2, y });
    }
    drawField(label, value, y) {
        const labelStyle = { foreground: 'gray' };
        const valueStyle = { foreground: 'white' };
        const labelText = `${label}:`.padEnd(12);
        this.terminalUI.write(labelText, { x: this.position.x + 2, y }, labelStyle);
        this.terminalUI.write(value, { x: this.position.x + 2 + labelText.length, y }, valueStyle);
    }
    drawProgressBar(y) {
        if (!this.task)
            return;
        const barWidth = this.dimensions.width - 6;
        const filledWidth = Math.floor((this.task.progress / 100) * barWidth);
        this.terminalUI.write('Progress: ', { x: this.position.x + 2, y });
        const barX = this.position.x + 12;
        // Draw filled portion
        for (let i = 0; i < filledWidth; i++) {
            this.terminalUI.write('█', { x: barX + i, y }, { foreground: 'green' });
        }
        // Draw empty portion
        for (let i = filledWidth; i < barWidth; i++) {
            this.terminalUI.write('░', { x: barX + i, y }, { foreground: 'gray' });
        }
        // Draw percentage
        const percentage = `${this.task.progress}%`;
        this.terminalUI.write(percentage, { x: barX + barWidth + 1, y });
    }
    wrapText(text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        words.forEach(word => {
            if (currentLine.length + word.length + 1 <= maxWidth) {
                currentLine += (currentLine ? ' ' : '') + word;
            }
            else {
                if (currentLine)
                    lines.push(currentLine);
                currentLine = word;
            }
        });
        if (currentLine)
            lines.push(currentLine);
        return lines;
    }
    nextSection() {
        this.currentSection = (this.currentSection + 1) % this.sections.length;
        this.scrollOffset = 0;
        this.invalidate();
    }
    previousSection() {
        this.currentSection = this.currentSection === 0
            ? this.sections.length - 1
            : this.currentSection - 1;
        this.scrollOffset = 0;
        this.invalidate();
    }
    scrollDown() {
        this.scrollOffset++;
        this.invalidate();
    }
    scrollUp() {
        if (this.scrollOffset > 0) {
            this.scrollOffset--;
            this.invalidate();
        }
    }
    close() {
        this.logger.info('Closing task detail view');
        // Emit close event
    }
}
//# sourceMappingURL=TaskDetailView.js.map