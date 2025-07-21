/**
 * Search View
 * Provides fuzzy search interface for tasks
 */

import { BaseView, KeyModifiers } from './IView';
import { ITerminalUI, Style } from '../../application/ports/ITerminalUI';
import { TaskViewModel } from '../view-models/TaskViewModel';
import { ILogger } from '../../application/ports/ILogger';

export interface SearchResult {
  task: TaskViewModel;
  score: number;
  highlights: Array<{ start: number; end: number }>;
}

export class SearchView extends BaseView {
  private query: string = '';
  private results: SearchResult[] = [];
  private selectedIndex: number = 0;
  private cursorPosition: number = 0;
  private searchHistory: string[] = [];
  private historyIndex: number = -1;
  private onSearchCallback?: (query: string) => void;
  private onSelectCallback?: (task: TaskViewModel) => void;

  constructor(
    private readonly terminalUI: ITerminalUI,
    private readonly logger: ILogger
  ) {
    super();
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing SearchView');
  }

  onSearch(callback: (query: string) => void): void {
    this.onSearchCallback = callback;
  }

  onSelect(callback: (task: TaskViewModel) => void): void {
    this.onSelectCallback = callback;
  }

  setResults(results: SearchResult[]): void {
    this.results = results;
    this.selectedIndex = 0;
    this.invalidate();
  }

  render(): void {
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

  onKeyPress(key: string, modifiers: KeyModifiers): boolean {
    if (!this.state.isFocused) return false;

    switch (key) {
      case 'Enter':
        if (modifiers.ctrl) {
          this.selectCurrent();
        } else {
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

  private drawSearchBox(): void {
    const boxStyle: Style = {
      foreground: this.state.isFocused ? 'cyan' : 'gray'
    };

    // Draw box
    this.terminalUI.drawBox(
      this.position,
      this.dimensions.width,
      3,
      boxStyle
    );

    // Draw prompt
    const promptStyle: Style = {
      foreground: 'yellow',
      bold: true
    };

    this.terminalUI.write(
      '🔍 ',
      { x: this.position.x + 1, y: this.position.y + 1 },
      promptStyle
    );

    // Draw query
    const queryStyle: Style = {
      foreground: 'white'
    };

    this.terminalUI.write(
      this.query,
      { x: this.position.x + 3, y: this.position.y + 1 },
      queryStyle
    );
  }

  private drawResults(): void {
    const startY = this.position.y + 4;
    const maxResults = this.dimensions.height - 7;

    this.results.slice(0, maxResults).forEach((result, index) => {
      const isSelected = index === this.selectedIndex;
      this.drawResult(result, startY + index, isSelected);
    });

    // Draw result count
    const countText = `${this.results.length} results`;
    const countStyle: Style = {
      foreground: 'gray',
      italic: true
    };

    this.terminalUI.write(
      countText,
      { 
        x: this.position.x + this.dimensions.width - countText.length - 2,
        y: this.position.y + 3
      },
      countStyle
    );
  }

  private drawResult(result: SearchResult, y: number, isSelected: boolean): void {
    const style: Style = {
      foreground: isSelected ? 'black' : 'white',
      background: isSelected ? 'cyan' : undefined
    };

    const task = result.task;
    const line = `${task.priorityIcon} ${task.statusIcon} ${task.title}`;
    
    // Draw base line
    this.terminalUI.writeLine(
      line.padEnd(this.dimensions.width - 2),
      { x: this.position.x + 1, y },
      style
    );

    // Highlight matching parts
    if (!isSelected && result.highlights.length > 0) {
      const highlightStyle: Style = {
        foreground: 'yellow',
        bold: true
      };

      result.highlights.forEach(({ start, end }) => {
        const highlightText = task.title.substring(start, end);
        const x = this.position.x + 6 + start; // Account for icons
        
        this.terminalUI.write(
          highlightText,
          { x, y },
          highlightStyle
        );
      });
    }
  }

  private drawHelp(): void {
    const helpY = this.position.y + this.dimensions.height - 1;
    const helpStyle: Style = {
      foreground: 'gray'
    };

    const helpText = ' ↑↓ Navigate | Enter Select | Ctrl+Enter Open | Esc Cancel ';
    
    this.terminalUI.write(
      helpText,
      { x: this.position.x + 1, y: helpY },
      helpStyle
    );
  }

  private insertCharacter(char: string): void {
    this.query = 
      this.query.slice(0, this.cursorPosition) + 
      char + 
      this.query.slice(this.cursorPosition);
    this.cursorPosition++;
    this.triggerSearch();
    this.invalidate();
  }

  private deleteCharacter(): void {
    if (this.cursorPosition > 0) {
      this.query = 
        this.query.slice(0, this.cursorPosition - 1) + 
        this.query.slice(this.cursorPosition);
      this.cursorPosition--;
      this.triggerSearch();
      this.invalidate();
    }
  }

  private deleteForward(): void {
    if (this.cursorPosition < this.query.length) {
      this.query = 
        this.query.slice(0, this.cursorPosition) + 
        this.query.slice(this.cursorPosition + 1);
      this.triggerSearch();
      this.invalidate();
    }
  }

  private deleteWord(): void {
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

  private clearQuery(): void {
    this.query = '';
    this.cursorPosition = 0;
    this.triggerSearch();
    this.invalidate();
  }

  private moveCursorLeft(): void {
    if (this.cursorPosition > 0) {
      this.cursorPosition--;
      this.invalidate();
    }
  }

  private moveCursorRight(): void {
    if (this.cursorPosition < this.query.length) {
      this.cursorPosition++;
      this.invalidate();
    }
  }

  private moveCursorToStart(): void {
    this.cursorPosition = 0;
    this.invalidate();
  }

  private moveCursorToEnd(): void {
    this.cursorPosition = this.query.length;
    this.invalidate();
  }

  private moveResultDown(): void {
    if (this.selectedIndex < this.results.length - 1) {
      this.selectedIndex++;
      this.invalidate();
    }
  }

  private moveResultUp(): void {
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
      this.invalidate();
    }
  }

  private triggerSearch(): void {
    if (this.onSearchCallback) {
      this.onSearchCallback(this.query);
    }
  }

  private executeSearch(): void {
    if (this.query.trim()) {
      this.searchHistory.push(this.query);
      this.historyIndex = -1;
    }
    this.selectCurrent();
  }

  private selectCurrent(): void {
    if (this.results.length > 0 && this.onSelectCallback) {
      const selected = this.results[this.selectedIndex];
      this.onSelectCallback(selected.task);
    }
  }

  private close(): void {
    this.query = '';
    this.cursorPosition = 0;
    this.results = [];
    this.selectedIndex = 0;
    this.terminalUI.hideCursor();
    this.hide();
  }

  dispose(): void {
    this.terminalUI.hideCursor();
    super.dispose();
  }
}