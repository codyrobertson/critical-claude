/**
 * Blessed Terminal UI Implementation
 * Concrete implementation using the blessed library
 */

import * as blessed from 'blessed';
import {
  ITerminalUI,
  ITerminalBuffer,
  Dimensions,
  Position,
  Style,
  Color,
  KeyModifiers
} from '../../application/ports/ITerminalUI';

export class BlessedTerminalUI implements ITerminalUI {
  private screen: blessed.Widgets.Screen;
  private activeBuffer: BlessedTerminalBuffer | null = null;
  private keyHandlers: Array<(key: string, modifiers: KeyModifiers) => void> = [];
  private resizeHandlers: Array<(dimensions: Dimensions) => void> = [];

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

  private setupEventHandlers(): void {
    // Key events
    this.screen.on('keypress', (ch, key) => {
      const modifiers: KeyModifiers = {
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

  clear(): void {
    this.screen.clearRegion(0, this.screen.width as number, 0, this.screen.height as number);
  }

  refresh(): void {
    this.screen.render();
  }

  getDimensions(): Dimensions {
    return {
      width: this.screen.width as number,
      height: this.screen.height as number
    };
  }

  setCursorPosition(position: Position): void {
    this.screen.program.cup(position.y, position.x);
  }

  getCursorPosition(): Position {
    // This is a simplified implementation
    return { x: 0, y: 0 };
  }

  hideCursor(): void {
    this.screen.program.hideCursor();
  }

  showCursor(): void {
    this.screen.program.showCursor();
  }

  write(text: string, position?: Position, style?: Style): void {
    if (position) {
      this.setCursorPosition(position);
    }

    const styledText = this.applyStyle(text, style);
    this.screen.program.write(styledText);
  }

  writeLine(text: string, position?: Position, style?: Style): void {
    this.write(text + '\n', position, style);
  }

  drawBox(position: Position, width: number, height: number, style?: Style): void {
    const box = blessed.box({
      top: position.y,
      left: position.x,
      width: width,
      height: height,
      border: {
        type: 'line'
      },
      style: this.convertStyle(style)
    });

    this.screen.append(box);
    box.render();
  }

  onKeyPress(handler: (key: string, modifiers: KeyModifiers) => void): () => void {
    this.keyHandlers.push(handler);
    return () => {
      const index = this.keyHandlers.indexOf(handler);
      if (index > -1) {
        this.keyHandlers.splice(index, 1);
      }
    };
  }

  onResize(handler: (dimensions: Dimensions) => void): () => void {
    this.resizeHandlers.push(handler);
    return () => {
      const index = this.resizeHandlers.indexOf(handler);
      if (index > -1) {
        this.resizeHandlers.splice(index, 1);
      }
    };
  }

  createBuffer(): ITerminalBuffer {
    return new BlessedTerminalBuffer(this.screen);
  }

  setActiveBuffer(buffer: ITerminalBuffer): void {
    if (buffer instanceof BlessedTerminalBuffer) {
      this.activeBuffer = buffer;
    }
  }

  dispose(): void {
    this.screen.destroy();
  }

  private applyStyle(text: string, style?: Style): string {
    if (!style) return text;

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

    if (style.bold) result = `{bold}${result}{/bold}`;
    if (style.italic) result = `{italic}${result}{/italic}`;
    if (style.underline) result = `{underline}${result}{/underline}`;
    if (style.strikethrough) result = `{strikethrough}${result}{/strikethrough}`;

    return result;
  }

  private convertStyle(style?: Style): any {
    if (!style) return {};

    const blessedStyle: any = {};

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

    if (style.bold) blessedStyle.bold = true;
    if (style.italic) blessedStyle.italic = true;
    if (style.underline) blessedStyle.underline = true;

    return blessedStyle;
  }

  private rgbToHex(color: Color): string {
    const toHex = (n: number) => {
      const hex = n.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
  }
}

class BlessedTerminalBuffer implements ITerminalBuffer {
  private box: blessed.Widgets.BoxElement;
  private content: string = '';

  constructor(private screen: blessed.Widgets.Screen) {
    this.box = blessed.box({
      hidden: true
    });
    screen.append(this.box);
  }

  write(text: string, position?: Position, style?: Style): void {
    if (position) {
      // Handle positioned writes differently
      // This is a simplified implementation
    }
    this.content += text;
  }

  clear(): void {
    this.content = '';
    this.box.setContent('');
  }

  render(): void {
    this.box.setContent(this.content);
    this.box.show();
    this.screen.render();
  }

  dispose(): void {
    this.box.destroy();
  }
}