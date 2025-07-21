/**
 * Critical Claude - Production-ready Task Management with Unified Claude Code Integration
 * Single entry point for unified hook system and task management functionality
 */
export { UnifiedStorageManager } from './core/unified-storage.js';
export { UnifiedHookManager } from './core/unified-hook-manager.js';
export { UnifiedTaskCommand } from './cli/commands/unified-task.js';
export { initializeCLI } from './cli/cc-main.js';
export { CriticalClaudeClient } from './core/critical-claude-client.js';
export { AIService } from './core/ai-service.js';
export { CommonTask, CreateTaskInput, UpdateTaskInput, TaskFilter, TaskListOptions } from './types/common-task.js';
export { logger } from './core/logger.js';
//# sourceMappingURL=index.d.ts.map