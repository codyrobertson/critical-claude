/**
 * Simplified Viewer Service
 * Consolidates ViewerService functionality into direct service methods
 */

import { 
  Task,
  Result,
  createSuccessResult,
  createErrorResult
} from '../models/index.js';
import { FileStorage } from '../storage/index.js';
import { logger } from '../utils/Logger.js';

export interface ViewerOptions {
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  theme?: 'dark' | 'light';
}

export interface ViewerResult {
  success: boolean;
  error?: string;
}

export class ViewerService {
  private readonly COLLECTION = 'tasks';

  constructor(private storage: FileStorage) {}

  async launchViewer(options: ViewerOptions): Promise<ViewerResult> {
    try {
      logger.info('Launching task viewer', options);
      
      // Initialize viewer with options
      const viewer = new TerminalViewer(this.storage, options);
      
      // Launch viewer interface
      await viewer.launch();
      
      logger.info('Task viewer exited');
      return {
        success: true
      };
    } catch (error) {
      logger.error('Failed to launch viewer', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async getTasksForViewer(): Promise<Result<Task[]>> {
    try {
      const tasks = await this.storage.findAll<Task>(this.COLLECTION);
      
      // Sort tasks for optimal viewing (high priority first, then by date)
      const sortedTasks = tasks.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority; // Higher priority first
        }
        
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Newer first
      });
      
      return createSuccessResult(sortedTasks);
    } catch (error) {
      return createErrorResult(`Failed to get tasks for viewer: ${error instanceof Error ? error.message : error}`);
    }
  }

  async searchTasks(query: string): Promise<Result<Task[]>> {
    try {
      const tasks = await this.storage.findAll<Task>(this.COLLECTION);
      
      const filteredTasks = tasks.filter(task => {
        const searchFields = [
          task.title.toLowerCase(),
          task.description.toLowerCase(),
          task.labels.join(' ').toLowerCase(),
          task.assignee?.toLowerCase() || '',
          task.status.toLowerCase(),
          task.priority.toLowerCase()
        ];
        
        const searchTerm = query.toLowerCase();
        return searchFields.some(field => field.includes(searchTerm));
      });
      
      return createSuccessResult(filteredTasks);
    } catch (error) {
      return createErrorResult(`Failed to search tasks: ${error instanceof Error ? error.message : error}`);
    }
  }

  async toggleTaskStatus(taskId: string): Promise<Result<Task>> {
    try {
      const task = await this.storage.findById<Task>(this.COLLECTION, taskId);
      
      if (!task) {
        return createErrorResult(`Task with ID ${taskId} not found`);
      }
      
      // Toggle status logic
      const statusTransitions = {
        'todo': 'in_progress',
        'in_progress': 'done',
        'done': 'todo',
        'blocked': 'in_progress',
        'archived': 'todo'
      };
      
      const newStatus = statusTransitions[task.status as keyof typeof statusTransitions] || 'todo';
      
      const updatedTask = {
        ...task,
        status: newStatus as Task['status'],
        updatedAt: new Date()
      };
      
      await this.storage.save(this.COLLECTION, taskId, updatedTask);
      
      return createSuccessResult(updatedTask);
    } catch (error) {
      return createErrorResult(`Failed to toggle task status: ${error instanceof Error ? error.message : error}`);
    }
  }
}

// Advanced Terminal GUI Viewer Implementation
class TerminalViewer {
  private tasks: Task[] = [];
  private filteredTasks: Task[] = [];
  private selectedIndex = 0;
  private statusFilter: string | null = null;
  private searchQuery = '';
  private isRunning = true;
  private showingDetails = false;
  private editingMode = false;
  private editingField = 0; // 0=title, 1=description, 2=priority, 3=status
  private editingTask: Task | null = null;
  private editingValue = '';
  private terminalWidth = 80;
  private terminalHeight = 24;

  constructor(
    private storage: FileStorage,
    private options: ViewerOptions
  ) {
    // Get terminal dimensions
    this.terminalWidth = process.stdout.columns || 80;
    this.terminalHeight = process.stdout.rows || 24;
  }

  async launch(): Promise<void> {
    logger.debug('Starting Terminal GUI viewer');
    
    // Setup terminal for GUI mode
    this.setupTerminal();
    
    // Load initial tasks
    await this.loadTasks();
    logger.debug('Initial tasks loaded', { count: this.tasks.length });
    
    // Initial render
    this.applyFilters();
    this.render();
    
    // Start event loop
    await this.startEventLoop();
    
    // Cleanup terminal
    this.cleanupTerminal();
  }

  private setupTerminal(): void {
    // Enable raw mode for key capture
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    // Hide cursor and enable alternate screen
    process.stdout.write('\x1b[?25l'); // Hide cursor
    process.stdout.write('\x1b[?1049h'); // Enable alternate screen buffer
    process.stdout.write('\x1b[2J'); // Clear screen
  }

  private cleanupTerminal(): void {
    // Show cursor and restore normal screen
    process.stdout.write('\x1b[?25h'); // Show cursor
    process.stdout.write('\x1b[?1049l'); // Disable alternate screen buffer
    process.stdout.write('\x1b[2J'); // Clear screen
    process.stdout.write('\x1b[H'); // Move cursor to home
    
    // Restore terminal mode
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    process.stdin.pause();
  }

  private async startEventLoop(): Promise<void> {
    return new Promise((resolve) => {
      const handleKeypress = (key: string) => {
        this.handleKeypress(key);
        
        if (!this.isRunning) {
          process.stdin.removeListener('data', handleKeypress);
          resolve();
        }
      };
      
      process.stdin.on('data', handleKeypress);
      
      // Handle process signals
      process.on('SIGINT', () => {
        this.isRunning = false;
      });
    });
  }

  private async loadTasks(): Promise<void> {
    try {
      const allTasks = await this.storage.findAll<Task>('tasks');
      this.tasks = allTasks.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } catch (error) {
      logger.error('Failed to load tasks', error);
    }
  }

  private handleKeypress(key: string): void {
    if (this.editingMode) {
      this.handleEditingKeypress(key);
    } else {
      this.handleNormalKeypress(key);
    }
    
    this.render();
  }

  private handleNormalKeypress(key: string): void {
    switch (key) {
      case '\u0003': // Ctrl+C
      case 'q':
      case 'Q':
        this.isRunning = false;
        break;
        
      case '\u001b[A': // Up arrow
      case 'k':
        this.moveSelection(-1);
        break;
        
      case '\u001b[B': // Down arrow  
      case 'j':
        this.moveSelection(1);
        break;
        
      case '\r': // Enter - Start editing task
        this.startEditingTask();
        break;
        
      case '\t': // Tab - Toggle details view
        this.toggleTaskDetails();
        break;
        
      case ' ': // Space - Toggle task status
        this.toggleSelectedTaskStatus();
        break;
        
      case 'f':
      case 'F':
        this.cycleStatusFilter();
        break;
        
      case 'r':
      case 'R':
        this.refreshTasks();
        break;
        
      case '/':
        // TODO: Implement search mode
        break;
        
      case 'h':
      case 'H':
      case '?':
        this.showHelp();
        break;
    }
  }

  private handleEditingKeypress(key: string): void {
    switch (key) {
      case '\u0003': // Ctrl+C - Exit editing
      case '\u001b': // Escape
        this.exitEditingMode();
        break;
        
      case '\u001b[A': // Up arrow - Previous field
        this.saveCurrentFieldValue(); // Save current field before switching
        this.editingField = Math.max(0, this.editingField - 1);
        this.updateEditingValue();
        break;
        
      case '\u001b[B': // Down arrow - Next field
        this.saveCurrentFieldValue(); // Save current field before switching
        this.editingField = Math.min(3, this.editingField + 1);
        this.updateEditingValue();
        break;
        
      case '\r': // Enter - Save and exit
        this.saveCurrentFieldValue(); // Save current field before saving task
        this.saveEditingTask();
        break;
        
      case '\u007f': // Backspace
        if (this.editingValue.length > 0) {
          this.editingValue = this.editingValue.slice(0, -1);
        }
        break;
        
      default:
        // Regular character input
        if (key.length === 1 && key >= ' ') {
          this.editingValue += key;
        }
        break;
    }
  }

  private moveSelection(direction: number): void {
    const newIndex = this.selectedIndex + direction;
    
    if (newIndex >= 0 && newIndex < this.filteredTasks.length) {
      this.selectedIndex = newIndex;
    }
  }

  private toggleTaskDetails(): void {
    this.showingDetails = !this.showingDetails;
  }

  private cycleStatusFilter(): void {
    const filters = [null, 'todo', 'in_progress', 'done', 'blocked', 'archived'];
    const currentIndex = filters.indexOf(this.statusFilter);
    const nextIndex = (currentIndex + 1) % filters.length;
    
    this.statusFilter = filters[nextIndex];
    this.applyFilters();
    this.selectedIndex = 0; // Reset selection
  }

  private async refreshTasks(): Promise<void> {
    await this.loadTasks();
    this.applyFilters();
    this.selectedIndex = 0;
  }

  private showHelp(): void {
    // Toggle help display - for now just cycle through
    // TODO: Implement help overlay
  }

  private startEditingTask(): void {
    if (this.filteredTasks.length === 0) return;
    
    this.editingTask = this.filteredTasks[this.selectedIndex];
    this.editingMode = true;
    this.editingField = 0;
    this.updateEditingValue();
  }

  private exitEditingMode(): void {
    this.editingMode = false;
    this.editingTask = null;
    this.editingValue = '';
    this.editingField = 0;
  }

  private updateEditingValue(): void {
    if (!this.editingTask) return;
    
    switch (this.editingField) {
      case 0:
        this.editingValue = this.editingTask.title;
        break;
      case 1:
        this.editingValue = this.editingTask.description || '';
        break;
      case 2:
        this.editingValue = this.editingTask.priority;
        break;
      case 3:
        this.editingValue = this.editingTask.status;
        break;
    }
  }

  private saveCurrentFieldValue(): void {
    if (!this.editingTask) return;
    
    switch (this.editingField) {
      case 0:
        this.editingTask.title = this.editingValue.trim() || this.editingTask.title;
        break;
      case 1:
        this.editingTask.description = this.editingValue.trim();
        break;
      case 2:
        const validPriorities = ['critical', 'high', 'medium', 'low'];
        if (validPriorities.includes(this.editingValue.trim())) {
          this.editingTask.priority = this.editingValue.trim() as Task['priority'];
        }
        break;
      case 3:
        const validStatuses = ['todo', 'in_progress', 'done', 'blocked', 'archived'];
        if (validStatuses.includes(this.editingValue.trim())) {
          this.editingTask.status = this.editingValue.trim() as Task['status'];
        }
        break;
    }
  }

  private async saveEditingTask(): Promise<void> {
    // Store the task reference before any async operations
    const taskToSave = this.editingTask;
    
    if (!taskToSave) {
      logger.error('Cannot save: no task being edited');
      return;
    }
    
    try {
      // Create the updated task from the stored reference
      const updatedTask: Task = { 
        ...taskToSave,
        updatedAt: new Date()
      };
      
      // Ensure required fields are valid
      if (!updatedTask.title || updatedTask.title.trim() === '') {
        logger.warn('Cannot save task with empty title, keeping original');
        // Don't save if title is empty
        return;
      }
      
      logger.debug('Saving task update', { 
        taskId: updatedTask.id, 
        originalTaskId: taskToSave.id,
        updatedTask: {
          title: updatedTask.title,
          description: updatedTask.description,
          priority: updatedTask.priority,
          status: updatedTask.status
        }
      });
      
      // Try saving with retry mechanism
      let saveAttempts = 0;
      const maxAttempts = 3;
      let lastError: any;
      
      while (saveAttempts < maxAttempts) {
        try {
          await this.storage.save('tasks', taskToSave.id, updatedTask);
          logger.debug('Storage save completed successfully', { attempt: saveAttempts + 1 });
          break; // Success, exit retry loop
        } catch (storageError) {
          saveAttempts++;
          lastError = storageError;
          logger.warn(`Storage.save failed, attempt ${saveAttempts}/${maxAttempts}`, {
            error: storageError instanceof Error ? storageError.message : String(storageError)
          });
          
          if (saveAttempts < maxAttempts) {
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }
      
      if (saveAttempts >= maxAttempts) {
        logger.error('Storage.save failed after all attempts', {
          error: lastError instanceof Error ? lastError.message : String(lastError),
          stack: lastError instanceof Error ? lastError.stack : undefined,
          attempts: saveAttempts
        });
        throw lastError;
      }
      
      // Update local cache
      const taskIndex = this.tasks.findIndex(t => t.id === taskToSave.id);
      if (taskIndex !== -1) {
        this.tasks[taskIndex] = updatedTask;
      }
      
      // Update filtered tasks as well
      const filteredIndex = this.filteredTasks.findIndex(t => t.id === taskToSave.id);
      if (filteredIndex !== -1) {
        this.filteredTasks[filteredIndex] = updatedTask;
      }
      
      logger.info(`Task updated successfully: ${taskToSave.id}`);
      this.exitEditingMode();
    } catch (error) {
      logger.error('Failed to save edited task', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        taskId: this.editingTask?.id,
        editingField: this.editingField,
        editingValue: this.editingValue
      });
      // Don't exit editing mode on error so user can try again
    }
  }

  private async toggleSelectedTaskStatus(): Promise<void> {
    if (this.filteredTasks.length === 0) return;
    
    const selectedTask = this.filteredTasks[this.selectedIndex];
    const statusTransitions = {
      'todo': 'in_progress',
      'in_progress': 'done', 
      'done': 'todo',
      'blocked': 'in_progress',
      'archived': 'todo'
    };
    
    const newStatus = statusTransitions[selectedTask.status as keyof typeof statusTransitions] || 'todo';
    
    try {
      const updatedTask = {
        ...selectedTask,
        status: newStatus as Task['status'],
        updatedAt: new Date()
      };
      
      await this.storage.save('tasks', selectedTask.id, updatedTask);
      
      // Update local cache
      const taskIndex = this.tasks.findIndex(t => t.id === selectedTask.id);
      if (taskIndex !== -1) {
        this.tasks[taskIndex] = updatedTask;
      }
      
      // Reapply filters to update the filtered list
      this.applyFilters();
      
      logger.debug(`Task status updated: ${selectedTask.id} -> ${newStatus}`);
    } catch (error) {
      logger.error('Failed to update task status', error);
    }
  }

  private applyFilters(): void {
    let filtered = [...this.tasks];
    
    // Apply status filter
    if (this.statusFilter) {
      filtered = filtered.filter(task => task.status === this.statusFilter);
    }
    
    // Apply search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(task => {
        return task.title.toLowerCase().includes(query) ||
               task.description.toLowerCase().includes(query) ||
               task.labels.some(label => label.toLowerCase().includes(query));
      });
    }
    
    this.filteredTasks = filtered;
    
    // Adjust selection if needed
    if (this.selectedIndex >= this.filteredTasks.length) {
      this.selectedIndex = Math.max(0, this.filteredTasks.length - 1);
    }
  }

  private render(): void {
    // Clear screen and reset cursor
    process.stdout.write('\x1b[2J\x1b[H');
    
    const width = this.terminalWidth;
    const height = this.terminalHeight;
    
    if (this.editingMode) {
      this.renderEditingScreen(width, height);
    } else {
      // Header
      this.renderHeader(width);
      
      // Main content area
      if (this.showingDetails && this.filteredTasks.length > 0) {
        this.renderSplitView(width, height - 4); // -4 for header and footer
      } else {
        this.renderTaskList(width, height - 4);
      }
      
      // Footer
      this.renderFooter(width);
    }
  }

  private renderHeader(width: number): void {
    const title = '🌙 Critical Claude Task Viewer';
    const projectInfo = this.getProjectInfo();
    
    // Title bar
    process.stdout.write('\x1b[44m'); // Blue background
    process.stdout.write('\x1b[37m'); // White text
    process.stdout.write(title.padEnd(width));
    process.stdout.write('\x1b[0m\n'); // Reset
    
    // Info bar
    let infoLine = `📊 ${this.filteredTasks.length}/${this.tasks.length} tasks`;
    if (projectInfo) {
      infoLine += ` | 📁 ${projectInfo}`;
    }
    if (this.statusFilter) {
      infoLine += ` | 🔍 ${this.statusFilter}`;
    }
    
    process.stdout.write('\x1b[100m'); // Dark gray background
    process.stdout.write('\x1b[37m'); // White text
    process.stdout.write(infoLine.padEnd(width));
    process.stdout.write('\x1b[0m\n'); // Reset
  }

  private renderTaskList(width: number, height: number): void {
    const visibleTasks = height - 2; // Leave space for borders
    const startIndex = Math.max(0, this.selectedIndex - Math.floor(visibleTasks / 2));
    const endIndex = Math.min(this.filteredTasks.length, startIndex + visibleTasks);
    
    // Border top
    process.stdout.write('┌' + '─'.repeat(width - 2) + '┐\n');
    
    if (this.filteredTasks.length === 0) {
      const emptyMsg = 'No tasks found';
      const padding = Math.floor((width - emptyMsg.length - 2) / 2);
      process.stdout.write('│' + ' '.repeat(padding) + emptyMsg + ' '.repeat(width - padding - emptyMsg.length - 2) + '│\n');
    } else {
      for (let i = 0; i < visibleTasks; i++) {
        const taskIndex = startIndex + i;
        if (taskIndex < endIndex) {
          this.renderTaskLine(this.filteredTasks[taskIndex], taskIndex === this.selectedIndex, width - 2);
        } else {
          process.stdout.write('│' + ' '.repeat(width - 2) + '│\n');
        }
      }
    }
    
    // Border bottom
    process.stdout.write('└' + '─'.repeat(width - 2) + '┘\n');
  }

  private renderTaskLine(task: Task, isSelected: boolean, width: number): void {
    const statusIcon = this.getStatusIcon(task.status);
    const priorityIcon = this.getPriorityIcon(task.priority);
    
    let line = `${statusIcon} ${priorityIcon} ${task.title}`;
    
    // Truncate if too long
    if (line.length > width - 4) {
      line = line.substring(0, width - 7) + '...';
    }
    
    // Highlight if selected
    if (isSelected) {
      process.stdout.write('│\x1b[7m'); // Reverse video
      process.stdout.write(line.padEnd(width - 2));
      process.stdout.write('\x1b[0m│\n'); // Reset
    } else {
      process.stdout.write('│');
      process.stdout.write(line.padEnd(width - 2));
      process.stdout.write('│\n');
    }
  }

  private renderSplitView(width: number, height: number): void {
    const leftWidth = Math.floor(width * 0.4); // Give more space to details
    const rightWidth = width - leftWidth - 1; // -1 for separator
    
    const selectedTask = this.filteredTasks[this.selectedIndex];
    
    // Render task list on left, details on right
    const visibleTasks = height - 2;
    const startIndex = Math.max(0, this.selectedIndex - Math.floor(visibleTasks / 2));
    const detailLines = selectedTask ? this.getTaskDetailLines(selectedTask) : [];
    
    // Top border
    process.stdout.write('┌' + '─'.repeat(leftWidth - 1) + '┬' + '─'.repeat(rightWidth - 1) + '┐\n');
    
    for (let i = 0; i < visibleTasks; i++) {
      const taskIndex = startIndex + i;
      
      // Left side - task list
      if (taskIndex < this.filteredTasks.length) {
        const task = this.filteredTasks[taskIndex];
        const isSelected = taskIndex === this.selectedIndex;
        this.renderSplitTaskLine(task, isSelected, leftWidth - 1);
      } else {
        process.stdout.write('│' + ' '.repeat(leftWidth - 2));
      }
      
      // Separator
      process.stdout.write('│');
      
      // Right side - task details with proper wrapping
      if (selectedTask && i < detailLines.length) {
        const detailLine = detailLines[i];
        const processedLine = this.renderDetailLineWithHighlighting(detailLine, rightWidth - 2);
        process.stdout.write(processedLine.padEnd(rightWidth - 2));
      } else {
        process.stdout.write(' '.repeat(rightWidth - 2));
      }
      
      process.stdout.write('│\n');
    }
    
    // Bottom border
    process.stdout.write('└' + '─'.repeat(leftWidth - 1) + '┴' + '─'.repeat(rightWidth - 1) + '┘\n');
  }

  private renderSplitTaskLine(task: Task, isSelected: boolean, width: number): void {
    const statusIcon = this.getStatusIcon(task.status);
    const priorityIcon = this.getPriorityIcon(task.priority);
    
    let line = `${statusIcon} ${priorityIcon} ${task.title}`;
    
    if (line.length > width - 3) {
      line = line.substring(0, width - 6) + '...';
    }
    
    if (isSelected) {
      process.stdout.write('\x1b[7m'); // Reverse video
      process.stdout.write(line.padEnd(width - 1));
      process.stdout.write('\x1b[0m'); // Reset
    } else {
      process.stdout.write(line.padEnd(width - 1));
    }
  }

  private getTaskDetailLines(task: Task): string[] {
    const lines = [
      `📋 ${task.title}`,
      `${this.getStatusIcon(task.status)} ${task.status}`,
      `${this.getPriorityIcon(task.priority)} ${task.priority}`,
      '',
      '📄 Description:',
      ...(task.description ? this.wrapText(task.description, 50) : ['  No description']),
      ''
    ];
    
    if (task.assignee) {
      lines.push(`👤 Assignee: ${task.assignee}`);
    }
    
    if (task.labels.length > 0) {
      lines.push(`🏷️  Labels: ${task.labels.join(', ')}`);
    }
    
    if (task.estimatedHours) {
      lines.push(`⏱️  Estimated Hours: ${task.estimatedHours}`);
    }
    
    lines.push('');
    lines.push(`📅 Created: ${new Date(task.createdAt).toLocaleDateString()}`);
    lines.push(`🔄 Updated: ${new Date(task.updatedAt).toLocaleDateString()}`);
    
    return lines;
  }

  private wrapText(text: string, maxWidth: number): string[] {
    const lines: string[] = [];
    const paragraphs = text.split('\n');
    
    for (const paragraph of paragraphs) {
      if (paragraph.trim() === '') {
        lines.push('');
        continue;
      }
      
      // Handle different types of content
      if (paragraph.trim().startsWith('```')) {
        // Code block
        lines.push(`  ${paragraph}`);
        continue;
      }
      
      const words = paragraph.split(' ');
      let currentLine = '  '; // Indent description content
      
      for (const word of words) {
        if (currentLine.length + word.length + 1 > maxWidth) {
          if (currentLine.trim()) {
            lines.push(currentLine);
            currentLine = '  ' + word;
          } else {
            // Single word too long, just add it
            lines.push('  ' + word);
            currentLine = '  ';
          }
        } else {
          currentLine += (currentLine.trim() ? ' ' : '') + word;
        }
      }
      
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
    }
    
    return lines;
  }

  private renderDetailLineWithHighlighting(line: string, maxWidth: number): string {
    // Apply markdown-style highlighting
    let processedLine = line;
    
    // Headers (# ## ###)
    if (processedLine.match(/^(\s*)#{1,3}\s/)) {
      processedLine = processedLine.replace(/^(\s*)(#{1,3})\s(.+)/, '$1\x1b[1m\x1b[36m$2 $3\x1b[0m');
    }
    
    // Bold (**text**)
    processedLine = processedLine.replace(/\*\*([^*]+)\*\*/g, '\x1b[1m$1\x1b[0m');
    
    // Italic (*text*)
    processedLine = processedLine.replace(/\*([^*]+)\*/g, '\x1b[3m$1\x1b[0m');
    
    // Inline code (`code`)
    processedLine = processedLine.replace(/`([^`]+)`/g, '\x1b[100m\x1b[37m$1\x1b[0m');
    
    // Code blocks (```)
    if (processedLine.includes('```')) {
      processedLine = processedLine.replace(/```/g, '\x1b[100m\x1b[37m```\x1b[0m');
    }
    
    // List items (- or *)
    processedLine = processedLine.replace(/^(\s*)([-*])\s/, '$1\x1b[33m$2\x1b[0m ');
    
    // URLs (basic detection)
    processedLine = processedLine.replace(/(https?:\/\/[^\s]+)/g, '\x1b[34m\x1b[4m$1\x1b[0m');
    
    // Truncate if still too long after processing
    if (this.getDisplayLength(processedLine) > maxWidth) {
      // Find a good truncation point that doesn't break escape sequences
      let truncated = processedLine;
      while (this.getDisplayLength(truncated) > maxWidth - 3) {
        truncated = truncated.slice(0, -1);
      }
      processedLine = truncated + '...';
    }
    
    return processedLine;
  }

  private getDisplayLength(text: string): number {
    // Remove ANSI escape sequences to get actual display length
    return text.replace(/\x1b\[[0-9;]*m/g, '').length;
  }

  private renderEditingScreen(width: number, height: number): void {
    if (!this.editingTask) return;
    
    // Header
    process.stdout.write('\x1b[44m'); // Blue background
    process.stdout.write('\x1b[37m'); // White text
    const title = '📝 Editing Task';
    process.stdout.write(title.padEnd(width));
    process.stdout.write('\x1b[0m\n'); // Reset
    
    // Task info
    process.stdout.write('\x1b[100m'); // Dark gray background
    process.stdout.write('\x1b[37m'); // White text
    const info = `Task ID: ${this.editingTask.id}`;
    process.stdout.write(info.padEnd(width));
    process.stdout.write('\x1b[0m\n'); // Reset
    
    process.stdout.write('\n');
    
    // Editing fields
    const fields = [
      { label: 'Title', value: this.editingTask.title },
      { label: 'Description', value: this.editingTask.description || '' },
      { label: 'Priority', value: this.editingTask.priority },
      { label: 'Status', value: this.editingTask.status }
    ];
    
    fields.forEach((field, index) => {
      const isSelected = index === this.editingField;
      const displayValue = index === this.editingField ? this.editingValue : field.value;
      
      if (isSelected) {
        process.stdout.write('\x1b[7m'); // Reverse video (highlight)
      }
      
      // Apply markdown highlighting to description field when not editing
      if (field.label === 'Description' && !isSelected && displayValue) {
        const highlightedValue = this.renderDetailLineWithHighlighting(displayValue, width - field.label.length - 3);
        process.stdout.write(`${field.label}: ${highlightedValue}`);
      } else {
        process.stdout.write(`${field.label}: ${displayValue}`);
      }
      
      if (isSelected) {
        process.stdout.write('█'); // Cursor
        process.stdout.write('\x1b[0m'); // Reset
      }
      
      process.stdout.write('\n\n');
    });
    
    // Help text
    process.stdout.write('\n');
    process.stdout.write('\x1b[2m'); // Dim text
    process.stdout.write('↑/↓ Switch fields  |  Type to edit  |  ENTER Save  |  ESC Cancel\n');
    
    if (this.editingField === 1) {
      process.stdout.write('Markdown supported: **bold**, *italic*, `code`, # headers, - lists\n');
    } else if (this.editingField === 2) {
      process.stdout.write('Priority options: critical, high, medium, low\n');
    } else if (this.editingField === 3) {
      process.stdout.write('Status options: todo, in_progress, done, blocked, archived\n');
    }
    
    process.stdout.write('\x1b[0m'); // Reset
  }

  private renderFooter(width: number): void {
    // Footer with keyboard shortcuts
    process.stdout.write('├' + '─'.repeat(width - 2) + '┤\n');
    
    const shortcuts = [
      '↑/↓ Navigate  SPACE Status  TAB Details  ENTER Edit  F Filter  R Refresh  Q Quit'
    ];
    
    shortcuts.forEach(shortcut => {
      const padding = Math.max(0, width - shortcut.length - 2);
      const leftPad = Math.floor(padding / 2);
      const rightPad = padding - leftPad;
      
      process.stdout.write('│');
      process.stdout.write(' '.repeat(leftPad));
      process.stdout.write('\x1b[2m'); // Dim text
      process.stdout.write(shortcut);
      process.stdout.write('\x1b[0m'); // Reset
      process.stdout.write(' '.repeat(rightPad));
      process.stdout.write('│\n');
    });
    
    process.stdout.write('└' + '─'.repeat(width - 2) + '┘');
  }

  private getProjectInfo(): string | null {
    // TODO: Get from ProjectDetection
    return 'critical_claude';
  }


  private getStatusIcon(status: string): string {
    const icons = {
      todo: '⭕',
      in_progress: '🟡',
      done: '✅',
      blocked: '🔴',
      archived: '📦'
    };
    return icons[status as keyof typeof icons] || '❓';
  }

  private getPriorityIcon(priority: string): string {
    const icons = {
      critical: '🔥',
      high: '🔺',
      medium: '🟡',
      low: '🔽'
    };
    return icons[priority as keyof typeof icons] || '❓';
  }
}