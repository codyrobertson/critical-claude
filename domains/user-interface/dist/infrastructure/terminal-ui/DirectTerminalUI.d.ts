/**
 * Direct Terminal UI Implementation
 * Simple direct terminal output without blessed
 */
import { ITerminalUI, Dimensions, Position, Style, KeyModifiers } from '../../application/ports/ITerminalUI.js';
export declare class DirectTerminalUI implements ITerminalUI {
    private keyHandlers;
    private resizeHandlers;
    private rl;
    constructor();
    private setupEventHandlers;
    clear(): void;
    refresh(): void;
    getDimensions(): Dimensions;
    setCursorPosition(position: Position): void;
    getCursorPosition(): Position;
    hideCursor(): void;
    showCursor(): void;
    write(text: string, position?: Position, style?: Style): void;
    writeLine(text: string, position?: Position, style?: Style): void;
    drawBox(position: Position, width: number, height: number, style?: Style): void;
    onKeyPress(handler: (key: string, modifiers: KeyModifiers) => void): () => void;
    onResize(handler: (dimensions: Dimensions) => void): () => void;
    createBuffer(): any;
    activateBuffer(buffer: any): void;
    setActiveBuffer(buffer: any): void;
    dispose(): void;
    private applyStyle;
}
//# sourceMappingURL=DirectTerminalUI.d.ts.map