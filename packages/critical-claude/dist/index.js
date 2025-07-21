/**
 * Critical Claude - Production-ready Task Management with Unified Claude Code Integration
 * Single entry point for unified hook system and task management functionality
 */
// Core unified task management system
export { UnifiedStorageManager } from './core/unified-storage.js';
export { UnifiedHookManager } from './core/unified-hook-manager.js';
// CLI components
export { UnifiedTaskCommand } from './cli/commands/unified-task.js';
export { initializeCLI } from './cli/cc-main.js';
// AI and client services
export { CriticalClaudeClient } from './core/critical-claude-client.js';
export { AIService } from './core/ai-service.js';
// Utilities
export { logger } from './core/logger.js';
//# sourceMappingURL=index.js.map