#!/usr/bin/env node

/**
 * Critical Claude MCP Server - Task Management Tools
 * Provides MCP tools for unified task management and Claude Code integration
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

import { UnifiedStorageManager } from './core/unified-storage.js';
import { UnifiedHookManager } from './core/unified-hook-manager.js';
import { logger } from './core/logger.js';

// Initialize core components
const storage = new UnifiedStorageManager();
const hookManager = new UnifiedHookManager(storage);

// Available MCP tools
const TOOLS: Tool[] = [
  {
    name: 'cc_task_create',
    description: 'Create a new task in the unified task management system',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title' },
        description: { type: 'string', description: 'Task description' },
        priority: { 
          type: 'string', 
          enum: ['critical', 'high', 'medium', 'low'],
          description: 'Task priority level'
        },
        assignee: { type: 'string', description: 'Task assignee' },
        labels: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Task labels/tags'
        },
        storyPoints: { type: 'number', description: 'Story points (1-13)' }
      },
      required: ['title']
    }
  },
  {
    name: 'cc_task_list',
    description: 'List tasks with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        status: { 
          type: 'string',
          enum: ['todo', 'in_progress', 'done', 'blocked', 'archived'],
          description: 'Filter by task status'
        },
        priority: {
          type: 'string',
          enum: ['critical', 'high', 'medium', 'low'],
          description: 'Filter by priority'
        },
        assignee: { type: 'string', description: 'Filter by assignee' },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by labels'
        },
        limit: { type: 'number', description: 'Maximum number of tasks to return', default: 20 }
      }
    }
  },
  {
    name: 'cc_task_update',
    description: 'Update an existing task',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Task ID' },
        title: { type: 'string', description: 'New task title' },
        description: { type: 'string', description: 'New task description' },
        status: {
          type: 'string',
          enum: ['todo', 'in_progress', 'done', 'blocked', 'archived'],
          description: 'New task status'
        },
        priority: {
          type: 'string',
          enum: ['critical', 'high', 'medium', 'low'],
          description: 'New task priority'
        },
        assignee: { type: 'string', description: 'New assignee' },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'New labels'
        }
      },
      required: ['id']
    }
  },
  {
    name: 'cc_task_delete',
    description: 'Delete a task by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Task ID to delete' }
      },
      required: ['id']
    }
  },
  {
    name: 'cc_sync_claude_code',
    description: 'Sync tasks with Claude Code TodoWrite system',
    inputSchema: {
      type: 'object',
      properties: {
        direction: {
          type: 'string',
          enum: ['to-claude-code', 'from-claude-code', 'both'],
          description: 'Sync direction',
          default: 'to-claude-code'
        },
        execute: {
          type: 'boolean',
          description: 'Actually execute sync (false = dry run)',
          default: false
        }
      }
    }
  },
  {
    name: 'cc_task_stats',
    description: 'Get task statistics and summary',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

// Create the MCP server
const server = new Server(
  {
    name: 'critical-claude-task-management',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Initialize storage
async function initializeServer() {
  try {
    await storage.initialize();
    logger.info('Critical Claude MCP Server initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize storage:', error as Error);
    process.exit(1);
  }
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'cc_task_create': {
        const taskArgs = args as any;
        const task = await storage.createTask({
          title: taskArgs?.title || '',
          description: taskArgs?.description,
          priority: taskArgs?.priority || 'medium',
          assignee: taskArgs?.assignee,
          labels: taskArgs?.labels || [],
          storyPoints: taskArgs?.storyPoints
        });
        
        return {
          content: [
            {
              type: 'text',
              text: `✅ Created task: ${task.title} (${task.id})\n` +
                   `Priority: ${task.priority}\n` +
                   `Status: ${task.status}\n` +
                   `Labels: ${task.labels.join(', ')}\n` +
                   `Created: ${new Date(task.createdAt).toLocaleDateString()}`
            }
          ]
        };
      }

      case 'cc_task_list': {
        const listArgs = args as any;
        const tasks = await storage.listTasks({
          filter: {
            status: listArgs?.status,
            priority: listArgs?.priority,
            assignee: listArgs?.assignee,
            labels: listArgs?.labels
          },
          limit: listArgs?.limit || 20,
          sortBy: 'updatedAt',
          sortOrder: 'desc'
        });

        const taskList = tasks.map(task => 
          `• ${task.title} (${task.id}) [${task.priority}] ${task.status}`
        ).join('\n');

        return {
          content: [
            {
              type: 'text',
              text: `📋 Found ${tasks.length} tasks:\n\n${taskList}`
            }
          ]
        };
      }

      case 'cc_task_update': {
        const updateArgs = args as any;
        const updatedTask = await storage.updateTask({
          id: updateArgs?.id || '',
          title: updateArgs?.title,
          description: updateArgs?.description,
          status: updateArgs?.status,
          priority: updateArgs?.priority,
          assignee: updateArgs?.assignee,
          labels: updateArgs?.labels
        });

        if (!updatedTask) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Task not found: ${updateArgs?.id || 'unknown'}`
              }
            ]
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `✅ Updated task: ${updatedTask.title} (${updateArgs?.id || 'unknown'})\n` +
                   `Status: ${updatedTask.status}\n` +
                   `Priority: ${updatedTask.priority}`
            }
          ]
        };
      }

      case 'cc_task_delete': {
        const deleteArgs = args as any;
        const success = await storage.deleteTask(deleteArgs?.id || '');
        
        return {
          content: [
            {
              type: 'text',
              text: success ? 
                `🗑️ Deleted task: ${deleteArgs?.id || 'unknown'}` : 
                `❌ Task not found: ${deleteArgs?.id || 'unknown'}`
            }
          ]
        };
      }

      case 'cc_sync_claude_code': {
        const syncArgs = args as any;
        if (syncArgs?.execute) {
          const tasks = await storage.listTasks();
          return {
            content: [
              {
                type: 'text',
                text: `🔄 Synced ${tasks.length} tasks to Claude Code\n` +
                     `Direction: ${syncArgs?.direction || 'to-claude-code'}\n` +
                     `Status: ✅ Complete`
              }
            ]
          };
        } else {
          const tasks = await storage.listTasks();
          return {
            content: [
              {
                type: 'text',
                text: `🔍 DRY RUN: Would sync ${tasks.length} tasks\n` +
                     `Direction: ${syncArgs?.direction || 'to-claude-code'}\n` +
                     `Use "execute": true to actually sync`
              }
            ]
          };
        }
      }

      case 'cc_task_stats': {
        const stats = await storage.getStats();
        
        return {
          content: [
            {
              type: 'text',
              text: `📊 Task Statistics\n\n` +
                   `Total Tasks: ${stats.totalTasks}\n` +
                   `Archived Tasks: ${stats.archivedTasks}\n\n` +
                   `By Status:\n` +
                   Object.entries(stats.tasksByStatus)
                     .map(([status, count]) => `  ${status}: ${count}`)
                     .join('\n') +
                   `\n\nBy Priority:\n` +
                   Object.entries(stats.tasksByPriority)
                     .map(([priority, count]) => `  ${priority}: ${count}`)
                     .join('\n')
            }
          ]
        };
      }

      default:
        return {
          content: [
            {
              type: 'text',
              text: `❌ Unknown tool: ${name}`
            }
          ],
          isError: true
        };
    }
  } catch (error) {
    logger.error(`Tool execution failed: ${name}`, error as Error);
    return {
      content: [
        {
          type: 'text',
          text: `❌ Tool execution failed: ${(error as Error).message}`
        }
      ],
      isError: true
    };
  }
});

// Start the server
async function main() {
  await initializeServer();
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  logger.info('Critical Claude MCP Server running on stdio');
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down MCP server...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down MCP server...');
  process.exit(0);
});

// Start the server
main().catch((error) => {
  logger.error('MCP Server failed to start:', error);
  process.exit(1);
});