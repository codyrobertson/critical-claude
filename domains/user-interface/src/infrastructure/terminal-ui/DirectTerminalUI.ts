/**
 * Direct Terminal UI Implementation
 * Simple direct terminal output without blessed
 */

import { ITerminalUI, Dimensions, Position, Style, KeyModifiers } from '../../application/ports/ITerminalUI.js';
import readline from 'readline';

export class DirectTerminalUI implements ITerminalUI {
  private keyHandlers: Array<(key: string, modifiers: KeyModifiers) => void> = [];
  private resizeHandlers: Array<(dimensions: Dimensions) => void> = [];
  private rl: readline.Interface;

  constructor() {
    // Set up readline interface for key input
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    // Enable raw mode for better key handling
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }

    this.setupEventHandlers();
    
    // Enter alternate screen buffer (prevents scrolling)
    process.stdout.write('\x1b[?1049h');
    
    // Clear screen and hide cursor
    this.clear();
    this.hideCursor();
  }

  private setupEventHandlers(): void {
    // Handle keypress events
    process.stdin.on('data', (data) => {
      const key = data.toString();
      const modifiers: KeyModifiers = {
        ctrl: false,
        alt: false,
        shift: false,
        meta: false
      };

      // Detect special keys
      let keyName = key;
      
      // Arrow keys
      if (key === '\x1b[A') keyName = 'ArrowUp';
      else if (key === '\x1b[B') keyName = 'ArrowDown';
      else if (key === '\x1b[C') keyName = 'ArrowRight';
      else if (key === '\x1b[D') keyName = 'ArrowLeft';
      
      // Special characters
      else if (key === '\r' || key === '\n') keyName = 'Enter';
      else if (key === '\x7f' || key === '\x08') keyName = 'Backspace';
      else if (key === '\t') keyName = 'Tab';
      else if (key === ' ') keyName = 'Space';
      else if (key === '\x1b') keyName = 'Escape';
      
      // Page Up/Down
      else if (key === '\x1b[5~') keyName = 'PageUp';
      else if (key === '\x1b[6~') keyName = 'PageDown';
      
      // Ctrl combinations
      else if (key === '\x03') { // Ctrl+C
        modifiers.ctrl = true;
        keyName = 'c';
      }
      else if (key === '\x11') { // Ctrl+Q
        modifiers.ctrl = true;
        keyName = 'q';
      }
      else if (key === '\x06') { // Ctrl+F
        modifiers.ctrl = true;
        keyName = 'f';
      }
      else if (key === '\x02') { // Ctrl+B
        modifiers.ctrl = true;
        keyName = 'b';
      }
      
      // Detect uppercase letters (shift)
      else if (key.length === 1 && key >= 'A' && key <= 'Z') {
        modifiers.shift = true;
        keyName = key.toLowerCase();
      }

      this.keyHandlers.forEach(handler => handler(keyName, modifiers));
    });

    // Handle resize events
    process.stdout.on('resize', () => {
      const dimensions = this.getDimensions();
      this.resizeHandlers.forEach(handler => handler(dimensions));
    });
  }

  clear(): void {
    // Clear screen and move cursor to top
    process.stdout.write('\x1b[2J\x1b[H');
  }

  refresh(): void {
    // Force a flush
    if (process.stdout.write('')) {
      process.stdout.uncork();
    }
  }

  getDimensions(): Dimensions {
    return {
      width: process.stdout.columns || 80,
      height: process.stdout.rows || 24
    };
  }

  setCursorPosition(position: Position): void {
    // ANSI escape sequence to move cursor
    process.stdout.write(`\x1b[${position.y + 1};${position.x + 1}H`);
  }

  getCursorPosition(): Position {
    return { x: 0, y: 0 };
  }

  hideCursor(): void {
    process.stdout.write('\x1b[?25l');
  }

  showCursor(): void {
    process.stdout.write('\x1b[?25h');
  }

  write(text: string, position?: Position, style?: Style): void {
    if (position) {
      this.setCursorPosition(position);
    }

    const styledText = this.applyStyle(text, style);
    process.stdout.write(styledText);
  }

  writeLine(text: string, position?: Position, style?: Style): void {
    this.write(text + '\n', position, style);
  }

  drawBox(position: Position, width: number, height: number, style?: Style): void {
    const top = '┌' + '─'.repeat(width - 2) + '┐';
    const bottom = '└' + '─'.repeat(width - 2) + '┘';
    const side = '│';

    this.writeLine(top, position, style);
    for (let i = 1; i < height - 1; i++) {
      this.write(side, { x: position.x, y: position.y + i }, style);
      this.write(side, { x: position.x + width - 1, y: position.y + i }, style);
    }
    this.writeLine(bottom, { x: position.x, y: position.y + height - 1 }, style);
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

  createBuffer(): any {
    return {
      write: () => {},
      clear: () => {},
      render: () => {}
    };
  }

  activateBuffer(buffer: any): void {
    // Not needed
  }

  setActiveBuffer(buffer: any): void {
    // Not needed
  }

  dispose(): void {
    this.showCursor();
    this.clear();
    
    // Exit alternate screen buffer
    process.stdout.write('\x1b[?1049l');
    
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    this.rl.close();
  }

  private applyStyle(text: string, style?: Style): string {
    if (!style) return text;

    let codes: string[] = [];

    // Foreground colors
    if (style.foreground) {
      const colorMap: Record<string, string> = {
        black: '30',
        red: '31',
        green: '32',
        yellow: '33',
        blue: '34',
        magenta: '35',
        cyan: '36',
        white: '37',
        gray: '90',
        grey: '90'
      };
      
      if (typeof style.foreground === 'string' && colorMap[style.foreground]) {
        codes.push(colorMap[style.foreground]);
      }
    }

    // Background colors
    if (style.background) {
      const colorMap: Record<string, string> = {
        black: '40',
        red: '41',
        green: '42',
        yellow: '43',
        blue: '44',
        magenta: '45',
        cyan: '46',
        white: '47'
      };
      
      if (typeof style.background === 'string' && colorMap[style.background]) {
        codes.push(colorMap[style.background]);
      }
    }

    // Text styles
    if (style.bold) codes.push('1');
    if (style.italic) codes.push('3');
    if (style.underline) codes.push('4');

    if (codes.length === 0) return text;

    return `\x1b[${codes.join(';')}m${text}\x1b[0m`;
  }
}