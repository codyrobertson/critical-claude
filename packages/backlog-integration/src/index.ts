/**
 * Critical Claude Backlog Integration
 * AI-powered AGILE task management with Critical Claude MCP tools
 */

export * from './types/agile.js';
export * from './core/critical-claude-client.js';

// Re-export core Critical Claude functionality
export { logger } from '@critical-claude/core';
export { SystemDesignServer } from '@critical-claude/system-design';
export { DataFlowServer } from '@critical-claude/data-flow';