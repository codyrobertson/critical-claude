/**
 * Task List View
 * Main view for displaying tasks in a list format
 */

import { BaseView, KeyModifiers } from './IView.js';
import { ITerminalUI, Style } from '../../application/ports/ITerminalUI.js';
import { TaskViewModel } from '../view-models/TaskViewModel.js';
import { ILogger } from '../../application/ports/ILogger.js';

export interface TaskListViewOptions {
  showLineNumbers: boolean;
  showPriority: boolean;
  showStatus: boolean;
  showTags: boolean;
  wrapText: boolean;
  highlightCurrentLine: boolean;
}

export class TaskListView extends BaseView {
  private tasks: TaskViewModel[] = [];
  private selectedIndex: number = 0;
  private scrollOffset: number = 0;
  private options: TaskListViewOptions;

  constructor(
    private readonly terminalUI: ITerminalUI,
    private readonly logger: ILogger,
    options?: Partial<TaskListViewOptions>
  ) {
    super();
    this.options = {
      showLineNumbers: true,
      showPriority: true,
      showStatus: true,
      showTags: true,
      wrapText: false,
      highlightCurrentLine: true,
      ...options
    };
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing TaskListView');
  }

  setTasks(tasks: TaskViewModel[]): void {
    this.tasks = tasks;
    this.selectedIndex = Math.min(this.selectedIndex, Math.max(0, tasks.length - 1));
    this.invalidate();
  }

  getSelectedTask(): TaskViewModel | null {
    return this.tasks[this.selectedIndex] || null;
  }

  render(): void {
    if (!this.state.isVisible || !this.state.needsRedraw) {
      return;
    }

    this.terminalUI.clear();
    
    // Draw border if focused
    if (this.state.isFocused) {
      this.drawBorder();
    }

    // Draw header
    this.drawHeader();

    // Draw tasks
    const visibleTasks = this.getVisibleTasks();
    let y = this.position.y + 2; // Account for header

    visibleTasks.forEach((task, index) => {
      const isSelected = this.scrollOffset + index === this.selectedIndex;
      this.drawTask(task, y, isSelected);
      y++;
    });

    // Draw scrollbar if needed
    if (this.tasks.length > this.getVisibleLines()) {
      this.drawScrollbar();
    }

    // Draw status line
    this.drawStatusLine();

    this.markAsDrawn();
  }

  onKeyPress(key: string, modifiers: KeyModifiers): boolean {
    if (!this.state.isFocused) return false;

    switch (key) {
      case 'j':
      case 'ArrowDown':
        this.moveDown();
        return true;
      
      case 'k':
      case 'ArrowUp':
        this.moveUp();
        return true;
      
      case 'g':
        if (modifiers.shift) {
          this.moveToEnd();
        } else {
          this.moveToStart();
        }
        return true;
      
      case 'PageDown':
        this.pageDown();
        return true;
        
      case 'f':
        if (modifiers.ctrl) {
          this.pageDown();
          return true;
        }
        return false;
      
      case 'PageUp':
        this.pageUp();
        return true;
        
      case 'b':
        if (modifiers.ctrl) {
          this.pageUp();
          return true;
        }
        return false;
      
      case 'Enter':
      case 'o':
        this.openSelectedTask();
        return true;
        
      case 'Space':
        this.toggleTaskStatus();
        return true;
      
      default:
        return false;
    }
  }

  private drawBorder(): void {
    const style: Style = {
      foreground: this.state.isFocused ? 'cyan' : 'gray'
    };

    this.terminalUI.drawBox(
      this.position,
      this.dimensions.width,
      this.dimensions.height,
      style
    );
  }

  private drawHeader(): void {
    const headerStyle: Style = {
      foreground: 'white',
      background: 'blue',
      bold: true
    };

    let header = '';
    
    if (this.options.showLineNumbers) {
      header += ' # ';
    }
    if (this.options.showStatus) {
      header += 'S ';
    }
    if (this.options.showPriority) {
      header += 'P ';
    }
    
    header += 'Title';
    
    if (this.options.showTags) {
      header = header.padEnd(this.dimensions.width - 10) + 'Tags';
    }

    this.terminalUI.writeLine(
      header.padEnd(this.dimensions.width),
      { x: this.position.x, y: this.position.y },
      headerStyle
    );
  }

  private drawTask(task: TaskViewModel, y: number, isSelected: boolean): void {
    const style: Style = {
      foreground: isSelected ? 'black' : 'white',
      background: isSelected ? 'cyan' : undefined,
      bold: isSelected
    };

    let line = '';
    
    if (this.options.showLineNumbers) {
      line += ` ${(this.tasks.indexOf(task) + 1).toString().padStart(2)} `;
    }
    
    if (this.options.showStatus) {
      line += `${task.statusIcon} `;
    }
    
    if (this.options.showPriority) {
      line += `${task.priorityIcon} `;
    }
    
    // Truncate or wrap title
    const remainingWidth = this.dimensions.width - line.length - 
      (this.options.showTags ? 15 : 0);
    
    const title = this.options.wrapText 
      ? task.title 
      : this.truncate(task.title, remainingWidth);
    
    line += title;
    
    if (this.options.showTags && task.tags.length > 0) {
      const tagsStr = task.tags.slice(0, 2).join(',');
      line = line.padEnd(this.dimensions.width - 15) + 
        this.truncate(tagsStr, 14);
    }

    this.terminalUI.writeLine(
      line.padEnd(this.dimensions.width),
      { x: this.position.x, y },
      style
    );
  }

  private drawScrollbar(): void {
    const scrollbarHeight = Math.max(
      1,
      Math.floor((this.getVisibleLines() / this.tasks.length) * this.getVisibleLines())
    );
    
    const scrollbarPosition = Math.floor(
      (this.scrollOffset / (this.tasks.length - this.getVisibleLines())) * 
      (this.getVisibleLines() - scrollbarHeight)
    );

    const x = this.position.x + this.dimensions.width - 1;
    
    for (let i = 0; i < this.getVisibleLines(); i++) {
      const y = this.position.y + 2 + i;
      const isScrollbar = i >= scrollbarPosition && 
        i < scrollbarPosition + scrollbarHeight;
      
      this.terminalUI.write(
        isScrollbar ? '█' : '│',
        { x, y },
        { foreground: isScrollbar ? 'cyan' : 'gray' }
      );
    }
  }

  private drawStatusLine(): void {
    const current = this.selectedIndex + 1;
    const total = this.tasks.length;
    const status = `${current}/${total}`;
    
    const style: Style = {
      foreground: 'gray',
      italic: true
    };

    this.terminalUI.write(
      status,
      { 
        x: this.position.x + this.dimensions.width - status.length - 1,
        y: this.position.y + this.dimensions.height - 1
      },
      style
    );
  }

  private getVisibleTasks(): TaskViewModel[] {
    const visibleLines = this.getVisibleLines();
    return this.tasks.slice(this.scrollOffset, this.scrollOffset + visibleLines);
  }

  private getVisibleLines(): number {
    return this.dimensions.height - 3; // Header + border
  }

  private moveDown(): void {
    if (this.selectedIndex < this.tasks.length - 1) {
      this.selectedIndex++;
      this.ensureVisible();
      this.invalidate();
    }
  }

  private moveUp(): void {
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
      this.ensureVisible();
      this.invalidate();
    }
  }

  private moveToStart(): void {
    this.selectedIndex = 0;
    this.scrollOffset = 0;
    this.invalidate();
  }

  private moveToEnd(): void {
    this.selectedIndex = this.tasks.length - 1;
    this.ensureVisible();
    this.invalidate();
  }

  private pageDown(): void {
    const pageSize = this.getVisibleLines();
    this.selectedIndex = Math.min(
      this.selectedIndex + pageSize,
      this.tasks.length - 1
    );
    this.ensureVisible();
    this.invalidate();
  }

  private pageUp(): void {
    const pageSize = this.getVisibleLines();
    this.selectedIndex = Math.max(this.selectedIndex - pageSize, 0);
    this.ensureVisible();
    this.invalidate();
  }

  private ensureVisible(): void {
    const visibleLines = this.getVisibleLines();
    
    if (this.selectedIndex < this.scrollOffset) {
      this.scrollOffset = this.selectedIndex;
    } else if (this.selectedIndex >= this.scrollOffset + visibleLines) {
      this.scrollOffset = this.selectedIndex - visibleLines + 1;
    }
  }

  private openSelectedTask(): void {
    const task = this.getSelectedTask();
    if (task) {
      this.logger.info('Opening task', { taskId: task.id });
      // Emit event or call controller
    }
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
  
  private toggleTaskStatus(): void {
    const task = this.getSelectedTask();
    if (task) {
      this.logger.info('Toggling task status', { taskId: task.id });
      // TODO: Emit event to toggle status
      // For now, just log
    }
  }
}