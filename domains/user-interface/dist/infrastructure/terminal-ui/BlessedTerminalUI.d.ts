/**
 * Blessed Terminal UI Implementation
 * Concrete implementation using the blessed library
 */
import { ITerminalUI, ITerminalBuffer, Dimensions, Position, Style, KeyModifiers } from '../../application/ports/ITerminalUI';
export declare class BlessedTerminalUI implements ITerminalUI {
    private screen;
    private activeBuffer;
    private keyHandlers;
    private resizeHandlers;
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
    createBuffer(): ITerminalBuffer;
    setActiveBuffer(buffer: ITerminalBuffer): void;
    dispose(): void;
    private applyStyle;
    private convertStyle;
    private rgbToHex;
}
//# sourceMappingURL=BlessedTerminalUI.d.ts.map