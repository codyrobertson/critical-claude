#!/usr/bin/env node

/**
 * Critical Claude Project Management Service
 * Handles project planning, timeline estimation, and initialization
 */

import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  logger,
  createStandardMCPServer,
  startMCPServer,
  setupGracefulShutdown,
} from '@critical-claude/core';
import { BrutalPlanEngine } from './engines/brutal-plan-engine.js';
import { CodebaseExplorer } from './engines/codebase-explorer.js';
import { InitWizard } from './tools/init-wizard.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Create the Project Management MCP server
 */
const server = createStandardMCPServer({
  name: 'Critical Claude Project Management',
  version: '1.0.0',
  description: 'Project planning, timeline estimation, and initialization service',
});

// Initialize engines
const planEngine = new BrutalPlanEngine();
const codebaseExplorer = new CodebaseExplorer();

/**
 * Resources - Planning guides and templates
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'critical-claude://project-management/planning-guide',
        mimeType: 'text/markdown',
        name: 'Project Planning Guide',
        description: 'Reality-based project planning methodology',
      },
      {
        uri: 'critical-claude://project-management/estimation-factors',
        mimeType: 'text/markdown',
        name: 'Estimation Factors',
        description: 'Multipliers and complexity factors for accurate estimates',
      },
      {
        uri: 'critical-claude://project-management/project-types',
        mimeType: 'text/markdown',
        name: 'Project Types Guide',
        description: 'Different project types and their characteristics',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const url = new URL(request.params.uri);
  const resourceId = url.pathname.replace(/^\/project-management\//, '');

  let content = '';

  switch (resourceId) {
    case 'planning-guide':
      content = `# Reality-Based Project Planning

## Core Principles

1. **Multiply everything by reality factors** - Features always take longer
2. **Factor in complexity multipliers** - PCI compliance, legacy systems, etc.
3. **Account for team experience** - New teams need more time
4. **Plan for integration hell** - Third-party systems always break
5. **Buffer for unknown unknowns** - Murphy's law applies to code

## Base Multipliers

- **Authentication**: 3.5x (always underestimated)
- **Payment Processing**: 5.0x (compliance nightmare)
- **Data Processing**: 2.0x (edge cases galore)
- **Third-party Integration**: 4.0x (APIs lie)
- **Default Features**: 2.5x (general complexity)

## Planning Phases

- **Research**: 25% (understand the problem)
- **Implementation**: 60% (write the code)
- **Hardening**: 15% (make it production-ready)`;
      break;

    case 'estimation-factors':
      content = `# Estimation Factors

## Complexity Multipliers

### Increase Estimates For:
- **PCI Compliance**: +50% (security requirements)
- **Legacy Integration**: +100% (technical debt hell)
- **Distributed Systems**: +80% (network failures)
- **Real-time Requirements**: +60% (performance constraints)
- **HIPAA Compliance**: +70% (privacy regulations)

### Decrease Estimates For:
- **Experienced Team**: -15% (knows the pitfalls)
- **Existing Codebase**: -10% (patterns established)
- **Proven Architecture**: -20% (reduced unknowns)
- **Good Documentation**: -10% (less discovery time)

## Risk Factors

- **New Technology**: +40%
- **Tight Deadline**: +25% (stress errors)
- **Remote Team**: +20% (communication overhead)
- **Large Team**: +30% (coordination complexity)`;
      break;

    case 'project-types':
      content = `# Project Types

## CLI Tools
- **Characteristics**: Simple, focused functionality
- **Multiplier**: 1.5x (simpler than web apps)
- **Focus**: User experience, error handling

## Web Applications
- **Small (<1k users)**: 2.0x multiplier
- **Large (>100k users)**: 4.0x multiplier
- **Focus**: Scalability, security, performance

## Libraries
- **Characteristics**: Reusable, well-documented
- **Multiplier**: 2.5x (API design complexity)
- **Focus**: API design, backward compatibility

## Enterprise Applications
- **Characteristics**: Complex, compliance-heavy
- **Multiplier**: 5.0x (enterprise requirements)
- **Focus**: Security, audit trails, integration`;
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
 * Tools - Project management capabilities
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'cc_plan_timeline',
        description: 'Generate reality-based project timelines from natural language requirements',
        inputSchema: {
          type: 'object',
          properties: {
            input: {
              type: 'string',
              description: 'Natural language description of what you want to build',
            },
            estimatedDays: {
              type: 'number',
              description: 'Your optimistic estimate in days (optional)',
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
        name: 'cc_plan_arch',
        description: 'Create architectural improvement plan based on codebase analysis',
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
        name: 'cc_init_project',
        description: 'Initialize Critical Claude for a project with tailored configuration',
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
        name: 'cc_explore_codebase',
        description: 'Analyze entire codebase structure to understand architecture',
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
    ],
  };
});

/**
 * Tool handlers - Project management functionality
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case 'cc_plan_timeline': {
      const input = String(request.params.arguments?.input || '');
      const estimatedDays = Number(request.params.arguments?.estimatedDays || 0);
      const context = request.params.arguments?.context || {};

      if (!input) {
        throw new Error('Input description is required for timeline generation');
      }

      logger.info('Generating timeline from natural language input', { input, estimatedDays });

      try {
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

    case 'cc_plan_arch': {
      const rootPath = String(request.params.arguments?.rootPath || '');
      const includeAnalysis = request.params.arguments?.includeAnalysis !== false;

      if (!rootPath) {
        throw new Error('Root path is required for creating an architectural plan');
      }

      const structure = await codebaseExplorer.exploreCodebase(rootPath);
      const issues: any[] = []; // Simplified for this service

      const plan = await codebaseExplorer.createCriticalPlan(structure, issues);

      let output = '🔥 CRITICAL ARCHITECTURAL PLAN 🔥\n';
      output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

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

      return {
        content: [
          {
            type: 'text',
            text: output,
          },
        ],
      };
    }

    case 'cc_init_project': {
      const projectName = request.params.arguments?.projectName as string | undefined;

      logger.info('Initializing project', { projectName });

      try {
        const wizard = new InitWizard();
        await wizard.run({ projectName });

        const finalName = projectName || path.basename(process.cwd());

        return {
          content: [
            {
              type: 'text',
              text: `✅ Critical Claude initialized for project: ${finalName}

Configuration saved to:
- .critical-claude/config.toml - Project configuration
- .claude/CLAUDE.md - Project-specific instructions
- .claude/commands/ - Custom commands

Available commands:
- /project:critique - Run comprehensive code critique
- /project:plan-feature - Plan new feature with timeline

Run 'cc_explore_codebase' to analyze your codebase structure.`,
            },
          ],
        };
      } catch (error) {
        logger.error('Failed to initialize project', error as Error);
        throw new Error(`Failed to initialize project: ${(error as Error).message}`);
      }
    }

    case 'cc_explore_codebase': {
      const rootPath = String(request.params.arguments?.rootPath || '');

      if (!rootPath) {
        throw new Error('Root path is required for codebase exploration');
      }

      logger.info('Starting codebase exploration', { rootPath });

      try {
        const structure = await codebaseExplorer.exploreCodebase(rootPath);

        let output = '🔍 CODEBASE STRUCTURE ANALYSIS 🔍\n';
        output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

        output += `📁 Root: ${structure.rootPath}\n`;
        output += `📊 Total Files: ${structure.totalFiles}\n`;
        output += `💾 Total Size: ${(structure.totalSize / 1024 / 1024).toFixed(2)} MB\n`;
        output += `🔤 Main Languages: ${structure.mainLanguages.join(', ')}\n`;
        output += `🚀 Frameworks: ${structure.frameworkIndicators.join(', ') || 'None detected'}\n`;
        output += `🏗️  Architecture Patterns: ${structure.architecturePatterns.join(', ') || 'None detected'}\n\n`;

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

    default:
      throw new Error(`Unknown tool: ${request.params.name}`);
  }
});

/**
 * Start the server
 */
async function main() {
  setupGracefulShutdown(server);
  await startMCPServer(server);
}

main().catch((error) => {
  logger.error('Server startup failed:', error);
  process.exit(1);
});