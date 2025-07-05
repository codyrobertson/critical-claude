#!/usr/bin/env node

/**
 * Brutal Code Critique MCP Server
 * Pragmatic code review with brutal honesty - context matters!
 * 
 * Mission: Identify REAL problems that affect users, not theoretical violations
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { CodebaseExplorer, CodebaseStructure, ArchitecturalPlan } from "./codebase-explorer.js";
import { PathValidator } from "./path-validator.js";
import { logger, LogLevel } from "./logger.js";
import { Semaphore } from "./semaphore.js";
import { BrutalPlanEngine } from "./brutal-plan-engine.js";
import fs from 'fs/promises';

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
  brutal_feedback: string;
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

/**
 * Pragmatic Code Critique Engine
 * Battle-hardened but understands context matters
 */
class PragmaticCritiqueEngine {
  /**
   * Detect what kind of system we're dealing with
   */
  private detectSystemType(code: string, filename: string): SystemType {
    // CLI tool indicators
    if (filename.includes('cli') || code.includes('process.argv') || code.includes('commander')) {
      return 'cli';
    }
    
    // Small web app indicators
    if ((code.includes('express') || code.includes('fastify')) && !code.includes('microservice')) {
      return 'web-small';
    }
    
    // Large web app indicators
    if (code.includes('kafka') || code.includes('redis.cluster') || code.includes('loadBalancer')) {
      return 'web-large';
    }
    
    // Library indicators
    if (code.includes('export class') && code.includes('/**') && !code.includes('app.listen')) {
      return 'library';
    }
    
    // Enterprise indicators
    if (code.includes('microservice') || code.includes('eventBus') || code.includes('saga')) {
      return 'enterprise';
    }
    
    return 'unknown';
  }

  /**
   * Analyzes code with brutal honesty but pragmatic context
   */
  async analyzeCode(code: string, filename: string): Promise<CritiqueResult> {
    const systemType = this.detectSystemType(code, filename);
    const issues: CodeIssue[] = [];
    const goodDecisions: string[] = [];
    const overEngineeringRisks: string[] = [];
    
    // Context-aware analysis
    this.analyzeSecurity(code, filename, systemType, issues);
    this.analyzePerformance(code, filename, systemType, issues);
    this.analyzeArchitecture(code, filename, systemType, issues, goodDecisions, overEngineeringRisks);
    this.analyzeCodeQuality(code, filename, systemType, issues);
    
    // Count real problems
    const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
    const highCount = issues.filter(i => i.severity === 'HIGH').length;
    
    // Determine verdict based on REAL problems
    let verdict: 'BLOCKED' | 'CONDITIONAL' | 'APPROVED' = 'APPROVED';
    if (criticalCount > 0) {
      verdict = 'BLOCKED';
    } else if (highCount > 0) {
      verdict = 'CONDITIONAL';
    }
    
    // Generate pragmatic action plan
    const actionPlan = this.generateActionPlan(issues, systemType);
    
    return {
      system_context: systemType,
      deployment_verdict: verdict,
      critical_count: criticalCount,
      high_count: highCount,
      issues,
      good_decisions: goodDecisions.length > 0 ? goodDecisions : ["Code is working - that's already a win"],
      over_engineering_risks: overEngineeringRisks,
      action_plan: actionPlan
    };
  }

  private analyzeSecurity(code: string, filename: string, systemType: SystemType, issues: CodeIssue[]): void {
    // SQL Injection - ALWAYS CRITICAL
    // Check for string interpolation in SQL queries
    if ((code.includes('query(') || code.includes('execute(') || code.includes('SELECT') || code.includes('INSERT') || code.includes('UPDATE') || code.includes('DELETE')) 
        && (code.includes('${') || code.includes('" +') || code.includes("' +"))) {
      issues.push({
        type: 'SECURITY',
        severity: 'CRITICAL',
        location: { file: filename, lines: [this.findLineNumber(code, 'query(')] },
        brutal_feedback: "SQL injection vulnerability - this WILL get exploited",
        actual_impact: "Complete database compromise, data theft, regulatory fines",
        fix: {
          description: "Use parameterized queries",
          working_code: `// Instead of: query(\`SELECT * FROM users WHERE id = \${userId}\`)
// Use: query('SELECT * FROM users WHERE id = ?', [userId])`,
          complexity: 'simple',
          roi: 'high'
        }
      });
    }
    
    // XSS - Check for any dynamic HTML insertion
    if (code.includes('innerHTML') && (code.includes('${') || code.includes('" +') || code.includes("' +"))) {
      issues.push({
        type: 'SECURITY',
        severity: 'HIGH',
        location: { file: filename, lines: [this.findLineNumber(code, 'innerHTML')] },
        brutal_feedback: "XSS vulnerability - user input in innerHTML",
        actual_impact: "User account takeover, malicious script execution",
        fix: {
          description: "Sanitize user input or use textContent",
          working_code: `element.textContent = userInput; // Safe
// Or: element.innerHTML = DOMPurify.sanitize(userInput);`,
          complexity: 'simple',
          roi: 'high'
        }
      });
    }
    
    // eval() - ALWAYS BAD
    if (code.includes('eval(') || code.includes('new Function(')) {
      issues.push({
        type: 'SECURITY',
        severity: 'CRITICAL',
        location: { file: filename, lines: [this.findLineNumber(code, 'eval(')] },
        brutal_feedback: "Code execution vulnerability - this is never acceptable",
        actual_impact: "Remote code execution, complete system compromise",
        fix: {
          description: "Remove eval/Function constructor entirely",
          working_code: `// Parse JSON: JSON.parse(data)
// Execute dynamic functions: Use a safe function map`,
          complexity: 'moderate',
          roi: 'high'
        }
      });
    }
  }

  private analyzePerformance(code: string, filename: string, systemType: SystemType, issues: CodeIssue[]): void {
    // O(n²) algorithms - severity depends on context
    const nestedLoops = (code.match(/for\s*\(/g) || []).length;
    if (nestedLoops >= 2 && code.includes('indexOf')) {
      const severity = systemType === 'cli' ? 'LOW' : 
                      systemType === 'web-large' ? 'HIGH' : 'MEDIUM';
      
      if (severity !== 'LOW') {
        issues.push({
          type: 'PERFORMANCE',
          severity: severity as IssueSeverity,
          location: { file: filename, lines: [this.findLineNumber(code, 'for')] },
          brutal_feedback: "O(n²) algorithm - this will hurt at scale",
          actual_impact: systemType === 'web-large' ? 
            "Response times will degrade with user growth, causing timeouts" :
            "Noticeable slowdown with larger datasets",
          fix: {
            description: "Use Map/Set for O(1) lookups",
            working_code: `const lookupMap = new Map(items.map(item => [item.id, item]));
// Now lookups are O(1) instead of O(n)`,
            complexity: 'simple',
            roi: systemType === 'web-large' ? 'high' : 'medium'
          }
        });
      }
    }
    
    // Memory leaks - always important
    if (code.includes('setInterval') && !code.includes('clearInterval')) {
      issues.push({
        type: 'PERFORMANCE',
        severity: 'HIGH',
        location: { file: filename, lines: [this.findLineNumber(code, 'setInterval')] },
        brutal_feedback: "Memory leak - your app will crash eventually",
        actual_impact: "Memory exhaustion leading to crashes and restarts",
        fix: {
          description: "Always clear intervals",
          working_code: `const intervalId = setInterval(() => {}, 1000);
// In cleanup/unmount:
clearInterval(intervalId);`,
          complexity: 'simple',
          roi: 'high'
        }
      });
    }
    
    // Synchronous I/O in web apps
    if (systemType !== 'cli' && code.includes('readFileSync')) {
      issues.push({
        type: 'PERFORMANCE',
        severity: 'HIGH',
        location: { file: filename, lines: [this.findLineNumber(code, 'readFileSync')] },
        brutal_feedback: "Synchronous I/O blocks the event loop",
        actual_impact: "All requests blocked while file reads, terrible UX",
        fix: {
          description: "Use async file operations",
          working_code: `const data = await fs.promises.readFile(path, 'utf8');
// Or: fs.readFile(path, 'utf8', (err, data) => {});`,
          complexity: 'simple',
          roi: 'high'
        }
      });
    }
  }

  private analyzeArchitecture(
    code: string, 
    filename: string, 
    systemType: SystemType, 
    issues: CodeIssue[], 
    goodDecisions: string[],
    overEngineeringRisks: string[]
  ): void {
    // Singletons in CLI tools - PERFECTLY FINE
    if (systemType === 'cli' && code.includes('getInstance()')) {
      goodDecisions.push("Singleton pattern is perfect for CLI tools - process-scoped state is fine");
    }
    
    // Direct dependencies without interfaces - CHECK CONTEXT
    const hasInterface = code.includes('interface ') && code.includes('implements ');
    const hasSingleImplementation = (code.match(/implements /g) || []).length === 1;
    
    if (hasInterface && hasSingleImplementation) {
      overEngineeringRisks.push("Interface with single implementation - YAGNI applies here");
      issues.push({
        type: 'OVER_ENGINEERING',
        severity: 'THEORETICAL',
        location: { file: filename, lines: [1] },
        brutal_feedback: "Interface for single implementation - premature abstraction",
        actual_impact: "Extra complexity with no benefit - makes code harder to navigate"
      });
    }
    
    // God functions - size matters but context matters more
    const lines = code.split('\n').length;
    if (lines > 200 && code.includes('function')) {
      if (systemType !== 'cli' || lines > 500) {
        issues.push({
          type: 'ARCHITECTURE',
          severity: systemType === 'cli' ? 'MEDIUM' : 'HIGH',
          location: { file: filename, lines: [1, lines] },
          brutal_feedback: "Function too large - becoming unmaintainable",
          actual_impact: "Hard to test, debug, or modify without breaking things",
          fix: {
            description: "Break into focused functions",
            working_code: `// Extract cohesive operations:
function validateInput(data) { /* validation */ }
function processData(data) { /* core logic */ }
function formatOutput(result) { /* formatting */ }`,
            complexity: 'moderate',
            roi: 'medium'
          }
        });
      }
    }
    
    // Factory pattern abuse
    if (code.includes('Factory') && code.includes('create') && systemType === 'cli') {
      const createCalls = (code.match(/create/g) || []).length;
      if (createCalls < 3) {
        overEngineeringRisks.push("Factory pattern for simple object creation - just use 'new'");
      }
    }
    
    // Microservices in small apps
    if (systemType === 'web-small' && code.includes('microservice')) {
      issues.push({
        type: 'OVER_ENGINEERING',
        severity: 'HIGH',
        location: { file: filename, lines: [1] },
        brutal_feedback: "Microservices for a small app - massive operational overhead",
        actual_impact: "10x complexity, deployment nightmares, debugging hell",
        fix: {
          description: "Use a modular monolith instead",
          working_code: `// Keep modules separate but deploy together:
// src/users/user.service.ts
// src/orders/order.service.ts
// Deploy as single app with clear boundaries`,
          complexity: 'complex',
          roi: 'high'
        }
      });
    }
  }

  private analyzeCodeQuality(code: string, filename: string, systemType: SystemType, issues: CodeIssue[]): void {
    // Missing error handling - always important
    if (code.includes('try') && !code.includes('catch')) {
      issues.push({
        type: 'QUALITY',
        severity: 'HIGH',
        location: { file: filename, lines: [this.findLineNumber(code, 'try')] },
        brutal_feedback: "Try without catch - errors will vanish into the void",
        actual_impact: "Silent failures, corrupted state, impossible debugging",
        fix: {
          description: "Add proper error handling",
          working_code: `try {
  // risky operation
} catch (error) {
  logger.error('Operation failed:', error);
  // Handle appropriately - retry, fallback, or propagate
}`,
          complexity: 'simple',
          roi: 'high'
        }
      });
    }
    
    // var usage - only mention if asked
    if (code.includes('var ')) {
      issues.push({
        type: 'QUALITY',
        severity: 'THEORETICAL',
        location: { file: filename, lines: [this.findLineNumber(code, 'var ')] },
        brutal_feedback: "Using var in 2024 - const/let are better",
        actual_impact: "Minor - potential scoping confusion"
      });
    }
  }

  private findLineNumber(code: string, searchTerm: string): number {
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchTerm)) {
        return i + 1;
      }
    }
    return 1;
  }

  private generateActionPlan(issues: CodeIssue[], systemType: SystemType): CritiqueResult['action_plan'] {
    const immediate: string[] = [];
    const nextSprint: string[] = [];
    const niceToHave: string[] = [];
    const avoid: string[] = [];
    
    issues.forEach(issue => {
      const desc = `Fix ${issue.type} issue at ${issue.location.file}:${issue.location.lines[0]}`;
      
      switch (issue.severity) {
        case 'CRITICAL':
          immediate.push(desc + ' - ' + issue.brutal_feedback);
          break;
        case 'HIGH':
          nextSprint.push(desc + ' - ' + issue.actual_impact);
          break;
        case 'MEDIUM':
          niceToHave.push(desc);
          break;
        case 'THEORETICAL':
          // Don't add to any action list
          break;
      }
    });
    
    // Context-specific advice
    if (systemType === 'cli') {
      avoid.push("Don't add dependency injection unless you have multiple implementations");
      avoid.push("Don't split into microservices - it's a CLI tool!");
    }
    
    if (systemType === 'web-small') {
      avoid.push("Don't add event sourcing or CQRS - you're not Netflix");
      avoid.push("Don't optimize for millions of users until you have thousands");
    }
    
    return { immediate, next_sprint: nextSprint, nice_to_have: niceToHave, avoid };
  }

  /**
   * Formats pragmatic feedback for MCP response
   */
  formatPragmaticFeedback(result: CritiqueResult): string {
    let output = "🔥 BRUTAL CODE REVIEW RESULTS 🔥\n";
    output += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    
    output += `📊 SYSTEM CONTEXT: ${result.system_context.toUpperCase()}\n`;
    output += `📊 DEPLOYMENT VERDICT: ${result.deployment_verdict}\n`;
    output += `⚡ Critical Issues: ${result.critical_count} - MUST FIX BEFORE DEPLOYMENT\n`;
    output += `⚠️  High Priority: ${result.high_count} - FIX BEFORE MERGE\n`;
    output += `📝 Total Issues: ${result.issues.length}\n\n`;
    
    // Critical issues that actually matter
    const criticalIssues = result.issues.filter(i => i.severity === 'CRITICAL');
    if (criticalIssues.length > 0) {
      output += "🚨 CRITICAL ISSUES - DEPLOYMENT BLOCKED\n";
      output += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
      
      criticalIssues.forEach((issue, index) => {
        output += `${index + 1}. ${issue.type}\n`;
        output += `📄 Location: ${issue.location.file}:${issue.location.lines.join(',')}\n`;
        output += `❌ Issue: ${issue.brutal_feedback}\n`;
        output += `💀 Impact: ${issue.actual_impact}\n`;
        if (issue.fix) {
          output += `🔧 Fix (${issue.fix.complexity}, ROI: ${issue.fix.roi}): ${issue.fix.description}\n`;
          output += `\`\`\`\n${issue.fix.working_code}\n\`\`\`\n`;
        }
        output += '\n';
      });
    }
    
    // High priority issues
    const highIssues = result.issues.filter(i => i.severity === 'HIGH');
    if (highIssues.length > 0) {
      output += "⚠️  HIGH PRIORITY FIXES REQUIRED\n";
      output += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
      
      highIssues.forEach((issue, index) => {
        output += `${index + 1}. ${issue.type}\n`;
        output += `📄 Location: ${issue.location.file}:${issue.location.lines.join(',')}\n`;
        output += `⚠️  Issue: ${issue.brutal_feedback}\n`;
        output += `📊 Impact: ${issue.actual_impact}\n`;
        if (issue.fix) {
          output += `🔧 Fix: ${issue.fix.description}\n`;
        }
        output += '\n';
      });
    }
    
    // Good decisions
    output += "💚 GOOD ARCHITECTURAL DECISIONS\n";
    output += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    result.good_decisions.forEach(decision => {
      output += `✅ ${decision}\n`;
    });
    output += '\n';
    
    // Over-engineering risks
    if (result.over_engineering_risks.length > 0) {
      output += "⚠️  OVER-ENGINEERING RISKS\n";
      output += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
      result.over_engineering_risks.forEach(risk => {
        output += `❌ ${risk}\n`;
      });
      output += '\n';
    }
    
    // Pragmatic action plan
    output += "📋 IMPLEMENTATION CHECKLIST\n";
    output += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    
    if (result.action_plan.immediate.length > 0) {
      output += "Immediate Actions (Before deployment):\n";
      result.action_plan.immediate.forEach(action => {
        output += `□ ${action}\n`;
      });
      output += '\n';
    }
    
    if (result.action_plan.next_sprint.length > 0) {
      output += "Sprint Actions (Before next release):\n";
      result.action_plan.next_sprint.forEach(action => {
        output += `□ ${action}\n`;
      });
      output += '\n';
    }
    
    if (result.action_plan.nice_to_have.length > 0) {
      output += "Nice to Have (When time permits):\n";
      result.action_plan.nice_to_have.forEach(action => {
        output += `□ ${action}\n`;
      });
      output += '\n';
    }
    
    if (result.action_plan.avoid.length > 0) {
      output += "Never (Avoid These):\n";
      result.action_plan.avoid.forEach(action => {
        output += `□ ${action}\n`;
      });
    }
    
    output += "\n💭 Remember: Perfect is the enemy of good. Ship working code that solves real problems.";
    
    return output;
  }
}

// Global instance of the pragmatic critique engine
const pragmaticEngine = new PragmaticCritiqueEngine();
const codebaseExplorer = new CodebaseExplorer();

/**
 * Create an MCP server with pragmatic brutal code critiques
 */
const server = new Server(
  {
    name: "Brutal Code Critique MCP Server",
    version: "2.0.0",
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
        uri: "critique://pragmatic-philosophy",
        mimeType: "text/markdown",
        name: "Pragmatic Code Review Philosophy",
        description: "Working code beats perfect code in refactoring hell"
      },
      {
        uri: "critique://context-guide",
        mimeType: "text/markdown",
        name: "Context-Aware Critique Guide",
        description: "Different systems need different architecture"
      },
      {
        uri: "critique://anti-patterns",
        mimeType: "text/markdown",
        name: "Over-Engineering Anti-Patterns",
        description: "When NOT to apply enterprise patterns"
      }
    ]
  };
});

/**
 * Handler for reading critique resources.
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const url = new URL(request.params.uri);
  const resourceId = url.pathname.replace(/^\//, '');

  let content = "";
  
  switch (resourceId) {
    case "pragmatic-philosophy":
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
      
    case "context-guide":
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
      
    case "anti-patterns":
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
    contents: [{
      uri: request.params.uri,
      mimeType: "text/markdown",
      text: content
    }]
  };
});

/**
 * Handler that lists available tools.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "pragmatic_review",
        description: "Pragmatic code review that identifies REAL problems, not theoretical issues",
        inputSchema: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "The source code to analyze"
            },
            filename: {
              type: "string",
              description: "Name of the file being analyzed (helps determine context)"
            }
          },
          required: ["code", "filename"]
        }
      },
      {
        name: "architecture_review",
        description: "Architecture review that matches patterns to problem size",
        inputSchema: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "The source code to analyze"
            },
            filename: {
              type: "string",
              description: "Name of the file being analyzed"
            },
            context: {
              type: "object",
              description: "Additional context about the system",
              properties: {
                user_count: {
                  type: "number",
                  description: "Current number of users"
                },
                team_size: {
                  type: "number",
                  description: "Development team size"
                },
                current_problems: {
                  type: "array",
                  items: { type: "string" },
                  description: "Actual problems being experienced"
                }
              }
            }
          },
          required: ["code", "filename"]
        }
      },
      {
        name: "explore_codebase",
        description: "Explores entire codebase structure to understand architecture and identify patterns",
        inputSchema: {
          type: "object",
          properties: {
            rootPath: {
              type: "string",
              description: "Root directory path of the codebase to explore"
            }
          },
          required: ["rootPath"]
        }
      },
      {
        name: "brutal_plan",
        description: "Creates a brutal but pragmatic architectural improvement plan based on codebase analysis",
        inputSchema: {
          type: "object",
          properties: {
            rootPath: {
              type: "string",
              description: "Root directory path of the codebase"
            },
            includeAnalysis: {
              type: "boolean",
              description: "Whether to run full analysis on key files",
              default: true
            }
          },
          required: ["rootPath"]
        }
      },
      {
        name: "brutal_timeline",
        description: "Generate a brutal reality-check implementation plan with realistic timelines",
        inputSchema: {
          type: "object",
          properties: {
            requirement: {
              type: "string",
              description: "The feature or project requirement/description"
            },
            estimatedDays: {
              type: "number",
              description: "Your optimistic estimate in days (default: 10)"
            },
            context: {
              type: "object",
              description: "Project context",
              properties: {
                teamSize: {
                  type: "number",
                  description: "Number of developers"
                },
                hasDeadline: {
                  type: "boolean",
                  description: "Is there a hard deadline?"
                },
                techStack: {
                  type: "array",
                  items: { type: "string" },
                  description: "Technology stack being used"
                }
              }
            }
          },
          required: ["requirement"]
        }
      }
    ]
  };
});

/**
 * Handler for pragmatic code critique tools.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "pragmatic_review": {
      const code = String(request.params.arguments?.code || "");
      const filename = String(request.params.arguments?.filename || "unknown.js");
      
      if (!code) {
        throw new Error("Code is required for review");
      }

      const result = await pragmaticEngine.analyzeCode(code, filename);
      const formattedOutput = pragmaticEngine.formatPragmaticFeedback(result);

      return {
        content: [{
          type: "text",
          text: formattedOutput
        }]
      };
    }

    case "architecture_review": {
      const code = String(request.params.arguments?.code || "");
      const filename = String(request.params.arguments?.filename || "unknown.js");
      const context = request.params.arguments?.context as any || {};
      
      if (!code) {
        throw new Error("Code is required for architecture review");
      }

      // Use the same engine but focus on architecture
      const result = await pragmaticEngine.analyzeCode(code, filename);
      
      // Add context-specific insights
      let contextInsights = "\n\n🎯 CONTEXT-SPECIFIC INSIGHTS:\n";
      if (context.user_count) {
        contextInsights += `Current scale: ${context.user_count} users\n`;
        if (context.user_count < 1000) {
          contextInsights += "→ Focus on shipping features, not premature scaling\n";
        }
      }
      if (context.team_size) {
        contextInsights += `Team size: ${context.team_size} developers\n`;
        if (context.team_size < 5) {
          contextInsights += "→ Keep architecture simple - small team advantage\n";
        }
      }
      if (context.current_problems?.length > 0) {
        contextInsights += `Actual problems: ${context.current_problems.join(', ')}\n`;
        contextInsights += "→ Fix these real issues before theoretical ones\n";
      }
      
      const formattedOutput = pragmaticEngine.formatPragmaticFeedback(result) + contextInsights;

      return {
        content: [{
          type: "text",
          text: formattedOutput
        }]
      };
    }

    case "explore_codebase": {
      const rootPath = String(request.params.arguments?.rootPath || "");
      
      if (!rootPath) {
        logger.error("Missing root path parameter");
        throw new Error("Root path is required for codebase exploration. Please provide a valid directory path.");
      }

      logger.info("Starting codebase exploration", { rootPath });

      try {
        const structure = await codebaseExplorer.exploreCodebase(rootPath);
        
        let output = "🔍 CODEBASE STRUCTURE ANALYSIS 🔍\n";
        output += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
        
        output += `📁 Root: ${structure.rootPath}\n`;
        output += `📊 Total Files: ${structure.totalFiles}\n`;
        output += `💾 Total Size: ${(structure.totalSize / 1024 / 1024).toFixed(2)} MB\n`;
        output += `🔤 Main Languages: ${structure.mainLanguages.join(', ')}\n`;
        output += `🚀 Frameworks: ${structure.frameworkIndicators.join(', ') || 'None detected'}\n`;
        output += `🏗️  Architecture Patterns: ${structure.architecturePatterns.join(', ') || 'None detected'}\n\n`;
        
        output += "📊 FILE DISTRIBUTION:\n";
        output += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        
        const sortedTypes = Array.from(structure.filesByType.entries())
          .sort((a, b) => b[1].length - a[1].length)
          .slice(0, 10);
        
        sortedTypes.forEach(([ext, files]) => {
          output += `${ext}: ${files.length} files\n`;
        });
        
        output += "\n📁 KEY DIRECTORIES:\n";
        output += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        
        const keyDirs = structure.directories
          .filter(d => d.fileCount > 5)
          .sort((a, b) => b.fileCount - a.fileCount)
          .slice(0, 10);
        
        keyDirs.forEach(dir => {
          const relPath = dir.path.replace(structure.rootPath, '.');
          output += `${relPath}: ${dir.fileCount} files, ${(dir.totalSize / 1024).toFixed(1)} KB\n`;
        });

        logger.info("Codebase exploration completed successfully", { 
          totalFiles: structure.totalFiles 
        });

        return {
          content: [{
            type: "text",
            text: output
          }]
        };
      } catch (error) {
        logger.error("Codebase exploration failed", { rootPath }, error as Error);
        throw new Error(`Failed to explore codebase: ${(error as Error).message}`);
      }
    }

    case "brutal_plan": {
      const rootPath = String(request.params.arguments?.rootPath || "");
      const includeAnalysis = request.params.arguments?.includeAnalysis !== false;
      
      if (!rootPath) {
        throw new Error("Root path is required for creating a brutal plan");
      }

      const structure = await codebaseExplorer.exploreCodebase(rootPath);
      
      // If includeAnalysis is true, analyze some key files with resource protection
      const issues: any[] = [];
      if (includeAnalysis && structure.filesByType.get('.ts')?.length) {
        logger.info("Analyzing key TypeScript files for issues");
        
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
                logger.warn("Skipping unsafe file path", { path: file.path });
                return [];
              }

              // Check file size before reading to prevent memory exhaustion
              const stats = await fs.stat(file.path);
              if (stats.size > MAX_FILE_SIZE_FOR_ANALYSIS) {
                logger.warn('File too large for analysis, skipping', { 
                  path: file.path, 
                  size: stats.size,
                  maxSize: MAX_FILE_SIZE_FOR_ANALYSIS
                });
                return [];
              }

              const code = await fs.readFile(file.path, 'utf8');
              const result = await pragmaticEngine.analyzeCode(code, file.path);
              logger.debug("File analysis completed", { 
                file: file.path, 
                issueCount: result.issues.length,
                concurrentOps: MAX_CONCURRENT_ANALYSIS - analysisSemaphore.availablePermits
              });
              return result.issues;
            } catch (error) {
              logger.warn("Failed to analyze file", { 
                path: file.path, 
                error: (error as Error).message 
              });
              return [];
            }
          });
        });

        const allIssues = await Promise.all(analysisPromises);
        issues.push(...allIssues.flat());
        
        logger.info("Analysis completed", { 
          filesAnalyzed: tsFiles.length,
          totalIssues: issues.length,
          maxConcurrency: MAX_CONCURRENT_ANALYSIS,
          maxFileSize: MAX_FILE_SIZE_FOR_ANALYSIS
        });
      }
      
      const plan = await codebaseExplorer.createBrutalPlan(structure, issues);
      
      let output = "🔥 BRUTAL ARCHITECTURAL PLAN 🔥\n";
      output += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
      
      output += `📋 ${plan.title}\n\n`;
      
      output += "💪 CURRENT STRENGTHS:\n";
      plan.currentState.strengths.forEach(s => output += `✅ ${s}\n`);
      
      output += "\n⚠️  CURRENT WEAKNESSES:\n";
      plan.currentState.weaknesses.forEach(w => output += `❌ ${w}\n`);
      
      output += "\n🚨 RISKS:\n";
      plan.currentState.risks.forEach(r => output += `💀 ${r}\n`);
      
      output += "\n📋 RECOMMENDATIONS:\n";
      output += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
      
      output += "\n🔥 IMMEDIATE (Do This Week):\n";
      output += `⏱️  Estimated Effort: ${plan.estimatedEffort.immediate}\n`;
      plan.recommendations.immediate.forEach(r => output += `□ ${r}\n`);
      
      output += "\n📅 SHORT TERM (Next Sprint):\n";
      output += `⏱️  Estimated Effort: ${plan.estimatedEffort.shortTerm}\n`;
      plan.recommendations.shortTerm.forEach(r => output += `□ ${r}\n`);
      
      output += "\n🎯 LONG TERM (Next Quarter):\n";
      output += `⏱️  Estimated Effort: ${plan.estimatedEffort.longTerm}\n`;
      plan.recommendations.longTerm.forEach(r => output += `□ ${r}\n`);
      
      if (plan.antiPatterns.length > 0) {
        output += "\n❌ ANTI-PATTERNS TO AVOID:\n";
        plan.antiPatterns.forEach(ap => output += `⚠️  ${ap}\n`);
      }
      
      output += "\n💭 Remember: Fix what's broken, not what's theoretically imperfect.";

      return {
        content: [{
          type: "text",
          text: output
        }]
      };
    }

    case "brutal_timeline": {
      const requirement = String(request.params.arguments?.requirement || "");
      const estimatedDays = Number(request.params.arguments?.estimatedDays || 10);
      const context = request.params.arguments?.context || {};
      
      if (!requirement) {
        logger.error("Missing requirement parameter");
        throw new Error("Requirement description is required for brutal timeline generation");
      }
      
      logger.info("Generating brutal timeline", { requirement, estimatedDays });
      
      try {
        const planEngine = new BrutalPlanEngine();
        const { filename, content } = await planEngine.generatePlan({
          requirement,
          estimatedDays,
          context: context as any
        });
        
        logger.info("Brutal timeline generated successfully", { filename });
        
        // Return first 2000 chars of the plan + info about where it's saved
        const preview = content.substring(0, 2000);
        const output = `🔥 BRUTAL TIMELINE GENERATED: ${filename}\n\n${preview}${content.length > 2000 ? '\n\n... (truncated - see full plan in file)' : ''}`;
        
        return {
          content: [{
            type: "text",
            text: output
          }]
        };
      } catch (error) {
        logger.error("Failed to generate brutal timeline", { requirement }, error as Error);
        throw new Error(`Failed to generate brutal timeline: ${(error as Error).message}`);
      }
    }

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
  console.error("Server error:", error);
  process.exit(1);
});