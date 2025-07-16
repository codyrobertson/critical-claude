/**
 * 🔥 BADASS TASK UI - Semantic Commands & Visual Excellence
 * Optimized performance with semantic command structure
 */

import chalk from 'chalk';
import { BacklogManager } from '../backlog-manager.js';
import { CommandHandler } from '../command-registry.js';
import { EnhancedTask, TaskStatus, TaskPriority } from '../../types/agile.js';
import * as readline from 'readline';

interface UIState {
  selectedIndex: number;
  scrollOffset: number;
  mode: 'browse' | 'search' | 'edit' | 'create' | 'help';
  searchQuery: string;
  tasks: EnhancedTask[];
  loading: boolean;
  lastRender: string; // Store last rendered content to avoid unnecessary redraws
  needsRedraw: boolean;
  lastTaskRefresh: number; // Cache timestamp
  taskCache: Map<string, EnhancedTask>; // Task cache for fast lookups
}

interface CacheStats {
  hits: number;
  misses: number;
  lastClear: number;
}

export class TaskUIOptimizedCommand implements CommandHandler {
  private backlogManager: BacklogManager;
  private rl!: readline.Interface;
  private currentFilter: 'all' | 'todo' | 'in_progress' | 'done' | 'high' | 'medium' | 'low' | 'critical' = 'all';
  private currentSort: 'created' | 'priority' | 'status' | 'title' = 'priority';
  private showSemanticHelp = false;
  private animationFrame = 0;
  private state: UIState = {
    selectedIndex: 0,
    scrollOffset: 0,
    mode: 'browse',
    searchQuery: '',
    tasks: [],
    loading: true,
    lastRender: '',
    needsRedraw: true,
    lastTaskRefresh: 0,
    taskCache: new Map()
  };
  private readonly PAGE_SIZE = 15; // More tasks visible
  private terminalWidth = 80;
  private terminalHeight = 24;
  private renderThrottle: NodeJS.Timeout | null = null;
  private readonly SEMANTIC_COMMANDS = {
    'cc task list': 'List all tasks with filtering',
    'cc task add "title"': 'Add new task',
    'cc task show <id>': 'Show task details', 
    'cc task edit <id>': 'Edit task',
    'cc analyze file <path>': 'Analyze file and create tasks',
    'cc analyze architecture': 'Analyze architecture'
  };
  private isExiting = false;
  private cacheStats: CacheStats = { hits: 0, misses: 0, lastClear: Date.now() };
  private readonly CACHE_TIMEOUT = 5000; // 5 seconds

  constructor() {
    this.backlogManager = new BacklogManager();
  }

  private setupTerminal(): void {
    // Get terminal dimensions
    this.updateTerminalSize();
    
    // Setup signal handlers first
    process.on('SIGINT', this.handleExit.bind(this));
    process.on('SIGTERM', this.handleExit.bind(this));
    process.on('exit', this.handleExit.bind(this));
    
    // Enable raw mode for immediate key detection
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(true);
    }
    
    // Hide cursor
    process.stdout.write('\x1b[?25l');
    
    // Handle terminal resize
    process.stdout.on('resize', () => {
      this.updateTerminalSize();
      this.state.needsRedraw = true;
      this.throttledRender();
    });
  }

  private updateTerminalSize(): void {
    this.terminalWidth = process.stdout.columns || 80;
    this.terminalHeight = process.stdout.rows || 24;
  }

  private cleanup(): void {
    if (this.isExiting) return; // Prevent double cleanup
    this.isExiting = true;
    
    // Clear any pending render
    if (this.renderThrottle) {
      clearTimeout(this.renderThrottle);
      this.renderThrottle = null;
    }
    
    // Restore terminal mode FIRST
    if (process.stdin.setRawMode) {
      try {
        process.stdin.setRawMode(false);
      } catch (e) {
        // Ignore errors on cleanup
      }
    }
    
    // Clear screen and restore cursor
    try {
      process.stdout.write('\x1b[2J\x1b[H'); // Clear screen
      process.stdout.write('\x1b[?25h'); // Show cursor
      process.stdout.write('\x1b[0m'); // Reset all attributes
    } catch (e) {
      // Ignore write errors on cleanup
    }
    
    // Close readline if exists
    if (this.rl) {
      this.rl.close();
      this.rl = null as any;
    }
    
    // Remove stdin listeners
    process.stdin.removeAllListeners('data');
    process.stdin.removeAllListeners('keypress');
  }
  
  private handleExit(): void {
    this.cleanup();
  }

  async execute(action: string, input: any, options: any): Promise<void> {
    try {
      this.setupTerminal();
      
      // Show initial loading screen
      this.renderLoadingScreen();
      
      // Initialize and load tasks in background
      await this.initializeAsync();
      
      // Start UI interaction
      await this.showUI();
    } catch (error) {
      this.cleanup();
      console.error('Task UI error:', error);
      process.exit(1);
    } finally {
      this.cleanup();
    }
  }

  private async initializeAsync(): Promise<void> {
    try {
      await this.backlogManager.initialize();
      await this.refreshTasks();
      this.state.loading = false;
      this.state.needsRedraw = true;
      this.throttledRender();
    } catch (error) {
      this.state.tasks = [];
      this.state.loading = false;
      this.state.needsRedraw = true;
      this.throttledRender();
    }
  }

  private async showUI(): Promise<void> {
    // Initial render
    this.throttledRender();
    
    // Handle key presses
    const handleKeypress = async (data: Buffer) => {
      if (!this.isExiting) {
        await this.handleInput(data);
      }
    };
    
    process.stdin.on('data', handleKeypress);

    // Keep the process alive
    return new Promise<void>((resolve) => {
      const checkExit = setInterval(() => {
        if (this.isExiting) {
          clearInterval(checkExit);
          resolve();
        }
      }, 100);
    });
  }

  private async refreshTasks(forceRefresh: boolean = false): Promise<void> {
    const now = Date.now();
    const cacheAge = now - this.state.lastTaskRefresh;
    
    // Use cache if recent and not forcing refresh
    if (!forceRefresh && cacheAge < this.CACHE_TIMEOUT && this.state.tasks.length > 0) {
      this.cacheStats.hits++;
      return;
    }
    
    this.cacheStats.misses++;
    const oldTaskCount = this.state.tasks.length;
    
    try {
      const newTasks = await this.getFilteredTasks();
      
      // Update cache
      this.state.taskCache.clear();
      newTasks.forEach(task => this.state.taskCache.set(task.id, task));
      
      this.state.tasks = newTasks;
      this.state.lastTaskRefresh = now;
      
      // Only mark for redraw if tasks actually changed
      if (oldTaskCount !== this.state.tasks.length) {
        this.state.needsRedraw = true;
      }
      
      // Ensure selected index is valid
      const maxIndex = this.state.tasks.length - 1;
      if (this.state.selectedIndex > maxIndex) {
        this.state.selectedIndex = Math.max(0, maxIndex);
        this.state.needsRedraw = true;
      }
    } catch (error) {
      // On error, keep existing tasks
      console.error('Failed to refresh tasks:', error);
    }
  }

  /**
   * Get a cached task by ID for fast lookups
   */
  private getCachedTask(taskId: string): EnhancedTask | undefined {
    const task = this.state.taskCache.get(taskId);
    if (task) {
      this.cacheStats.hits++;
      return task;
    }
    this.cacheStats.misses++;
    return undefined;
  }

  /**
   * Clear cache when needed
   */
  private clearCache(): void {
    this.state.taskCache.clear();
    this.state.lastTaskRefresh = 0;
    this.cacheStats.lastClear = Date.now();
    this.cacheStats.hits = 0;
    this.cacheStats.misses = 0;
  }

  private async handleInput(data: Buffer): Promise<void> {
    const input = data.toString();
    const oldSelectedIndex = this.state.selectedIndex;
    const oldMode = this.state.mode;
    
    if (this.state.mode === 'search') {
      await this.handleSearchInput(input);
      return;
    }
    
    // Handle navigation
    if (input === '\x1b[A' || input === 'k') { // Up arrow or k
      this.moveSelection(-1);
    } else if (input === '\x1b[B' || input === 'j') { // Down arrow or j  
      this.moveSelection(1);
    } else if (input === '\x1b[5~') { // Page Up
      this.moveSelection(-this.PAGE_SIZE);
    } else if (input === '\x1b[6~') { // Page Down
      this.moveSelection(this.PAGE_SIZE);
    } else if (input === '\x1b[H' || input === 'g') { // Home or g
      this.state.selectedIndex = 0;
      this.state.scrollOffset = 0;
      this.state.needsRedraw = true;
    } else if (input === '\x1b[F' || input === 'G') { // End or G
      const maxIndex = this.state.tasks.length - 1;
      if (maxIndex >= 0) {
        this.state.selectedIndex = maxIndex;
        this.adjustScrollOffset();
        this.state.needsRedraw = true;
      }
    } else if (input === '\r' || input === '\n') { // Enter
      await this.editSelectedTask();
    } else if (input === ' ') { // Space - toggle completion
      await this.toggleTaskCompletion();
    } else if (input === 'f') { // Focus
      await this.focusSelectedTask();
    } else if (input === 'c') { // Create
      await this.createNewTask();
    } else if (input === 'r') { // Refresh
      await this.refreshTasks(true); // Force refresh
    } else if (input === '/') { // Search
      this.state.mode = 'search';
      this.state.searchQuery = '';
      this.state.needsRedraw = true;
    } else if (input === '\x1b[11~') { // F1 - Help
      this.state.mode = 'help';
      this.state.needsRedraw = true;
    } else if (input === '\x1b[12~') { // F2 - Create  
      await this.createNewTask();
    } else if (input === '\x1b[15~') { // F5 - Sync
      await this.syncTasks();
    } else if (input === '\x1b' || input === 'q' || input === '\x03') { // Escape, q, or Ctrl+C - quit
      this.isExiting = true;
      this.cleanup();
      return; // Don't call process.exit, let the promise resolve naturally
    }
    
    // Only render if something changed
    if (oldSelectedIndex !== this.state.selectedIndex || oldMode !== this.state.mode || this.state.needsRedraw) {
      this.throttledRender();
    }
  }

  private moveSelection(delta: number): void {
    const maxIndex = this.state.tasks.length - 1;
    if (maxIndex >= 0) {
      const newIndex = Math.max(0, Math.min(maxIndex, this.state.selectedIndex + delta));
      if (newIndex !== this.state.selectedIndex) {
        this.state.selectedIndex = newIndex;
        this.adjustScrollOffset();
        this.state.needsRedraw = true;
      }
    }
  }

  private adjustScrollOffset(): void {
    const oldOffset = this.state.scrollOffset;
    if (this.state.selectedIndex < this.state.scrollOffset) {
      this.state.scrollOffset = this.state.selectedIndex;
    } else if (this.state.selectedIndex >= this.state.scrollOffset + this.PAGE_SIZE) {
      this.state.scrollOffset = this.state.selectedIndex - this.PAGE_SIZE + 1;
    }
    
    if (oldOffset !== this.state.scrollOffset) {
      this.state.needsRedraw = true;
    }
  }

  /**
   * Throttled render to prevent excessive redraws
   */
  private throttledRender(): void {
    if (this.isExiting) return;
    
    // Clear any pending render
    if (this.renderThrottle) {
      clearTimeout(this.renderThrottle);
    }
    
    // Schedule new render with 16ms delay (60fps max)
    this.renderThrottle = setTimeout(() => {
      if (!this.isExiting && this.state.needsRedraw) {
        this.render();
        this.state.needsRedraw = false;
      }
    }, 16);
  }

  private render(): void {
    if (this.isExiting) return;
    
    try {
      // Build the complete screen content
      let screenContent = '';
      
      // Clear screen
      screenContent += '\x1b[2J\x1b[H'; // Clear and move to home
      
      switch (this.state.mode) {
        case 'browse':
          screenContent += this.buildBrowseView();
          break;
        case 'search':
          screenContent += this.buildSearchView();
          break;
        case 'help':
          screenContent += this.buildHelpView();
          break;
      }
      
      // Only write if content changed
      if (screenContent !== this.state.lastRender) {
        process.stdout.write(screenContent);
        this.state.lastRender = screenContent;
      }
    } catch (error) {
      // Silent fail on render errors
      this.cleanup();
    }
  }

  private buildBrowseView(): string {
    let output = '';
    
    if (this.state.loading) {
      return this.buildLoadingScreen();
    }

    output += this.buildHeader();
    output += this.buildQuickStats();
    output += this.buildTaskList();
    output += this.buildTaskDetails();
    output += this.buildBottomControls();
    
    return output;
  }

  private buildHeader(): string {
    let output = '\n';
    output += chalk.bold.cyan('  🔥 CRITICAL CLAUDE TASK MANAGER') + chalk.gray(' - Semantic Commands') + '\n';
    output += chalk.gray('  ═══════════════════════════════════════════════════') + '\n';
    
    // Show semantic command hints
    output += chalk.dim('  Quick Start: ') + chalk.cyan('cc task list') + chalk.dim(' | ') + chalk.cyan('cc task add "title"') + chalk.dim(' | ') + chalk.cyan('cc analyze file <path>') + '\n\n';
    
    return output;
  }

  private buildQuickStats(): string {
    let output = '';
    const stats = this.getTaskStats();
    const total = stats.total;
    const completed = stats.done;
    const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    output += chalk.bold.yellow('  📊 Overview') + '\n\n';
    
    // Progress bar
    const barWidth = 30;
    const filled = Math.floor((completionPercent / 100) * barWidth);
    const empty = barWidth - filled;
    const progressBar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
    
    output += `  Total Tasks: ${chalk.bold.white(total)}\n`;
    output += `  Progress:    ${progressBar} ${chalk.bold(completionPercent)}%\n`;
    output += `  Active:      ${chalk.blue(stats.todo + stats.inProgress)}   Completed: ${chalk.green(completed)}\n`;
    
    // Priority breakdown
    const criticalCount = this.state.tasks.filter(t => t.priority === 'critical').length;
    const highCount = this.state.tasks.filter(t => t.priority === 'high').length;
    const mediumCount = this.state.tasks.filter(t => t.priority === 'medium').length;
    const lowCount = this.state.tasks.filter(t => t.priority === 'low').length;
    
    output += `  Priority:    ${chalk.red('🚨')} ${criticalCount}  ${chalk.yellow('🔥')} ${highCount}  ${chalk.blue('📋')} ${mediumCount}  ${chalk.gray('📝')} ${lowCount}\n`;
    
    // Cache performance info
    const cacheHitRate = this.cacheStats.hits + this.cacheStats.misses > 0 ? 
      Math.round((this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses)) * 100) : 0;
    const cacheAge = Math.round((Date.now() - this.state.lastTaskRefresh) / 1000);
    
    output += chalk.dim(`  Cache:       ${cacheHitRate}% hit rate, ${cacheAge}s old`) + '\n';
    output += chalk.dim('  Semantic:    ') + chalk.green('✅ Active') + chalk.dim(' | Commands: ') + chalk.cyan(Object.keys(this.SEMANTIC_COMMANDS).length) + '\n\n';
    
    return output;
  }

  private buildTaskList(): string {
    let output = '';
    output += chalk.bold.yellow('  📋 Tasks') + '\n';
    output += chalk.gray('  ─────────') + '\n\n';

    if (this.state.tasks.length === 0) {
      output += chalk.gray('  No tasks found. Try: ') + chalk.cyan('cc task add "My first task"') + '\n\n';
      return output;
    }

    // Virtual scrolling - calculate visible range based on terminal height
    const maxVisibleTasks = Math.min(this.PAGE_SIZE, this.terminalHeight - 12); // Leave room for header/footer
    const startIdx = this.state.scrollOffset;
    const endIdx = Math.min(startIdx + maxVisibleTasks, this.state.tasks.length);
    
    // Pre-calculate visible task lines for better performance
    const visibleTasks = this.state.tasks.slice(startIdx, endIdx);
    const taskLines = this.buildTaskLines(visibleTasks, startIdx);
    
    output += taskLines.join('\n') + '\n';
    
    // Show pagination info efficiently
    if (this.state.tasks.length > maxVisibleTasks) {
      const totalPages = Math.ceil(this.state.tasks.length / maxVisibleTasks);
      const currentPage = Math.floor(startIdx / maxVisibleTasks) + 1;
      output += chalk.gray(`\n  Page ${currentPage}/${totalPages} • Showing ${startIdx + 1}-${endIdx} of ${this.state.tasks.length} tasks`) + '\n';
    }
    
    output += '\n';
    return output;
  }

  /**
   * Build task lines efficiently with minimal string operations
   */
  private buildTaskLines(tasks: EnhancedTask[], startOffset: number): string[] {
    const lines: string[] = [];
    const maxWidth = this.terminalWidth - 2;
    
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const globalIndex = startOffset + i;
      const isSelected = globalIndex === this.state.selectedIndex;
      
      // Use cached priority/status icons for better performance
      const priority = this.getPriorityIcon(task.priority);
      const status = this.getStatusIcon(task.status);
      const selector = isSelected ? chalk.cyan('▶') : ' ';
      
      // Build line efficiently
      let taskLine = `${selector} ${priority} ${status} ${task.title}`;
      
      // Truncate efficiently
      if (taskLine.length > maxWidth) {
        taskLine = taskLine.substring(0, maxWidth - 3) + '...';
      }
      
      // Apply selection styling
      if (isSelected) {
        lines.push(chalk.bgBlue.white(taskLine.padEnd(maxWidth)));
      } else {
        lines.push(taskLine);
      }
    }
    
    return lines;
  }

  private buildTaskDetails(): string {
    let output = '';
    const selectedTask = this.getSelectedTask();
    
    output += chalk.bold.yellow('  📝 Task Details') + '\n';
    output += chalk.gray('  ────────────────') + '\n\n';
    
    if (!selectedTask) {
      output += chalk.gray('  Select a task to view details') + '\n\n';
      return output;
    }

    output += `  ${chalk.bold.white(selectedTask.title)}\n\n`;
    
    const priority = this.getPriorityWithColor(selectedTask.priority);
    const status = this.getStatusWithIcon(selectedTask.status);
    
    output += `  Status:     ${status}\n`;
    output += `  Priority:   ${priority}\n`;
    output += `  Points:     ${chalk.blue(selectedTask.storyPoints)}\n`;
    output += `  Assignee:   ${selectedTask.assignee || chalk.gray('unassigned')}\n`;
    output += `  Created:    ${chalk.gray(new Date(selectedTask.createdAt).toLocaleDateString())}\n`;
    output += `  ID:         ${chalk.dim(selectedTask.id.substring(0, 8))}...\n`;
    
    if (selectedTask.labels && selectedTask.labels.length > 0) {
      output += `  Labels:     ${selectedTask.labels.map(l => chalk.cyan('#' + l)).join(' ')}\n`;
    }
    
    output += '\n';
    
    if (selectedTask.description) {
      output += chalk.yellow('  Description:') + '\n';
      const desc = selectedTask.description;
      const lines = this.wrapText(desc, 76);
      lines.slice(0, 3).forEach(line => {
        output += `  ${chalk.gray(line)}\n`;
      });
      if (lines.length > 3) {
        output += chalk.dim('  ...') + '\n';
      }
    }
    
    return output;
  }

  private buildBottomControls(): string {
    let output = '';
    const remainingLines = Math.max(0, this.terminalHeight - 20);
    
    output += '\n'.repeat(Math.min(remainingLines, 2));
    
    const separatorWidth = Math.min(this.terminalWidth - 4, 60);
    output += chalk.gray('  ' + '─'.repeat(separatorWidth)) + '\n';
    
    // Semantic commands section
    output += chalk.dim('  Semantic: ') + chalk.cyan('cc task add "title"') + chalk.dim(' | ') + chalk.cyan('cc analyze file <path>') + chalk.dim(' | ') + chalk.cyan('cc task show <id>') + '\n';
    
    // Controls - responsive layout
    if (this.terminalWidth < 80) {
      output += chalk.dim('  ↑↓ Nav  ENTER Edit  SPACE Toggle  ? Help  Q Quit') + '\n';
    } else {
      output += chalk.dim('  ↑↓ Navigate  ENTER Edit  SPACE Toggle  F2 New  F5 Sync  R Refresh  ? Help  Q Quit') + '\n';
    }
    
    return output;
  }

  private buildLoadingScreen(): string {
    let output = '\n';
    output += chalk.bold.cyan('  🔥 CRITICAL CLAUDE TASK MANAGER') + chalk.gray(' - Semantic Commands') + '\n';
    output += chalk.gray('  ═══════════════════════════════════════════════════════════') + '\n\n';
    output += chalk.yellow('  ⏳ Loading tasks...') + '\n';
    output += chalk.dim('  Try: ') + chalk.cyan('cc task add "My first task"') + '\n\n';
    return output;
  }

  private buildSearchView(): string {
    let output = chalk.bold('Search') + '\n';
    output += '─'.repeat(this.terminalWidth) + '\n';
    output += `/${this.state.searchQuery}_\n\n`;
    output += chalk.gray('Search coming soon...') + '\n\n';
    output += '─'.repeat(this.terminalWidth) + '\n';
    output += chalk.dim('ESC:exit') + '\n';
    return output;
  }

  private buildHelpView(): string {
    let output = '';
    output += chalk.cyan('╔══════════════════════════════════════════════════════════════╗') + '\n';
    output += chalk.cyan('║') + chalk.bold.white('            🔥 Critical Claude - Semantic Commands           ') + chalk.cyan('║') + '\n';
    output += chalk.cyan('╚══════════════════════════════════════════════════════════════╝') + '\n\n';
    
    output += chalk.yellow('🎯 Semantic Commands:') + '\n';
    Object.entries(this.SEMANTIC_COMMANDS).forEach(([cmd, desc]) => {
      output += `  ${chalk.cyan(cmd.padEnd(25))} - ${desc}\n`;
    });
    output += '\n';
    
    output += chalk.yellow('⌨️  UI Navigation:') + '\n';
    output += '  ↑/↓ j/k     - Navigate tasks\n';
    output += '  PgUp/PgDn   - Navigate by page\n';
    output += '  g/G         - Go to first/last\n\n';
    
    output += chalk.green('🚀 Quick Actions:') + '\n';
    output += '  ENTER       - Edit task\n';
    output += '  SPACE       - Toggle completion\n';
    output += '  f           - Focus task\n';
    output += '  c/F2        - Create new task\n';
    output += '  r           - Refresh\n';
    output += '  F5          - Sync\n';
    output += '  q/ESC       - Quit\n\n';
    
    output += chalk.dim('[ESC] Back to tasks | [?] Toggle help') + '\n';
    
    return output;
  }

  private renderLoadingScreen(): void {
    try {
      process.stdout.write('\x1b[2J\x1b[H'); // Clear screen properly
      process.stdout.write(this.buildLoadingScreen());
    } catch (error) {
      // Fallback to console.clear if needed
      console.clear();
      console.log(this.buildLoadingScreen());
    }
  }

  private countLines(text: string): number {
    return (text.match(/\n/g) || []).length;
  }

  private wrapText(text: string, width: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + word).length <= width) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    
    return lines.length > 0 ? lines : [''];
  }

  private async handleSearchInput(input: string): Promise<void> {
    if (input === '\x1b' || input === '\r') {
      this.state.mode = 'browse';
      this.state.searchQuery = '';
      this.state.needsRedraw = true;
      this.throttledRender();
    }
  }

  private getSelectedTask(): EnhancedTask | undefined {
    if (this.state.tasks.length > 0 && 
        this.state.selectedIndex >= 0 && 
        this.state.selectedIndex < this.state.tasks.length) {
      return this.state.tasks[this.state.selectedIndex];
    }
    return undefined;
  }

  private getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'critical': return chalk.red('🚨');
      case 'high': return chalk.yellow('🔥');
      case 'medium': return chalk.blue('📋');
      case 'low': return chalk.gray('📝');
      default: return chalk.gray('❔');
    }
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'todo': return chalk.gray('⏳');
      case 'in-progress': return chalk.blue('🔄');
      case 'focused': return chalk.cyan('🎯');
      case 'done': return chalk.green('✅');
      case 'blocked': return chalk.red('🚫');
      default: return chalk.gray('❓');
    }
  }

  private getStatusWithIcon(status: string): string {
    switch (status) {
      case 'todo': return chalk.gray('⏳ todo');
      case 'in-progress': return chalk.blue('🔄 in-progress');
      case 'focused': return chalk.cyan('🎯 focused');
      case 'done': return chalk.green('✅ done');
      case 'blocked': return chalk.red('🚫 blocked');
      default: return chalk.gray(`❓ ${status}`);
    }
  }

  private getPriorityWithColor(priority: string): string {
    switch (priority) {
      case 'critical': return chalk.red.bold('🚨 critical');
      case 'high': return chalk.yellow('🔥 high');
      case 'medium': return chalk.blue('📋 medium');
      case 'low': return chalk.gray('📝 low');
      default: return chalk.gray(`❔ ${priority}`);
    }
  }

  private getTaskStats(): { total: number; todo: number; inProgress: number; done: number } {
    const allTasks = this.state.tasks;
    return {
      total: allTasks.length,
      todo: allTasks.filter(t => t.status === 'todo').length,
      inProgress: allTasks.filter(t => t.status === 'in-progress' || t.status === 'focused').length,
      done: allTasks.filter(t => t.status === 'done').length
    };
  }

  // Action methods (simplified versions for now)
  private async editSelectedTask(): Promise<void> {
    const selectedTask = this.getSelectedTask();
    if (!selectedTask) return;
    
    // For now, just mark for redraw
    this.state.needsRedraw = true;
    this.throttledRender();
  }

  private async toggleTaskCompletion(): Promise<void> {
    const selectedTask = this.getSelectedTask();
    if (!selectedTask) return;
    
    const newStatus = selectedTask.status === 'done' ? 'todo' : 'done';
    try {
      await this.backlogManager.updateTask(selectedTask.id, { status: newStatus });
      await this.refreshTasks();
      this.throttledRender();
    } catch (error) {
      // Silent fail
    }
  }

  private async focusSelectedTask(): Promise<void> {
    const selectedTask = this.getSelectedTask();
    if (!selectedTask) return;
    
    try {
      await this.backlogManager.updateTask(selectedTask.id, { status: 'focused' });
      await this.refreshTasks();
      this.throttledRender();
    } catch (error) {
      // Silent fail
    }
  }

  private async createNewTask(): Promise<void> {
    // For now, just mark for redraw
    this.state.needsRedraw = true;
    this.throttledRender();
  }

  private async syncTasks(): Promise<void> {
    // For now, just mark for redraw
    this.state.needsRedraw = true;
    this.throttledRender();
  }

  private async getFilteredTasks(): Promise<EnhancedTask[]> {
    let tasks = await this.backlogManager.listTasks();
    
    // Apply filter
    switch (this.currentFilter) {
      case 'todo':
        tasks = tasks.filter(t => t.status === 'todo');
        break;
      case 'in_progress':
        tasks = tasks.filter(t => t.status === 'in-progress' || t.status === 'focused');
        break;
      case 'done':
        tasks = tasks.filter(t => t.status === 'done');
        break;
      case 'high':
        tasks = tasks.filter(t => t.priority === 'high');
        break;
      case 'medium':
        tasks = tasks.filter(t => t.priority === 'medium');
        break;
      case 'low':
        tasks = tasks.filter(t => t.priority === 'low');
        break;
      case 'critical':
        tasks = tasks.filter(t => t.priority === 'critical');
        break;
    }
    
    // Apply sort
    switch (this.currentSort) {
      case 'created':
        tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'priority':
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        tasks.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0));
        break;
      case 'status':
        const statusOrder: Record<string, number> = { 
          todo: 1, focused: 2, 'in-progress': 3, blocked: 4, done: 5
        };
        tasks.sort((a, b) => (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0));
        break;
      case 'title':
        tasks.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
    
    return tasks;
  }
}