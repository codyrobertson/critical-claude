/**
 * Critical Claude Backlog Integration - Unified Task Management
 * Single entry point for all task management functionality
 */
// Unified task management system
export { UnifiedStorageManager } from './core/unified-storage.js';
export { UnifiedTaskCommand } from './cli/commands/unified-task.js';
export { UnifiedHookManager } from './core/unified-hook-manager.js';
// Core utilities
export { logger } from './core/logger.js';
// Main CLI entry
export { initializeCLI } from './cli/cc-main.js';
//# sourceMappingURL=index.js.map