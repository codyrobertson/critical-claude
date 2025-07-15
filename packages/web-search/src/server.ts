#!/usr/bin/env node

/**
 * Critical Claude Web Search Service
 * Provides web search integration for fact-checking and vulnerability verification
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
import { WebSearchTool } from './web-search.js';

/**
 * Create the Web Search MCP server
 */
const server = createStandardMCPServer({
  name: 'Critical Claude Web Search',
  version: '1.0.0',
  description: 'Web search integration for fact-checking and vulnerability verification',
});

// Initialize web search tool
const webSearchTool = new WebSearchTool({
  enabled: true,
  searchDepth: 'comprehensive'
});

/**
 * Resources - Search guides and documentation
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'critical-claude://web-search/search-guide',
        mimeType: 'text/markdown',
        name: 'Web Search Guide',
        description: 'How to use web search for code analysis and fact-checking',
      },
      {
        uri: 'critical-claude://web-search/vulnerability-sources',
        mimeType: 'text/markdown',
        name: 'Vulnerability Sources',
        description: 'Authoritative sources for security vulnerability information',
      },
      {
        uri: 'critical-claude://web-search/best-practices',
        mimeType: 'text/markdown',
        name: 'Search Best Practices',
        description: 'Best practices for effective web search in code analysis',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const url = new URL(request.params.uri);
  const resourceId = url.pathname.replace(/^\/web-search\//, '');

  let content = '';

  switch (resourceId) {
    case 'search-guide':
      content = `# Web Search Guide

## Overview

The web search service provides real-time fact-checking and vulnerability verification to enhance code analysis accuracy.

## Core Capabilities

### Vulnerability Verification
- Cross-check security issues against CVE databases
- Verify exploitability of identified vulnerabilities
- Find recent security advisories for libraries

### Best Practice Validation
- Verify recommendations against current industry standards
- Check for updated security guidelines
- Validate architectural patterns

### Library Security Checks
- Identify known vulnerabilities in dependencies
- Check for security patches and updates
- Find alternative secure libraries

## Search Types

### Security Searches
- **CVE Lookup**: Search for specific vulnerabilities
- **Library Scanning**: Check npm/PyPI packages for known issues
- **Exploit Verification**: Confirm if vulnerabilities are actively exploited

### Best Practice Searches
- **Pattern Validation**: Verify architectural patterns
- **Framework Updates**: Check for security updates
- **Compliance Guidelines**: Find regulatory requirements

## Usage Examples

\`\`\`javascript
// Search for vulnerabilities in a specific library
await webSearchTool.searchForVulnerabilities(
  "express.js session handling",
  "authentication bypass"
);

// Verify best practices for a pattern
await webSearchTool.verifyBestPractices(
  "JWT token storage",
  "JavaScript"
);

// Check library security status
await webSearchTool.checkLibraryIssues([
  "express@4.18.0",
  "jsonwebtoken@8.5.1"
]);
\`\`\``;
      break;

    case 'vulnerability-sources':
      content = `# Authoritative Vulnerability Sources

## Primary Sources

### CVE Databases
- **NIST NVD**: National Vulnerability Database
- **MITRE CVE**: Common Vulnerabilities and Exposures
- **CVE Details**: Comprehensive vulnerability information

### Security Advisory Sources
- **GitHub Security Advisories**: Repository-specific vulnerabilities
- **npm Security Advisories**: Node.js package vulnerabilities
- **PyPI Security**: Python package security information
- **RubySec**: Ruby gem vulnerability database

### Vendor-Specific Sources
- **Microsoft Security**: Windows and .NET vulnerabilities
- **Oracle Security**: Java and database vulnerabilities
- **Google Project Zero**: Zero-day vulnerabilities
- **Red Hat Security**: Enterprise Linux vulnerabilities

## Package Managers
- **npm audit**: Node.js dependency scanning
- **pip-audit**: Python package vulnerability scanning
- **bundler-audit**: Ruby gem security checking
- **Cargo audit**: Rust crate vulnerability scanning

## Exploit Databases
- **Exploit-DB**: Verified exploits and proofs of concept
- **Metasploit**: Penetration testing framework exploits
- **Packet Storm**: Security tools and exploits

## Search Strategies

### High-Confidence Sources
1. Official CVE entries
2. Vendor security advisories
3. Package manager audit results
4. Security research publications

### Verification Steps
1. Cross-reference multiple sources
2. Check publication dates for relevance
3. Verify affected versions match
4. Confirm exploit feasibility`;
      break;

    case 'best-practices':
      content = `# Search Best Practices

## Effective Search Strategies

### Query Construction
- **Be Specific**: Include exact library names and versions
- **Use Technical Terms**: CVE, vulnerability, exploit, advisory
- **Include Context**: Programming language, framework, use case

### Source Prioritization
1. **Official Sources**: CVE databases, vendor advisories
2. **Security Research**: Academic papers, security blogs
3. **Community Sources**: Stack Overflow, GitHub issues
4. **News Sources**: Security news, breach reports

## Search Quality Guidelines

### High-Quality Indicators
- Recent publication dates (< 1 year for best practices)
- Authoritative sources (NIST, OWASP, vendors)
- Peer-reviewed or well-cited content
- Technical depth and specific examples

### Red Flags
- Outdated information (> 2 years old)
- Unverified claims without sources
- Generic advice without specifics
- Promotional content without substance

## Fact-Checking Process

### Verification Steps
1. **Source Credibility**: Check author credentials and publication
2. **Cross-Reference**: Verify claims across multiple sources
3. **Currency**: Ensure information is current and relevant
4. **Technical Accuracy**: Validate technical details

### Common Pitfalls
- Relying on single sources
- Using outdated security advice
- Misinterpreting vulnerability severity
- Ignoring context-specific factors

## Integration with Code Analysis

### When to Use Web Search
- **Security Vulnerabilities**: Always verify against CVE databases
- **Best Practices**: Check for updated guidelines
- **Library Issues**: Scan for known vulnerabilities
- **Compliance**: Verify regulatory requirements

### Search Result Integration
- Prioritize authoritative sources
- Include publication dates in recommendations
- Provide direct links to sources
- Summarize key findings clearly`;
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
 * Tools - Web search capabilities
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'cc_search_vulnerabilities',
        description: 'Search for security vulnerabilities and exploits',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Code snippet to analyze for vulnerabilities',
            },
            context: {
              type: 'string',
              description: 'Additional context about the vulnerability',
            },
            libraries: {
              type: 'array',
              items: { type: 'string' },
              description: 'Specific libraries to check for vulnerabilities',
            },
          },
          required: ['code'],
        },
      },
      {
        name: 'cc_verify_practices',
        description: 'Verify best practices against current industry standards',
        inputSchema: {
          type: 'object',
          properties: {
            pattern: {
              type: 'string',
              description: 'Code pattern or practice to verify',
            },
            language: {
              type: 'string',
              description: 'Programming language or technology',
            },
            domain: {
              type: 'string',
              description: 'Application domain (e.g., web, mobile, enterprise)',
            },
          },
          required: ['pattern', 'language'],
        },
      },
      {
        name: 'cc_check_libraries',
        description: 'Check libraries and dependencies for known security issues',
        inputSchema: {
          type: 'object',
          properties: {
            dependencies: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of dependencies to check (name@version format)',
            },
            ecosystem: {
              type: 'string',
              enum: ['npm', 'pypi', 'maven', 'nuget', 'cargo', 'gem'],
              description: 'Package ecosystem',
            },
          },
          required: ['dependencies'],
        },
      },
      {
        name: 'cc_fact_check',
        description: 'Fact-check claims or recommendations against authoritative sources',
        inputSchema: {
          type: 'object',
          properties: {
            claim: {
              type: 'string',
              description: 'Claim or recommendation to fact-check',
            },
            domain: {
              type: 'string',
              description: 'Technical domain for the claim',
            },
          },
          required: ['claim'],
        },
      },
    ],
  };
});

/**
 * Tool handlers - Web search functionality
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case 'cc_search_vulnerabilities': {
      const code = String(request.params.arguments?.code || '');
      const context = String(request.params.arguments?.context || '');
      const libraries = (request.params.arguments?.libraries as string[]) || [];

      if (!code) {
        throw new Error('Code is required for vulnerability search');
      }

      try {
        const findings = await webSearchTool.searchForVulnerabilities(code, context);
        
        let output = '🔍 VULNERABILITY SEARCH RESULTS\n';
        output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

        if (findings.length === 0) {
          output += '✅ No known vulnerabilities found in the provided code.\n';
        } else {
          findings.forEach((finding, index) => {
            output += `🚨 VULNERABILITY ${index + 1}\n`;
            output += `Type: ${finding.vulnerability}\n`;
            output += `Severity: ${finding.severity}\n`;
            output += `Description: ${finding.description}\n`;
            if (finding.cve) {
              output += `CVE: ${finding.cve}\n`;
            }
            if (finding.source) {
              output += `Source: ${finding.source}\n`;
            }
            output += `\n`;
          });
        }

        // Check specific libraries if provided
        if (libraries.length > 0) {
          const libraryIssues = await webSearchTool.checkLibraryIssues(libraries);
          if (libraryIssues.length > 0) {
            output += '\n📦 LIBRARY VULNERABILITIES\n';
            output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
            
            libraryIssues.forEach(issue => {
              output += `🔴 ${issue.library}\n`;
              output += `Issues: ${issue.issues.join(', ')}\n`;
              if (issue.version) {
                output += `Version: ${issue.version}\n`;
              }
              if (issue.alternatives && issue.alternatives.length > 0) {
                output += `Alternatives: ${issue.alternatives.join(', ')}\n`;
              }
              output += `\n`;
            });
          }
        }

        return {
          content: [{ type: 'text', text: output }],
        };
      } catch (error) {
        logger.error('Vulnerability search failed', error as Error);
        throw new Error(`Vulnerability search failed: ${(error as Error).message}`);
      }
    }

    case 'cc_verify_practices': {
      const pattern = String(request.params.arguments?.pattern || '');
      const language = String(request.params.arguments?.language || '');
      const domain = String(request.params.arguments?.domain || '');

      if (!pattern || !language) {
        throw new Error('Pattern and language are required for practice verification');
      }

      try {
        const practices = await webSearchTool.verifyBestPractices(pattern, language);
        
        let output = `🎯 BEST PRACTICE VERIFICATION: ${pattern}\n`;
        output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

        if (practices.length === 0) {
          output += '⚠️ No specific best practices found for this pattern.\n';
        } else {
          practices.forEach((practice, index) => {
            output += `📋 RECOMMENDATION ${index + 1}\n`;
            output += `Practice: ${practice.practice}\n`;
            output += `Description: ${practice.description}\n`;
            output += `Confidence: ${practice.confidence}\n`;
            if (practice.source) {
              output += `Source: ${practice.source}\n`;
            }
            output += `Confidence: ${(practice.confidence * 100).toFixed(0)}%\n`;
            output += `\n`;
          });
        }

        return {
          content: [{ type: 'text', text: output }],
        };
      } catch (error) {
        logger.error('Best practice verification failed', error as Error);
        throw new Error(`Best practice verification failed: ${(error as Error).message}`);
      }
    }

    case 'cc_check_libraries': {
      const dependencies = (request.params.arguments?.dependencies as string[]) || [];
      const ecosystem = String(request.params.arguments?.ecosystem || 'npm');

      if (dependencies.length === 0) {
        throw new Error('Dependencies list is required for library checking');
      }

      try {
        const issues = await webSearchTool.checkLibraryIssues(dependencies);
        
        let output = '📦 LIBRARY SECURITY CHECK\n';
        output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

        if (issues.length === 0) {
          output += '✅ No known security issues found in the checked libraries.\n';
        } else {
          issues.forEach(issue => {
            output += `🔴 ${issue.library}\n`;
            output += `Issues: ${issue.issues.join(', ')}\n`;
            if (issue.version) {
              output += `Version: ${issue.version}\n`;
            }
            if (issue.alternatives && issue.alternatives.length > 0) {
              output += `Alternatives: ${issue.alternatives.join(', ')}\n`;
            }
            output += `Source: ${issue.source}\n`;
            output += `\n`;
          });
        }

        return {
          content: [{ type: 'text', text: output }],
        };
      } catch (error) {
        logger.error('Library checking failed', error as Error);
        throw new Error(`Library checking failed: ${(error as Error).message}`);
      }
    }

    case 'cc_fact_check': {
      const claim = String(request.params.arguments?.claim || '');
      const domain = String(request.params.arguments?.domain || '');

      if (!claim) {
        throw new Error('Claim is required for fact-checking');
      }

      try {
        // For now, return a placeholder implementation
        // In a real implementation, this would search authoritative sources
        let output = `🔍 FACT-CHECK RESULTS: ${claim}\n`;
        output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        output += '⚠️ Fact-checking functionality is currently in development.\n';
        output += 'Please verify claims against authoritative sources manually.\n';

        return {
          content: [{ type: 'text', text: output }],
        };
      } catch (error) {
        logger.error('Fact-checking failed', error as Error);
        throw new Error(`Fact-checking failed: ${(error as Error).message}`);
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