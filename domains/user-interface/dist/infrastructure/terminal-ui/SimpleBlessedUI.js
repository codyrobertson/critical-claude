/**
 * Simplified Blessed Terminal UI
 * A working implementation that properly renders content
 */
import blessed from 'blessed';
export class SimpleBlessedUI {
    screen;
    mainBox;
    contentLines = [];
    keyHandlers = [];
    constructor() {
        this.screen = blessed.screen({
            smartCSR: true,
            fullUnicode: true,
            forceUnicode: true,
            autoPadding: true,
            cursor: {
                artificial: true,
                shape: 'block',
                blink: true,
                color: 'white'
            }
        });
        // Force initial allocation
        this.screen.alloc();
        // Create main content box
        this.mainBox = blessed.box({
            parent: this.screen,
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            tags: true,
            scrollable: true,
            alwaysScroll: true,
            scrollbar: {
                ch: ' ',
                style: {
                    inverse: true
                }
            }
        });
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.screen.on('keypress', (ch, key) => {
            const modifiers = {
                ctrl: key.ctrl || false,
                alt: key.meta || false,
                shift: key.shift || false,
                meta: key.meta || false
            };
            const keyName = key.name || ch;
            this.keyHandlers.forEach(handler => handler(keyName, modifiers));
        });
        this.screen.on('resize', () => {
            this.refresh();
        });
    }
    clear() {
        this.contentLines = [];
        this.mainBox.setContent('');
    }
    refresh() {
        const content = this.contentLines.join('\n');
        this.mainBox.setContent(content);
        this.screen.render();
    }
    getDimensions() {
        // Force screen to update dimensions
        this.screen.alloc();
        return {
            width: this.screen.width || 80,
            height: this.screen.height || 24
        };
    }
    setCursorPosition(position) {
        // Not needed for this implementation
    }
    getCursorPosition() {
        return { x: 0, y: 0 };
    }
    hideCursor() {
        this.screen.program.hideCursor();
    }
    showCursor() {
        this.screen.program.showCursor();
    }
    write(text, position, style) {
        const styledText = this.applyBlessedTags(text, style);
        if (position) {
            const line = position.y;
            const col = position.x;
            // Ensure we have enough lines
            while (this.contentLines.length <= line) {
                this.contentLines.push('');
            }
            // Get current line and ensure it's long enough
            let currentLine = this.contentLines[line];
            while (currentLine.length < col) {
                currentLine += ' ';
            }
            // Insert text at position (overwrite mode)
            this.contentLines[line] = currentLine.substring(0, col) + styledText + currentLine.substring(col + styledText.length);
        }
        else {
            this.contentLines.push(styledText);
        }
    }
    writeLine(text, position, style) {
        const styledText = this.applyBlessedTags(text, style);
        if (position) {
            const line = position.y;
            // Ensure we have enough lines
            while (this.contentLines.length <= line) {
                this.contentLines.push('');
            }
            // Replace entire line
            this.contentLines[line] = styledText;
        }
        else {
            this.contentLines.push(styledText);
        }
    }
    drawBox(position, width, height, style) {
        // For simplicity, we'll skip box drawing in this implementation
        // The main content is what matters
    }
    onKeyPress(handler) {
        this.keyHandlers.push(handler);
        return () => {
            const index = this.keyHandlers.indexOf(handler);
            if (index > -1) {
                this.keyHandlers.splice(index, 1);
            }
        };
    }
    onResize(handler) {
        const resizeHandler = () => handler(this.getDimensions());
        this.screen.on('resize', resizeHandler);
        return () => {
            this.screen.off('resize', resizeHandler);
        };
    }
    createBuffer() {
        return {
            write: () => { },
            clear: () => { },
            render: () => { }
        };
    }
    activateBuffer(buffer) {
        // Not needed
    }
    setActiveBuffer(buffer) {
        // Not needed for this implementation
    }
    dispose() {
        this.screen.destroy();
    }
    applyBlessedTags(text, style) {
        if (!style)
            return text;
        let result = text;
        // Apply styles in correct order
        if (style.background) {
            result = `{${style.background}-bg}${result}{/${style.background}-bg}`;
        }
        if (style.foreground) {
            result = `{${style.foreground}-fg}${result}{/${style.foreground}-fg}`;
        }
        if (style.underline) {
            result = `{underline}${result}{/underline}`;
        }
        if (style.bold) {
            result = `{bold}${result}{/bold}`;
        }
        return result;
    }
}
//# sourceMappingURL=SimpleBlessedUI.js.map