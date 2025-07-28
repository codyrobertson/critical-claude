/**
 * Simplified Viewer Service
 * Consolidates ViewerService functionality into direct service methods
 */
import { createSuccessResult, createErrorResult } from '../models/index.js';
import { logger } from '../utils/Logger.js';
export class ViewerService {
    storage;
    COLLECTION = 'tasks';
    dependenciesChecked = false;
    dependencyErrors = [];
    constructor(storage) {
        this.storage = storage;
        // Validate storage immediately
        this.validateStorage();
    }
    validateStorage() {
        if (!this.storage) {
            throw new Error('Storage instance is required for ViewerService');
        }
    }
    async checkDependencies() {
        if (this.dependenciesChecked) {
            return { success: this.dependencyErrors.length === 0, errors: this.dependencyErrors };
        }
        const errors = [];
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
            const storageBasePath = await this.storage.getBasePath?.();
            if (!storageBasePath) {
                errors.push('Storage base path is not accessible');
            }
            // Test storage read capability
            await this.storage.findAll('__health_check');
        }
        catch (error) {
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
        }
        catch (error) {
            errors.push(`File system permissions error: ${error instanceof Error ? error.message : error}`);
        }
        this.dependenciesChecked = true;
        this.dependencyErrors = errors;
        return { success: errors.length === 0, errors };
    }
    async launchViewer(options) {
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
            const storageBasePath = await this.storage.getBasePath?.();
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
            }
            catch (dirError) {
                logger.error('Failed to create storage directory', dirError);
                return {
                    success: false,
                    error: `Cannot create storage directory: ${dirError instanceof Error ? dirError.message : dirError}`
                };
            }
            // Initialize viewer with comprehensive error handling
            let viewer;
            try {
                viewer = new TerminalViewer(this.storage, options);
            }
            catch (viewerError) {
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
            }
            catch (launchError) {
                logger.error('Viewer launch failed', launchError);
                // Provide specific error messages based on error type
                let errorMessage = 'Unknown viewer error';
                if (launchError instanceof Error) {
                    if (launchError.message.includes('ENOENT')) {
                        errorMessage = 'File or directory not found. Storage may be corrupted.';
                    }
                    else if (launchError.message.includes('EACCES')) {
                        errorMessage = 'Permission denied. Check file system permissions.';
                    }
                    else if (launchError.message.includes('ENOSPC')) {
                        errorMessage = 'No space left on device. Free up disk space.';
                    }
                    else {
                        errorMessage = launchError.message;
                    }
                }
                return {
                    success: false,
                    error: `Viewer launch failed: ${errorMessage}`
                };
            }
        }
        catch (error) {
            logger.error('Critical viewer service failure', error);
            return {
                success: false,
                error: `Critical failure: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    async getTasksForViewer() {
        try {
            // Validate storage before attempting to read
            if (!this.storage) {
                return createErrorResult('Storage is not initialized');
            }
            // Attempt to load tasks with retry mechanism
            let tasks = [];
            let lastError;
            const maxAttempts = 3;
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                try {
                    tasks = await this.storage.findAll(this.COLLECTION);
                    break; // Success, exit retry loop
                }
                catch (error) {
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
                if (!task || typeof task !== 'object')
                    return false;
                if (!task.id || !task.title)
                    return false;
                return true;
            });
            if (validTasks.length !== tasks.length) {
                logger.warn(`Filtered out ${tasks.length - validTasks.length} invalid tasks`);
            }
            // Sort tasks for optimal viewing (high priority first, then by date)
            const sortedTasks = validTasks.sort((a, b) => {
                const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                const aPriority = priorityOrder[a.priority] || 0;
                const bPriority = priorityOrder[b.priority] || 0;
                if (aPriority !== bPriority) {
                    return bPriority - aPriority; // Higher priority first
                }
                const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return bDate - aDate; // Newer first
            });
            logger.info(`Loaded ${sortedTasks.length} valid tasks for viewer`);
            return createSuccessResult(sortedTasks);
        }
        catch (error) {
            logger.error('Critical error in getTasksForViewer', error);
            return createErrorResult(`Failed to get tasks for viewer: ${error instanceof Error ? error.message : error}`);
        }
    }
    async searchTasks(query) {
        try {
            const tasks = await this.storage.findAll(this.COLLECTION);
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
        }
        catch (error) {
            return createErrorResult(`Failed to search tasks: ${error instanceof Error ? error.message : error}`);
        }
    }
    async toggleTaskStatus(taskId) {
        try {
            const task = await this.storage.findById(this.COLLECTION, taskId);
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
            const newStatus = statusTransitions[task.status] || 'todo';
            const updatedTask = {
                ...task,
                status: newStatus,
                updatedAt: new Date()
            };
            await this.storage.save(this.COLLECTION, taskId, updatedTask);
            return createSuccessResult(updatedTask);
        }
        catch (error) {
            return createErrorResult(`Failed to toggle task status: ${error instanceof Error ? error.message : error}`);
        }
    }
}
// Advanced Terminal GUI Viewer Implementation
class TerminalViewer {
    storage;
    options;
    tasks = [];
    filteredTasks = [];
    selectedIndex = 0;
    statusFilter = null;
    searchQuery = '';
    isRunning = true;
    showingDetails = false;
    editingMode = false;
    editingField = 0; // 0=title, 1=description, 2=priority, 3=status
    editingTask = null;
    editingValue = '';
    terminalWidth = 80;
    terminalHeight = 24;
    constructor(storage, options) {
        this.storage = storage;
        this.options = options;
        // Validate required dependencies
        if (!this.storage) {
            throw new Error('Storage instance is required for TerminalViewer');
        }
        if (!process.stdout || !process.stdin) {
            throw new Error('Standard input/output streams are required for terminal viewer');
        }
        // Get terminal dimensions with fallbacks
        this.terminalWidth = process.stdout.columns || 80;
        this.terminalHeight = process.stdout.rows || 24;
        // Validate terminal dimensions
        if (this.terminalWidth < 40 || this.terminalHeight < 10) {
            logger.warn('Terminal size is very small', { width: this.terminalWidth, height: this.terminalHeight });
        }
        // Set logger level based on options
        if (this.options.logLevel) {
            try {
                logger.setLevel(this.options.logLevel);
            }
            catch (error) {
                logger.warn('Failed to set logger level', error);
            }
        }
        // Debug: Log storage information in constructor
        logger.info('🏗️ TerminalViewer initialized', {
            hasStorage: !!this.storage,
            logLevel: this.options.logLevel,
            theme: this.options.theme,
            terminalSize: `${this.terminalWidth}x${this.terminalHeight}`
        });
    }
    async launch() {
        let terminalSetup = false;
        try {
            logger.debug('Starting Terminal GUI viewer');
            // Pre-flight checks
            if (!process.stdout.isTTY) {
                throw new Error('Terminal viewer requires interactive TTY terminal');
            }
            // In debug mode, write logs to file
            if (this.options.logLevel === 'debug') {
                try {
                    const fs = await import('fs/promises');
                    const path = await import('path');
                    const os = await import('os');
                    const logDir = path.join(os.homedir(), '.critical-claude');
                    await fs.mkdir(logDir, { recursive: true });
                    const logPath = path.join(logDir, 'viewer-debug.log');
                    const logMessage = `\n[${new Date().toISOString()}] Starting viewer launch\n`;
                    await fs.appendFile(logPath, logMessage);
                }
                catch (logError) {
                    logger.warn('Failed to write debug log', logError);
                }
            }
            // Setup terminal for GUI mode with error handling
            try {
                this.setupTerminal();
                terminalSetup = true;
            }
            catch (setupError) {
                throw new Error(`Terminal setup failed: ${setupError instanceof Error ? setupError.message : setupError}`);
            }
            // Load initial tasks with comprehensive error handling
            try {
                await this.loadTasks();
                logger.debug('Initial tasks loaded', { count: this.tasks.length });
            }
            catch (loadError) {
                logger.error('Initial task loading failed', loadError);
                // Continue with empty task list - viewer should still be functional
                this.tasks = [];
            }
            // Retry mechanism for task loading
            if (this.tasks.length === 0) {
                logger.warn('⚠️ No tasks loaded, trying alternative load method...');
                try {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    await this.loadTasks();
                    logger.debug('Second attempt tasks loaded', { count: this.tasks.length });
                }
                catch (retryError) {
                    logger.warn('Task loading retry failed', retryError);
                }
                // Log but don't fail if no tasks found
                if (this.tasks.length === 0) {
                    logger.info('No tasks found - showing empty state');
                }
            }
            // Initial render with error recovery
            try {
                this.applyFilters();
                this.render();
            }
            catch (renderError) {
                logger.error('Initial render failed', renderError);
                // Try minimal render
                try {
                    process.stdout.write('\x1b[2J\x1b[H'); // Clear screen
                    process.stdout.write('Critical Claude Viewer - Rendering Error\n');
                    process.stdout.write('Press q to quit\n');
                }
                catch (minimalRenderError) {
                    throw new Error(`Complete render failure: ${minimalRenderError}`);
                }
            }
            // Start event loop with timeout
            try {
                await this.startEventLoop();
            }
            catch (eventLoopError) {
                logger.error('Event loop error', eventLoopError);
                throw eventLoopError;
            }
        }
        catch (error) {
            logger.error('Terminal viewer launch failed', error);
            throw error;
        }
        finally {
            // Always cleanup terminal if it was setup
            if (terminalSetup) {
                try {
                    this.cleanupTerminal();
                }
                catch (cleanupError) {
                    logger.error('Terminal cleanup failed', cleanupError);
                }
            }
        }
    }
    setupTerminal() {
        try {
            // Validate terminal capabilities
            if (!process.stdin || !process.stdout) {
                throw new Error('Standard input/output streams not available');
            }
            // Enable raw mode for key capture with error handling
            if (process.stdin.isTTY) {
                try {
                    process.stdin.setRawMode(true);
                }
                catch (rawModeError) {
                    throw new Error(`Cannot enable raw mode: ${rawModeError}`);
                }
            }
            else {
                throw new Error('Terminal is not interactive (not a TTY)');
            }
            // Setup input stream
            try {
                process.stdin.resume();
                process.stdin.setEncoding('utf8');
            }
            catch (inputError) {
                throw new Error(`Input stream setup failed: ${inputError}`);
            }
            // Setup terminal display with error checking
            try {
                process.stdout.write('\x1b[?25l'); // Hide cursor
                process.stdout.write('\x1b[?1049h'); // Enable alternate screen buffer
                process.stdout.write('\x1b[2J'); // Clear screen
            }
            catch (displayError) {
                throw new Error(`Terminal display setup failed: ${displayError}`);
            }
            logger.debug('Terminal setup completed successfully');
        }
        catch (error) {
            logger.error('Terminal setup failed', error);
            throw error;
        }
    }
    cleanupTerminal() {
        try {
            logger.debug('Starting terminal cleanup');
            // Restore terminal display
            try {
                process.stdout.write('\x1b[?25h'); // Show cursor
                process.stdout.write('\x1b[?1049l'); // Disable alternate screen buffer
                process.stdout.write('\x1b[2J'); // Clear screen
                process.stdout.write('\x1b[H'); // Move cursor to home
            }
            catch (displayError) {
                logger.warn('Display cleanup failed', displayError);
            }
            // Restore terminal mode
            try {
                if (process.stdin && process.stdin.isTTY) {
                    process.stdin.setRawMode(false);
                }
            }
            catch (rawModeError) {
                logger.warn('Raw mode cleanup failed', rawModeError);
            }
            // Cleanup input stream
            try {
                if (process.stdin) {
                    process.stdin.pause();
                }
            }
            catch (inputError) {
                logger.warn('Input stream cleanup failed', inputError);
            }
            logger.debug('Terminal cleanup completed');
        }
        catch (error) {
            logger.error('Terminal cleanup encountered error', error);
            // Don't throw - we're already in cleanup
        }
    }
    async startEventLoop() {
        return new Promise((resolve) => {
            const handleKeypress = (key) => {
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
    async loadTasks() {
        try {
            logger.info('🔍 Starting task loading process...');
            // Debug: Log storage path information
            const storageBasePath = await this.storage.getBasePath?.();
            logger.info(`📁 Storage base path: ${storageBasePath}`);
            console.error(`DEBUG: LoadTasks storage path: ${storageBasePath}`);
            const allTasks = await this.storage.findAll('tasks');
            logger.info(`📦 Raw tasks loaded: ${allTasks.length}`, {
                storageBasePath,
                sampleTasks: allTasks.slice(0, 3).map(t => ({ id: t.id, title: t.title, status: t.status }))
            });
            console.error(`DEBUG: LoadTasks found ${allTasks.length} tasks`);
            // Debug: Write to file to understand what's happening
            if (this.options.logLevel === 'debug') {
                const fs = await import('fs/promises');
                const path = await import('path');
                const os = await import('os');
                const logPath = path.join(os.homedir(), '.critical-claude', 'viewer-debug.log');
                const logMessage = `[${new Date().toISOString()}] loadTasks: StoragePath=${storageBasePath}, Found ${allTasks.length} tasks\n`;
                await fs.appendFile(logPath, logMessage).catch(() => { });
            }
            this.tasks = allTasks.sort((a, b) => {
                const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                const aPriority = priorityOrder[a.priority] || 0;
                const bPriority = priorityOrder[b.priority] || 0;
                if (aPriority !== bPriority) {
                    return bPriority - aPriority;
                }
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            logger.info(`✅ Tasks sorted and ready: ${this.tasks.length}`, {
                priorities: this.tasks.slice(0, 5).map(t => `${t.title} (${t.priority})`)
            });
        }
        catch (error) {
            logger.error('❌ Failed to load tasks', error);
            // Debug: Write error to file
            if (this.options.logLevel === 'debug') {
                const fs = await import('fs/promises');
                const path = await import('path');
                const os = await import('os');
                const logPath = path.join(os.homedir(), '.critical-claude', 'viewer-debug.log');
                const logMessage = `[${new Date().toISOString()}] loadTasks ERROR: ${error}\n`;
                await fs.appendFile(logPath, logMessage).catch(() => { });
            }
            this.tasks = []; // Ensure tasks is always an array
        }
    }
    handleKeypress(key) {
        if (this.editingMode) {
            this.handleEditingKeypress(key);
        }
        else {
            this.handleNormalKeypress(key);
        }
        this.render();
    }
    handleNormalKeypress(key) {
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
    handleEditingKeypress(key) {
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
    moveSelection(direction) {
        const newIndex = this.selectedIndex + direction;
        if (newIndex >= 0 && newIndex < this.filteredTasks.length) {
            this.selectedIndex = newIndex;
        }
    }
    toggleTaskDetails() {
        this.showingDetails = !this.showingDetails;
    }
    cycleStatusFilter() {
        const filters = [null, 'todo', 'in_progress', 'done', 'blocked', 'archived'];
        const currentIndex = filters.indexOf(this.statusFilter);
        const nextIndex = (currentIndex + 1) % filters.length;
        this.statusFilter = filters[nextIndex];
        this.applyFilters();
        this.selectedIndex = 0; // Reset selection
    }
    async refreshTasks() {
        await this.loadTasks();
        this.applyFilters();
        this.selectedIndex = 0;
        this.needsFullRedraw = true; // Force full redraw after refresh
    }
    showHelp() {
        // Toggle help display - for now just cycle through
        // TODO: Implement help overlay
    }
    startEditingTask() {
        if (this.filteredTasks.length === 0)
            return;
        this.editingTask = this.filteredTasks[this.selectedIndex];
        this.editingMode = true;
        this.editingField = 0;
        this.updateEditingValue();
    }
    exitEditingMode() {
        this.editingMode = false;
        this.editingTask = null;
        this.editingValue = '';
        this.editingField = 0;
    }
    updateEditingValue() {
        if (!this.editingTask)
            return;
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
    saveCurrentFieldValue() {
        if (!this.editingTask)
            return;
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
                    this.editingTask.priority = this.editingValue.trim();
                }
                break;
            case 3:
                const validStatuses = ['todo', 'in_progress', 'done', 'blocked', 'archived'];
                if (validStatuses.includes(this.editingValue.trim())) {
                    this.editingTask.status = this.editingValue.trim();
                }
                break;
        }
    }
    async saveEditingTask() {
        // Store the task reference before any async operations
        const taskToSave = this.editingTask;
        if (!taskToSave) {
            logger.error('Cannot save: no task being edited');
            return;
        }
        try {
            // Create the updated task from the stored reference
            const updatedTask = {
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
            let lastError;
            while (saveAttempts < maxAttempts) {
                try {
                    await this.storage.save('tasks', taskToSave.id, updatedTask);
                    logger.debug('Storage save completed successfully', { attempt: saveAttempts + 1 });
                    break; // Success, exit retry loop
                }
                catch (storageError) {
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
        }
        catch (error) {
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
    async toggleSelectedTaskStatus() {
        if (this.filteredTasks.length === 0)
            return;
        const selectedTask = this.filteredTasks[this.selectedIndex];
        const statusTransitions = {
            'todo': 'in_progress',
            'in_progress': 'done',
            'done': 'todo',
            'blocked': 'in_progress',
            'archived': 'todo'
        };
        const newStatus = statusTransitions[selectedTask.status] || 'todo';
        try {
            const updatedTask = {
                ...selectedTask,
                status: newStatus,
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
        }
        catch (error) {
            logger.error('Failed to update task status', error);
        }
    }
    applyFilters() {
        logger.debug(`🔽 Applying filters... tasks.length=${this.tasks.length}, statusFilter=${this.statusFilter}, searchQuery=${this.searchQuery}`);
        let filtered = [...this.tasks];
        // Apply status filter
        if (this.statusFilter) {
            filtered = filtered.filter(task => task.status === this.statusFilter);
            logger.debug(`🔍 After status filter: ${filtered.length} tasks`);
        }
        // Apply search filter
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(task => {
                return task.title.toLowerCase().includes(query) ||
                    task.description.toLowerCase().includes(query) ||
                    task.labels.some(label => label.toLowerCase().includes(query));
            });
            logger.debug(`🔍 After search filter: ${filtered.length} tasks`);
        }
        this.filteredTasks = filtered;
        logger.debug(`📊 Final filtered tasks: ${this.filteredTasks.length}/${this.tasks.length}`);
        // Adjust selection if needed
        if (this.selectedIndex >= this.filteredTasks.length) {
            this.selectedIndex = Math.max(0, this.filteredTasks.length - 1);
        }
    }
    render() {
        // Clear screen and reset cursor
        process.stdout.write('\x1b[2J\x1b[H');
        const width = this.terminalWidth;
        const height = this.terminalHeight;
        if (this.editingMode) {
            this.renderEditingScreen(width, height);
        }
        else {
            // Header
            this.renderHeader(width);
            // Main content area
            if (this.showingDetails && this.filteredTasks.length > 0) {
                this.renderSplitView(width, height - 4); // -4 for header and footer
            }
            else {
                this.renderTaskList(width, height - 4);
            }
            // Footer
            this.renderFooter(width);
        }
    }
    renderHeader(width) {
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
    buildTaskList(width, height) {
        const visibleTasks = height - 2; // Leave space for borders
        const startIndex = Math.max(0, this.selectedIndex - Math.floor(visibleTasks / 2));
        const endIndex = Math.min(this.filteredTasks.length, startIndex + visibleTasks);
        // Border top
        this.renderBuffer.push('┌' + '─'.repeat(width - 2) + '┐\n');
        if (this.filteredTasks.length === 0) {
            const emptyMsg = 'No tasks found';
            const padding = Math.floor((width - emptyMsg.length - 2) / 2);
            this.renderBuffer.push('│' + ' '.repeat(padding) + emptyMsg + ' '.repeat(width - padding - emptyMsg.length - 2) + '│\n');
        }
        else {
            for (let i = 0; i < visibleTasks; i++) {
                const taskIndex = startIndex + i;
                if (taskIndex < endIndex) {
                    this.buildTaskLine(this.filteredTasks[taskIndex], taskIndex === this.selectedIndex, width - 2);
                }
                else {
                    this.renderBuffer.push('│' + ' '.repeat(width - 2) + '│\n');
                }
            }
        }
        // Border bottom
        this.renderBuffer.push('└' + '─'.repeat(width - 2) + '┘\n');
    }
    buildTaskLine(task, isSelected, width) {
        const statusIcon = this.getStatusIcon(task.status);
        const priorityIcon = this.getPriorityIcon(task.priority);
        let line = `${statusIcon} ${priorityIcon} ${task.title}`;
        // Truncate if too long
        if (line.length > width - 4) {
            line = line.substring(0, width - 7) + '...';
        }
        // Highlight if selected
        if (isSelected) {
            this.renderBuffer.push('│\x1b[7m'); // Reverse video
            this.renderBuffer.push(line.padEnd(width - 2));
            this.renderBuffer.push('\x1b[0m│\n'); // Reset
        }
        else {
            this.renderBuffer.push('│');
            this.renderBuffer.push(line.padEnd(width - 2));
            this.renderBuffer.push('│\n');
        }
    }
    buildSplitView(width, height) {
        const leftWidth = Math.floor(width * 0.4); // Give more space to details
        const rightWidth = width - leftWidth - 1; // -1 for separator
        const selectedTask = this.filteredTasks[this.selectedIndex];
        // Render task list on left, details on right
        const visibleTasks = height - 2;
        const startIndex = Math.max(0, this.selectedIndex - Math.floor(visibleTasks / 2));
        const detailLines = selectedTask ? this.getTaskDetailLines(selectedTask) : [];
        // Top border
        this.renderBuffer.push('┌' + '─'.repeat(leftWidth - 1) + '┬' + '─'.repeat(rightWidth - 1) + '┐\n');
        for (let i = 0; i < visibleTasks; i++) {
            const taskIndex = startIndex + i;
            // Left side - task list
            if (taskIndex < this.filteredTasks.length) {
                const task = this.filteredTasks[taskIndex];
                const isSelected = taskIndex === this.selectedIndex;
                this.buildSplitTaskLine(task, isSelected, leftWidth - 1);
            }
            else {
                this.renderBuffer.push('│' + ' '.repeat(leftWidth - 2));
            }
            // Separator
            this.renderBuffer.push('│');
            // Right side - task details with proper wrapping
            if (selectedTask && i < detailLines.length) {
                const detailLine = detailLines[i];
                const processedLine = this.renderDetailLineWithHighlighting(detailLine, rightWidth - 2);
                this.renderBuffer.push(processedLine.padEnd(rightWidth - 2));
            }
            else {
                this.renderBuffer.push(' '.repeat(rightWidth - 2));
            }
            this.renderBuffer.push('│\n');
        }
        // Bottom border
        this.renderBuffer.push('└' + '─'.repeat(leftWidth - 1) + '┴' + '─'.repeat(rightWidth - 1) + '┘\n');
    }
    buildSplitTaskLine(task, isSelected, width) {
        const statusIcon = this.getStatusIcon(task.status);
        const priorityIcon = this.getPriorityIcon(task.priority);
        let line = `${statusIcon} ${priorityIcon} ${task.title}`;
        if (line.length > width - 3) {
            line = line.substring(0, width - 6) + '...';
        }
        if (isSelected) {
            this.renderBuffer.push('\x1b[7m'); // Reverse video
            this.renderBuffer.push(line.padEnd(width - 1));
            this.renderBuffer.push('\x1b[0m'); // Reset
        }
        else {
            this.renderBuffer.push(line.padEnd(width - 1));
        }
    }
    getTaskDetailLines(task) {
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
    wrapText(text, maxWidth) {
        const lines = [];
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
                    }
                    else {
                        // Single word too long, just add it
                        lines.push('  ' + word);
                        currentLine = '  ';
                    }
                }
                else {
                    currentLine += (currentLine.trim() ? ' ' : '') + word;
                }
            }
            if (currentLine.trim()) {
                lines.push(currentLine);
            }
        }
        return lines;
    }
    renderDetailLineWithHighlighting(line, maxWidth) {
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
    getDisplayLength(text) {
        // Remove ANSI escape sequences to get actual display length
        return text.replace(/\x1b\[[0-9;]*m/g, '').length;
    }
    buildEditingScreen(width, height) {
        if (!this.editingTask)
            return;
        // Header
        this.renderBuffer.push('\x1b[44m'); // Blue background
        this.renderBuffer.push('\x1b[37m'); // White text
        const title = '⚙️ Editing Task';
        this.renderBuffer.push(title.padEnd(width));
        this.renderBuffer.push('\x1b[0m\n'); // Reset
        // Task info
        this.renderBuffer.push('\x1b[100m'); // Dark gray background
        this.renderBuffer.push('\x1b[37m'); // White text
        const info = `Task ID: ${this.editingTask.id}`;
        this.renderBuffer.push(info.padEnd(width));
        this.renderBuffer.push('\x1b[0m\n'); // Reset
        this.renderBuffer.push('\n');
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
                this.renderBuffer.push('\x1b[7m'); // Reverse video (highlight)
            }
            // Apply markdown highlighting to description field when not editing
            if (field.label === 'Description' && !isSelected && displayValue) {
                const highlightedValue = this.renderDetailLineWithHighlighting(displayValue, width - field.label.length - 3);
                this.renderBuffer.push(`${field.label}: ${highlightedValue}`);
            }
            else {
                this.renderBuffer.push(`${field.label}: ${displayValue}`);
            }
            if (isSelected) {
                this.renderBuffer.push('█'); // Cursor
                this.renderBuffer.push('\x1b[0m'); // Reset
            }
            this.renderBuffer.push('\n\n');
        });
        // Help text
        this.renderBuffer.push('\n');
        this.renderBuffer.push('\x1b[2m'); // Dim text
        this.renderBuffer.push('↑/↓ Switch fields  |  Type to edit  |  ENTER Save  |  ESC Cancel\n');
        if (this.editingField === 1) {
            this.renderBuffer.push('Markdown supported: **bold**, *italic*, `code`, # headers, - lists\n');
        }
        else if (this.editingField === 2) {
            this.renderBuffer.push('Priority options: critical, high, medium, low\n');
        }
        else if (this.editingField === 3) {
            this.renderBuffer.push('Status options: todo, in_progress, done, blocked, archived\n');
        }
        this.renderBuffer.push('\x1b[0m'); // Reset
    }
    buildFooter(width) {
        // Footer with keyboard shortcuts
        this.renderBuffer.push('├' + '─'.repeat(width - 2) + '┤\n');
        const shortcuts = [
            '↑/↓ Navigate  SPACE Status  TAB Details  ENTER Edit  F Filter  R Refresh  Q Quit'
        ];
        shortcuts.forEach(shortcut => {
            const padding = Math.max(0, width - shortcut.length - 2);
            const leftPad = Math.floor(padding / 2);
            const rightPad = padding - leftPad;
            this.renderBuffer.push('│');
            this.renderBuffer.push(' '.repeat(leftPad));
            this.renderBuffer.push('\x1b[2m'); // Dim text
            this.renderBuffer.push(shortcut);
            this.renderBuffer.push('\x1b[0m'); // Reset
            this.renderBuffer.push(' '.repeat(rightPad));
            this.renderBuffer.push('│\n');
        });
        this.renderBuffer.push('└' + '─'.repeat(width - 2) + '┘');
    }
    getProjectInfo() {
        // TODO: Get from ProjectDetection
        return 'critical_claude';
    }
    getStatusIcon(status) {
        const icons = {
            todo: '⭕',
            in_progress: '🟡',
            done: '✅',
            blocked: '🔴',
            archived: '📦'
        };
        return icons[status] || '❓';
    }
    getPriorityIcon(priority) {
        const icons = {
            critical: '🔥',
            high: '🔺',
            medium: '🟡',
            low: '🔽'
        };
        return icons[priority] || '❓';
    }
}
