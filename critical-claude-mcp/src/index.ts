#!/usr/bin/env node

/**
 * Critical Claude MCP Server
 * Pragmatic code review with critical analysis - context matters!
 *
 * Mission: Identify REAL problems that affect users, not theoretical violations
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { CodebaseExplorer } from './codebase-explorer.js';
import { PathValidator } from './path-validator.js';
import { logger } from './logger.js';
import { Semaphore } from './semaphore.js';
import { BrutalPlanEngine } from './brutal-plan-engine.js';
import { SecurityAnalyzer } from './security-analyzer.js';
import { PragmaticCritiqueEngine } from './pragmatic-critique-engine.js';
import { ArchitectureAnalyzer } from './architecture-analyzer.js';
import { PerformanceAnalyzer } from './performance-analyzer.js';
import { ResourceManager } from './resource-manager.js';
import { InputValidator } from './input-validator.js';
import { ErrorHandler } from './error-handler.js';
import { WebSearchTool } from './tools/web-search.js';
import { InitWizard } from './tools/init-wizard.js';
import { PromptManager } from './tools/prompt-manager.js';
import { SetupWizard } from './tools/setup-wizard.js';
import { TaskManager } from './tools/task-manager.js';
import { ProjectInitializer } from './tools/project-initializer.js';
import { GlobalInstaller } from './tools/global-installer.js';
import { StatefulTaskQueue } from './tools/stateful-task-queue.js';
import { EnhancedHookSystem } from './tools/enhanced-hook-system.js';
import { MarkdownTaskManager } from './tools/markdown-task-manager.js';
import { TaskCLI } from './tools/task-cli.js';
import { AITaskEngine } from './tools/ai-task-engine.js';
import { getConfig } from './config-loader.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Import new service packages
import { SystemDesignServer } from '@critical-claude/system-design';
import { DataFlowServer } from '@critical-claude/data-flow';

// Backlog integration will be dynamically imported if available
let BacklogIntegrationServer: any = null;

/**
 * System context types
 */
type SystemType = 'cli' | 'web-small' | 'web-large' | 'library' | 'enterprise' | 'unknown';

/**
 * Pragmatic severity levels based on actual impact
 */
type IssueSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'THEORETICAL';

/**
 * Issue categories for analysis
 */
type IssueCategory = 'SECURITY' | 'PERFORMANCE' | 'ARCHITECTURE' | 'QUALITY' | 'OVER_ENGINEERING';

/**
 * Code issue representation
 */
type CodeIssue = {
  type: IssueCategory;
  severity: IssueSeverity;
  location: {
    file: string;
    lines: number[];
  };
  critical_feedback: string;
  actual_impact: string;
  fix?: {
    description: string;
    working_code: string;
    complexity: 'simple' | 'moderate' | 'complex';
    roi: 'high' | 'medium' | 'low';
  };
};

/**
 * Pragmatic critique result
 */
type CritiqueResult = {
  system_context: SystemType;
  deployment_verdict: 'BLOCKED' | 'CONDITIONAL' | 'APPROVED';
  critical_count: number;
  high_count: number;
  issues: CodeIssue[];
  good_decisions: string[];
  over_engineering_risks: string[];
  action_plan: {
    immediate: string[];
    next_sprint: string[];
    nice_to_have: string[];
    avoid: string[];
  };
};

// PragmaticCritiqueEngine has been extracted to pragmatic-critique-engine.ts
// Global instances - will be initialized after config is loaded
let pragmaticEngine: PragmaticCritiqueEngine;
let webSearchTool: WebSearchTool;
const codebaseExplorer = new CodebaseExplorer();

// Initialize service packages
const systemDesignServer = new SystemDesignServer();
const dataFlowServer = new DataFlowServer();
let backlogServer: any = null;

// Initialize new tools
let setupWizard: SetupWizard;
let taskManager: TaskManager;
let projectInitializer: ProjectInitializer;
let globalInstaller: GlobalInstaller;
let mainTaskQueue: StatefulTaskQueue;
let enhancedHookSystem: EnhancedHookSystem;
let markdownTaskManager: MarkdownTaskManager;
let taskCLI: TaskCLI;
let aiTaskEngine: AITaskEngine;

// Initialize tools with configuration
async function initializeTools() {
  try {
    const config = await getConfig();
    
    // Initialize web search tool with config
    webSearchTool = new WebSearchTool({
      enabled: config.web_search?.enabled ?? false,
      searchDepth: config.web_search?.search_depth ?? 'basic'
    });
    
    // Initialize pragmatic engine with web search tool
    pragmaticEngine = new PragmaticCritiqueEngine(webSearchTool);
    
    // Initialize new tools
    setupWizard = new SetupWizard(config);
    taskManager = new TaskManager(config);
    projectInitializer = new ProjectInitializer(config);
    globalInstaller = new GlobalInstaller();
    
    // Initialize stateful task queue with Claude Code integration
    mainTaskQueue = new StatefulTaskQueue('main', {
      enableHooks: true,
      syncWithClaudeCode: true,
      autoSave: true
    });
    await mainTaskQueue.initialize();

    // Initialize markdown task manager for Backlog.md-style task management
    markdownTaskManager = new MarkdownTaskManager(process.cwd(), {
      backlogDir: 'critical-claude',
      autoCommit: false,
      defaultStatus: 'To Do'
    });
    await markdownTaskManager.initialize();

    // Initialize enhanced hook system with tight integration and AI capabilities
    enhancedHookSystem = new EnhancedHookSystem(mainTaskQueue, markdownTaskManager);
    await enhancedHookSystem.initialize();

    // Initialize task CLI with markdown task manager
    taskCLI = new TaskCLI(markdownTaskManager);

    // Initialize AI task engine
    aiTaskEngine = new AITaskEngine(markdownTaskManager);
    
    // Backlog integration is optional and will be loaded at runtime if available
    // For now, leaving as null - will be implemented when backlog package is ready
    
    logger.info('Tools initialized with configuration', {
      webSearchEnabled: config.web_search?.enabled ?? false,
      backlogIntegrationAvailable: !!BacklogIntegrationServer
    });
  } catch (error) {
    logger.warn('Failed to load config, using defaults', error as Error);
    
    // Initialize with defaults
    webSearchTool = new WebSearchTool({ enabled: false });
    pragmaticEngine = new PragmaticCritiqueEngine(webSearchTool);
    setupWizard = new SetupWizard({});
    taskManager = new TaskManager({});
    projectInitializer = new ProjectInitializer({});
  }
}

// Initialize tools on startup
await initializeTools();

/**
 * Create an MCP server with critical code analysis and planning
 */
const server = new Server(
  {
    name: 'Critical Claude MCP Server',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

/**
 * Handler for listing available resources.
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'critical-claude://pragmatic-philosophy',
        mimeType: 'text/markdown',
        name: 'Critical Code Review Philosophy',
        description: 'Working code beats perfect code in refactoring hell',
      },
      {
        uri: 'critical-claude://context-guide',
        mimeType: 'text/markdown',
        name: 'Context-Aware Critical Analysis Guide',
        description: 'Different systems need different architecture',
      },
      {
        uri: 'critical-claude://anti-patterns',
        mimeType: 'text/markdown',
        name: 'Over-Engineering Anti-Patterns',
        description: 'When NOT to apply enterprise patterns',
      },
    ],
  };
});

/**
 * Handler for reading critique resources.
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const url = new URL(request.params.uri);
  const resourceId = url.pathname.replace(/^\//, '');

  let content = '';

  switch (resourceId) {
    case 'pragmatic-philosophy':
      content = `# Pragmatic Code Review Philosophy

## Core Principles

1. **Working code in production beats perfect code in refactoring hell**
2. **Context matters - a CLI tool isn't a distributed system**
3. **Simple solutions often outlast clever abstractions**
4. **Today's over-engineering is tomorrow's technical debt**
5. **If tests pass and users are happy, think twice before refactoring**

## Real Problems vs Theoretical Issues

### 🔴 CRITICAL REAL PROBLEMS (Fix Immediately)
- Crashes, hangs, or data loss
- Security vulnerabilities with exploit paths
- Features that don't work as advertised
- Performance so bad the system is unusable

### ❌ THEORETICAL PROBLEMS (Usually Ignore)
- "Violates SOLID principles" in working code
- "Should use dependency injection" for stable classes
- "God object anti-pattern" for practical service classes
- "Singleton abuse" in CLI tools (they're process-scoped!)

## Questions Before Any Major Change

1. What specific problem does this solve?
2. Who is experiencing this problem?
3. What's the simplest fix that works?
4. What could break if we change this?
5. Is the cure worse than the disease?`;
      break;

    case 'context-guide':
      content = `# Context-Aware Architecture Guide

## CLI Tools & Scripts
**Good Architecture:**
- Simple, direct service calls
- Singletons for process-scoped resources
- Straightforward error handling

**Avoid Over-Architecting:**
- Don't add DI containers
- Don't create interfaces with single implementations
- Don't apply microservice patterns

## Small Web Applications (<10k users)
**Focus On:**
- Basic security (auth, input validation)
- Reasonable performance (sub-second responses)
- Simple deployment

**Don't Prematurely Optimize:**
- Complex caching layers
- Microservice splits
- Event sourcing
- CQRS patterns

## Large Systems (>100k users)
**Now Consider:**
- Horizontal scaling patterns
- Cache strategies
- Service boundaries
- Performance optimization`;
      break;

    case 'anti-patterns':
      content = `# Over-Engineering Anti-Patterns

## Premature Abstraction
❌ Interface for single implementation
❌ Factory for simple object creation
❌ Strategy pattern for 2-3 options

## Architecture Astronauts
❌ Microservices for small apps
❌ Event sourcing without event requirements
❌ DI containers in CLI tools
❌ CQRS for simple CRUD

## When Patterns Actually Help

✅ Strategy Pattern - When you have 5+ strategies
✅ Factory Pattern - When creation is complex
✅ Microservices - When teams can't coordinate deploys
✅ Event Sourcing - When audit trail is legally required

Remember: YAGNI - You Aren't Gonna Need It`;
      break;

    default:
      throw new Error(`Resource ${resourceId} not found`);
  }

  return {
    contents: [
      {
        uri: request.params.uri,
        mimeType: 'text/markdown',
        text: content,
      },
    ],
  };
});

/**
 * Handler that lists available tools.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  // Get tools from service packages
  const systemDesignTools = systemDesignServer.getTools();
  const dataFlowTools = dataFlowServer.getTools();
  const backlogTools = backlogServer ? backlogServer.getTools() : [];
  
  return {
    tools: [
      {
        name: 'cc_crit_code',
        description: 'Critical code review that identifies REAL problems, not theoretical issues',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'The source code to analyze',
            },
            filename: {
              type: 'string',
              description: 'Name of the file being analyzed (helps determine context)',
            },
            filePath: {
              type: 'string',
              description: 'Path to the file to analyze (alternative to providing code directly)',
            },
          },
          required: [],
        },
      },
      {
        name: 'cc_crit_arch',
        description: 'Architecture review that matches patterns to problem size',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'The source code to analyze',
            },
            filename: {
              type: 'string',
              description: 'Name of the file being analyzed',
            },
            filePath: {
              type: 'string',
              description: 'Path to the file to analyze (alternative to providing code directly)',
            },
            context: {
              type: 'object',
              description: 'Additional context about the system',
              properties: {
                user_count: {
                  type: 'number',
                  description: 'Current number of users',
                },
                team_size: {
                  type: 'number',
                  description: 'Development team size',
                },
                current_problems: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Actual problems being experienced',
                },
              },
            },
          },
          required: [],
        },
      },
      {
        name: 'cc_crit_explore',
        description:
          'Explores entire codebase structure to understand architecture and identify patterns',
        inputSchema: {
          type: 'object',
          properties: {
            rootPath: {
              type: 'string',
              description: 'Root directory path of the codebase to explore',
            },
          },
          required: ['rootPath'],
        },
      },
      {
        name: 'cc_plan_arch',
        description:
          'Creates a critical but pragmatic architectural improvement plan based on codebase analysis',
        inputSchema: {
          type: 'object',
          properties: {
            rootPath: {
              type: 'string',
              description: 'Root directory path of the codebase',
            },
            includeAnalysis: {
              type: 'boolean',
              description: 'Whether to run full analysis on key files',
              default: true,
            },
          },
          required: ['rootPath'],
        },
      },
      {
        name: 'cc_plan_timeline',
        description:
          'Generate critical reality-based project plans from natural language. Say things like "I want to build X" or "Here\'s my PRD, make me a plan" or "Based on this requirements doc, give me a timeline"',
        inputSchema: {
          type: 'object',
          properties: {
            input: {
              type: 'string',
              description:
                'Natural language description of what you want to build. Can be a simple request like "user authentication system", a detailed requirements document, a PRD, or any project description. The tool will intelligently extract requirements and generate a realistic plan.',
            },
            estimatedDays: {
              type: 'number',
              description:
                'Your optimistic estimate in days (optional - tool will estimate if not provided)',
            },
            context: {
              type: 'object',
              description: 'Additional context (all optional)',
              properties: {
                teamSize: {
                  type: 'number',
                  description: 'Number of developers',
                },
                hasDeadline: {
                  type: 'boolean',
                  description: 'Is there a hard deadline?',
                },
                techStack: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Technology stack being used',
                },
              },
            },
          },
          required: ['input'],
        },
      },
      {
        name: 'cc_init_project',
        description: 'Initialize Critical Claude for a project with tailored configuration and commands',
        inputSchema: {
          type: 'object',
          properties: {
            projectName: {
              type: 'string',
              description: 'Project name (optional, defaults to directory name)',
            },
          },
        },
      },
      {
        name: 'cc_prompt_mgmt',
        description: 'Manage developer prompt templates for code review and analysis',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['list', 'get', 'add', 'update', 'delete', 'render', 'search', 'export', 'import'],
              description: 'Action to perform on prompt templates',
            },
            id: {
              type: 'string',
              description: 'Prompt template ID (for get, update, delete, render actions)',
            },
            category: {
              type: 'string',
              enum: ['security', 'performance', 'architecture', 'code-review', 'debugging', 'refactoring', 'testing', 'documentation', 'custom'],
              description: 'Prompt category filter (for list, add actions)',
            },
            prompt: {
              type: 'object',
              description: 'Prompt template data (for add, update actions)',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                template: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
              },
            },
            variables: {
              type: 'object',
              description: 'Template variables for rendering (for render action)',
            },
            query: {
              type: 'string',
              description: 'Search query (for search action)',
            },
            filePath: {
              type: 'string',
              description: 'File path for export/import operations',
            },
            overwrite: {
              type: 'boolean',
              description: 'Overwrite existing prompts during import (default: false)',
            },
          },
          required: ['action'],
        },
      },
      {
        name: 'cc_setup_wizard',
        description: 'Automated setup wizard for Critical Claude + Claude Desktop integration',
        inputSchema: {
          type: 'object',
          properties: {
            installationType: {
              type: 'string',
              enum: ['basic', 'advanced', 'development'],
              description: 'Type of installation to perform',
              default: 'basic'
            },
            claudeDesktopConfigPath: {
              type: 'string',
              description: 'Path to Claude Desktop config (auto-detected if not provided)'
            },
            projectPath: {
              type: 'string',
              description: 'Project path to configure (defaults to current directory)'
            },
            enableHooks: {
              type: 'boolean',
              description: 'Enable Claude Code hook integration (experimental)',
              default: false
            },
            setupAliases: {
              type: 'boolean',
              description: 'Set up global command aliases',
              default: true
            }
          },
          required: []
        }
      },
      {
        name: 'cc_task_manage',
        description: 'Advanced stateful task management with dependency tracking and Claude Code integration',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['list', 'create', 'update', 'delete', 'sync', 'status', 'comment', 'dependencies', 'stats'],
              description: 'Task management action to perform'
            },
            taskData: {
              type: 'object',
              description: 'Task data for create/update operations',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'blocked'] },
                assignee: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                dueDate: { type: 'string' }
              }
            },
            filters: {
              type: 'object',
              description: 'Filters for list operations',
              properties: {
                status: { type: 'string' },
                priority: { type: 'string' },
                assignee: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } }
              }
            },
            syncDirection: {
              type: 'string',
              enum: ['to_claude', 'from_claude', 'bidirectional'],
              description: 'Direction for sync operations',
              default: 'bidirectional'
            }
          },
          required: ['action']
        }
      },
      {
        name: 'cc_project_setup',
        description: 'Complete project setup with Critical Claude integration',
        inputSchema: {
          type: 'object',
          properties: {
            projectType: {
              type: 'string',
              enum: ['web-app', 'api', 'cli', 'library', 'mobile-app', 'desktop-app'],
              description: 'Type of project to set up'
            },
            framework: {
              type: 'string',
              description: 'Framework being used (React, Express, etc.)'
            },
            language: {
              type: 'string',
              enum: ['javascript', 'typescript', 'python', 'go', 'rust', 'java'],
              description: 'Primary programming language'
            },
            includeTemplates: {
              type: 'boolean',
              description: 'Include code templates and examples',
              default: true
            },
            setupCI: {
              type: 'boolean',
              description: 'Set up CI/CD configuration',
              default: false
            },
            setupTesting: {
              type: 'boolean',
              description: 'Set up testing framework',
              default: true
            }
          },
          required: ['projectType']
        }
      },
      {
        name: 'cc_status_check',
        description: 'System health and configuration verification',
        inputSchema: {
          type: 'object',
          properties: {
            checkType: {
              type: 'string',
              enum: ['full', 'mcp', 'hooks', 'config', 'tasks'],
              description: 'Type of status check to perform',
              default: 'full'
            },
            verbose: {
              type: 'boolean',
              description: 'Show detailed information',
              default: false
            }
          },
          required: []
        }
      },
      {
        name: 'cc_hook_system',
        description: 'Manage Enhanced Hook System for real-time editor integration',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['status', 'enable', 'disable', 'configure', 'test', 'logs', 'install_hooks', 'live_logs', 'export_logs', 'stream_logs'],
              description: 'Action to perform on hook system'
            },
            hookType: {
              type: 'string',
              enum: ['claude_code', 'vscode', 'cursor', 'universal'],
              description: 'Type of hook integration to configure'
            },
            config: {
              type: 'object',
              description: 'Hook configuration settings',
              properties: {
                enabled: { type: 'boolean' },
                visual_feedback: { type: 'boolean' },
                instant_sync: { type: 'boolean' },
                response_timeout_ms: { type: 'number' }
              }
            },
            logOptions: {
              type: 'object',
              description: 'Options for log operations',
              properties: {
                limit: { type: 'number' },
                since: { type: 'string' },
                toolFilter: { type: 'string' },
                sessionFilter: { type: 'string' },
                format: { type: 'string', enum: ['json', 'csv', 'markdown'] },
                outputPath: { type: 'string' }
              }
            }
          },
          required: ['action']
        }
      },
      {
        name: 'cc_process_hook',
        description: 'Process a hook event from Claude Code or other editors',
        inputSchema: {
          type: 'object',
          properties: {
            tool_name: {
              type: 'string',
              description: 'Name of the tool that triggered the hook (e.g., TodoWrite, Edit)'
            },
            arguments: {
              type: 'object',
              description: 'Tool arguments that were passed'
            },
            file_path: {
              type: 'string',
              description: 'File path if applicable'
            },
            content: {
              type: 'string',
              description: 'File content or other relevant data'
            },
            session_id: {
              type: 'string',
              description: 'Session identifier for tracking'
            }
          },
          required: ['tool_name']
        }
      },
      {
        name: 'cc_alias_setup',
        description: 'Configure global command aliases and shortcuts',
        inputSchema: {
          type: 'object',
          properties: {
            shell: {
              type: 'string',
              enum: ['bash', 'zsh', 'fish', 'auto'],
              description: 'Target shell for alias setup',
              default: 'auto'
            },
            aliases: {
              type: 'object',
              description: 'Custom aliases to set up',
              additionalProperties: { type: 'string' }
            },
            global: {
              type: 'boolean',
              description: 'Set up global aliases vs project-specific',
              default: true
            }
          },
          required: []
        }
      },
      {
        name: 'cc_install_global',
        description: 'Install Critical Claude globally with complete system integration',
        inputSchema: {
          type: 'object',
          properties: {
            installLocation: {
              type: 'string',
              description: 'Custom installation location (optional)'
            },
            createGlobalCommand: {
              type: 'boolean',
              description: 'Create global "critical-claude" command',
              default: true
            },
            setupClaudeDesktop: {
              type: 'boolean',
              description: 'Configure Claude Desktop MCP integration',
              default: true
            },
            enableHooks: {
              type: 'boolean',
              description: 'Enable experimental hook system',
              default: false
            },
            setupAliases: {
              type: 'boolean',
              description: 'Create shell aliases (cc, ccrit, etc.)',
              default: true
            },
            verbose: {
              type: 'boolean',
              description: 'Show detailed installation progress',
              default: false
            }
          },
          required: []
        }
      },
      {
        name: 'cc_queue_advanced',
        description: 'Advanced task queue operations with dependencies and state management',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['create_queue', 'list_queues', 'queue_stats', 'dependency_graph', 'bulk_update', 'export', 'import'],
              description: 'Advanced queue operation to perform'
            },
            queueName: {
              type: 'string',
              description: 'Name of the queue to operate on'
            },
            taskIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of task IDs for bulk operations'
            },
            updates: {
              type: 'object',
              description: 'Updates to apply in bulk operations'
            },
            exportFormat: {
              type: 'string',
              enum: ['json', 'csv', 'markdown'],
              description: 'Export format for queue data',
              default: 'json'
            }
          },
          required: ['action']
        }
      },
      {
        name: 'cc_hook_system',
        description: 'Manage Critical Claude hook system for real-time integrations',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['status', 'enable', 'disable', 'configure', 'test', 'logs'],
              description: 'Hook system action to perform'
            },
            hookType: {
              type: 'string',
              enum: ['claude_code', 'vscode', 'cursor', 'universal'],
              description: 'Type of hook to manage'
            },
            config: {
              type: 'object',
              description: 'Hook configuration data',
              properties: {
                events: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Events to listen for'
                },
                actions: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Actions to trigger'
                },
                visualFeedback: {
                  type: 'boolean',
                  description: 'Show visual feedback for hook events'
                }
              }
            }
          },
          required: ['action']
        }
      },
      {
        name: 'cc_task',
        description: 'AI-powered task management with markdown files, automatic dependencies, and intelligent task generation',
        inputSchema: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              enum: [
                'init', 'task.create', 'task.list', 'task.view', 'task.edit', 'task.archive', 
                'board.view', 'board.export', 'ai.create', 'ai.expand', 'ai.dependencies', 
                'ai.from-file', 'ai.from-text', 'plan.generate'
              ],
              description: 'Task management command to execute'
            },
            title: {
              type: 'string',
              description: 'Task title (for task.create)'
            },
            description: {
              type: 'string',
              description: 'Task description'
            },
            status: {
              type: 'string',
              enum: ['To Do', 'In Progress', 'Done', 'Blocked'],
              description: 'Task status'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              description: 'Task priority'
            },
            assignee: {
              type: 'string',
              description: 'Task assignee'
            },
            labels: {
              type: 'string',
              description: 'Comma-separated labels'
            },
            parent: {
              type: 'string',
              description: 'Parent task ID'
            },
            dependencies: {
              type: 'string',
              description: 'Comma-separated dependency task IDs'
            },
            plan: {
              type: 'string',
              description: 'Implementation plan'
            },
            acceptanceCriteria: {
              type: 'string',
              description: 'Comma-separated acceptance criteria'
            },
            notes: {
              type: 'string',
              description: 'Additional notes'
            },
            draft: {
              type: 'boolean',
              description: 'Create as draft task'
            },
            id: {
              type: 'string',
              description: 'Task ID (for view, edit, archive)'
            },
            plain: {
              type: 'boolean',
              description: 'Plain text output for AI processing',
              default: false
            },
            outputPath: {
              type: 'string',
              description: 'Output path for board export'
            },
            force: {
              type: 'boolean',
              description: 'Force overwrite for board export'
            },
            includeDrafts: {
              type: 'boolean',
              description: 'Include draft tasks in list'
            },
            filePath: {
              type: 'string',
              description: 'Path to file for ai.from-file command (PRD, requirements, etc.)'
            },
            text: {
              type: 'string', 
              description: 'Text content for ai.from-text or ai.create commands'
            },
            prompt: {
              type: 'string',
              description: 'AI prompt for task generation or expansion'
            },
            parentId: {
              type: 'string',
              description: 'Parent task ID for subtask creation'
            },
            autoGenerateDependencies: {
              type: 'boolean',
              description: 'Automatically detect and create task dependencies',
              default: true
            },
            expandLevel: {
              type: 'number',
              description: 'Depth level for subtask expansion (1-3)',
              default: 2
            },
            projectContext: {
              type: 'string',
              description: 'Project context for AI task generation'
            }
          },
          required: ['command']
        }
      },
      // Add tools from service packages
      ...systemDesignTools,
      ...dataFlowTools,
      ...backlogTools,
    ],
  };
});

/**
 * Handler for pragmatic code critique tools.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case 'cc_crit_code': {
      let code: string;
      let filename: string;
      
      // Check if filePath is provided
      if (request.params.arguments?.filePath) {
        const filePath = String(request.params.arguments.filePath);
        
        // Validate file path
        if (!PathValidator.isSafeToRead(filePath, process.cwd())) {
          throw new Error('File path is not safe to read');
        }
        
        try {
          code = await fs.readFile(filePath, 'utf8');
          filename = path.basename(filePath);
        } catch (error) {
          throw new Error(`Failed to read file: ${(error as Error).message}`);
        }
      } else {
        // Use provided code and filename
        const codeValidation = InputValidator.validateCode(request.params.arguments?.code);
        const filenameValidation = InputValidator.validateFilename(request.params.arguments?.filename || 'unknown.js');

        if (!codeValidation.valid) {
          throw new Error(`Invalid code: ${codeValidation.errors.join(', ')}`);
        }
        if (!filenameValidation.valid) {
          throw new Error(`Invalid filename: ${filenameValidation.errors.join(', ')}`);
        }

        code = codeValidation.sanitized!;
        filename = filenameValidation.sanitized!;
      }

      // Use error boundary
      const analyzeWithErrorHandling = ErrorHandler.wrapAsync(
        pragmaticEngine.analyzeCode.bind(pragmaticEngine),
        'cc_crit_code'
      );

      const result = await analyzeWithErrorHandling(code, filename);
      const formattedOutput = pragmaticEngine.formatPragmaticFeedback(result);

      return {
        content: [
          {
            type: 'text',
            text: formattedOutput,
          },
        ],
      };
    }

    case 'cc_crit_arch': {
      let code: string;
      let filename: string;
      const context = (request.params.arguments?.context as any) || {};
      
      // Check if filePath is provided
      if (request.params.arguments?.filePath) {
        const filePath = String(request.params.arguments.filePath);
        
        // Validate file path
        if (!PathValidator.isSafeToRead(filePath, process.cwd())) {
          throw new Error('File path is not safe to read');
        }
        
        try {
          code = await fs.readFile(filePath, 'utf8');
          filename = path.basename(filePath);
        } catch (error) {
          throw new Error(`Failed to read file: ${(error as Error).message}`);
        }
      } else {
        // Use provided code and filename
        code = String(request.params.arguments?.code || '');
        filename = String(request.params.arguments?.filename || 'unknown.js');

        if (!code) {
          throw new Error('Code or filePath is required for architecture review');
        }
      }

      // Use the same engine but focus on architecture
      const result = await pragmaticEngine.analyzeCode(code, filename);

      // Add context-specific insights
      let contextInsights = '\n\n🎯 CONTEXT-SPECIFIC INSIGHTS:\n';
      if (context.user_count) {
        contextInsights += `Current scale: ${context.user_count} users\n`;
        if (context.user_count < 1000) {
          contextInsights += '→ Focus on shipping features, not premature scaling\n';
        }
      }
      if (context.team_size) {
        contextInsights += `Team size: ${context.team_size} developers\n`;
        if (context.team_size < 5) {
          contextInsights += '→ Keep architecture simple - small team advantage\n';
        }
      }
      if (context.current_problems?.length > 0) {
        contextInsights += `Actual problems: ${context.current_problems.join(', ')}\n`;
        contextInsights += '→ Fix these real issues before theoretical ones\n';
      }

      const formattedOutput = pragmaticEngine.formatPragmaticFeedback(result) + contextInsights;

      return {
        content: [
          {
            type: 'text',
            text: formattedOutput,
          },
        ],
      };
    }

    case 'cc_crit_explore': {
      const rootPath = String(request.params.arguments?.rootPath || '');

      if (!rootPath) {
        logger.error('Missing root path parameter');
        throw new Error(
          'Root path is required for codebase exploration. Please provide a valid directory path.'
        );
      }

      logger.info('Starting codebase exploration', { rootPath });

      try {
        const structure = await codebaseExplorer.exploreCodebase(rootPath);

        let output = '🔍 CODEBASE STRUCTURE ANALYSIS 🔍\n';
        output +=
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

        output += `📁 Root: ${structure.rootPath}\n`;
        output += `📊 Total Files: ${structure.totalFiles}\n`;
        output += `💾 Total Size: ${(structure.totalSize / 1024 / 1024).toFixed(2)} MB\n`;
        output += `🔤 Main Languages: ${structure.mainLanguages.join(', ')}\n`;
        output += `🚀 Frameworks: ${structure.frameworkIndicators.join(', ') || 'None detected'}\n`;
        output += `🏗️  Architecture Patterns: ${structure.architecturePatterns.join(', ') || 'None detected'}\n\n`;

        output += '📊 FILE DISTRIBUTION:\n';
        output +=
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';

        const sortedTypes = Array.from(structure.filesByType.entries())
          .sort((a, b) => b[1].length - a[1].length)
          .slice(0, 10);

        sortedTypes.forEach(([ext, files]) => {
          output += `${ext}: ${files.length} files\n`;
        });

        output += '\n📁 KEY DIRECTORIES:\n';
        output +=
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';

        const keyDirs = structure.directories
          .filter((d) => d.fileCount > 5)
          .sort((a, b) => b.fileCount - a.fileCount)
          .slice(0, 10);

        keyDirs.forEach((dir) => {
          const relPath = dir.path.replace(structure.rootPath, '.');
          output += `${relPath}: ${dir.fileCount} files, ${(dir.totalSize / 1024).toFixed(1)} KB\n`;
        });

        logger.info('Codebase exploration completed successfully', {
          totalFiles: structure.totalFiles,
        });

        return {
          content: [
            {
              type: 'text',
              text: output,
            },
          ],
        };
      } catch (error) {
        logger.error('Codebase exploration failed', { rootPath }, error as Error);
        throw new Error(`Failed to explore codebase: ${(error as Error).message}`);
      }
    }

    case 'cc_plan_arch': {
      const rootPath = String(request.params.arguments?.rootPath || '');
      const includeAnalysis = request.params.arguments?.includeAnalysis !== false;

      if (!rootPath) {
        throw new Error('Root path is required for creating an architectural plan');
      }

      const structure = await codebaseExplorer.exploreCodebase(rootPath);

      // If includeAnalysis is true, analyze some key files with resource protection
      const issues: any[] = [];
      if (includeAnalysis && structure.filesByType.get('.ts')?.length) {
        logger.info('Analyzing key TypeScript files for issues');

        // Resource protection constants
        const MAX_CONCURRENT_ANALYSIS = 2;
        const MAX_FILE_SIZE_FOR_ANALYSIS = 1024 * 1024; // 1MB
        const MAX_FILES_TO_ANALYZE = 5;

        const analysisSemaphore = new Semaphore(MAX_CONCURRENT_ANALYSIS);

        // Analyze a sample of TypeScript files with controlled concurrency
        const tsFiles = structure.filesByType.get('.ts')!.slice(0, MAX_FILES_TO_ANALYZE);
        const analysisPromises = tsFiles.map(async (file) => {
          return analysisSemaphore.acquire(async () => {
            try {
              // Validate file is safe to read
              if (!PathValidator.isSafeToRead(file.path, structure.rootPath)) {
                logger.warn('Skipping unsafe file path', { path: file.path });
                return [];
              }

              // Check file size before reading to prevent memory exhaustion
              const stats = await fs.stat(file.path);
              if (stats.size > MAX_FILE_SIZE_FOR_ANALYSIS) {
                logger.warn('File too large for analysis, skipping', {
                  path: file.path,
                  size: stats.size,
                  maxSize: MAX_FILE_SIZE_FOR_ANALYSIS,
                });
                return [];
              }

              const code = await fs.readFile(file.path, 'utf8');
              const result = await pragmaticEngine.analyzeCode(code, file.path);
              logger.debug('File analysis completed', {
                file: file.path,
                issueCount: result.issues.length,
                concurrentOps: MAX_CONCURRENT_ANALYSIS - analysisSemaphore.availablePermits,
              });
              return result.issues;
            } catch (error) {
              logger.warn('Failed to analyze file', {
                path: file.path,
                error: (error as Error).message,
              });
              return [];
            }
          });
        });

        const allIssues = await Promise.all(analysisPromises);
        issues.push(...allIssues.flat());

        logger.info('Analysis completed', {
          filesAnalyzed: tsFiles.length,
          totalIssues: issues.length,
          maxConcurrency: MAX_CONCURRENT_ANALYSIS,
          maxFileSize: MAX_FILE_SIZE_FOR_ANALYSIS,
        });
      }

      const plan = await codebaseExplorer.createCriticalPlan(structure, issues);

      let output = '🔥 CRITICAL ARCHITECTURAL PLAN 🔥\n';
      output +=
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

      output += `📋 ${plan.title}\n\n`;

      output += '💪 CURRENT STRENGTHS:\n';
      plan.currentState.strengths.forEach((s) => (output += `✅ ${s}\n`));

      output += '\n⚠️  CURRENT WEAKNESSES:\n';
      plan.currentState.weaknesses.forEach((w) => (output += `❌ ${w}\n`));

      output += '\n🚨 RISKS:\n';
      plan.currentState.risks.forEach((r) => (output += `💀 ${r}\n`));

      output += '\n📋 RECOMMENDATIONS:\n';
      output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';

      output += '\n🔥 IMMEDIATE (Do This Week):\n';
      output += `⏱️  Estimated Effort: ${plan.estimatedEffort.immediate}\n`;
      plan.recommendations.immediate.forEach((r) => (output += `□ ${r}\n`));

      output += '\n📅 SHORT TERM (Next Sprint):\n';
      output += `⏱️  Estimated Effort: ${plan.estimatedEffort.shortTerm}\n`;
      plan.recommendations.shortTerm.forEach((r) => (output += `□ ${r}\n`));

      output += '\n🎯 LONG TERM (Next Quarter):\n';
      output += `⏱️  Estimated Effort: ${plan.estimatedEffort.longTerm}\n`;
      plan.recommendations.longTerm.forEach((r) => (output += `□ ${r}\n`));

      if (plan.antiPatterns.length > 0) {
        output += '\n❌ ANTI-PATTERNS TO AVOID:\n';
        plan.antiPatterns.forEach((ap) => (output += `⚠️  ${ap}\n`));
      }

      output += "\n💭 Remember: Fix what's broken, not what's theoretically imperfect.";

      return {
        content: [
          {
            type: 'text',
            text: output,
          },
        ],
      };
    }

    case 'cc_plan_timeline': {
      const input = String(request.params.arguments?.input || '');
      const estimatedDays = Number(request.params.arguments?.estimatedDays || 0); // 0 means auto-estimate
      const context = request.params.arguments?.context || {};

      if (!input) {
        logger.error('Missing input parameter');
        throw new Error('Input description is required for timeline generation');
      }

      logger.info('Generating timeline from natural language input', {
        input,
        estimatedDays,
      });

      try {
        const planEngine = new BrutalPlanEngine();

        // Extract structured requirements from natural language input
        const extractedRequirements = planEngine.extractRequirements(input);

        const { filename, content } = await planEngine.generatePlan({
          requirement: extractedRequirements.requirement,
          estimatedDays: estimatedDays || extractedRequirements.estimatedDays,
          context: {
            ...context,
            ...extractedRequirements.context,
            originalInput: input,
          } as any,
        });

        logger.info('Timeline generated successfully', { filename });

        // Return first 2000 chars of the plan + info about where it's saved
        const preview = content.substring(0, 2000);
        const output = `🔥 CRITICAL TIMELINE GENERATED: ${filename}\n\n${preview}${content.length > 2000 ? '\n\n... (truncated - see full plan in file)' : ''}`;

        return {
          content: [
            {
              type: 'text',
              text: output,
            },
          ],
        };
      } catch (error) {
        logger.error('Failed to generate timeline', { input }, error as Error);
        throw new Error(`Failed to generate timeline: ${(error as Error).message}`);
      }
    }

    case 'cc_init_project': {
      const projectName = request.params.arguments?.projectName as string | undefined;
      
      logger.info('Initializing project', { projectName });
      
      try {
        const wizard = new InitWizard();
        await wizard.run({ projectName });
        
        const finalName = projectName || path.basename(process.cwd());
        
        return {
          content: [{
            type: 'text',
            text: `✅ Critical Claude initialized for project: ${finalName}
      
Configuration saved to:
- .critical-claude/config.toml - Project configuration
- .claude/CLAUDE.md - Project-specific instructions
- .claude/commands/ - Custom commands

Available commands:
- /project:critique - Run comprehensive code critique
- /project:plan-feature - Plan new feature with timeline

Run 'cc crit explore' to analyze your codebase structure.`,
          }],
        };
      } catch (error) {
        logger.error('Failed to initialize project', error as Error);
        throw new Error(`Failed to initialize project: ${(error as Error).message}`);
      }
    }

    case 'cc_prompt_mgmt': {
      const action = String(request.params.arguments?.action || '');
      const id = request.params.arguments?.id as string;
      const category = request.params.arguments?.category as any;
      const prompt = request.params.arguments?.prompt as any;
      const variables = request.params.arguments?.variables as Record<string, string>;
      const query = request.params.arguments?.query as string;
      const filePath = request.params.arguments?.filePath as string;
      const overwrite = Boolean(request.params.arguments?.overwrite);

      if (!action) {
        throw new Error('Action is required for prompt management');
      }

      try {
        const promptManager = new PromptManager();
        await promptManager.initialize();

        switch (action) {
          case 'list': {
            const prompts = await promptManager.listPrompts(category);
            let output = '📚 PROMPT LIBRARY\n';
            output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
            
            if (category) {
              output += `📂 Category: ${category}\n\n`;
            }

            if (prompts.length === 0) {
              output += 'No prompts found.\n';
            } else {
              prompts.forEach(p => {
                output += `🔹 ${p.id}\n`;
                output += `   Name: ${p.name}\n`;
                output += `   Category: ${p.category}\n`;
                output += `   Description: ${p.description}\n`;
                output += `   Tags: ${p.tags.join(', ')}\n`;
                output += `   Variables: ${p.variables.join(', ')}\n\n`;
              });
            }

            return {
              content: [{ type: 'text', text: output }],
            };
          }

          case 'get': {
            if (!id) {
              throw new Error('Prompt ID is required for get action');
            }
            
            const prompt = await promptManager.getPrompt(id);
            if (!prompt) {
              throw new Error(`Prompt '${id}' not found`);
            }

            let output = `📄 PROMPT: ${prompt.id}\n`;
            output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
            output += `Name: ${prompt.name}\n`;
            output += `Category: ${prompt.category}\n`;
            output += `Description: ${prompt.description}\n`;
            output += `Tags: ${prompt.tags.join(', ')}\n`;
            output += `Variables: ${prompt.variables.join(', ')}\n`;
            output += `Created: ${prompt.created_at}\n`;
            output += `Updated: ${prompt.updated_at}\n\n`;
            output += `Template:\n${prompt.template}`;

            return {
              content: [{ type: 'text', text: output }],
            };
          }

          case 'add': {
            if (!id || !prompt) {
              throw new Error('Prompt ID and prompt data are required for add action');
            }

            await promptManager.addPrompt({
              id,
              category: category || 'custom',
              ...prompt,
            });

            return {
              content: [{ type: 'text', text: `✅ Added prompt: ${id}` }],
            };
          }

          case 'update': {
            if (!id || !prompt) {
              throw new Error('Prompt ID and update data are required for update action');
            }

            await promptManager.updatePrompt(id, prompt);

            return {
              content: [{ type: 'text', text: `✅ Updated prompt: ${id}` }],
            };
          }

          case 'delete': {
            if (!id) {
              throw new Error('Prompt ID is required for delete action');
            }

            await promptManager.deletePrompt(id);

            return {
              content: [{ type: 'text', text: `✅ Deleted prompt: ${id}` }],
            };
          }

          case 'render': {
            if (!id || !variables) {
              throw new Error('Prompt ID and variables are required for render action');
            }

            const rendered = await promptManager.renderPrompt(id, variables);

            let output = `🎯 RENDERED PROMPT: ${id}\n`;
            output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
            output += rendered;

            return {
              content: [{ type: 'text', text: output }],
            };
          }

          case 'search': {
            if (!query) {
              throw new Error('Search query is required for search action');
            }

            const results = await promptManager.searchPrompts(query);

            let output = `🔍 SEARCH RESULTS for "${query}"\n`;
            output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

            if (results.length === 0) {
              output += 'No prompts found matching your query.\n';
            } else {
              results.forEach(p => {
                output += `🔹 ${p.id} - ${p.name}\n`;
                output += `   Category: ${p.category}\n`;
                output += `   Description: ${p.description}\n\n`;
              });
            }

            return {
              content: [{ type: 'text', text: output }],
            };
          }

          case 'export': {
            if (!filePath) {
              throw new Error('File path is required for export action');
            }

            await promptManager.exportPrompts(filePath, category);

            return {
              content: [{ type: 'text', text: `✅ Exported prompts to: ${filePath}` }],
            };
          }

          case 'import': {
            if (!filePath) {
              throw new Error('File path is required for import action');
            }

            const count = await promptManager.importPrompts(filePath, overwrite);

            return {
              content: [{ type: 'text', text: `✅ Imported ${count} prompts from: ${filePath}` }],
            };
          }

          default:
            throw new Error(`Unknown prompt management action: ${action}`);
        }
      } catch (error) {
        logger.error('Prompt management failed', { action, id }, error as Error);
        throw new Error(`Prompt management failed: ${(error as Error).message}`);
      }
    }

    // Handle system design tools
    case 'cc_mvp_plan':
    case 'cc_system_design_analyze':
    case 'cc_tech_stack_recommend':
      return await systemDesignServer.handleToolCall(request.params.name, request.params.arguments);

    // Handle data flow tools
    case 'cc_data_flow_analyze':
    case 'cc_data_flow_trace':
    case 'cc_data_flow_diagram':
      return await dataFlowServer.handleToolCall(request.params.name, request.params.arguments);

    case 'cc_setup_wizard': {
      const installationType = String(request.params.arguments?.installationType || 'basic');
      const claudeDesktopConfigPath = request.params.arguments?.claudeDesktopConfigPath as string;
      const projectPath = String(request.params.arguments?.projectPath || process.cwd());
      const enableHooks = Boolean(request.params.arguments?.enableHooks);
      const setupAliases = Boolean(request.params.arguments?.setupAliases ?? true);

      logger.info('Running setup wizard', {
        installationType,
        projectPath,
        enableHooks,
        setupAliases
      });

      try {
        const result = await setupWizard.run({
          installationType: installationType as 'basic' | 'advanced' | 'development',
          claudeDesktopConfigPath,
          projectPath,
          enableHooks,
          setupAliases
        });

        let output = '🚀 CRITICAL CLAUDE SETUP COMPLETE! 🚀\n';
        output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        
        if (result.success) {
          output += '✅ Setup completed successfully!\n\n';
          
          if (result.claudeConfigUpdated) {
            output += `📝 Claude Desktop config updated: ${result.claudeConfigPath}\n`;
          }
          
          if (result.aliasesSetup) {
            output += '🔗 Global aliases configured:\n';
            result.aliases?.forEach(alias => {
              output += `   ${alias.command} -> ${alias.target}\n`;
            });
            output += '\n';
          }
          
          if (result.hooksEnabled) {
            output += '🪝 Claude Code hooks enabled (experimental)\n';
          }
          
          output += '\n🎯 Next Steps:\n';
          output += '1. Restart Claude Desktop to load new configuration\n';
          output += '2. Run "cc status" to verify installation\n';
          output += '3. Try "cc crit explore" to analyze a codebase\n';
          
          if (result.projectConfigured) {
            output += '4. Project-specific configuration saved to .critical-claude/\n';
          }
        } else {
          output += '❌ Setup encountered issues:\n';
          result.errors?.forEach((error: any) => {
            output += `   • ${error}\n`;
          });
          output += '\n💡 Run with installationType="advanced" for more options\n';
        }

        return {
          content: [{
            type: 'text',
            text: output
          }]
        };
      } catch (error) {
        logger.error('Setup wizard failed', error as Error);
        throw new Error(`Setup failed: ${(error as Error).message}`);
      }
    }

    case 'cc_task_manage': {
      const action = String(request.params.arguments?.action || '');
      const taskData = request.params.arguments?.taskData as any;
      const filters = request.params.arguments?.filters as any;
      const syncDirection = String(request.params.arguments?.syncDirection || 'bidirectional');

      if (!action) {
        throw new Error('Action is required for task management');
      }

      logger.info('Managing tasks', { action, syncDirection });

      try {
        const result = await taskManager.handleAction({
          action: action as any,
          taskData,
          filters,
          syncDirection: syncDirection as any
        });

        let output = `📋 TASK MANAGEMENT: ${action.toUpperCase()}\n`;
        output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

        switch (action) {
          case 'list':
            if (result.tasks && result.tasks.length > 0) {
              result.tasks.forEach((task: any) => {
                const priority = task.priority === 'critical' ? '🔴' : 
                                task.priority === 'high' ? '🟠' : 
                                task.priority === 'medium' ? '🟡' : '🟢';
                const status = task.status === 'completed' ? '✅' : 
                              task.status === 'in_progress' ? '🔄' : 
                              task.status === 'blocked' ? '🚫' : '⭕';
                
                output += `${priority} ${status} ${task.title}\n`;
                if (task.description) {
                  output += `   ${task.description}\n`;
                }
                if (task.assignee) {
                  output += `   👤 ${task.assignee}`;
                }
                if (task.dueDate) {
                  output += ` | 📅 ${task.dueDate}`;
                }
                output += '\n\n';
              });
            } else {
              output += 'No tasks found.\n';
            }
            break;
            
          case 'create':
            output += `✅ Created task: ${result.task?.title || 'New Task'}\n`;
            output += `📝 ID: ${result.task?.id}\n`;
            break;
            
          case 'update':
            output += `✅ Updated task: ${result.task?.title}\n`;
            break;
            
          case 'delete':
            output += `✅ Deleted task: ${taskData?.id || 'Unknown'}\n`;
            break;
            
          case 'sync':
            output += `✅ Sync completed: ${result.syncedCount || 0} tasks\n`;
            if (result.conflicts) {
              output += `⚠️  Conflicts resolved: ${result.conflicts}\n`;
            }
            break;
            
          case 'status':
            output += `📊 Total tasks: ${result.totalTasks || 0}\n`;
            output += `✅ Completed: ${result.completedTasks || 0}\n`;
            output += `🔄 In progress: ${result.inProgressTasks || 0}\n`;
            output += `⭕ Pending: ${result.pendingTasks || 0}\n`;
            break;
        }

        if (result.claudeCodeSynced) {
          output += '\n🔄 Synced with Claude Code todo system\n';
        }

        return {
          content: [{
            type: 'text',
            text: output
          }]
        };
      } catch (error) {
        logger.error('Task management failed', { action }, error as Error);
        throw new Error(`Task management failed: ${(error as Error).message}`);
      }
    }

    case 'cc_project_setup': {
      const projectType = String(request.params.arguments?.projectType || '');
      const framework = request.params.arguments?.framework as string;
      const language = String(request.params.arguments?.language || 'javascript');
      const includeTemplates = Boolean(request.params.arguments?.includeTemplates ?? true);
      const setupCI = Boolean(request.params.arguments?.setupCI);
      const setupTesting = Boolean(request.params.arguments?.setupTesting ?? true);

      if (!projectType) {
        throw new Error('Project type is required for project setup');
      }

      logger.info('Setting up project', {
        projectType,
        framework,
        language,
        includeTemplates,
        setupCI,
        setupTesting
      });

      try {
        const result = await projectInitializer.setupProject({
          projectType: projectType as any,
          framework,
          language: language as any,
          includeTemplates,
          setupCI,
          setupTesting
        });

        let output = `🏗️  PROJECT SETUP COMPLETE: ${projectType.toUpperCase()}\n`;
        output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        
        if (result.success) {
          output += '✅ Project configured successfully!\n\n';
          
          output += '📁 Files created:\n';
          result.filesCreated?.forEach(file => {
            output += `   📄 ${file}\n`;
          });
          
          if (result.templatesAdded) {
            output += '\n📋 Templates added:\n';
            result.templates?.forEach(template => {
              output += `   📝 ${template}\n`;
            });
          }
          
          if (result.ciConfigured) {
            output += '\n🔄 CI/CD configuration added\n';
          }
          
          if (result.testingSetup) {
            output += '\n🧪 Testing framework configured\n';
          }
          
          output += '\n🎯 Next Steps:\n';
          output += '1. Review generated configuration files\n';
          output += '2. Install dependencies if needed\n';
          output += '3. Run "cc crit explore" to analyze your setup\n';
          output += '4. Use "cc task create" to start tracking work\n';
        } else {
          output += '❌ Project setup encountered issues:\n';
          result.errors?.forEach((error: any) => {
            output += `   • ${error}\n`;
          });
        }

        return {
          content: [{
            type: 'text',
            text: output
          }]
        };
      } catch (error) {
        logger.error('Project setup failed', error as Error);
        throw new Error(`Project setup failed: ${(error as Error).message}`);
      }
    }

    case 'cc_status_check': {
      const checkType = String(request.params.arguments?.checkType || 'full');
      const verbose = Boolean(request.params.arguments?.verbose);

      logger.info('Running status check', { checkType, verbose });

      try {
        // Perform status checks
        const claudeDesktopConfig = await checkClaudeDesktopConfig();
        const mcpServerStatus = await checkMcpServerStatus();
        const hooksStatus = await checkHooksStatus();
        const taskSystemStatus = await checkTaskSystemStatus();
        
        let output = '🔍 CRITICAL CLAUDE STATUS CHECK\n';
        output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        
        // Claude Desktop Configuration
        output += '📱 Claude Desktop Integration:\n';
        if (claudeDesktopConfig.found) {
          output += `   ✅ Config found: ${claudeDesktopConfig.path}\n`;
          output += `   ✅ MCP server configured: ${claudeDesktopConfig.mcpConfigured ? 'Yes' : 'No'}\n`;
        } else {
          output += '   ❌ Claude Desktop config not found\n';
          output += '   💡 Run "cc setup" to configure\n';
        }
        
        // MCP Server Status
        output += '\n🔌 MCP Server Status:\n';
        output += `   ${mcpServerStatus.running ? '✅' : '❌'} Server: ${mcpServerStatus.running ? 'Running' : 'Not running'}\n`;
        output += `   ✅ Tools available: ${mcpServerStatus.toolCount}\n`;
        
        if (checkType === 'full' || checkType === 'hooks') {
          // Hooks Status
          output += '\n🪝 Claude Code Hooks:\n';
          output += `   ${hooksStatus.enabled ? '✅' : '⚠️'} Status: ${hooksStatus.enabled ? 'Enabled' : 'Disabled (Experimental)'}\n`;
          if (hooksStatus.enabled && hooksStatus.hookFile) {
            output += `   📄 Hook file: ${hooksStatus.hookFile}\n`;
          }
        }
        
        if (checkType === 'full' || checkType === 'tasks') {
          // Task System Status
          output += '\n📋 Task Management:\n';
          output += `   ${taskSystemStatus.available ? '✅' : '❌'} System: ${taskSystemStatus.available ? 'Available' : 'Not available'}\n`;
          if (taskSystemStatus.available) {
            output += `   📊 Active tasks: ${taskSystemStatus.taskCount || 0}\n`;
            output += `   🔄 Sync status: ${taskSystemStatus.syncEnabled ? 'Enabled' : 'Disabled'}\n`;
          }
        }
        
        // Overall Health
        const overallHealth = claudeDesktopConfig.mcpConfigured && mcpServerStatus.running;
        output += `\n🎯 Overall Health: ${overallHealth ? '✅ Good' : '⚠️ Needs attention'}\n`;
        
        if (!overallHealth) {
          output += '\n💡 Recommended Actions:\n';
          if (!claudeDesktopConfig.found) {
            output += '   1. Run "cc setup" to configure Claude Desktop\n';
          }
          if (!mcpServerStatus.running) {
            output += '   2. Restart Claude Desktop to load MCP server\n';
          }
        }

        return {
          content: [{
            type: 'text',
            text: output
          }]
        };
      } catch (error) {
        logger.error('Status check failed', error as Error);
        throw new Error(`Status check failed: ${(error as Error).message}`);
      }
    }

    case 'cc_hook_system': {
      const action = String(request.params.arguments?.action || '');
      const hookType = String(request.params.arguments?.hookType || 'universal');
      const config = request.params.arguments?.config as any;
      const logOptions = request.params.arguments?.logOptions as any;

      logger.info('Managing hook system', { action, hookType });

      if (!enhancedHookSystem) {
        throw new Error('Enhanced hook system not initialized');
      }

      try {
        let output = '🪝 ENHANCED HOOK SYSTEM\n';
        output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

        switch (action) {
          case 'status': {
            const stats = await enhancedHookSystem.getHookStats();
            output += `🔧 Status: ${stats.enabled ? '✅ Enabled' : '❌ Disabled'}\n`;
            output += `📊 Processed events: ${stats.processed_events}\n`;
            output += `⏱️  Average response time: ${stats.avg_response_time}ms\n`;
            output += `🛠️  Supported tools: ${stats.supported_tools.join(', ')}\n`;
            output += `🔄 Sync status: ${stats.sync_status}\n`;
            break;
          }

          case 'install_hooks': {
            await enhancedHookSystem.initialize();
            output += '✅ Hook scripts installed successfully!\n\n';
            output += '🏗️  Created:\n';
            output += '   • ~/.critical-claude/hooks/ultimate-hook.sh\n';
            output += '   • ~/.critical-claude/hooks/install-hooks.sh\n\n';
            output += '🎯 Next step: Run the installer to configure Claude Code:\n';
            output += '   bash ~/.critical-claude/hooks/install-hooks.sh\n';
            break;
          }

          case 'test': {
            const testEvent = {
              timestamp: new Date().toISOString(),
              tool_name: 'TodoWrite',
              arguments: {
                todos: [{
                  id: 'test-' + Date.now(),
                  content: 'Test hook integration',
                  status: 'pending',
                  priority: 'medium'
                }]
              },
              session_id: 'test-session'
            };

            const response = await enhancedHookSystem.processHookEvent(testEvent);
            output += `🧪 Test hook processed in ${response.response_time_ms}ms\n`;
            output += `📊 Tasks updated: ${response.tasks_updated || 0}\n`;
            output += `✅ Sync status: ${response.sync_status}\n`;
            if (response.visual_feedback) {
              output += `💬 Visual feedback: ${response.visual_feedback}\n`;
            }
            break;
          }

          case 'live_logs': {
            const logs = await enhancedHookSystem.getLiveLogs(logOptions || {});
            output += `📊 Live Hook Logs (${logs.length} events)\n`;
            output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
            
            if (logs.length === 0) {
              output += 'No hook events found.\n';
            } else {
              logs.slice(0, 20).forEach(log => {
                const time = new Date(log.timestamp).toLocaleTimeString();
                const status = log.sync_status === 'success' ? '✅' : 
                              log.sync_status === 'failed' ? '❌' : 
                              log.sync_status === 'partial' ? '⚠️' : '🔄';
                
                output += `${status} ${time} | ${log.tool_name}`;
                if (log.session_id) output += ` | Session: ${log.session_id.substring(0, 8)}...`;
                if (log.response_time_ms) output += ` | ${log.response_time_ms}ms`;
                if (log.tasks_updated) output += ` | ${log.tasks_updated} tasks`;
                output += '\n';
                
                if (log.file_path) {
                  output += `    📄 ${log.file_path}\n`;
                }
                if (log.actions_triggered && log.actions_triggered.length > 0) {
                  output += `    🎯 ${log.actions_triggered.join(', ')}\n`;
                }
                output += '\n';
              });

              if (logs.length > 20) {
                output += `... and ${logs.length - 20} more events\n`;
                output += `💡 Use logOptions.limit to see more\n`;
              }
            }
            break;
          }

          case 'export_logs': {
            if (!logOptions?.outputPath) {
              throw new Error('outputPath is required for export_logs action');
            }
            
            const format = logOptions.format || 'json';
            await enhancedHookSystem.exportHookLogs({
              format,
              outputPath: logOptions.outputPath,
              since: logOptions.since,
              toolFilter: logOptions.toolFilter
            });
            
            output += `✅ Hook logs exported successfully!\n`;
            output += `📄 File: ${logOptions.outputPath}\n`;
            output += `📊 Format: ${format}\n`;
            if (logOptions.since) output += `📅 Since: ${logOptions.since}\n`;
            if (logOptions.toolFilter) output += `🔧 Tool filter: ${logOptions.toolFilter}\n`;
            break;
          }

          case 'stream_logs': {
            // For streaming, we provide instructions since this is not a real-time interface
            output += `🌊 Live Log Streaming Setup\n`;
            output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
            output += `📡 Stream file location:\n`;
            output += `   ~/.critical-claude/hooks/live-stream.json\n\n`;
            output += `🔄 Auto-updates every hook event\n`;
            output += `📊 Contains last 50 events + stats\n\n`;
            output += `💡 Monitor with:\n`;
            output += `   watch -n 1 'cat ~/.critical-claude/hooks/live-stream.json | jq .stats'\n`;
            output += `   tail -f ~/.critical-claude/hooks/live-monitor.jsonl\n`;
            break;
          }

          default:
            throw new Error(`Unknown hook action: ${action}`);
        }

        return {
          content: [{
            type: 'text',
            text: output
          }]
        };
      } catch (error) {
        logger.error('Hook system operation failed', error as Error);
        throw new Error(`Hook system operation failed: ${(error as Error).message}`);
      }
    }

    case 'cc_process_hook': {
      const hookEvent = {
        timestamp: new Date().toISOString(),
        tool_name: String(request.params.arguments?.tool_name || ''),
        arguments: request.params.arguments?.arguments,
        file_path: String(request.params.arguments?.file_path || ''),
        content: String(request.params.arguments?.content || ''),
        session_id: String(request.params.arguments?.session_id || '')
      };

      logger.info('Processing hook event', { tool: hookEvent.tool_name });

      if (!enhancedHookSystem) {
        throw new Error('Enhanced hook system not initialized');
      }

      try {
        const response = await enhancedHookSystem.processHookEvent(hookEvent);

        let output = `🔄 Hook Event Processed: ${hookEvent.tool_name}\n`;
        output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        
        output += `⚡ Response time: ${response.response_time_ms}ms\n`;
        output += `📊 Tasks updated: ${response.tasks_updated || 0}\n`;
        output += `✅ Sync status: ${response.sync_status}\n`;
        
        if (response.actions_triggered && response.actions_triggered.length > 0) {
          output += `🎯 Actions triggered: ${response.actions_triggered.join(', ')}\n`;
        }
        
        if (response.visual_feedback) {
          output += `\n💬 ${response.visual_feedback}\n`;
        }

        output += '\n🔄 Real-time sync with Critical Claude task queue completed!';

        return {
          content: [{
            type: 'text',
            text: output
          }]
        };
      } catch (error) {
        logger.error('Hook processing failed', error as Error);
        throw new Error(`Hook processing failed: ${(error as Error).message}`);
      }
    }

    case 'cc_alias_setup': {
      const shell = String(request.params.arguments?.shell || 'auto');
      const aliases = request.params.arguments?.aliases as Record<string, string> || {};
      const global = Boolean(request.params.arguments?.global ?? true);

      logger.info('Setting up aliases', { shell, global, customAliases: Object.keys(aliases).length });

      try {
        const result = await setupGlobalAliases({ shell: shell as any, aliases, global });

        let output = '🔗 COMMAND ALIAS SETUP\n';
        output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        
        if (result.success) {
          output += '✅ Aliases configured successfully!\n\n';
          
          output += `🐚 Shell: ${result.detectedShell}\n`;
          output += `📄 Config file: ${result.configFile}\n\n`;
          
          output += '🔗 Available aliases:\n';
          result.aliases?.forEach((alias: any) => {
            output += `   ${alias.command} → ${alias.description}\n`;
          });
          
          output += '\n🎯 Usage:\n';
          output += '   cc crit explore /path/to/project\n';
          output += '   cc task create "New feature"\n';
          output += '   cc setup wizard\n';
          
          output += '\n💡 Restart your terminal or run "source ~/.bashrc" to use aliases\n';
        } else {
          output += '❌ Alias setup encountered issues:\n';
          result.errors?.forEach((error: any) => {
            output += `   • ${error}\n`;
          });
        }

        return {
          content: [{
            type: 'text',
            text: output
          }]
        };
      } catch (error) {
        logger.error('Alias setup failed', error as Error);
        throw new Error(`Alias setup failed: ${(error as Error).message}`);
      }
    }

    case 'cc_task': {
      const command = String(request.params.arguments?.command || '');
      
      logger.info('Executing markdown task command', { command });

      if (!taskCLI || !aiTaskEngine) {
        throw new Error('Task management system not initialized');
      }

      try {
        // Extract all possible arguments
        const args = {
          title: request.params.arguments?.title,
          description: request.params.arguments?.description,
          status: request.params.arguments?.status,
          priority: request.params.arguments?.priority,
          assignee: request.params.arguments?.assignee,
          labels: request.params.arguments?.labels,
          parent: request.params.arguments?.parent,
          dependencies: request.params.arguments?.dependencies,
          plan: request.params.arguments?.plan,
          acceptanceCriteria: request.params.arguments?.acceptanceCriteria,
          notes: request.params.arguments?.notes,
          draft: request.params.arguments?.draft,
          id: request.params.arguments?.id,
          plain: request.params.arguments?.plain || false,
          outputPath: request.params.arguments?.outputPath,
          force: request.params.arguments?.force,
          includeDrafts: request.params.arguments?.includeDrafts,
          filePath: request.params.arguments?.filePath,
          text: request.params.arguments?.text,
          prompt: request.params.arguments?.prompt,
          parentId: request.params.arguments?.parentId,
          autoGenerateDependencies: request.params.arguments?.autoGenerateDependencies !== false,
          expandLevel: request.params.arguments?.expandLevel || 2,
          projectContext: request.params.arguments?.projectContext
        };

        let result: any;
        let output = '🤖 AI-POWERED TASK MANAGEMENT\n';
        output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

        // Handle AI commands
        if (command.startsWith('ai.') || command === 'plan.generate') {
          switch (command) {
            case 'ai.from-file':
              if (!args.filePath) {
                throw new Error('filePath is required for ai.from-file command');
              }
              result = await aiTaskEngine.generateTasksFromFile(String(args.filePath), {
                context: String(args.projectContext || ''),
                expandLevel: Number(args.expandLevel || 2),
                autoGenerateDependencies: Boolean(args.autoGenerateDependencies)
              });
              break;

            case 'ai.from-text':
              if (!args.text) {
                throw new Error('text is required for ai.from-text command');
              }
              result = await aiTaskEngine.generateTasksFromText(String(args.text), {
                context: String(args.projectContext || ''),
                expandLevel: Number(args.expandLevel || 2),
                autoGenerateDependencies: Boolean(args.autoGenerateDependencies)
              });
              break;

            case 'ai.expand':
              if (!args.parentId) {
                throw new Error('parentId is required for ai.expand command');
              }
              result = await aiTaskEngine.expandTaskIntoSubtasks(String(args.parentId), {
                context: String(args.projectContext || ''),
                expandLevel: Number(args.expandLevel || 2)
              });
              break;

            case 'ai.dependencies':
              const analyses = await aiTaskEngine.analyzeAndSuggestDependencies(
                args.id ? [String(args.id)] : undefined
              );
              result = {
                success: true,
                message: `Analyzed ${analyses.length} tasks for dependencies`,
                data: analyses
              };
              break;

            case 'ai.create':
              if (!args.prompt && !args.text) {
                throw new Error('prompt or text is required for ai.create command');
              }
              result = await aiTaskEngine.generateTasksFromText(String(args.prompt || args.text || ''), {
                context: String(args.projectContext || ''),
                expandLevel: Number(args.expandLevel || 2),
                autoGenerateDependencies: Boolean(args.autoGenerateDependencies)
              });
              break;

            case 'plan.generate':
              // Agentic planning loop
              const planText = args.text || args.prompt;
              if (!planText) {
                throw new Error('text or prompt is required for plan.generate command');
              }
              
              // Generate tasks from plan
              const planResult = await aiTaskEngine.generateTasksFromText(String(planText), {
                context: String(args.projectContext || 'project planning'),
                expandLevel: 3, // Higher expansion for planning
                autoGenerateDependencies: true
              });

              // Auto-expand high-level tasks into subtasks
              const allTasks = [...planResult.tasks];
              for (const task of planResult.tasks) {
                if (task.title.toLowerCase().includes('implement') || 
                    task.title.toLowerCase().includes('build') ||
                    task.title.toLowerCase().includes('feature')) {
                  const subtaskResult = await aiTaskEngine.expandTaskIntoSubtasks(task.id, {
                    context: String(args.projectContext || ''),
                    expandLevel: 2
                  });
                  allTasks.push(...subtaskResult.tasks);
                }
              }

              result = {
                success: true,
                tasks: allTasks,
                message: `Generated ${allTasks.length} tasks from plan (${planResult.tasks.length} main tasks + ${allTasks.length - planResult.tasks.length} subtasks)`
              };
              break;

            default:
              throw new Error(`Unknown AI command: ${command}`);
          }

          // Format AI command results
          if (result.success) {
            output += `✅ ${result.message}\n\n`;
            
            if (result.tasks && result.tasks.length > 0) {
              output += `📋 Generated Tasks:\n`;
              result.tasks.forEach((task: any, index: number) => {
                const priorityIcon = task.priority === 'high' ? '🔴' : 
                                   task.priority === 'medium' ? '🟡' : '🟢';
                output += `${priorityIcon} **task-${task.id}** - ${task.title}\n`;
                if (task.description && !args.plain) {
                  output += `   ${task.description.substring(0, 100)}${task.description.length > 100 ? '...' : ''}\n`;
                }
                if (task.parent) {
                  output += `   └─ Subtask of: task-${task.parent}\n`;
                }
                output += '\n';
              });
            }

            if (result.dependencies) {
              output += `\n🔗 Dependencies Auto-Generated:\n`;
              Object.entries(result.dependencies).forEach(([taskId, deps]: [string, any]) => {
                if (deps.length > 0) {
                  output += `   task-${taskId} depends on: ${deps.map((d: string) => `task-${d}`).join(', ')}\n`;
                }
              });
            }

            if (result.data && command === 'ai.dependencies') {
              output += `\n🧠 Dependency Analysis:\n`;
              result.data.forEach((analysis: any) => {
                if (analysis.dependencies.length > 0) {
                  output += `   task-${analysis.taskId}: ${analysis.reasoning} (confidence: ${Math.round(analysis.confidence * 100)}%)\n`;
                }
              });
            }
          } else {
            output += `❌ ${result.message}\n`;
          }

        } else {
          // Handle regular CLI commands
          result = await taskCLI.executeCommand(command, args);
          
          if (result.success) {
            if (result.output) {
              output += result.output;
            } else {
              output += `✅ ${result.message}\n`;
            }
            
            // Add task data if available
            if (result.data && !args.plain) {
              output += '\n📊 Result data available for further processing.\n';
            }
          } else {
            output += `❌ ${result.message}\n`;
          }
        }

        return {
          content: [{
            type: 'text',
            text: output
          }]
        };
      } catch (error) {
        logger.error('Task command failed', error as Error);
        throw new Error(`Task command failed: ${(error as Error).message}`);
      }
    }

    // Handle backlog integration tools if available
    default:
      if (backlogServer && request.params.name.startsWith('cc_')) {
        try {
          return await backlogServer.handleToolCall(request.params.name, request.params.arguments);
        } catch (error) {
          // Fall through to unknown tool error
        }
      }
      
      throw new Error(`Unknown tool: ${request.params.name}`);
  }
});

/**
 * Start the server using stdio transport.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Helper functions for status checks
async function checkClaudeDesktopConfig(): Promise<{ found: boolean; path?: string; mcpConfigured: boolean }> {
  const platform = os.platform();
  const homeDir = os.homedir();
  
  const possiblePaths = [
    path.join(homeDir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'), // macOS
    path.join(homeDir, 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json'), // Windows
    path.join(homeDir, '.config', 'Claude', 'claude_desktop_config.json'), // Linux
  ];

  for (const configPath of possiblePaths) {
    try {
      const content = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(content);
      const mcpConfigured = config.mcpServers && config.mcpServers['critical-claude'];
      
      return {
        found: true,
        path: configPath,
        mcpConfigured: !!mcpConfigured
      };
    } catch {
      continue;
    }
  }

  return { found: false, mcpConfigured: false };
}

async function checkMcpServerStatus(): Promise<{ running: boolean; toolCount: number }> {
  // Since we're running inside the MCP server, we know it's running
  // Count available tools
  const systemDesignTools = systemDesignServer.getTools();
  const dataFlowTools = dataFlowServer.getTools();
  const backlogTools = backlogServer ? backlogServer.getTools() : [];
  
  const totalTools = 11 + systemDesignTools.length + dataFlowTools.length + backlogTools.length; // 11 core tools
  
  return {
    running: true,
    toolCount: totalTools
  };
}

async function checkHooksStatus(): Promise<{ enabled: boolean; hookFile?: string }> {
  try {
    const claudeDir = path.join(os.homedir(), '.claude');
    const hooksDir = path.join(claudeDir, 'hooks');
    const hookFile = path.join(hooksDir, 'critical-claude-sync.sh');
    
    await fs.access(hookFile);
    return {
      enabled: true,
      hookFile
    };
  } catch {
    return { enabled: false };
  }
}

async function checkTaskSystemStatus(): Promise<{ available: boolean; taskCount?: number; syncEnabled: boolean }> {
  try {
    const tasksDir = path.join(os.homedir(), '.critical-claude', 'tasks');
    const files = await fs.readdir(tasksDir);
    const taskFiles = files.filter(f => f.endsWith('.json'));
    
    // Check if Claude Code sync is available
    const claudeDir = path.join(os.homedir(), '.claude');
    let syncEnabled = false;
    try {
      await fs.access(claudeDir);
      syncEnabled = true;
    } catch {
      syncEnabled = false;
    }
    
    return {
      available: true,
      taskCount: taskFiles.length,
      syncEnabled
    };
  } catch {
    return {
      available: false,
      syncEnabled: false
    };
  }
}

async function setupGlobalAliases(options: { shell: 'bash' | 'zsh' | 'fish' | 'auto'; aliases: Record<string, string>; global: boolean }): Promise<any> {
  const shell = options.shell === 'auto' ? path.basename(process.env.SHELL || 'bash') : options.shell;
  
  const defaultAliases = [
    { command: 'cc', target: 'critical-claude', description: 'Main Critical Claude command' },
    { command: 'ccrit', target: 'critical-claude crit', description: 'Code critique commands' },
    { command: 'cctask', target: 'critical-claude task', description: 'Task management commands' },
  ];
  
  // Merge with custom aliases
  const allAliases = [...defaultAliases];
  Object.entries(options.aliases).forEach(([cmd, target]) => {
    allAliases.push({ command: cmd, target, description: `Custom alias for ${target}` });
  });
  
  let rcFile: string;
  switch (shell) {
    case 'zsh':
      rcFile = path.join(os.homedir(), '.zshrc');
      break;
    case 'fish':
      rcFile = path.join(os.homedir(), '.config', 'fish', 'config.fish');
      break;
    default:
      rcFile = path.join(os.homedir(), '.bashrc');
  }
  
  try {
    let rcContent = '';
    try {
      rcContent = await fs.readFile(rcFile, 'utf8');
    } catch {
      // File doesn't exist, will be created
    }
    
    // Check if aliases already exist
    const aliasSection = '# Critical Claude aliases';
    if (!rcContent.includes(aliasSection)) {
      let aliasContent = `\n${aliasSection}\n`;
      for (const alias of allAliases) {
        if (shell === 'fish') {
          aliasContent += `alias ${alias.command} '${alias.target}'\n`;
        } else {
          aliasContent += `alias ${alias.command}='${alias.target}'\n`;
        }
      }
      aliasContent += '# End Critical Claude aliases\n';
      
      await fs.writeFile(rcFile, rcContent + aliasContent);
    }
    
    return {
      success: true,
      detectedShell: shell,
      configFile: rcFile,
      aliases: allAliases
    };
  } catch (error) {
    return {
      success: false,
      errors: [(error as Error).message]
    };
  }
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
