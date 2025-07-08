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
import { getConfig } from './config-loader.js';
import fs from 'fs/promises';
import path from 'path';

// Import new service packages
import { SystemDesignServer } from '@critical-claude/system-design';
import { DataFlowServer } from '@critical-claude/data-flow';

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

// Initialize new service packages
const systemDesignServer = new SystemDesignServer();
const dataFlowServer = new DataFlowServer();

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
    
    logger.info('Tools initialized with configuration', {
      webSearchEnabled: config.web_search?.enabled ?? false
    });
  } catch (error) {
    logger.warn('Failed to load config, using defaults', error as Error);
    
    // Initialize with defaults
    webSearchTool = new WebSearchTool({ enabled: false });
    pragmaticEngine = new PragmaticCritiqueEngine(webSearchTool);
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
  // Get tools from new service packages
  const systemDesignTools = systemDesignServer.getTools();
  const dataFlowTools = dataFlowServer.getTools();
  
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
          },
          required: ['code', 'filename'],
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
          required: ['code', 'filename'],
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
      // Add tools from new service packages
      ...systemDesignTools,
      ...dataFlowTools,
    ],
  };
});

/**
 * Handler for pragmatic code critique tools.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case 'cc_crit_code': {
      // Validate inputs
      const codeValidation = InputValidator.validateCode(request.params.arguments?.code);
      const filenameValidation = InputValidator.validateFilename(request.params.arguments?.filename || 'unknown.js');

      if (!codeValidation.valid) {
        throw new Error(`Invalid code: ${codeValidation.errors.join(', ')}`);
      }
      if (!filenameValidation.valid) {
        throw new Error(`Invalid filename: ${filenameValidation.errors.join(', ')}`);
      }

      const code = codeValidation.sanitized!;
      const filename = filenameValidation.sanitized!;

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
      const code = String(request.params.arguments?.code || '');
      const filename = String(request.params.arguments?.filename || 'unknown.js');
      const context = (request.params.arguments?.context as any) || {};

      if (!code) {
        throw new Error('Code is required for architecture review');
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

    default:
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

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
