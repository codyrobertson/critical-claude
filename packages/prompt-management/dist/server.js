#!/usr/bin/env node
/**
 * Critical Claude Prompt Management Service
 * Manages developer prompt templates for code review and analysis
 */
import { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { logger, createStandardMCPServer, startMCPServer, setupGracefulShutdown, } from '@critical-claude/core';
import { PromptManager } from './prompt-manager.js';
/**
 * Create the Prompt Management MCP server
 */
const server = createStandardMCPServer({
    name: 'Critical Claude Prompt Management',
    version: '1.0.0',
    description: 'Developer prompt template management and organization service',
});
/**
 * Resources - Prompt guides and documentation
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: [
            {
                uri: 'critical-claude://prompt-management/getting-started',
                mimeType: 'text/markdown',
                name: 'Prompt Management Getting Started',
                description: 'How to organize and use prompt templates effectively',
            },
            {
                uri: 'critical-claude://prompt-management/template-variables',
                mimeType: 'text/markdown',
                name: 'Template Variables Guide',
                description: 'Using variables in prompt templates for reusability',
            },
            {
                uri: 'critical-claude://prompt-management/categories',
                mimeType: 'text/markdown',
                name: 'Prompt Categories',
                description: 'Organizing prompts by category and use case',
            },
        ],
    };
});
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const url = new URL(request.params.uri);
    const resourceId = url.pathname.replace(/^\/prompt-management\//, '');
    let content = '';
    switch (resourceId) {
        case 'getting-started':
            content = `# Prompt Management Getting Started

## Quick Start

1. **List Available Prompts**
   \`\`\`
   cc_prompt_mgmt action=list
   \`\`\`

2. **View a Specific Prompt**
   \`\`\`
   cc_prompt_mgmt action=get id=security-audit
   \`\`\`

3. **Render a Prompt with Variables**
   \`\`\`
   cc_prompt_mgmt action=render id=security-audit variables='{"FILE_TYPE":"TypeScript","CODE":"..."}'
   \`\`\`

## Default Templates

The system comes with starter templates for:
- **Security Audit** - Comprehensive security vulnerability analysis
- **Performance Analysis** - Performance bottleneck identification
- **Architecture Review** - Architectural pattern evaluation
- **Production Readiness** - Deployment readiness checklist

## Creating Custom Prompts

\`\`\`
cc_prompt_mgmt action=add id=my-custom-review prompt='{
  "name": "My Custom Review",
  "description": "Custom code review for my team",
  "template": "Review this {{LANGUAGE}} code: {{CODE}}",
  "tags": ["custom", "team-specific"]
}'
\`\`\``;
            break;
        case 'template-variables':
            content = `# Template Variables Guide

## Variable Syntax

Use double curly braces for variables: \`{{VARIABLE_NAME}}\`

## Common Variables

### Code Analysis
- \`{{CODE}}\` - The source code to analyze
- \`{{FILE_TYPE}}\` - Type of file (e.g., "TypeScript", "Python")
- \`{{LANGUAGE}}\` - Programming language
- \`{{FILENAME}}\` - Name of the file

### Context Variables
- \`{{SYSTEM_TYPE}}\` - Type of system (cli, web-app, library)
- \`{{TEAM_SIZE}}\` - Number of developers
- \`{{USER_COUNT}}\` - Expected number of users
- \`{{PROJECT_STAGE}}\` - Current project stage

### Performance Variables
- \`{{EXPECTED_LOAD}}\` - Expected concurrent users
- \`{{PERFORMANCE_TARGET}}\` - Performance requirements
- \`{{TRAFFIC_PATTERN}}\` - Expected traffic patterns

## Example Template

\`\`\`
Analyze this {{LANGUAGE}} code for security issues:

{{CODE}}

Context:
- File: {{FILENAME}}
- System type: {{SYSTEM_TYPE}}
- Expected users: {{USER_COUNT}}

Focus on production security concerns.
\`\`\``;
            break;
        case 'categories':
            content = `# Prompt Categories

## Security
**Purpose**: Security vulnerability analysis and hardening
**Common Variables**: CODE, FILE_TYPE, SYSTEM_TYPE
**Examples**: SQL injection detection, XSS analysis, authentication review

## Performance
**Purpose**: Performance optimization and bottleneck identification
**Common Variables**: LANGUAGE, EXPECTED_LOAD, PERFORMANCE_TARGET
**Examples**: Algorithm optimization, memory analysis, scaling review

## Architecture
**Purpose**: Architectural pattern evaluation and design review
**Common Variables**: SYSTEM_TYPE, TEAM_SIZE, USER_COUNT
**Examples**: SOLID principles, design patterns, maintainability

## Code Review
**Purpose**: General code quality and best practices
**Common Variables**: CODE, FILENAME, PROJECT_STAGE
**Examples**: Production readiness, style guide compliance

## Debugging
**Purpose**: Bug investigation and troubleshooting
**Common Variables**: ERROR_MESSAGE, CODE, ENVIRONMENT
**Examples**: Error analysis, performance debugging

## Testing
**Purpose**: Test strategy and coverage analysis
**Common Variables**: CODE, TEST_TYPE, COVERAGE_TARGET
**Examples**: Unit testing, integration testing, test coverage

## Documentation
**Purpose**: Documentation and comment analysis
**Common Variables**: CODE, API_TYPE, AUDIENCE
**Examples**: API documentation, code comments, user guides

## Custom
**Purpose**: Project-specific or team-specific prompts
**Common Variables**: (varies by project)
**Examples**: Company-specific patterns, domain-specific analysis`;
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
 * Tools - Prompt management operations
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
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
        ],
    };
});
/**
 * Tool handlers - Prompt management functionality
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name !== 'cc_prompt_mgmt') {
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
    const action = String(request.params.arguments?.action || '');
    const id = request.params.arguments?.id;
    const category = request.params.arguments?.category;
    const prompt = request.params.arguments?.prompt;
    const variables = request.params.arguments?.variables;
    const query = request.params.arguments?.query;
    const filePath = request.params.arguments?.filePath;
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
                }
                else {
                    prompts.forEach(p => {
                        output += `🔹 ${p.id}\n`;
                        output += `   Name: ${p.name}\n`;
                        output += `   Category: ${p.category}\n`;
                        output += `   Description: ${p.description}\n`;
                        output += `   Tags: ${p.tags.join(', ')}\n`;
                        output += `   Variables: ${p.variables.join(', ')}\n\n`;
                    });
                }
                return { content: [{ type: 'text', text: output }] };
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
                return { content: [{ type: 'text', text: output }] };
            }
            case 'render': {
                if (!id || !variables) {
                    throw new Error('Prompt ID and variables are required for render action');
                }
                const rendered = await promptManager.renderPrompt(id, variables);
                let output = `🎯 RENDERED PROMPT: ${id}\n`;
                output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
                output += rendered;
                return { content: [{ type: 'text', text: output }] };
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
                return { content: [{ type: 'text', text: `✅ Added prompt: ${id}` }] };
            }
            case 'update': {
                if (!id || !prompt) {
                    throw new Error('Prompt ID and update data are required for update action');
                }
                await promptManager.updatePrompt(id, prompt);
                return { content: [{ type: 'text', text: `✅ Updated prompt: ${id}` }] };
            }
            case 'delete': {
                if (!id) {
                    throw new Error('Prompt ID is required for delete action');
                }
                await promptManager.deletePrompt(id);
                return { content: [{ type: 'text', text: `✅ Deleted prompt: ${id}` }] };
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
                }
                else {
                    results.forEach(p => {
                        output += `🔹 ${p.id} - ${p.name}\n`;
                        output += `   Category: ${p.category}\n`;
                        output += `   Description: ${p.description}\n\n`;
                    });
                }
                return { content: [{ type: 'text', text: output }] };
            }
            case 'export': {
                if (!filePath) {
                    throw new Error('File path is required for export action');
                }
                await promptManager.exportPrompts(filePath, category);
                return { content: [{ type: 'text', text: `✅ Exported prompts to: ${filePath}` }] };
            }
            case 'import': {
                if (!filePath) {
                    throw new Error('File path is required for import action');
                }
                const count = await promptManager.importPrompts(filePath, overwrite);
                return { content: [{ type: 'text', text: `✅ Imported ${count} prompts from: ${filePath}` }] };
            }
            default:
                throw new Error(`Unknown prompt management action: ${action}`);
        }
    }
    catch (error) {
        logger.error('Prompt management failed', { action, id }, error);
        throw new Error(`Prompt management failed: ${error.message}`);
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
//# sourceMappingURL=server.js.map