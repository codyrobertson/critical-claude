/**
 * Critical Claude Backlog Integration - Unified Task Management
 * Single entry point for all task management functionality
 */
export { UnifiedStorageManager } from './core/unified-storage.js';
export { UnifiedTaskCommand } from './cli/commands/unified-task.js';
export { UnifiedHookManager } from './core/unified-hook-manager.js';
export { CommonTask, CreateTaskInput, UpdateTaskInput, TaskFilter, TaskListOptions } from './types/common-task.js';
export { logger } from './core/logger.js';
export { initializeCLI } from './cli/cc-main.js';
//# sourceMappingURL=index.d.ts.map