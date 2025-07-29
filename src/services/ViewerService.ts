/**
 * Production-Grade Terminal Viewer Service
 * Bulletproof implementation with comprehensive error handling, performance optimization,
 * and robust terminal management for Critical Claude task management.
 */

import { 
  Task,
  Result,
  createSuccessResult,
  createErrorResult
} from '../models/index.js';
import { FileStorage } from '../storage/index.js';
import { logger } from '../utils/Logger.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { ViewerHelpers } from './ViewerServiceHelpers.js';

export interface ViewerOptions {
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  theme?: 'dark' | 'light';
  refreshInterval?: number;
  maxRetries?: number;
  timeout?: number;
  useTextual?: boolean; // New option to use Textual viewer
}

export interface ViewerResult {
  success: boolean;
  error?: string;
  exitCode?: number;
}

// Terminal display buffer for efficient rendering
interface RenderBuffer {
  lines: string[];
  dirty: boolean;
  lastRender: number;
}

// File lock mechanism for storage operations
interface FileLock {
  acquire(): Promise<void>;
  release(): Promise<void>;
  isLocked(): boolean;
}

export class ViewerService {
  private readonly COLLECTION = 'tasks';
  private dependenciesChecked = false;
  private dependencyErrors: string[] = [];

  constructor(private storage: FileStorage) {
    // Validate storage immediately
    this.validateStorage();
  }

  private validateStorage(): void {
    if (!this.storage) {
      throw new Error('Storage instance is required for ViewerService');
    }
  }

  private async checkDependencies(): Promise<{ success: boolean; errors: string[] }> {
    if (this.dependenciesChecked) {
      return { success: this.dependencyErrors.length === 0, errors: this.dependencyErrors };
    }

    const errors: string[] = [];
    
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
    if (majorVersion < 18) {
      errors.push(`Node.js ${nodeVersion} is too old. Requires Node.js 18+`);
    }

    // Check terminal capabilities
    if (!process.stdout.isTTY) {
      errors.push('Terminal viewer requires interactive TTY terminal');
    }

    // Check storage accessibility
    try {
      const storageBasePath = await (this.storage as any).getBasePath?.();
      if (!storageBasePath) {
        errors.push('Storage base path is not accessible');
      }
      
      // Test storage read capability - use actual tasks collection
      await this.storage.findAll<any>('tasks');
    } catch (error) {
      errors.push(`Storage is not accessible: ${error instanceof Error ? error.message : error}`);
    }

    // Check file system permissions
    try {
      const path = await import('path');
      const fs = await import('fs/promises');
      const os = await import('os');
      const testDir = path.join(os.homedir(), '.critical-claude');
      
      // Test directory creation
      await fs.mkdir(testDir, { recursive: true });
      
      // Test file write
      const testFile = path.join(testDir, '.viewer-test');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
    } catch (error) {
      errors.push(`File system permissions error: ${error instanceof Error ? error.message : error}`);
    }

    this.dependenciesChecked = true;
    this.dependencyErrors = errors;
    
    return { success: errors.length === 0, errors };
  }

  async launchOriginalViewer(options: ViewerOptions): Promise<ViewerResult> {
    try {
      logger.info('Launching task viewer', options);
      
      // CRITICAL: Check all dependencies before proceeding
      const dependencyCheck = await this.checkDependencies();
      if (!dependencyCheck.success) {
        const errorMessage = [
          '❌ Viewer cannot start due to dependency issues:',
          ...dependencyCheck.errors.map(err => `  • ${err}`),
          '',
          '🔧 Suggested fixes:',
          '  • Ensure you\'re using Node.js 18+',
          '  • Run from an interactive terminal (not in background)',
          '  • Check ~/.critical-claude directory permissions',
          '  • Try: chmod 755 ~/.critical-claude'
        ].join('\n');
        
        logger.error('Dependency check failed', { errors: dependencyCheck.errors });
        console.error(errorMessage);
        
        return {
          success: false,
          error: 'Dependency validation failed. See console for details.'
        };
      }
      
      // Validate storage before creating viewer
      const storageBasePath = await (this.storage as any).getBasePath?.();
      if (!storageBasePath) {
        return {
          success: false,
          error: 'Storage base path is not accessible. Cannot launch viewer.'
        };
      }
      
      logger.info(`🔧 ViewerService storage path: ${storageBasePath}`);
      
      // Ensure storage directory exists
      try {
        const path = await import('path');
        const fs = await import('fs/promises');
        await fs.mkdir(storageBasePath, { recursive: true });
      } catch (dirError) {
        logger.error('Failed to create storage directory', dirError);
        return {
          success: false,
          error: `Cannot create storage directory: ${dirError instanceof Error ? dirError.message : dirError}`
        };
      }
      
      // Initialize viewer with comprehensive error handling
      let viewer: TerminalViewer;
      try {
        viewer = new TerminalViewer(this.storage, options);
      } catch (viewerError) {
        logger.error('Failed to initialize terminal viewer', viewerError);
        return {
          success: false,
          error: `Viewer initialization failed: ${viewerError instanceof Error ? viewerError.message : viewerError}`
        };
      }
      
      // Launch viewer with timeout and error recovery
      try {
        await viewer.launch();
        logger.info('Task viewer exited normally');
        return { success: true };
      } catch (launchError) {
        logger.error('Viewer launch failed', launchError);
        
        // Provide specific error messages based on error type
        let errorMessage = 'Unknown viewer error';
        if (launchError instanceof Error) {
          if (launchError.message.includes('ENOENT')) {
            errorMessage = 'File or directory not found. Storage may be corrupted.';
          } else if (launchError.message.includes('EACCES')) {
            errorMessage = 'Permission denied. Check file system permissions.';
          } else if (launchError.message.includes('ENOSPC')) {
            errorMessage = 'No space left on device. Free up disk space.';
          } else {
            errorMessage = launchError.message;
          }
        }
        
        return {
          success: false,
          error: `Viewer launch failed: ${errorMessage}`
        };
      }
    } catch (error) {
      logger.error('Critical viewer service failure', error);
      return {
        success: false,
        error: `Critical failure: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async getTasksForViewer(): Promise<Result<Task[]>> {
    try {
      // Validate storage before attempting to read
      if (!this.storage) {
        return createErrorResult('Storage is not initialized');
      }
      
      // Attempt to load tasks with retry mechanism
      let tasks: Task[] = [];
      let lastError: any;
      const maxAttempts = 3;
      
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          tasks = await this.storage.findAll<Task>(this.COLLECTION);
          break; // Success, exit retry loop
        } catch (error) {
          lastError = error;
          logger.warn(`Task loading attempt ${attempt + 1}/${maxAttempts} failed`, error);
          
          if (attempt < maxAttempts - 1) {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      }
      
      if (tasks.length === 0 && lastError) {
        logger.error('All task loading attempts failed', lastError);
        return createErrorResult(`Failed to load tasks after ${maxAttempts} attempts: ${lastError instanceof Error ? lastError.message : lastError}`);
      }
      
      // Validate task data structure
      const validTasks = tasks.filter(task => {
        if (!task || typeof task !== 'object') return false;
        if (!task.id || !task.title) return false;
        return true;
      });
      
      if (validTasks.length !== tasks.length) {
        logger.warn(`Filtered out ${tasks.length - validTasks.length} invalid tasks`);
      }
      
      // Sort tasks for optimal viewing (high priority first, then by date)
      const sortedTasks = validTasks.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority; // Higher priority first
        }
        
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bDate - aDate; // Newer first
      });
      
      logger.info(`Loaded ${sortedTasks.length} valid tasks for viewer`);
      return createSuccessResult(sortedTasks);
    } catch (error) {
      logger.error('Critical error in getTasksForViewer', error);
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
        updatedAt: new Date().toISOString()
      };
      
      await this.storage.save(this.COLLECTION, taskId, updatedTask);
      
      return createSuccessResult(updatedTask);
    } catch (error) {
      return createErrorResult(`Failed to toggle task status: ${error instanceof Error ? error.message : error}`);
    }
  }
}

// Production-Grade Terminal GUI Implementation
class TerminalViewer {
  // Core state
  private tasks: Task[] = [];
  private filteredTasks: Task[] = [];
  private selectedIndex = 0;
  private statusFilter: string | null = null;
  private searchQuery = '';
  private isRunning = true;
  private showingDetails = false;
  
  // Editing state
  private editingMode = false;
  private editingField = 0;
  private editingTask: Task | null = null;
  private editingValue = '';
  
  // Terminal state
  private terminalWidth = 80;
  private terminalHeight = 24;
  private originalTerminalState: any = null;
  
  // Performance optimization
  private renderBuffer: RenderBuffer = {
    lines: [],
    dirty: true,
    lastRender: 0
  };
  private needsFullRedraw = true;
  private lastKeypress = 0;
  private keyDebounceMs = 50;
  
  // Error handling
  private errorState: string | null = null;
  private lastError: Error | null = null;
  
  // Resource cleanup
  private signalHandlers: Map<string, () => void> = new Map();
  private timeouts: Set<NodeJS.Timeout> = new Set();
  private intervals: Set<NodeJS.Timeout> = new Set();
  
  // File locking for safe storage operations
  private storageLock: FileLock;
  
  // Pagination for performance
  private pageSize = 20;
  private currentPage = 0;

  constructor(
    private storage: FileStorage,
    private options: ViewerOptions
  ) {
    // Validate critical dependencies
    if (!this.storage) {
      throw new Error('Storage instance is required for TerminalViewer');
    }
    
    if (!process.stdout || !process.stdin) {
      throw new Error('Standard input/output streams are required for terminal viewer');
    }
    
    if (!process.stdout.isTTY) {
      throw new Error('Interactive terminal (TTY) is required for viewer');
    }
    
    // Initialize file locking mechanism
    this.storageLock = this.createFileLock();
    
    // Store original terminal state for restoration
    this.originalTerminalState = {
      rawMode: process.stdin.isRaw,
      encoding: process.stdin.readableEncoding,
      isPaused: process.stdin.isPaused()
    };
    
    // Get terminal dimensions with validation
    this.updateTerminalDimensions();
    
    // Setup signal handlers for graceful shutdown
    this.setupSignalHandlers();
    
    // Setup terminal resize handler
    this.setupResizeHandler();
    
    // Configure logger
    if (this.options.logLevel) {
      try {
        logger.setLevel(this.options.logLevel);
      } catch (error) {
        logger.warn('Failed to set logger level', error);
      }
    }
    
    logger.info('TerminalViewer initialized successfully', {
      terminalSize: `${this.terminalWidth}x${this.terminalHeight}`,
      options: this.options
    });
  }

  async launch(): Promise<void> {
    let terminalSetup = false;
    const startTime = Date.now();
    
    try {
      logger.debug('Starting production terminal viewer');
      
      // Pre-flight system checks
      await this.performSystemChecks();
      
      // Setup terminal with bulletproof error handling
      try {
        await this.setupTerminal();
        terminalSetup = true;
        logger.debug('Terminal setup completed successfully');
      } catch (setupError) {
        throw new Error(`Critical terminal setup failure: ${ViewerHelpers.getErrorMessage(setupError)}`);
      }
      
      // Load tasks with retry mechanism and timeout
      await this.loadTasksWithRetry();
      
      // Initialize display state
      this.applyFilters();
      this.needsFullRedraw = true;
      
      // Perform initial render with fallback
      await this.safeRender();
      
      logger.info(`Viewer launched successfully in ${Date.now() - startTime}ms`);
      
      // Start main event loop with comprehensive error handling
      await this.startEventLoop();
      
    } catch (error) {
      logger.error('Critical viewer launch failure', {
        error: ViewerHelpers.getErrorMessage(error),
        stack: error instanceof Error ? error.stack : undefined,
        duration: Date.now() - startTime
      });
      
      // Attempt emergency cleanup
      await this.emergencyCleanup();
      throw error;
      
    } finally {
      // Always perform comprehensive cleanup
      if (terminalSetup) {
        await this.cleanupTerminal();
      }
      
      // Clean up all resources
      this.cleanupResources();
      
      logger.debug(`Viewer session ended after ${Date.now() - startTime}ms`);
    }
  }

  private async setupTerminal(): Promise<void> {
    try {
      // Validate terminal capabilities
      if (!process.stdin || !process.stdout) {
        throw new Error('Standard input/output streams not available');
      }
      
      if (!process.stdout.isTTY || !process.stdin.isTTY) {
        throw new Error('Interactive terminal (TTY) required for both input and output');
      }
      
      // Store original terminal settings for restoration
      this.originalTerminalState = {
        rawMode: process.stdin.isRaw,
        encoding: process.stdin.readableEncoding,
        isPaused: process.stdin.isPaused()
      };
      
      // Enable raw mode with comprehensive error handling
      try {
        if (!process.stdin.isRaw) {
          process.stdin.setRawMode(true);
        }
      } catch (rawModeError) {
        throw new Error(`Raw mode activation failed: ${ViewerHelpers.getErrorMessage(rawModeError)}`);
      }
      
      // Configure input stream
      try {
        if (process.stdin.isPaused()) {
          process.stdin.resume();
        }
        process.stdin.setEncoding('utf8');
      } catch (inputError) {
        throw new Error(`Input stream configuration failed: ${ViewerHelpers.getErrorMessage(inputError)}`);
      }
      
      // Setup terminal display modes with validation
      try {
        // Test terminal write capability first
        process.stdout.write('');
        
        // Enter alternate screen buffer for clean restore
        process.stdout.write('\x1b[?1049h');
        
        // Hide cursor for clean UI
        process.stdout.write('\x1b[?25l');
        
        // Clear screen and reset cursor
        process.stdout.write('\x1b[2J\x1b[H');
        
        // Enable mouse reporting (optional)
        process.stdout.write('\x1b[?1000h');
        
      } catch (displayError) {
        throw new Error(`Terminal display setup failed: ${ViewerHelpers.getErrorMessage(displayError)}`);
      }
      
      // Verify terminal dimensions are reasonable
      this.updateTerminalDimensions();
      if (this.terminalWidth < 40 || this.terminalHeight < 10) {
        logger.warn('Terminal size is very small, UI may be degraded', {
          width: this.terminalWidth,
          height: this.terminalHeight
        });
      }
      
      logger.debug('Terminal setup completed successfully', {
        dimensions: `${this.terminalWidth}x${this.terminalHeight}`,
        rawMode: process.stdin.isRaw
      });
      
    } catch (error) {
      logger.error('Terminal setup failed catastrophically', {
        error: ViewerHelpers.getErrorMessage(error),
        terminalState: this.originalTerminalState
      });
      throw error;
    }
  }

  private async cleanupTerminal(): Promise<void> {
    try {
      logger.debug('Starting comprehensive terminal cleanup');
      
      // Disable mouse reporting first
      try {
        process.stdout.write('\x1b[?1000l');
      } catch (mouseError) {
        logger.warn('Mouse reporting cleanup failed', mouseError);
      }
      
      // Restore cursor and screen buffer
      try {
        process.stdout.write('\x1b[?25h'); // Show cursor
        process.stdout.write('\x1b[?1049l'); // Exit alternate screen buffer
        process.stdout.write('\x1b[2J'); // Clear screen
        process.stdout.write('\x1b[H'); // Move cursor to home
        process.stdout.write('\x1b[0m'); // Reset all attributes
      } catch (displayError) {
        logger.warn('Terminal display cleanup failed', displayError);
        
        // Emergency display cleanup
        try {
          process.stdout.write('\n\nTerminal restored.\n');
        } catch (emergencyError) {
          // Complete terminal failure - nothing we can do
        }
      }
      
      // Restore terminal mode using original state
      try {
        if (process.stdin && process.stdin.isTTY) {
          if (process.stdin.isRaw && this.originalTerminalState && !this.originalTerminalState.rawMode) {
            process.stdin.setRawMode(false);
          }
        }
      } catch (rawModeError) {
        logger.warn('Raw mode restoration failed', rawModeError);
      }
      
      // Restore input stream state
      try {
        if (process.stdin) {
          if (this.originalTerminalState?.isPaused && !process.stdin.isPaused()) {
            process.stdin.pause();
          }
        }
      } catch (inputError) {
        logger.warn('Input stream restoration failed', inputError);
      }
      
      // Small delay to ensure terminal state is fully restored
      await new Promise(resolve => setTimeout(resolve, 10));
      
      logger.debug('Terminal cleanup completed successfully');
      
    } catch (error) {
      logger.error('Terminal cleanup encountered critical error', {
        error: ViewerHelpers.getErrorMessage(error),
        originalState: this.originalTerminalState
      });
      
      // Emergency fallback cleanup
      try {
        if (process.stdout && process.stdout.writable) {
          process.stdout.write('\x1b[0m\x1b[?25h\n');
        }
      } catch (emergencyError) {
        // Complete system failure - log and continue
        logger.error('Emergency terminal cleanup failed', emergencyError);
      }
    }
  }

  private async startEventLoop(): Promise<void> {
    return new Promise((resolve, reject) => {
      let resolved = false;
      const timeout = this.options.timeout || 3600000; // 1 hour default
      
      // Setup timeout protection
      const eventLoopTimeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          logger.warn('Event loop timeout reached, shutting down gracefully');
          this.isRunning = false;
          resolve();
        }
      }, timeout);
      
      this.timeouts.add(eventLoopTimeout);
      
      // Debounced keypress handler for performance
      const handleKeypress = (data: Buffer | string) => {
        try {
          // Debounce rapid keypresses
          const now = Date.now();
          if (now - this.lastKeypress < this.keyDebounceMs) {
            return;
          }
          this.lastKeypress = now;
          
          const key = data.toString();
          this.handleKeypress(key);
          
          // Check exit condition
          if (!this.isRunning && !resolved) {
            resolved = true;
            clearTimeout(eventLoopTimeout);
            process.stdin.removeListener('data', handleKeypress);
            resolve();
          }
          
        } catch (keypressError) {
          logger.error('Keypress handling error', keypressError);
          this.errorState = `Input error: ${ViewerHelpers.getErrorMessage(keypressError)}`;
          this.safeRender();
        }
      };
      
      // Setup error handling for input stream
      const handleInputError = (error: Error) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(eventLoopTimeout);
          logger.error('Input stream error', error);
          reject(new Error(`Input stream failed: ${ViewerHelpers.getErrorMessage(error)}`));
        }
      };
      
      // Attach event listeners
      process.stdin.on('data', handleKeypress);
      process.stdin.on('error', handleInputError);
      
      // Cleanup function
      const cleanup = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(eventLoopTimeout);
          process.stdin.removeListener('data', handleKeypress);
          process.stdin.removeListener('error', handleInputError);
          resolve();
        }
      };
      
      // Handle process termination signals
      ['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
        const handler = () => {
          logger.info(`Received ${signal}, shutting down gracefully`);
          this.isRunning = false;
          cleanup();
        };
        
        process.on(signal, handler);
        this.signalHandlers.set(signal, handler);
      });
      
      // Setup periodic refresh if enabled
      if (this.options.refreshInterval && this.options.refreshInterval > 0) {
        const refreshInterval = setInterval(async () => {
          try {
            await this.refreshTasks();
          } catch (refreshError) {
            logger.warn('Periodic refresh failed', refreshError);
          }
        }, this.options.refreshInterval);
        
        this.intervals.add(refreshInterval);
      }
      
      logger.debug('Event loop started successfully', {
        timeout,
        refreshInterval: this.options.refreshInterval
      });
    });
  }

  private async loadTasks(): Promise<void> {
    try {
      logger.info('Loading tasks from storage...');
      
      // Validate storage before loading
      if (!this.storage) {
        throw new Error('Storage service is not available');
      }
      
      const allTasks = await this.storage.findAll<Task>('tasks');
      
      // Validate and sanitize loaded tasks
      const validTasks = allTasks.filter(task => {
        // Validate required fields
        if (!task || typeof task !== 'object') {
          logger.warn('Skipping invalid task: not an object', { task });
          return false;
        }
        
        if (!task.id || typeof task.id !== 'string') {
          logger.warn('Skipping task with invalid ID', { task });
          return false;
        }
        
        if (!task.title || typeof task.title !== 'string') {
          logger.warn('Skipping task with invalid title', { taskId: task.id });
          return false; 
        }
        
        // Ensure required fields have valid defaults
        if (!task.status || !['todo', 'in_progress', 'done', 'blocked', 'archived'].includes(task.status)) {
          task.status = 'todo';
          logger.debug('Fixed invalid task status', { taskId: task.id, status: task.status });
        }
        
        if (!task.priority || !['critical', 'high', 'medium', 'low'].includes(task.priority)) {
          task.priority = 'medium';
          logger.debug('Fixed invalid task priority', { taskId: task.id, priority: task.priority });
        }
        
        // Ensure arrays exist
        if (!Array.isArray(task.labels)) {
          task.labels = [];
        }
        
        // Ensure dates exist
        if (!task.createdAt) {
          task.createdAt = new Date().toISOString();
        }
        
        if (!task.updatedAt) {
          task.updatedAt = task.createdAt;
        }
        
        return true;
      });
      
      // Sort tasks by priority then by creation date
      this.tasks = validTasks.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return bTime - aTime;
      });
      
      const invalidCount = allTasks.length - validTasks.length;
      if (invalidCount > 0) {
        logger.warn(`Filtered out ${invalidCount} invalid tasks`);
      }
      
      logger.info(`Successfully loaded ${this.tasks.length} valid tasks`);
      
    } catch (error) {
      logger.error('Failed to load tasks from storage', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Ensure tasks is always an array, even on failure
      this.tasks = [];
      this.errorState = `Failed to load tasks: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  private handleKeypress(key: string): void {
    try {
      if (this.editingMode) {
        this.handleEditingKeypress(key);
      } else {
        this.handleNormalKeypress(key);
      }
      
      // Mark render buffer as dirty to trigger re-render
      this.renderBuffer.dirty = true;
      this.safeRender();
      
    } catch (error) {
      logger.error('Keypress handling failed', {
        error: error instanceof Error ? error.message : String(error),
        key: key.charCodeAt(0), // Log key code for debugging
        editingMode: this.editingMode
      });
      
      // Don't crash on keypress errors - just log and continue
      this.errorState = `Input error: ${error instanceof Error ? error.message : String(error)}`;
      this.renderBuffer.dirty = true;
      this.safeRender();
    }
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

  // This method was replaced with complete implementation above

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
    this.needsFullRedraw = true; // Force full redraw after refresh
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
        updatedAt: new Date().toISOString()
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
        updatedAt: new Date().toISOString()
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
    try {
      // Ensure we have a valid tasks array
      if (!Array.isArray(this.tasks)) {
        logger.error('Tasks is not an array, resetting to empty array');
        this.tasks = [];
      }
      
      let filtered = [...this.tasks];
      
      // Apply status filter with null safety
      if (this.statusFilter) {
        filtered = filtered.filter(task => {
          return task && task.status === this.statusFilter;
        });
      }
      
      // Apply search filter with null safety
      if (this.searchQuery && this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase().trim();
        filtered = filtered.filter(task => {
          if (!task) return false;
          
          const title = (task.title || '').toLowerCase();
          const description = (task.description || '').toLowerCase();
          const labels = Array.isArray(task.labels) ? 
            task.labels.join(' ').toLowerCase() : '';
          
          return title.includes(query) || 
                 description.includes(query) || 
                 labels.includes(query);
        });
      }
      
      this.filteredTasks = filtered;
      
      // Adjust selection if needed with bounds checking
      if (this.selectedIndex >= this.filteredTasks.length) {
        this.selectedIndex = Math.max(0, this.filteredTasks.length - 1);
      }
      
      if (this.selectedIndex < 0) {
        this.selectedIndex = 0;
      }
      
      logger.debug(`Applied filters: ${this.filteredTasks.length}/${this.tasks.length} tasks`);
      
    } catch (error) {
      logger.error('Failed to apply filters', {
        error: error instanceof Error ? error.message : String(error),
        tasksLength: Array.isArray(this.tasks) ? this.tasks.length : 'invalid',
        statusFilter: this.statusFilter,
        searchQuery: this.searchQuery
      });
      
      // Fallback to show all tasks if filtering fails
      this.filteredTasks = Array.isArray(this.tasks) ? [...this.tasks] : [];
      this.selectedIndex = 0;
    }
  }

  private render(): void {
    // Clear screen and reset cursor
    process.stdout.write('\x1b[2J\x1b[H');
    
    const width = this.terminalWidth;
    const height = this.terminalHeight;
    
    // Reset render buffer
    this.renderBuffer.lines = [];
    
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
    
    // Output all buffer content at once for better performance
    process.stdout.write(this.renderBuffer.lines.join(''));
  }

  private renderHeader(width: number): void {
    const title = '🌙 Critical Claude Task Viewer';
    const projectInfo = this.getProjectInfo();
    
    // Professional title bar with better padding
    this.renderBuffer.lines.push('\x1b[44m\x1b[97m'); // Blue background, bright white text
    const titlePadding = Math.max(0, width - ViewerHelpers.getDisplayLength(title));
    const leftPad = Math.floor(titlePadding / 2);
    const rightPad = titlePadding - leftPad;
    this.renderBuffer.lines.push(' '.repeat(leftPad) + title + ' '.repeat(rightPad));
    this.renderBuffer.lines.push('\x1b[0m\n'); // Reset
    
    // Enhanced info bar with consistent spacing
    let infoLine = `📊 ${this.filteredTasks.length}/${this.tasks.length} tasks`;
    if (projectInfo) {
      infoLine += ` │ 📁 ${projectInfo}`;
    }
    if (this.statusFilter) {
      infoLine += ` │ 🔍 ${this.statusFilter}`;
    }
    
    this.renderBuffer.lines.push('\x1b[100m\x1b[97m'); // Dark gray background, bright white text
    const infoPadding = Math.max(0, width - ViewerHelpers.getDisplayLength(infoLine));
    this.renderBuffer.lines.push(' ' + infoLine + ' '.repeat(infoPadding - 1));
    this.renderBuffer.lines.push('\x1b[0m\n'); // Reset
  }

  // This method was replaced with renderTaskList

  private buildTaskLine(task: Task, isSelected: boolean, width: number): void {
    const statusIcon = this.getStatusIcon(task.status);
    const priorityIcon = this.getPriorityIcon(task.priority);
    
    let line = `${statusIcon} ${priorityIcon} ${task.title}`;
    
    // Truncate if too long
    if (line.length > width - 4) {
      line = line.substring(0, width - 7) + '...';
    }
    
    // Highlight if selected
    if (isSelected) {
      this.renderBuffer.lines.push('│\x1b[7m'); // Reverse video
      this.renderBuffer.lines.push(line.padEnd(width - 2));
      this.renderBuffer.lines.push('\x1b[0m│\n'); // Reset
    } else {
      this.renderBuffer.lines.push('│');
      this.renderBuffer.lines.push(line.padEnd(width - 2));
      this.renderBuffer.lines.push('│\n');
    }
  }

  // This method is implemented in the new renderSplitView method below

  // This method is now in ViewerHelpers.getTaskDetailLines

  // This method is now in ViewerHelpers.wrapText

  // This method is now in ViewerHelpers.renderDetailLineWithHighlighting

  // This method is now in ViewerHelpers.getDisplayLength

  // This method was replaced with renderEditingScreen

  // This method was replaced with renderFooter

  // This method is implemented below


  // Professional, clear status and priority indicators with enhanced visual design
  private getStatusIcon(status: string): string {
    const icons = {
      todo: '\x1b[37m○\x1b[0m',         // Gray circle for todo
      in_progress: '\x1b[33m●\x1b[0m',  // Yellow filled circle for in progress  
      done: '\x1b[32m✓\x1b[0m',         // Green checkmark for completed
      blocked: '\x1b[31m⊘\x1b[0m',       // Red prohibition symbol for blocked
      archived: '\x1b[90m□\x1b[0m'       // Dark gray square for archived
    };
    return icons[status as keyof typeof icons] || '\x1b[90m?\x1b[0m';
  }

  private getPriorityIcon(priority: string): string {
    const badges = {
      critical: '\x1b[41m\x1b[97m CRIT \x1b[0m',  // Red background, white text
      high: '\x1b[43m\x1b[30m HIGH \x1b[0m',      // Yellow background, black text
      medium: '\x1b[46m\x1b[30m MED  \x1b[0m',     // Cyan background, black text
      low: '\x1b[47m\x1b[30m LOW  \x1b[0m'         // White background, black text
    };
    return badges[priority as keyof typeof badges] || '\x1b[90m UNK  \x1b[0m';
  }
  
  private getStatusColor(status: string): string {
    const colors = {
      todo: '\x1b[37m',        // White/gray
      in_progress: '\x1b[33m', // Yellow
      done: '\x1b[32m',        // Green
      blocked: '\x1b[31m',     // Red
      archived: '\x1b[90m'     // Dark gray
    };
    return colors[status as keyof typeof colors] || '\x1b[37m';
  }
  
  private getPriorityColor(priority: string): string {
    const colors = {
      critical: '\x1b[91m',    // Bright red
      high: '\x1b[93m',       // Bright yellow
      medium: '\x1b[96m',     // Bright cyan
      low: '\x1b[90m'         // Dark gray
    };
    return colors[priority as keyof typeof colors] || '\x1b[37m';
  }

  // Helper method for truncating text while preserving ANSI escape sequences
  private truncateWithAnsi(text: string, maxLength: number): string {
    let result = '';
    let displayLength = 0;
    let i = 0;
    
    while (i < text.length && displayLength < maxLength) {
      if (text[i] === '\x1b' && text[i + 1] === '[') {
        // Find the end of the ANSI sequence
        let j = i + 2;
        while (j < text.length && !/[a-zA-Z]/.test(text[j])) {
          j++;
        }
        if (j < text.length) {
          j++; // Include the ending character
        }
        result += text.slice(i, j);
        i = j;
      } else {
        result += text[i];
        displayLength++;
        i++;
      }
    }
    
    return result;
  }
  
  // Complete moveSelection method implementation
  private moveSelection(direction: number): void {
    const newIndex = this.selectedIndex + direction;
    const maxIndex = this.filteredTasks.length - 1;
    
    if (newIndex < 0) {
      this.selectedIndex = 0;
    } else if (newIndex > maxIndex) {
      this.selectedIndex = Math.max(0, maxIndex);
    } else {
      this.selectedIndex = newIndex;
    }
  }
  
  // Add missing render method implementations
  private renderEditingScreen(width: number, height: number): void {
    if (!this.editingTask) return;
    
    // Professional editing header
    this.renderBuffer.lines.push('\x1b[44m\x1b[97m'); // Professional blue
    const title = ' EDITING TASK';
    this.renderBuffer.lines.push(title.padEnd(width));
    this.renderBuffer.lines.push('\x1b[0m\n'); // Reset
    
    // Task ID info bar
    this.renderBuffer.lines.push('\x1b[100m\x1b[97m'); // Dark gray
    const info = ` ID: ${this.editingTask.id} | Use ↑↓ to navigate fields`;
    this.renderBuffer.lines.push(info.padEnd(width));
    this.renderBuffer.lines.push('\x1b[0m\n\n'); // Reset
    
    // Editing fields with clear visual separation
    const fields = [
      { label: 'Title', value: this.editingTask.title, required: true },
      { label: 'Description', value: this.editingTask.description || '', multiline: true },
      { label: 'Priority', value: this.editingTask.priority, options: ['critical', 'high', 'medium', 'low'] },
      { label: 'Status', value: this.editingTask.status, options: ['todo', 'in_progress', 'done', 'blocked', 'archived'] }
    ];
    
    fields.forEach((field, index) => {
      const isSelected = index === this.editingField;
      const displayValue = index === this.editingField ? this.editingValue : field.value;
      
      // Field label with styling
      this.renderBuffer.lines.push('\x1b[1m'); // Bold
      this.renderBuffer.lines.push(field.label);
      if ((field as any).required) {
        this.renderBuffer.lines.push('\x1b[31m*\x1b[0m'); // Red asterisk for required
      }
      this.renderBuffer.lines.push('\x1b[0m:\n'); // Reset
      
      // Field value with highlighting if selected
      if (isSelected) {
        this.renderBuffer.lines.push('\x1b[103m\x1b[30m'); // Yellow background, black text
        this.renderBuffer.lines.push(`  ${displayValue}█`); // Cursor
        this.renderBuffer.lines.push('\x1b[0m'); // Reset
      } else {
        this.renderBuffer.lines.push(`  ${displayValue || '(empty)'}`);
      }
      
      this.renderBuffer.lines.push('\n\n');
    });
    
    // Context-sensitive help
    this.renderBuffer.lines.push('\x1b[90m'); // Dark gray
    this.renderBuffer.lines.push('CONTROLS: ↑↓ Navigate | Type to edit | ENTER Save | ESC Cancel\n');
    
    const currentField = fields[this.editingField];
    if (currentField && (currentField as any).options) {
      this.renderBuffer.lines.push(`OPTIONS: ${(currentField as any).options.join(', ')}\n`);
    } else if (currentField && (currentField as any).multiline) {
      this.renderBuffer.lines.push('TIP: Markdown supported (**bold**, *italic*, `code`, # headers)\n');
    }
    
    this.renderBuffer.lines.push('\x1b[0m'); // Reset
  }
  
  private renderSplitView(width: number, height: number): void {
    // Responsive split view that adapts to terminal size
    const isNarrow = width < 100;
    const isVeryNarrow = width < 80;
    
    // Adjust proportions based on terminal width
    let leftWidth: number;
    if (isVeryNarrow) {
      // For very narrow terminals, use full width and stack vertically
      this.renderStackedView(width, height);
      return;
    } else if (isNarrow) {
      leftWidth = Math.floor(width * 0.5); // 50/50 split for narrow terminals
    } else {
      leftWidth = Math.floor(width * 0.45); // 45/55 split for wider terminals
    }
    
    const rightWidth = width - leftWidth - 1;
    const selectedTask = this.filteredTasks[this.selectedIndex];
    const visibleTasks = height - 2;
    const startIndex = Math.max(0, this.selectedIndex - Math.floor(visibleTasks / 2));
    
    // Responsive labels based on width
    const leftLabel = isNarrow ? ' TASKS ' : ' TASK LIST ';
    const rightLabel = isNarrow ? ' INFO ' : ' DETAILS ';
    const leftLabelPad = Math.max(0, Math.floor((leftWidth - 1 - ViewerHelpers.getDisplayLength(leftLabel)) / 2));
    const rightLabelPad = Math.max(0, Math.floor((rightWidth - 1 - ViewerHelpers.getDisplayLength(rightLabel)) / 2));
    
    // Professional top border with responsive labels
    this.renderBuffer.lines.push('┌');
    this.renderBuffer.lines.push('─'.repeat(leftLabelPad));
    this.renderBuffer.lines.push(leftLabel);
    this.renderBuffer.lines.push('─'.repeat(Math.max(0, leftWidth - 1 - leftLabelPad - ViewerHelpers.getDisplayLength(leftLabel))));
    this.renderBuffer.lines.push('┬');
    this.renderBuffer.lines.push('─'.repeat(rightLabelPad));
    this.renderBuffer.lines.push(rightLabel);
    this.renderBuffer.lines.push('─'.repeat(Math.max(0, rightWidth - 1 - rightLabelPad - ViewerHelpers.getDisplayLength(rightLabel))));
    this.renderBuffer.lines.push('┐\n');
    
    // Content rows with responsive formatting
    const taskDetailLines = selectedTask ? ViewerHelpers.getTaskDetailLines(selectedTask, rightWidth - 3) : [];
    
    for (let i = 0; i < visibleTasks; i++) {
      const taskIndex = startIndex + i;
      
      // Left side - task list with responsive content
      this.renderBuffer.lines.push('│');
      if (taskIndex < this.filteredTasks.length) {
        const task = this.filteredTasks[taskIndex];
        const isSelected = taskIndex === this.selectedIndex;
        this.renderResponsiveSplitTaskLine(task, isSelected, leftWidth - 2, isNarrow);
      } else {
        this.renderBuffer.lines.push(' '.repeat(leftWidth - 2));
      }
      
      this.renderBuffer.lines.push('│');
      
      // Right side - task details with responsive formatting
      if (i < taskDetailLines.length) {
        const detailLine = taskDetailLines[i];
        const maxDetailWidth = rightWidth - 3;
        const processedLine = ViewerHelpers.renderDetailLineWithHighlighting(detailLine, maxDetailWidth);
        this.renderBuffer.lines.push(' ' + this.padLineToWidth(processedLine, maxDetailWidth));
      } else {
        this.renderBuffer.lines.push(' '.repeat(rightWidth - 1));
      }
      
      this.renderBuffer.lines.push('│\n');
    }
    
    // Professional bottom border
    this.renderBuffer.lines.push('└' + '─'.repeat(leftWidth - 1) + '┴' + '─'.repeat(rightWidth - 1) + '┘\n');
  }
  
  private renderSplitTaskLine(task: Task, isSelected: boolean, width: number): void {
    const statusIcon = this.getStatusIcon(task.status);
    const priorityIcon = this.getPriorityIcon(task.priority);
    
    let line = `${statusIcon} ${priorityIcon} ${task.title}`;
    
    // Add assignee for split view context
    if (task.assignee) {
      line += ` \x1b[36m@${task.assignee}\x1b[0m`;
    }
    
    // Smart truncation for split view with ANSI awareness
    const displayLength = ViewerHelpers.getDisplayLength(line);
    if (displayLength > width - 3) {
      line = this.truncateWithAnsi(line, width - 6) + '...';
    }
    
    // Full-width highlighting for split view
    if (isSelected) {
      this.renderBuffer.lines.push('\x1b[44m\x1b[97m'); // Blue background, bright white text
      this.renderBuffer.lines.push(line);
      const currentDisplayLength = ViewerHelpers.getDisplayLength(line);
      const remainingSpace = width - currentDisplayLength;
      if (remainingSpace > 0) {
        this.renderBuffer.lines.push(' '.repeat(remainingSpace));
      }
      this.renderBuffer.lines.push('\x1b[0m'); // Reset
    } else {
      this.renderBuffer.lines.push(line);
      const currentDisplayLength = ViewerHelpers.getDisplayLength(line);
      const remainingSpace = width - currentDisplayLength;
      if (remainingSpace > 0) {
        this.renderBuffer.lines.push(' '.repeat(remainingSpace));
      }
    }
  }
  
  private getProjectInfo(): string | null {
    // Simple project detection - could be enhanced
    return 'critical_claude';
  }
  
  // Enhanced helper method for padding lines with ANSI code awareness
  private padLineToWidth(line: string, targetWidth: number): string {
    const displayLength = ViewerHelpers.getDisplayLength(line);
    const padding = Math.max(0, targetWidth - displayLength);
    return line + ' '.repeat(padding);
  }

  // Responsive split task line rendering based on available width
  private renderResponsiveSplitTaskLine(task: Task, isSelected: boolean, width: number, isNarrow: boolean): void {
    const statusIcon = this.getStatusIcon(task.status);
    const priorityIcon = isNarrow ? this.getCompactPriorityIcon(task.priority) : this.getPriorityIcon(task.priority);
    
    let line = `${statusIcon} ${priorityIcon} ${task.title}`;
    
    // Add assignee only if there's space and not narrow
    if (!isNarrow && task.assignee && width > 50) {
      line += ` \x1b[36m@${task.assignee}\x1b[0m`;
    }
    
    // Smart truncation with responsive behavior
    const displayLength = ViewerHelpers.getDisplayLength(line);
    if (displayLength > width - 3) {
      line = this.truncateWithAnsi(line, width - 6) + '...';
    }
    
    // Responsive highlighting
    if (isSelected) {
      this.renderBuffer.lines.push('\x1b[44m\x1b[97m');
      this.renderBuffer.lines.push(line);
      const currentDisplayLength = ViewerHelpers.getDisplayLength(line);
      const remainingSpace = width - currentDisplayLength;
      if (remainingSpace > 0) {
        this.renderBuffer.lines.push(' '.repeat(remainingSpace));
      }
      this.renderBuffer.lines.push('\x1b[0m');
    } else {
      this.renderBuffer.lines.push(line);
      const currentDisplayLength = ViewerHelpers.getDisplayLength(line);
      const remainingSpace = width - currentDisplayLength;
      if (remainingSpace > 0) {
        this.renderBuffer.lines.push(' '.repeat(remainingSpace));
      }
    }
  }

  // Compact priority icon for narrow terminals
  private getCompactPriorityIcon(priority: string): string {
    const badges = {
      critical: '\x1b[41m\x1b[97mC\x1b[0m',  // Single letter for space
      high: '\x1b[43m\x1b[30mH\x1b[0m',
      medium: '\x1b[46m\x1b[30mM\x1b[0m',
      low: '\x1b[47m\x1b[30mL\x1b[0m'
    };
    return badges[priority as keyof typeof badges] || '\x1b[90m?\x1b[0m';
  }

  // Stacked view for very narrow terminals
  private renderStackedView(width: number, height: number): void {
    const selectedTask = this.filteredTasks[this.selectedIndex];
    const availableHeight = height - 4; // Header, separator, footer
    const taskListHeight = Math.floor(availableHeight * 0.6);
    const detailHeight = availableHeight - taskListHeight - 1; // -1 for separator
    
    // Header
    this.renderBuffer.lines.push('┌' + ' TASKS (STACKED VIEW) '.padEnd(width - 2, '─') + '┐\n');
    
    // Task list section
    const startIndex = Math.max(0, this.selectedIndex - Math.floor(taskListHeight / 2));
    for (let i = 0; i < taskListHeight; i++) {
      const taskIndex = startIndex + i;
      if (taskIndex < this.filteredTasks.length) {
        const task = this.filteredTasks[taskIndex];
        const isSelected = taskIndex === this.selectedIndex;
        this.renderCompactTaskLine(task, isSelected, width);
      } else {
        this.renderBuffer.lines.push('│' + ' '.repeat(width - 2) + '│\n');
      }
    }
    
    // Separator
    this.renderBuffer.lines.push('├' + '─'.repeat(width - 2) + '┤\n');
    
    // Details section
    if (selectedTask) {
      const detailLines = ViewerHelpers.getTaskDetailLines(selectedTask, width - 6).slice(0, detailHeight);
      for (let i = 0; i < detailHeight; i++) {
        if (i < detailLines.length) {
          const detailLine = detailLines[i];
          const processedLine = ViewerHelpers.renderDetailLineWithHighlighting(detailLine, width - 3);
          this.renderBuffer.lines.push('│ ' + this.padLineToWidth(processedLine, width - 3) + '│\n');
        } else {
          this.renderBuffer.lines.push('│' + ' '.repeat(width - 2) + '│\n');
        }
      }
    } else {
      for (let i = 0; i < detailHeight; i++) {
        this.renderBuffer.lines.push('│' + ' '.repeat(width - 2) + '│\n');
      }
    }
    
    // Bottom border
    this.renderBuffer.lines.push('└' + '─'.repeat(width - 2) + '┘\n');
  }

  // Compact task line for stacked view
  private renderCompactTaskLine(task: Task, isSelected: boolean, width: number): void {
    const statusIcon = this.getStatusIcon(task.status);
    const priorityIcon = this.getCompactPriorityIcon(task.priority);
    
    let line = `${statusIcon}${priorityIcon} ${task.title}`;
    
    // Very aggressive truncation for compact view
    const maxLength = width - 6;
    if (ViewerHelpers.getDisplayLength(line) > maxLength) {
      line = this.truncateWithAnsi(line, maxLength - 3) + '...';
    }
    
    if (isSelected) {
      this.renderBuffer.lines.push('│\x1b[44m\x1b[97m ');
      this.renderBuffer.lines.push(line);
      const currentDisplayLength = ViewerHelpers.getDisplayLength(line);
      const remainingSpace = width - currentDisplayLength - 3;
      if (remainingSpace > 0) {
        this.renderBuffer.lines.push(' '.repeat(remainingSpace));
      }
      this.renderBuffer.lines.push('\x1b[0m│\n');
    } else {
      this.renderBuffer.lines.push('│ ');
      this.renderBuffer.lines.push(line);
      const currentDisplayLength = ViewerHelpers.getDisplayLength(line);
      const remainingSpace = width - currentDisplayLength - 3;
      if (remainingSpace > 0) {
        this.renderBuffer.lines.push(' '.repeat(remainingSpace));
      }
      this.renderBuffer.lines.push('│\n');
    }
  }
  
  private renderTaskList(width: number, height: number): void {
    const visibleTasks = height - 2; // Leave space for borders
    const totalTasks = this.filteredTasks.length;
    
    // Smart pagination for performance
    const startIndex = Math.max(0, this.selectedIndex - Math.floor(visibleTasks / 2));
    const endIndex = Math.min(totalTasks, startIndex + visibleTasks);
    
    // Professional top border with pagination info
    const paginationInfo = totalTasks > visibleTasks ? 
      ` (${startIndex + 1}-${endIndex}/${totalTasks}) ` : ' TASKS ';
    const borderWidth = width - 2;
    const paginationLength = ViewerHelpers.getDisplayLength(paginationInfo);
    const leftBorderLength = Math.floor((borderWidth - paginationLength) / 2);
    const rightBorderLength = borderWidth - leftBorderLength - paginationLength;
    
    const borderTop = '┌' + '─'.repeat(leftBorderLength) + paginationInfo + '─'.repeat(rightBorderLength) + '┐';
    this.renderBuffer.lines.push(borderTop + '\n');
    
    if (totalTasks === 0) {
      // Enhanced empty state message
      const emptyMsg = this.statusFilter ? 
        `No ${this.statusFilter} tasks found` : 
        'No tasks found - use "cc task create" to add tasks';
      const padding = Math.floor((width - ViewerHelpers.getDisplayLength(emptyMsg) - 2) / 2);
      const rightPadding = width - padding - ViewerHelpers.getDisplayLength(emptyMsg) - 2;
      this.renderBuffer.lines.push('│' + ' '.repeat(padding) + '\x1b[90m' + emptyMsg + '\x1b[0m' + 
        ' '.repeat(rightPadding) + '│\n');
        
      // Add some vertical padding for better appearance
      for (let i = 1; i < visibleTasks; i++) {
        this.renderBuffer.lines.push('│' + ' '.repeat(width - 2) + '│\n');
      }
    } else {
      for (let i = 0; i < visibleTasks; i++) {
        const taskIndex = startIndex + i;
        if (taskIndex < totalTasks) {
          this.renderTaskLine(this.filteredTasks[taskIndex], taskIndex === this.selectedIndex, width);
        } else {
          this.renderBuffer.lines.push('│' + ' '.repeat(width - 2) + '│\n');
        }
      }
    }
    
    // Bottom border
    this.renderBuffer.lines.push('└' + '─'.repeat(width - 2) + '┘\n');
  }
  
  private renderTaskLine(task: Task, isSelected: boolean, width: number): void {
    const statusIcon = this.getStatusIcon(task.status);
    const priorityIcon = this.getPriorityIcon(task.priority);
    
    // Build clean line without complex color handling
    let line = `${statusIcon} ${priorityIcon} ${task.title}`;
    
    // Add assignee with professional styling
    if (task.assignee) {
      line += ` \x1b[36m@${task.assignee}\x1b[0m`;
    }
    
    // Add labels with subtle styling (first 2 only to avoid clutter)
    if (task.labels && task.labels.length > 0) {
      const labelText = task.labels.slice(0, 2).join(',');
      if (labelText.trim()) {
        line += ` \x1b[90m#${labelText}\x1b[0m`;
      }
    }
    
    // Calculate display length accounting for ANSI codes
    const displayLength = ViewerHelpers.getDisplayLength(line);
    const maxLength = width - 4; // Leave space for borders
    
    // Smart truncation that preserves ANSI codes
    if (displayLength > maxLength) {
      line = this.truncateWithAnsi(line, maxLength - 3) + '...';
    }
    
    // Professional full-width row highlighting
    if (isSelected) {
      // Use blue background with white text for better contrast
      this.renderBuffer.lines.push('│\x1b[44m\x1b[97m'); // Blue background, bright white text
      this.renderBuffer.lines.push(line);
      // Pad remaining space with background color
      const currentDisplayLength = ViewerHelpers.getDisplayLength(line);
      const remainingSpace = width - 2 - currentDisplayLength;
      if (remainingSpace > 0) {
        this.renderBuffer.lines.push(' '.repeat(remainingSpace));
      }
      this.renderBuffer.lines.push('\x1b[0m│\n'); // Reset and close
    } else {
      this.renderBuffer.lines.push('│');
      this.renderBuffer.lines.push(line);
      // Pad to maintain alignment
      const currentDisplayLength = ViewerHelpers.getDisplayLength(line);
      const remainingSpace = width - 2 - currentDisplayLength;
      if (remainingSpace > 0) {
        this.renderBuffer.lines.push(' '.repeat(remainingSpace));
      }
      this.renderBuffer.lines.push('│\n');
    }
  }
  
  private renderFooter(width: number): void {
    // Separator line for visual clarity
    this.renderBuffer.lines.push('├' + '─'.repeat(width - 2) + '┤\n');
    
    // Enhanced keyboard shortcuts with better organization
    const shortcuts = [
      '\x1b[96m↑↓\x1b[0m Navigate \x1b[90m|\x1b[0m \x1b[96mSPACE\x1b[0m Status \x1b[90m|\x1b[0m \x1b[96mTAB\x1b[0m Details \x1b[90m|\x1b[0m \x1b[96mENTER\x1b[0m Edit',
      '\x1b[96mF\x1b[0m Filter \x1b[90m|\x1b[0m \x1b[96mR\x1b[0m Refresh \x1b[90m|\x1b[0m \x1b[96mQ\x1b[0m Quit \x1b[90m|\x1b[0m \x1b[96m?\x1b[0m Help'
    ];
    
    shortcuts.forEach(shortcut => {
      const displayLength = ViewerHelpers.getDisplayLength(shortcut);
      const padding = Math.max(0, width - displayLength - 2);
      const leftPad = Math.floor(padding / 2);
      const rightPad = padding - leftPad;
      
      this.renderBuffer.lines.push('│');
      this.renderBuffer.lines.push(' '.repeat(leftPad));
      this.renderBuffer.lines.push(shortcut);
      this.renderBuffer.lines.push(' '.repeat(rightPad));
      this.renderBuffer.lines.push('│\n');
    });
    
    // Professional bottom border
    this.renderBuffer.lines.push('└' + '─'.repeat(width - 2) + '┘');
  }
  
  // Missing helper methods that are called but not implemented
  private updateTerminalDimensions(): void {
    const newWidth = process.stdout.columns || 80;
    const newHeight = process.stdout.rows || 24;
    
    if (newWidth !== this.terminalWidth || newHeight !== this.terminalHeight) {
      // Enhanced minimum sizes with responsive scaling
      this.terminalWidth = Math.max(60, newWidth); // Increased minimum for better UX
      this.terminalHeight = Math.max(12, newHeight); // Increased minimum for better UX
      
      // Adjust pagination based on terminal size
      this.pageSize = Math.max(10, Math.floor((this.terminalHeight - 6) * 0.8));
      
      this.needsFullRedraw = true;
      
      logger.debug('Terminal dimensions updated', {
        width: this.terminalWidth,
        height: this.terminalHeight,
        pageSize: this.pageSize
      });
    }
  }
  
  private setupSignalHandlers(): void {
    ['SIGINT', 'SIGTERM', 'SIGQUIT', 'SIGHUP'].forEach(signal => {
      const handler = () => {
        logger.info(`Received ${signal}, initiating graceful shutdown`);
        this.isRunning = false;
      };
      
      process.on(signal, handler);
      this.signalHandlers.set(signal, handler);
    });
  }
  
  private setupResizeHandler(): void {
    const handler = () => {
      this.updateTerminalDimensions();
      this.needsFullRedraw = true;
      this.safeRender();
    };
    
    process.stdout.on('resize', handler);
    this.signalHandlers.set('resize', handler);
  }
  
  private async performSystemChecks(): Promise<void> {
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
    if (majorVersion < 18) {
      throw new Error(`Node.js ${nodeVersion} is unsupported. Requires Node.js 18+`);
    }
    
    // Check terminal capabilities
    if (!process.stdout.isTTY || !process.stdin.isTTY) {
      throw new Error('Interactive terminal (TTY) required for both input and output');
    }
    
    // Test storage accessibility - use actual tasks collection  
    try {
      await this.storage.findAll<any>('tasks');
    } catch (error) {
      throw new Error(`Storage system inaccessible: ${ViewerHelpers.getErrorMessage(error)}`);
    }
    
    // Acquire file lock to prevent multiple instances
    await this.storageLock.acquire();
  }
  
  private async loadTasksWithRetry(): Promise<void> {
    const maxAttempts = this.options.maxRetries || 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.loadTasks();
        logger.debug(`Tasks loaded successfully on attempt ${attempt}`);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn(`Task loading attempt ${attempt}/${maxAttempts} failed`, {
          error: ViewerHelpers.getErrorMessage(error),
          attempt
        });
        
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100 * attempt));
        }
      }
    }
    
    // If all attempts failed, set empty tasks and log error
    this.tasks = [];
    this.errorState = `Failed to load tasks: ${ViewerHelpers.getErrorMessage(lastError)}`;
    logger.error('All task loading attempts failed', {
      error: ViewerHelpers.getErrorMessage(lastError),
      attempts: maxAttempts
    });
  }
  
  private async safeRender(): Promise<void> {
    try {
      // Throttle rendering for performance (16ms = ~60fps)
      const now = Date.now();
      if (now - this.renderBuffer.lastRender < 16) {
        return;
      }
      
      // Only render if data has changed or forced redraw
      if (this.needsFullRedraw || this.renderBuffer.dirty) {
        this.render();
        this.renderBuffer.lastRender = now;
        this.renderBuffer.dirty = false;
        this.needsFullRedraw = false;
      }
      
    } catch (renderError) {
      logger.error('Rendering failed', {
        error: renderError instanceof Error ? renderError.message : String(renderError),
        stack: renderError instanceof Error ? renderError.stack : undefined
      });
      
      // Emergency fallback render with better error information
      try {
        process.stdout.write('\x1b[2J\x1b[H');
        process.stdout.write('\x1b[31m=== Critical Claude Viewer - Rendering Error ===\x1b[0m\n\n');
        process.stdout.write('The interface encountered an error but is still running.\n');
        process.stdout.write('You can try the following:\n');
        process.stdout.write('• Press \x1b[33mr\x1b[0m to refresh and reload tasks\n');
        process.stdout.write('• Press \x1b[33mq\x1b[0m to quit safely\n\n');
        
        if (renderError instanceof Error) {
          process.stdout.write(`\x1b[90mError Details: ${renderError.message}\x1b[0m\n`);
        }
        
        process.stdout.write('\n\x1b[90mTasks loaded: '); 
        process.stdout.write(Array.isArray(this.tasks) ? this.tasks.length.toString() : '0');  
        process.stdout.write(' | Filtered: ');
        process.stdout.write(Array.isArray(this.filteredTasks) ? this.filteredTasks.length.toString() : '0');
        process.stdout.write('\x1b[0m\n');
        
      } catch (emergencyError) {
        logger.error('Emergency render failed', emergencyError);
        this.isRunning = false;
      }
    }
  }
  
  private async emergencyCleanup(): Promise<void> {
    try {
      // Emergency terminal restore
      process.stdout.write('\x1b[?25h\x1b[?1049l\x1b[0m\n');
      
      // Emergency message
      process.stdout.write('Critical Claude Viewer encountered an error and has been terminated.\n');
      process.stdout.write('Your terminal should be restored to normal operation.\n');
      
    } catch (emergencyError) {
      // Complete failure - nothing more we can do
      logger.error('Emergency cleanup failed', emergencyError);
    }
  }
  
  private cleanupResources(): void {
    // Clear all timeouts
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
    
    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    
    // Remove signal handlers
    this.signalHandlers.forEach((handler, signal) => {
      if (signal !== 'resize') {
        process.removeListener(signal, handler);
      } else {
        process.stdout.removeListener('resize', handler);
      }
    });
    this.signalHandlers.clear();
    
    // Release file lock
    this.storageLock.release().catch(error => {
      logger.warn('Failed to release storage lock during cleanup', error);
    });
  }
  
  private createFileLock(): FileLock {
    let lockAcquired = false;
    const lockFile = join(homedir(), '.critical-claude', '.viewer.lock');
    
    return {
      async acquire(): Promise<void> {
        if (lockAcquired) return;
        
        try {
          await fs.mkdir(join(homedir(), '.critical-claude'), { recursive: true });
          await fs.writeFile(lockFile, process.pid.toString(), { flag: 'wx' });
          lockAcquired = true;
        } catch (error: any) {
          if (error.code === 'EEXIST') {
            // Check if process is still running
            try {
              const existingPid = await fs.readFile(lockFile, 'utf8');
              process.kill(parseInt(existingPid), 0); // Test if process exists
              throw new Error('Viewer is already running in another process');
            } catch (killError: any) {
              if (killError.code === 'ESRCH') {
                // Process doesn't exist, remove stale lock
                await fs.unlink(lockFile).catch(() => {});
                await this.acquire(); // Retry
              } else {
                throw killError;
              }
            }
          } else {
            throw error;
          }
        }
      },
      
      async release(): Promise<void> {
        if (!lockAcquired) return;
        
        try {
          await fs.unlink(lockFile);
          lockAcquired = false;
        } catch (error) {
          logger.warn('Failed to release file lock', error);
        }
      },
      
      isLocked(): boolean {
        return lockAcquired;
      }
    };
  }

  /**
   * Launch Safe Textual Viewer (Python TUI with terminal safety)
   */
  async launchTextualViewer(options: ViewerOptions = {}): Promise<ViewerResult> {
    try {
      logger.info('Launching safe Textual viewer...');
      
      // Check dependencies first
      const dependencyCheck = await this.checkDependencies();
      if (!dependencyCheck.success) {
        const errorMessage = [
          '❌ Critical Claude Viewer - Dependency Check Failed',
          '',
          'The following issues must be resolved:',
          ...dependencyCheck.errors.map(error => `  • ${error}`),
          '',
          'Please fix these issues and try again.'
        ].join('\n');
        
        logger.error('Viewer dependency check failed', { errors: dependencyCheck.errors });
        console.error(errorMessage);
        
        return {
          success: false,
          error: 'Dependency validation failed. See console for details.'
        };
      }

      // Use spawn to launch the safe Python viewer directly
      const { spawn } = await import('child_process');
      const path = await import('path');
      
      // Find the textual viewer script
      const viewerPath = path.join(__dirname, '..', '..', 'textual_viewer.py');
      
      // Check if Python and textual viewer exist
      try {
        const fs = await import('fs/promises');
        await fs.access(viewerPath);
      } catch (error) {
        logger.error('Textual viewer script not found', { path: viewerPath });
        return {
          success: false,
          error: `Textual viewer script not found at ${viewerPath}`
        };
      }

      logger.info(`Launching safe textual viewer from: ${viewerPath}`);
      
      // Launch the safe Python viewer
      const pythonProcess = spawn('python3', [viewerPath], {
        stdio: 'inherit', // Pass through stdin/stdout/stderr
        env: {
          ...process.env,
          PYTHONPATH: path.dirname(viewerPath),
          CRITICAL_CLAUDE_LOG_LEVEL: options.logLevel || 'info'
        }
      });

      // Handle process events
      return new Promise((resolve) => {
        pythonProcess.on('exit', (code, signal) => {
          if (signal) {
            logger.info(`Textual viewer terminated by signal: ${signal}`);
            resolve({ success: true, exitCode: 0 });
          } else if (code === 0) {
            logger.info('Textual viewer exited successfully');
            resolve({ success: true, exitCode: code });
          } else {
            logger.error(`Textual viewer exited with code: ${code}`);
            resolve({
              success: false,
              error: `Viewer process exited with code ${code}`,
              exitCode: code
            });
          }
        });

        pythonProcess.on('error', (error) => {
          logger.error('Failed to launch textual viewer process', error);
          resolve({
            success: false,
            error: `Failed to launch viewer: ${error.message}`
          });
        });

        // Log successful start
        logger.info('Safe textual viewer process started successfully');
      });

    } catch (error) {
      logger.error('Critical textual viewer failure', error);
      return {
        success: false,
        error: `Textual viewer failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Main viewer entry point - uses safe Textual viewer by default
   */
  async launchViewer(options: ViewerOptions = {}): Promise<ViewerResult> {
    // Default to safe textual viewer (new behavior)
    // Use legacy terminal viewer only if explicitly requested
    if (options.useTextual === false) {
      logger.info('Using legacy terminal viewer (explicitly requested)');
      return this.launchOriginalViewer(options);
    } else {
      logger.info('Using safe textual viewer (default)');
      return this.launchTextualViewer(options);
    }
  }
}