/**
 * Simplified Blessed Terminal UI
 * A working implementation that properly renders content
 */
import { ITerminalUI, Dimensions, Position, Style, KeyModifiers } from '../../application/ports/ITerminalUI.js';
export declare class SimpleBlessedUI implements ITerminalUI {
    private screen;
    private mainBox;
    private contentLines;
    private keyHandlers;
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
    private applyBlessedTags;
}
//# sourceMappingURL=SimpleBlessedUI.d.ts.map