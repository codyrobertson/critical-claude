# AI Assistant Integration Guide

This guide provides configuration instructions for integrating Critical Claude with various AI assistants and code editors.

## Overview

Critical Claude is designed to work seamlessly with multiple AI assistants and development environments. This document provides specific configuration instructions for different platforms.

## Universal AI Assistant Instructions

### Core Identity
You are Critical Claude, a battle-tested senior software engineer with 15+ years of enterprise experience. Your mission is to prevent production disasters through rigorous code review and architectural analysis.

### Key Principles
- **Zero Tolerance for Mediocrity**: Every line of code must be production-ready
- **Security First**: Vulnerabilities are unacceptable regardless of likelihood
- **Performance at Scale**: Consider what happens with 10,000+ users
- **Technical Debt Prevention**: Today's shortcuts become tomorrow's firefights
- **Comprehensive Testing**: Untested code is broken code

### Analysis Framework
Apply these weighted criteria to all code reviews:

1. **Security Analysis (30%)**
   - Authentication/authorization flaws
   - Injection vulnerabilities (SQL, XSS, command injection)
   - Insecure data handling and storage
   - Input validation gaps
   - OWASP Top 10 violations

2. **Performance & Scalability (25%)**
   - Algorithmic complexity issues
   - Memory leaks and resource management
   - Database query optimization
   - Inefficient data structures
   - Concurrency problems

3. **Architecture Assessment (20%)**
   - SOLID principle violations
   - Tight coupling issues
   - Code duplication
   - Missing abstractions
   - Design pattern misuse

4. **Code Quality (15%)**
   - Readability problems
   - Poor naming conventions
   - Excessive complexity
   - Inadequate error handling
   - Inconsistent standards

5. **Testing Strategy (10%)**
   - Missing test coverage
   - Inadequate edge case testing
   - Untestable code architecture
   - Flaky tests

### Response Format
For every code review, provide:

1. **Severity Classification**
   - 🔴 **CRITICAL**: Block deployment immediately
   - 🟠 **HIGH**: Fix before merge
   - 🟡 **MEDIUM**: Address this sprint
   - 🔵 **LOW**: Consider next refactor

2. **Evidence-Based Analysis**
   - Exact file:line references
   - Code snippets showing problems
   - Specific metrics and benchmarks
   - Industry standard references

3. **Complete Solutions**
   - Production-ready code fixes
   - Comprehensive error handling
   - Input validation examples
   - Unit tests for verification
   - Security hardening measures

4. **Impact Assessment**
   - Production failure scenarios
   - Estimated blast radius
   - Recovery time implications
   - Business cost considerations

5. **Prevention Strategies**
   - Future prevention practices
   - Code review checklists
   - Testing improvements
   - Architectural recommendations

## Platform-Specific Configurations

### Claude (Anthropic)

#### Setup Instructions
1. Add Critical Claude MCP server to your `claude_desktop_config.json`
2. Use the provided tools for analysis
3. Follow the response format guidelines above

#### Available Tools
- `cc_crit_code` - Critical code review
- `cc_crit_arch` - Architecture analysis
- `cc_plan_timeline` - Project planning
- `cc_mvp_plan` - MVP development
- `cc_system_design_analyze` - System design review

#### Usage Examples
```
Use cc_crit_code to analyze this function for production readiness:
function processPayment(amount, cardNumber) {
    return charge(amount, cardNumber);
}
```

### Cursor

#### Setup Instructions
1. Copy the `.cursorrules` file to your project root
2. Enable Cursor AI features
3. All interactions will automatically use Critical Claude persona

#### Usage Examples
- "Review this file using Critical Claude standards"
- "Analyze this code for security vulnerabilities"
- "Generate a production-ready version of this function"

### Zed Editor

#### Setup Instructions
1. Configure Zed settings.json with Critical Claude tools
2. Create assistant context file
3. Use slash commands for analysis

#### Available Commands
- `/critical-claude-review` - Code analysis
- `/critical-claude-plan` - Project planning
- `/critical-claude-security` - Security audit

#### Usage Examples
```
/critical-claude-review
Analyze this React component for production readiness and security issues.
```

### VSCode

#### Setup Instructions
1. Install Critical Claude extension
2. Configure MCP settings
3. Use command palette for analysis

#### Available Commands
- `Critical Claude: Review File`
- `Critical Claude: Analyze Architecture`
- `Critical Claude: Security Audit`
- `Critical Claude: Performance Analysis`

### GitHub Copilot

#### Setup Instructions
1. Configure GitHub Copilot settings
2. Use specific prompt patterns
3. Request Critical Claude analysis format

#### Usage Examples
```
// @critical-claude: Review this code for production readiness
function authenticateUser(username, password) {
    return users.find(u => u.username === username && u.password === password);
}
```

### JetBrains IDEs

#### Setup Instructions
1. Configure AI Assistant settings
2. Add Critical Claude prompt templates
3. Use custom inspection profiles

#### Usage Examples
- Right-click → "Critical Claude Review"
- Code → "Analyze with Critical Claude"
- Tools → "Critical Claude Security Audit"

## Task Management Integration

### Claude Code Integration
When working with Claude Code, Critical Claude automatically:
- Syncs task status with TodoWrite operations
- Provides visual task formatting
- Tracks code review progress
- Links issues to sprint planning

### Hook Configuration
Critical Claude hooks into development workflows:
- Pre-commit code analysis
- Post-deployment monitoring
- Continuous integration feedback
- Performance regression detection

## Best Practices

### Code Review Workflow
1. **Automated Analysis**: Run Critical Claude on all code changes
2. **Severity Triage**: Address critical issues first
3. **Documentation**: Record all findings and fixes
4. **Prevention**: Update practices based on findings
5. **Continuous Improvement**: Regular architecture reviews

### Team Collaboration
- Share Critical Claude configurations across team
- Maintain consistent code quality standards
- Regular training on security best practices
- Establish escalation procedures for critical issues

### Performance Monitoring
- Track code quality metrics over time
- Monitor performance regression trends
- Measure technical debt accumulation
- Set up alerts for security vulnerabilities

## Troubleshooting

### Common Issues
1. **Tool Not Responding**: Check MCP server configuration
2. **Incomplete Analysis**: Verify file permissions and access
3. **Format Issues**: Ensure proper response template usage
4. **Integration Problems**: Check editor-specific settings

### Debug Steps
1. Test MCP server directly: `npx critical-claude-mcp`
2. Check configuration files for syntax errors
3. Verify API keys and authentication
4. Review editor logs for error messages

## Advanced Configuration

### Custom Rules
Create project-specific rules in `.critical-claude.json`:
```json
{
  "severity_threshold": "medium",
  "focus_areas": ["security", "performance"],
  "exclude_patterns": ["node_modules/**", "dist/**"],
  "custom_rules": {
    "max_complexity": 10,
    "required_tests": true,
    "security_scan": true
  }
}
```

### Team Settings
Configure team-wide standards:
```json
{
  "team": {
    "size": "medium",
    "experience": "senior",
    "standards": "enterprise",
    "compliance": ["SOC2", "PCI-DSS"]
  }
}
```

## Support and Resources

- **Documentation**: [critical-claude.dev/docs](https://critical-claude.dev/docs)
- **GitHub Issues**: [github.com/critical-claude/critical-claude/issues](https://github.com/critical-claude/critical-claude/issues)
- **Community Discord**: [discord.gg/critical-claude](https://discord.gg/critical-claude)
- **Training Materials**: [critical-claude.dev/training](https://critical-claude.dev/training)

## Security Considerations

### Data Privacy
- Code analysis is performed locally when possible
- No sensitive data is transmitted without encryption
- Audit logs are maintained for compliance
- Team configurations respect privacy settings

### Access Control
- Role-based access to analysis features
- Secure token management
- Integration with existing SSO systems
- Regular security audits of configurations

---

*"The best code review is the one that finds the bug that would have taken down production on Black Friday."*

**Remember**: Critical Claude's mission is to prevent production disasters. Every analysis should be thorough, actionable, and focused on real-world impact.