/**
 * Search View
 * Provides fuzzy search interface for tasks
 */
import { BaseView } from './IView';
export class SearchView extends BaseView {
    terminalUI;
    logger;
    query = '';
    results = [];
    selectedIndex = 0;
    cursorPosition = 0;
    searchHistory = [];
    historyIndex = -1;
    onSearchCallback;
    onSelectCallback;
    constructor(terminalUI, logger) {
        super();
        this.terminalUI = terminalUI;
        this.logger = logger;
    }
    async initialize() {
        this.logger.info('Initializing SearchView');
    }
    onSearch(callback) {
        this.onSearchCallback = callback;
    }
    onSelect(callback) {
        this.onSelectCallback = callback;
    }
    setResults(results) {
        this.results = results;
        this.selectedIndex = 0;
        this.invalidate();
    }
    render() {
        if (!this.state.isVisible || !this.state.needsRedraw) {
            return;
        }
        this.terminalUI.clear();
        // Draw search box
        this.drawSearchBox();
        // Draw results
        this.drawResults();
        // Draw help
        this.drawHelp();
        // Position cursor
        if (this.state.isFocused) {
            this.terminalUI.setCursorPosition({
                x: this.position.x + 2 + this.cursorPosition,
                y: this.position.y + 1
            });
            this.terminalUI.showCursor();
        }
        this.markAsDrawn();
    }
    onKeyPress(key, modifiers) {
        if (!this.state.isFocused)
            return false;
        switch (key) {
            case 'Enter':
                if (modifiers.ctrl) {
                    this.selectCurrent();
                }
                else {
                    this.executeSearch();
                }
                return true;
            case 'Escape':
                this.close();
                return true;
            case 'ArrowDown':
            case 'ctrl+n':
                this.moveResultDown();
                return true;
            case 'ArrowUp':
            case 'ctrl+p':
                this.moveResultUp();
                return true;
            case 'ArrowLeft':
                this.moveCursorLeft();
                return true;
            case 'ArrowRight':
                this.moveCursorRight();
                return true;
            case 'Home':
            case 'ctrl+a':
                this.moveCursorToStart();
                return true;
            case 'End':
            case 'ctrl+e':
                this.moveCursorToEnd();
                return true;
            case 'Backspace':
                this.deleteCharacter();
                return true;
            case 'Delete':
                this.deleteForward();
                return true;
            case 'ctrl+u':
                this.clearQuery();
                return true;
            case 'ctrl+w':
                this.deleteWord();
                return true;
            default:
                if (key.length === 1 && !modifiers.ctrl && !modifiers.alt) {
                    this.insertCharacter(key);
                    return true;
                }
                return false;
        }
    }
    drawSearchBox() {
        const boxStyle = {
            foreground: this.state.isFocused ? 'cyan' : 'gray'
        };
        // Draw box
        this.terminalUI.drawBox(this.position, this.dimensions.width, 3, boxStyle);
        // Draw prompt
        const promptStyle = {
            foreground: 'yellow',
            bold: true
        };
        this.terminalUI.write('🔍 ', { x: this.position.x + 1, y: this.position.y + 1 }, promptStyle);
        // Draw query
        const queryStyle = {
            foreground: 'white'
        };
        this.terminalUI.write(this.query, { x: this.position.x + 3, y: this.position.y + 1 }, queryStyle);
    }
    drawResults() {
        const startY = this.position.y + 4;
        const maxResults = this.dimensions.height - 7;
        this.results.slice(0, maxResults).forEach((result, index) => {
            const isSelected = index === this.selectedIndex;
            this.drawResult(result, startY + index, isSelected);
        });
        // Draw result count
        const countText = `${this.results.length} results`;
        const countStyle = {
            foreground: 'gray',
            italic: true
        };
        this.terminalUI.write(countText, {
            x: this.position.x + this.dimensions.width - countText.length - 2,
            y: this.position.y + 3
        }, countStyle);
    }
    drawResult(result, y, isSelected) {
        const style = {
            foreground: isSelected ? 'black' : 'white',
            background: isSelected ? 'cyan' : undefined
        };
        const task = result.task;
        const line = `${task.priorityIcon} ${task.statusIcon} ${task.title}`;
        // Draw base line
        this.terminalUI.writeLine(line.padEnd(this.dimensions.width - 2), { x: this.position.x + 1, y }, style);
        // Highlight matching parts
        if (!isSelected && result.highlights.length > 0) {
            const highlightStyle = {
                foreground: 'yellow',
                bold: true
            };
            result.highlights.forEach(({ start, end }) => {
                const highlightText = task.title.substring(start, end);
                const x = this.position.x + 6 + start; // Account for icons
                this.terminalUI.write(highlightText, { x, y }, highlightStyle);
            });
        }
    }
    drawHelp() {
        const helpY = this.position.y + this.dimensions.height - 1;
        const helpStyle = {
            foreground: 'gray'
        };
        const helpText = ' ↑↓ Navigate | Enter Select | Ctrl+Enter Open | Esc Cancel ';
        this.terminalUI.write(helpText, { x: this.position.x + 1, y: helpY }, helpStyle);
    }
    insertCharacter(char) {
        this.query =
            this.query.slice(0, this.cursorPosition) +
                char +
                this.query.slice(this.cursorPosition);
        this.cursorPosition++;
        this.triggerSearch();
        this.invalidate();
    }
    deleteCharacter() {
        if (this.cursorPosition > 0) {
            this.query =
                this.query.slice(0, this.cursorPosition - 1) +
                    this.query.slice(this.cursorPosition);
            this.cursorPosition--;
            this.triggerSearch();
            this.invalidate();
        }
    }
    deleteForward() {
        if (this.cursorPosition < this.query.length) {
            this.query =
                this.query.slice(0, this.cursorPosition) +
                    this.query.slice(this.cursorPosition + 1);
            this.triggerSearch();
            this.invalidate();
        }
    }
    deleteWord() {
        if (this.cursorPosition > 0) {
            const beforeCursor = this.query.slice(0, this.cursorPosition);
            const lastSpaceIndex = beforeCursor.lastIndexOf(' ');
            const deleteFrom = lastSpaceIndex === -1 ? 0 : lastSpaceIndex + 1;
            this.query =
                this.query.slice(0, deleteFrom) +
                    this.query.slice(this.cursorPosition);
            this.cursorPosition = deleteFrom;
            this.triggerSearch();
            this.invalidate();
        }
    }
    clearQuery() {
        this.query = '';
        this.cursorPosition = 0;
        this.triggerSearch();
        this.invalidate();
    }
    moveCursorLeft() {
        if (this.cursorPosition > 0) {
            this.cursorPosition--;
            this.invalidate();
        }
    }
    moveCursorRight() {
        if (this.cursorPosition < this.query.length) {
            this.cursorPosition++;
            this.invalidate();
        }
    }
    moveCursorToStart() {
        this.cursorPosition = 0;
        this.invalidate();
    }
    moveCursorToEnd() {
        this.cursorPosition = this.query.length;
        this.invalidate();
    }
    moveResultDown() {
        if (this.selectedIndex < this.results.length - 1) {
            this.selectedIndex++;
            this.invalidate();
        }
    }
    moveResultUp() {
        if (this.selectedIndex > 0) {
            this.selectedIndex--;
            this.invalidate();
        }
    }
    triggerSearch() {
        if (this.onSearchCallback) {
            this.onSearchCallback(this.query);
        }
    }
    executeSearch() {
        if (this.query.trim()) {
            this.searchHistory.push(this.query);
            this.historyIndex = -1;
        }
        this.selectCurrent();
    }
    selectCurrent() {
        if (this.results.length > 0 && this.onSelectCallback) {
            const selected = this.results[this.selectedIndex];
            this.onSelectCallback(selected.task);
        }
    }
    close() {
        this.query = '';
        this.cursorPosition = 0;
        this.results = [];
        this.selectedIndex = 0;
        this.terminalUI.hideCursor();
        this.hide();
    }
    dispose() {
        this.terminalUI.hideCursor();
        super.dispose();
    }
}
//# sourceMappingURL=SearchView.js.map