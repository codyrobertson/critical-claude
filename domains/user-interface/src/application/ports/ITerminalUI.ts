/**
 * Terminal UI Port Interface
 * Abstracts terminal rendering capabilities
 */

export interface Dimensions {
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
}

export interface Style {
  foreground?: Color | string;
  background?: Color | string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
}

export interface ITerminalUI {
  // Screen management
  clear(): void;
  refresh(): void;
  getDimensions(): Dimensions;
  
  // Cursor control
  setCursorPosition(position: Position): void;
  getCursorPosition(): Position;
  hideCursor(): void;
  showCursor(): void;
  
  // Text rendering
  write(text: string, position?: Position, style?: Style): void;
  writeLine(text: string, position?: Position, style?: Style): void;
  
  // Box drawing
  drawBox(
    position: Position,
    width: number,
    height: number,
    style?: Style
  ): void;
  
  // Input handling
  onKeyPress(handler: (key: string, modifiers: KeyModifiers) => void): () => void;
  onResize(handler: (dimensions: Dimensions) => void): () => void;
  
  // Buffer management
  createBuffer(): ITerminalBuffer;
  setActiveBuffer(buffer: ITerminalBuffer): void;
  
  // Cleanup
  dispose(): void;
}

export interface KeyModifiers {
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
}

export interface ITerminalBuffer {
  write(text: string, position?: Position, style?: Style): void;
  clear(): void;
  render(): void;
  dispose(): void;
}