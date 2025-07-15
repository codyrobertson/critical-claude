# Claude-Specific Setup Guide

This guide provides detailed instructions for integrating Critical Claude with Claude (Anthropic's AI assistant) through the Model Context Protocol (MCP).

## Overview

Critical Claude provides a comprehensive MCP server that integrates seamlessly with Claude Code, enabling powerful code analysis, project planning, and task management capabilities directly within your Claude conversations.

## Installation Methods

### Method 1: Automatic Installation (Recommended)

```bash
# Install Critical Claude globally
npm install -g critical-claude

# Configure Claude Code automatically
critical-claude setup claude-code

# Verify installation
critical-claude status
```

### Method 2: Manual MCP Configuration

#### Step 1: Locate Claude Configuration File

The configuration file location depends on your operating system:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

#### Step 2: Add Critical Claude MCP Server

Add the following configuration to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "critical-claude": {
      "command": "node",
      "args": [
        "/path/to/critical-claude-mcp/build/index.js"
      ],
      "env": {
        "CRITICAL_CLAUDE_PROJECT_PATH": "/path/to/your/project",
        "CRITICAL_CLAUDE_LOG_LEVEL": "info"
      }
    }
  }
}
```

#### Step 3: Build MCP Server

```bash
# Navigate to your Critical Claude installation
cd /path/to/critical-claude

# Build the MCP server
npm run build:mcp

# Test the server
node critical-claude-mcp/build/index.js
```

#### Step 4: Restart Claude Code

Close and reopen Claude Code to load the new MCP server configuration.

## Available Tools

### Code Analysis Tools

#### `cc_crit_code`
**Purpose**: Performs critical code review with production-ready analysis

**Parameters**:
- `code` (string): Source code to analyze
- `filePath` (string): Path to file (alternative to providing code directly)
- `filename` (string): Name of file being analyzed

**Usage Example**:
```
Use cc_crit_code to analyze this function for security vulnerabilities:

function authenticateUser(username, password) {
    return users.find(u => u.username === username && u.password === password);
}
```

#### `cc_crit_arch`
**Purpose**: Architecture review that matches patterns to problem size

**Parameters**:
- `code` (string): Source code to analyze
- `filePath` (string): Path to file
- `filename` (string): Name of file
- `context` (object): Additional system context including team size, user count, current problems

**Usage Example**:
```
Use cc_crit_arch to review the architecture of my user authentication system. The team has 5 developers, 10,000 active users, and we're experiencing slow login times.
```

### Project Planning Tools

#### `cc_plan_timeline`
**Purpose**: Generate critical reality-based project plans from natural language

**Parameters**:
- `input` (string): Natural language description of what you want to build
- `estimatedDays` (number): Your optimistic estimate in days (optional)
- `context` (object): Additional context like team size, tech stack, deadlines

**Usage Example**:
```
Use cc_plan_timeline to create a project plan for building a real-time chat application with user authentication, message persistence, and file sharing capabilities. We have a team of 3 developers and need to launch in 8 weeks.
```

#### `cc_mvp_plan`
**Purpose**: Generate an MVP plan for a new product or feature

**Parameters**:
- `projectName` (string): Name of the project
- `description` (string): Detailed description of what you want to build
- `targetUsers` (string): Description of target users
- `constraints` (object): Budget, timeline, and team size constraints

**Usage Example**:
```
Use cc_mvp_plan to create an MVP plan for "TaskFlow Pro" - a project management tool for software development teams. Target users are engineering managers and team leads at startups. Budget is $50,000 and timeline is 3 months with 2 developers.
```

### System Design Tools

#### `cc_system_design_analyze`
**Purpose**: Analyze existing system architecture and provide recommendations

**Parameters**:
- `rootPath` (string): Root directory of codebase to analyze
- `focus` (string): Focus area - "scalability", "performance", "maintainability", "security", or "all"

**Usage Example**:
```
Use cc_system_design_analyze to review my e-commerce platform architecture with focus on scalability. Root path is /Users/dev/ecommerce-platform
```

#### `cc_tech_stack_recommend`
**Purpose**: Recommend technology stack for a project

**Parameters**:
- `projectType` (string): Type of project - "web-app", "mobile-app", "api", "desktop-app", "microservices"
- `requirements` (array): List of requirements like "real-time", "high-throughput", "offline-support"
- `teamExperience` (string): Team experience level - "beginner", "intermediate", "advanced"
- `constraints` (object): Budget and timeline constraints

**Usage Example**:
```
Use cc_tech_stack_recommend for a microservices project with real-time messaging, high-throughput requirements, and offline support. Team has advanced experience, medium budget, and 6-month timeline.
```

### Data Flow Analysis Tools

#### `cc_data_flow_analyze`
**Purpose**: Analyze data flow patterns in a codebase

**Parameters**:
- `rootPath` (string): Root directory of codebase to analyze

**Usage Example**:
```
Use cc_data_flow_analyze to understand how data flows through my Node.js API. Root path is /Users/dev/api-service
```

#### `cc_data_flow_trace`
**Purpose**: Trace data flow from a specific entry point

**Parameters**:
- `entryPoint` (string): Path to entry point file
- `rootPath` (string): Root directory of codebase

**Usage Example**:
```
Use cc_data_flow_trace to trace data flow starting from my main API handler. Entry point is /Users/dev/api-service/src/handlers/user.js
```

#### `cc_data_flow_diagram`
**Purpose**: Generate data flow diagrams in Mermaid format

**Parameters**:
- `rootPath` (string): Root directory of codebase
- `diagramType` (string): Type of diagram - "system", "critical-path", "database", or "all"

**Usage Example**:
```
Use cc_data_flow_diagram to create a system diagram for my microservices architecture. Root path is /Users/dev/microservices
```

### Task Management Tools

#### `cc_crit_explore`
**Purpose**: Explore entire codebase structure to understand architecture

**Parameters**:
- `rootPath` (string): Root directory of codebase

**Usage Example**:
```
Use cc_crit_explore to analyze the structure of my React application. Root path is /Users/dev/react-app
```

#### `cc_plan_arch`
**Purpose**: Create architectural improvement plan based on codebase analysis

**Parameters**:
- `rootPath` (string): Root directory of codebase
- `includeAnalysis` (boolean): Whether to run full analysis on key files

**Usage Example**:
```
Use cc_plan_arch to create an architectural improvement plan for my legacy PHP application. Root path is /Users/dev/legacy-app
```

## Task Management Integration

### ⚠️ Hook System - Canary Feature

**IMPORTANT**: Hook integration is currently a canary feature and is **disabled by default**. 

Hooks are experimental and may cause issues in production environments. Only enable for development and testing:

```bash
# Enable hooks (development only)
export CRITICAL_CLAUDE_HOOKS_ENABLED=true

# Enable live monitoring (experimental)
export CRITICAL_CLAUDE_LIVE_MONITOR=true
```

### Claude Code Hook System

Critical Claude integrates with Claude Code's hook system to provide real-time task management:

#### Hook Configuration

Create a hook script in your Claude Code settings:

```bash
#!/bin/bash
# File: ~/.claude/critical-claude-hook.sh

# Parse hook data
HOOK_DATA=$(cat)
TOOL_NAME=$(echo "$HOOK_DATA" | jq -r '.tool_name // empty')

# Handle TodoWrite operations
if [ "$TOOL_NAME" = "TodoWrite" ]; then
    echo "Critical Claude task updated!" >> ~/.critical-claude/hook-debug.log
    
    # Sync with Critical Claude task system
    echo "$HOOK_DATA" | npx critical-claude sync claude-code
    
    # Visual feedback
    echo "$HOOK_DATA" | node ~/.claude/todo-visual-formatter.js
fi
```

#### Visual Task Formatting

Critical Claude provides a visual formatter for task display:

```javascript
// Visual formatter for Claude Code integration
const formatTasks = (todos) => {
    const priorityColors = {
        high: '\x1b[31m',    // Red
        medium: '\x1b[33m',  // Yellow
        low: '\x1b[36m'      // Cyan
    };
    
    const statusSymbols = {
        pending: '○',
        in_progress: '●',
        completed: '✓'
    };
    
    return todos.map(todo => {
        const color = priorityColors[todo.priority] || '\x1b[0m';
        const symbol = statusSymbols[todo.status] || '?';
        return `${color}${symbol} ${todo.content}\x1b[0m`;
    }).join('\n');
};
```

### Bidirectional Sync

Critical Claude maintains bidirectional sync with Claude Code:

1. **Claude → Critical Claude**: Hook events trigger task updates
2. **Critical Claude → Claude**: Task changes reflect in conversation context
3. **Real-time Updates**: Live monitoring of task status changes
4. **Conflict Resolution**: Automatic handling of concurrent updates

## Configuration Options

### Environment Variables

Set these in your MCP server configuration:

```json
{
  "env": {
    "CRITICAL_CLAUDE_PROJECT_PATH": "/path/to/your/project",
    "CRITICAL_CLAUDE_LOG_LEVEL": "info",
    "CRITICAL_CLAUDE_HOOK_ENABLED": "true",
    "CRITICAL_CLAUDE_VISUAL_FORMAT": "true",
    "CRITICAL_CLAUDE_SYNC_INTERVAL": "1000"
  }
}
```

### Project-Specific Settings

Create `.critical-claude.json` in your project root:

```json
{
  "version": "1.0.0",
  "project": {
    "name": "My Project",
    "type": "web-app",
    "language": "typescript",
    "framework": "react"
  },
  "claude": {
    "mcp_enabled": true,
    "hooks_enabled": false,
    "hooks_canary": true,
    "visual_formatting": true,
    "sync_mode": "bidirectional"
  },
  "analysis": {
    "security_focus": true,
    "performance_monitoring": true,
    "architecture_review": true,
    "code_quality_threshold": "medium"
  }
}
```

## Best Practices

### Effective Tool Usage

1. **Start with Exploration**: Use `cc_crit_explore` to understand codebase structure
2. **Focus Analysis**: Use specific tools for targeted analysis
3. **Iterate on Plans**: Use planning tools to refine project scope
4. **Monitor Progress**: Leverage task management integration

### Code Review Workflow

1. **Automated Analysis**: Use `cc_crit_code` on all new code
2. **Architecture Review**: Regular `cc_crit_arch` reviews
3. **System Design**: Use `cc_system_design_analyze` for scalability planning
4. **Data Flow**: Use flow analysis tools for complex systems

### Task Management

1. **Real-time Sync**: Enable hooks for live task updates
2. **Visual Feedback**: Use formatters for clear task status
3. **Priority Management**: Focus on high-priority security issues
4. **Team Collaboration**: Share task status across development team

## Troubleshooting

### Common Issues

#### MCP Server Not Loading

```bash
# Check MCP server status
npx critical-claude-mcp --health

# Test direct connection
node /path/to/critical-claude-mcp/build/index.js

# Check Claude Code logs
tail -f ~/Library/Logs/Claude/claude.log
```

#### Hook Events Not Triggering

```bash
# Verify hook configuration
cat ~/.claude/settings.json | jq '.hooks'

# Test hook script directly
echo '{"tool_name": "TodoWrite"}' | ~/.claude/critical-claude-hook.sh

# Check hook logs
tail -f ~/.critical-claude/hook-debug.log
```

#### Task Sync Issues

```bash
# Force sync
npx critical-claude sync claude-code --force

# Reset task state
npx critical-claude reset tasks

# Check sync status
npx critical-claude status sync
```

### Debug Mode

Enable debug mode for detailed logging:

```json
{
  "env": {
    "CRITICAL_CLAUDE_LOG_LEVEL": "debug",
    "CRITICAL_CLAUDE_DEBUG_MODE": "true"
  }
}
```

## Advanced Features

### Custom Tool Development

Create custom MCP tools for specific workflows:

```javascript
// Example custom tool
const customAnalyzer = {
    name: 'cc_custom_security',
    description: 'Custom security analysis for specific framework',
    inputSchema: {
        type: 'object',
        properties: {
            framework: { type: 'string' },
            securityRules: { type: 'array' }
        }
    },
    handler: async (params) => {
        // Custom analysis logic
        return {
            findings: [],
            recommendations: [],
            severity: 'medium'
        };
    }
};
```

### Performance Monitoring

Track Critical Claude performance:

```json
{
  "monitoring": {
    "performance_tracking": true,
    "metrics_collection": true,
    "response_times": true,
    "error_tracking": true
  }
}
```

### Security Considerations

- **Data Privacy**: Code analysis is performed locally
- **Secure Communication**: All MCP communication is encrypted
- **Access Control**: Configure role-based access to tools
- **Audit Logging**: All tool usage is logged for compliance

## Support and Resources

- **MCP Documentation**: [docs.anthropic.com/claude/docs/mcp](https://docs.anthropic.com/claude/docs/mcp)
- **Critical Claude Docs**: [critical-claude.dev/docs](https://critical-claude.dev/docs)
- **GitHub Issues**: [github.com/critical-claude/critical-claude](https://github.com/critical-claude/critical-claude)
- **Community Discord**: [discord.gg/critical-claude](https://discord.gg/critical-claude)

---

*"The best code review is the one that finds the bug that would have taken down production on Black Friday."*

**Ready to integrate Critical Claude with Claude Code? Start with the automatic installation method for the fastest setup!**