#!/usr/bin/env node
/**
 * Critical Claude Code Critique Service
 * Focused on code analysis, security, and performance review
 */
import { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { logger, InputValidator, ErrorHandler, createStandardMCPServer, startMCPServer, setupGracefulShutdown, } from '@critical-claude/core';
import { PragmaticCritiqueEngine } from './engines/pragmatic-critique-engine.js';
/**
 * Create the Code Critique MCP server
 */
const server = createStandardMCPServer({
    name: 'Critical Claude Code Critique',
    version: '1.0.0',
    description: 'Advanced code analysis and security review service',
});
// Initialize critique engine
const critiqueEngine = new PragmaticCritiqueEngine();
/**
 * Resources - Documentation and guides
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: [
            {
                uri: 'critical-claude://code-critique/philosophy',
                mimeType: 'text/markdown',
                name: 'Code Critique Philosophy',
                description: 'Working code beats perfect code in refactoring hell',
            },
            {
                uri: 'critical-claude://code-critique/security-guide',
                mimeType: 'text/markdown',
                name: 'Security Analysis Guide',
                description: 'Comprehensive security vulnerability detection',
            },
            {
                uri: 'critical-claude://code-critique/performance-guide',
                mimeType: 'text/markdown',
                name: 'Performance Analysis Guide',
                description: 'Performance bottleneck identification and optimization',
            },
        ],
    };
});
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const url = new URL(request.params.uri);
    const resourceId = url.pathname.replace(/^\/code-critique\//, '');
    let content = '';
    switch (resourceId) {
        case 'philosophy':
            content = `# Code Critique Philosophy

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
- "Singleton abuse" in CLI tools (they're process-scoped!)`;
            break;
        case 'security-guide':
            content = `# Security Analysis Guide

## Detection Patterns

### SQL Injection
- String concatenation in queries
- Missing parameterized queries
- Dynamic query building without sanitization

### XSS Vulnerabilities
- Direct DOM manipulation without sanitization
- User input in HTML context
- Missing content security policies

### Authentication Issues
- Hardcoded credentials
- Weak session management
- Missing authorization checks

### Data Exposure
- Sensitive data in logs
- Unencrypted data transmission
- Inadequate access controls`;
            break;
        case 'performance-guide':
            content = `# Performance Analysis Guide

## Common Bottlenecks

### Algorithmic Issues
- O(n²) algorithms in hot paths
- Nested loops over large datasets
- Inefficient sorting and searching

### Memory Problems
- Memory leaks from unclosed resources
- Large object allocations
- Inefficient data structures

### Database Issues
- N+1 query problems
- Missing indexes
- Inefficient query patterns

### Network Issues
- Synchronous blocking calls
- Missing connection pooling
- Inefficient serialization`;
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
 * Tools - Code analysis capabilities
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
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
                        context: {
                            type: 'object',
                            description: 'Additional context about the system',
                            properties: {
                                systemType: {
                                    type: 'string',
                                    enum: ['cli', 'web-small', 'web-large', 'library', 'enterprise'],
                                    description: 'Type of system being analyzed',
                                },
                                userCount: {
                                    type: 'number',
                                    description: 'Expected number of users',
                                },
                                enableFactChecking: {
                                    type: 'boolean',
                                    description: 'Enable web search fact-checking',
                                },
                            },
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
                                userCount: {
                                    type: 'number',
                                    description: 'Current number of users',
                                },
                                teamSize: {
                                    type: 'number',
                                    description: 'Development team size',
                                },
                                currentProblems: {
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
        ],
    };
});
/**
 * Tool handlers - Core analysis functionality
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
            const code = codeValidation.sanitized;
            const filename = filenameValidation.sanitized;
            const context = request.params.arguments?.context || {};
            // Use error boundary
            const analyzeWithErrorHandling = ErrorHandler.wrapAsync(critiqueEngine.analyzeCode.bind(critiqueEngine), 'cc_crit_code');
            const result = await analyzeWithErrorHandling(code, filename, context);
            const formattedOutput = critiqueEngine.formatPragmaticFeedback(result);
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
            const context = request.params.arguments?.context || {};
            if (!code) {
                throw new Error('Code is required for architecture review');
            }
            // Use the same engine but focus on architecture
            const result = await critiqueEngine.analyzeCode(code, filename, context);
            // Add context-specific insights
            let contextInsights = '\n\n🎯 CONTEXT-SPECIFIC INSIGHTS:\n';
            if (context.userCount) {
                contextInsights += `Current scale: ${context.userCount} users\n`;
                if (context.userCount < 1000) {
                    contextInsights += '→ Focus on shipping features, not premature scaling\n';
                }
            }
            if (context.teamSize) {
                contextInsights += `Team size: ${context.teamSize} developers\n`;
                if (context.teamSize < 5) {
                    contextInsights += '→ Keep architecture simple - small team advantage\n';
                }
            }
            if (context.currentProblems?.length > 0) {
                contextInsights += `Actual problems: ${context.currentProblems.join(', ')}\n`;
                contextInsights += '→ Fix these real issues before theoretical ones\n';
            }
            const formattedOutput = critiqueEngine.formatPragmaticFeedback(result) + contextInsights;
            return {
                content: [
                    {
                        type: 'text',
                        text: formattedOutput,
                    },
                ],
            };
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
//# sourceMappingURL=server.js.map