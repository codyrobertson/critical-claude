# 🔥 Brutal Code Critique MCP Server

A battle-hardened senior engineer's brutal but constructive code review system implemented as a Model Context Protocol (MCP) server for Claude Code.

## 🎯 Features

### Core Capabilities
- **Brutal File Analysis** - Security, performance, and architecture checks with zero mercy
- **Diff-based Reviews** - Ruthless analysis of code changes for pull requests
- **Production Risk Assessment** - Real-world failure scenarios with business impact
- **Working Code Fixes** - Complete, executable solutions for every issue found
- **Battle-tested Persona** - 15+ years of enterprise experience detecting disasters before they happen

### Analysis Framework
- **Security Analysis (30%)** - SQL injection, XSS, authentication bypasses, data exposure
- **Performance Analysis (25%)** - Algorithmic complexity, memory leaks, database optimization
- **Architecture Analysis (20%)** - SOLID violations, coupling issues, maintainability
- **Code Quality (15%)** - Error handling, naming, readability, technical debt
- **Testing Strategy (10%)** - Coverage gaps, edge cases, test maintainability

## 🚀 Quick Start

### Installation

The server is already configured for Claude Desktop. If you need to set it up manually:

```json
{
  "mcpServers": {
    "brutal-critique": {
      "command": "node",
      "args": ["./build/index.js"],
      "cwd": "/Users/Cody/code_projects/critical_claude/brutal-critique-mcp"
    }
  }
}
```

### Development

```bash
# Install dependencies
npm install

# Build the server
npm run build

# Run in watch mode for development
npm run watch

# Test with MCP Inspector
npx @modelcontextprotocol/inspector build/index.js
```

## 🛠️ Available Tools

### `brutal_review_file`
Perform brutal code review on a single file with battle-hardened senior engineer perspective.

**Parameters:**
- `code` (string, required) - The source code to analyze
- `filename` (string, required) - Name of the file being analyzed
- `brutality_level` (number, optional) - Brutality level from 1-10 (default: 8)

**Example Usage:**
```javascript
// In Claude Code, this tool will analyze your code and provide:
// - Specific security vulnerabilities with exploitation scenarios
// - Performance bottlenecks with scaling impact
// - Architectural issues with maintenance costs
// - Complete working fixes for every problem
```

### `brutal_review_diff`
Brutal code review of changes between two code versions.

**Parameters:**
- `old_code` (string, required) - Original code version
- `new_code` (string, required) - Modified code version
- `filename` (string, required) - Name of the file being analyzed
- `brutality_level` (number, optional) - Brutality level from 1-10 (default: 8)

## 📚 Resources

The server provides comprehensive documentation:

- **Analysis Guide** (`critique://analysis-guide`) - Complete methodology and severity levels
- **Security Checklist** (`critique://security-checklist`) - High-risk vulnerability patterns
- **Performance Patterns** (`critique://performance-patterns`) - Common bottlenecks that kill systems

## 🎯 Sample Output

```
🔥 BRUTAL CODE REVIEW RESULTS 🔥
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 OVERALL VERDICT: DEPLOYMENT BLOCKED - CATASTROPHIC ISSUES
🔥 Brutality Score: 9/10
⚠️  Total Issues Found: 5
🚨 Mandatory Fixes: 3

🚨 ISSUES FOUND:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. CATASTROPHIC - SECURITY
📄 Location: auth.js:45
❌ Issue: SQL injection vulnerability that a script kiddie could exploit in their sleep. Did you learn database security from a 2002 PHP tutorial?
💀 Production Risk: Complete database compromise, data theft, and potential ransomware attack within 24 hours of deployment
🔧 Fix: Use parameterized queries with proper input validation
```

## 🔧 Architecture

### Core Components

**BrutalCritiqueEngine**
- Multi-dimensional analysis engine
- Pattern-based vulnerability detection
- Real-world risk assessment
- Working code generation

**MCP Integration**
- Standard Model Context Protocol implementation
- Seamless Claude Code integration
- Resource-based documentation
- Tool-based analysis interface

### Security Detection Patterns

```typescript
// SQL Injection Detection
if (code.includes('query(') && code.includes('${') && !code.includes('parameterized'))

// XSS Vulnerability Detection  
if (code.includes('innerHTML') && !code.includes('sanitize'))

// Memory Leak Detection
if (code.includes('setInterval') && !code.includes('clearInterval'))
```

## 🎭 The Brutal Persona

This system embodies a battle-hardened senior engineer who has:
- Debugged critical production systems at 3 AM during outages affecting millions
- Witnessed spectacular deployment disasters caused by "minor" code issues
- Survived multiple startup death spirals caused by technical debt
- Built systems that scale to hundreds of thousands of concurrent users
- Led incident response for security breaches and data corruption events

**Zero tolerance for:**
- Code that "works on my machine" but will fail in production
- Security vulnerabilities, no matter how "unlikely" the attack vector
- Performance issues that will crash with scale
- Technical debt that compounds exponentially
- Tests that are optional rather than mandatory

## 🚀 Integration with Claude Code

The server integrates seamlessly with Claude Code through the MCP protocol:

1. **Automatic Discovery** - Claude Code detects and loads the server
2. **Tool Access** - Use `brutal_review_file` and `brutal_review_diff` tools directly
3. **Resource Access** - Access analysis guides and checklists as resources
4. **Real-time Analysis** - Immediate feedback on code quality and security

## 📈 Severity Classification

- **🔴 CATASTROPHIC** - Blocks deployment immediately (security vulnerabilities, data corruption risks)
- **🟠 SEVERE** - Must fix before merge (performance killers, memory leaks)  
- **🟡 MAJOR** - Address within sprint (architectural violations, maintainability issues)
- **🔵 MINOR** - Consider next refactor (style improvements, micro-optimizations)

## 🛡️ Security Focus

Primary security vulnerability detection:
- SQL injection through string concatenation
- Cross-site scripting via unsafe DOM manipulation
- Authentication bypass patterns
- Data exposure through logging
- Memory corruption via buffer overflows
- Race conditions in concurrent code

## ⚡ Performance Analysis

Critical performance patterns detected:
- O(n²) algorithms with nested loops
- Memory leaks from uncleaned resources
- Database N+1 query problems
- Synchronous blocking operations
- Inefficient data structure usage
- Missing caching strategies

## 🏗️ Architecture Validation

Architectural anti-patterns identified:
- God functions exceeding 50 lines
- Tight coupling between modules
- Missing separation of concerns
- Violation of SOLID principles
- Inadequate abstraction layers
- Poor error boundary design

## 🧪 Quality Assurance

Code quality issues tracked:
- Missing error handling with try/catch gaps
- Poor naming conventions
- Inadequate documentation
- Technical debt accumulation
- Inconsistent coding standards
- Missing type safety measures

## 🎯 Production Readiness

The system evaluates code against enterprise production standards:
- Scalability under load
- Monitoring and observability
- Error recovery mechanisms
- Security hardening
- Performance optimization
- Maintainability standards

## 📊 Metrics and Scoring

**Brutality Score Calculation:**
- Catastrophic issues: 3 points each
- Severe issues: 2 points each  
- Major issues: 1 point each
- Maximum score: 10/10 (deployment blocked)

**Overall Verdicts:**
- EXCELLENT - Production ready (0 critical issues)
- ACCEPTABLE - Minor improvements needed
- NEEDS IMPROVEMENT - Multiple issues found
- POOR - Significant refactoring required  
- DANGEROUS - Immediate fixes required
- DEPLOYMENT BLOCKED - Catastrophic issues present

Your Brutal Code Critique MCP Server is now ready to prevent the next production disaster. Use it to ship bulletproof code or don't ship at all.

*"The best code review is the one that finds the bug that would have taken down production on Black Friday."*