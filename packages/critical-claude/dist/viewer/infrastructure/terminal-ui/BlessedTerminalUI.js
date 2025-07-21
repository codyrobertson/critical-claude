/**
 * Blessed Terminal UI Implementation
 * Concrete implementation using the blessed library
 */
import blessed from 'blessed';
export class BlessedTerminalUI {
    screen;
    activeBuffer = null;
    keyHandlers = [];
    resizeHandlers = [];
    constructor() {
        this.screen = blessed.screen({
            smartCSR: true,
            fullUnicode: true,
            forceUnicode: true,
            dockBorders: false,
            cursor: {
                artificial: true,
                shape: 'block',
                blink: true,
                color: 'white'
            }
        });
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        // Key events
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
        // Resize events
        this.screen.on('resize', () => {
            const dimensions = this.getDimensions();
            this.resizeHandlers.forEach(handler => handler(dimensions));
        });
    }
    clear() {
        this.screen.clearRegion(0, this.screen.width, 0, this.screen.height);
    }
    refresh() {
        this.screen.render();
    }
    getDimensions() {
        return {
            width: this.screen.width,
            height: this.screen.height
        };
    }
    setCursorPosition(position) {
        this.screen.program.cup(position.y, position.x);
    }
    getCursorPosition() {
        // This is a simplified implementation
        return { x: 0, y: 0 };
    }
    hideCursor() {
        this.screen.program.hideCursor();
    }
    showCursor() {
        this.screen.program.showCursor();
    }
    write(text, position, style) {
        if (position) {
            this.setCursorPosition(position);
        }
        const styledText = this.applyStyle(text, style);
        this.screen.program.write(styledText);
    }
    writeLine(text, position, style) {
        this.write(text + '\n', position, style);
    }
    drawBox(position, width, height, style) {
        try {
            const box = blessed.box({
                top: position.y,
                left: position.x,
                width: width,
                height: height,
                border: {
                    type: 'line'
                },
                style: this.convertStyle(style),
                parent: this.screen
            });
            this.screen.render();
        }
        catch (error) {
            console.error('Error rendering box:', error);
        }
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
        this.resizeHandlers.push(handler);
        return () => {
            const index = this.resizeHandlers.indexOf(handler);
            if (index > -1) {
                this.resizeHandlers.splice(index, 1);
            }
        };
    }
    createBuffer() {
        return new BlessedTerminalBuffer(this.screen);
    }
    setActiveBuffer(buffer) {
        if (buffer instanceof BlessedTerminalBuffer) {
            this.activeBuffer = buffer;
        }
    }
    dispose() {
        this.screen.destroy();
    }
    applyStyle(text, style) {
        if (!style)
            return text;
        let result = text;
        if (style.foreground) {
            const color = typeof style.foreground === 'string'
                ? style.foreground
                : this.rgbToHex(style.foreground);
            result = `{${color}-fg}${result}{/}`;
        }
        if (style.background) {
            const color = typeof style.background === 'string'
                ? style.background
                : this.rgbToHex(style.background);
            result = `{${color}-bg}${result}{/}`;
        }
        if (style.bold)
            result = `{bold}${result}{/bold}`;
        if (style.italic)
            result = `{italic}${result}{/italic}`;
        if (style.underline)
            result = `{underline}${result}{/underline}`;
        if (style.strikethrough)
            result = `{strikethrough}${result}{/strikethrough}`;
        return result;
    }
    convertStyle(style) {
        if (!style)
            return {};
        const blessedStyle = {};
        if (style.foreground) {
            blessedStyle.fg = typeof style.foreground === 'string'
                ? style.foreground
                : this.rgbToHex(style.foreground);
        }
        if (style.background) {
            blessedStyle.bg = typeof style.background === 'string'
                ? style.background
                : this.rgbToHex(style.background);
        }
        if (style.bold)
            blessedStyle.bold = true;
        if (style.italic)
            blessedStyle.italic = true;
        if (style.underline)
            blessedStyle.underline = true;
        return blessedStyle;
    }
    rgbToHex(color) {
        const toHex = (n) => {
            const hex = n.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
    }
}
class BlessedTerminalBuffer {
    screen;
    box;
    content = '';
    constructor(screen) {
        this.screen = screen;
        this.box = blessed.box({
            hidden: true
        });
        screen.append(this.box);
    }
    write(text, position, style) {
        if (position) {
            // Handle positioned writes differently
            // This is a simplified implementation
        }
        this.content += text;
    }
    clear() {
        this.content = '';
        this.box.setContent('');
    }
    render() {
        this.box.setContent(this.content);
        this.box.show();
        this.screen.render();
    }
    dispose() {
        this.box.destroy();
    }
}
//# sourceMappingURL=BlessedTerminalUI.js.map