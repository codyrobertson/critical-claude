# Critical Claude

Enterprise-grade task management and code analysis CLI with AI-powered automation.

## Quick Start

```bash
# Install
npm install -g critical-claude

# Initialize project
cc init

# Create tasks with AI
cc task ai "Build authentication system with OAuth2"

# Load project templates
cc task template webapp --framework react --database postgres
```

## Core Features

### 🤖 AI-Powered Task Management

```bash
# Generate tasks from description
cc task ai "Create REST API for user management"

# Expand tasks into subtasks
cc task expand task-123 --maxTasks 8 --teamSize 3

# Multi-agent research
cc task research "Modern React authentication patterns"

# Analyze dependencies
cc task deps
```

### 📋 Task Templates

Pre-built project templates for rapid scaffolding:

```bash
# Available templates
cc task template list

# Load template with variables
cc task template webapp --framework vue --auth_type jwt
cc task template api --database mongodb
cc task template mobile-app --platform flutter
cc task template machine-learning --ml_framework pytorch
```

### 🔒 Dependency Management

Smart dependency validation with guard rules:

```bash
# Tasks respect dependency chains
cc task edit task-123 --status done
# ❌ Blocked: Dependencies not complete

# View dependency graph
cc task deps
# 🎯 Critical Path: task-1 → task-2 → task-3
```

### 📊 Natural Language Syntax

```bash
# Intuitive task creation
cc task create "Fix login bug @critical #security 5pts for:alice"

# Status icons
📝 Todo  🔄 In Progress  ✅ Done  🚫 Blocked  📦 Archived
```

## Installation

### Global Install (Recommended)
```bash
npm install -g critical-claude
```

### Local Development
```bash
git clone https://github.com/critical-claude/critical-claude.git
cd critical-claude
npm run setup
```

### Environment Setup

Create `cc.env` in your project:

```bash
# Option 1: OpenAI
OPENAI_API_KEY=sk-your-openai-key

# Option 2: Anthropic
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Option 3: Claude Desktop
# Automatically detected if Claude Code CLI is running
```

## Task Management

### Basic Commands

```bash
# Create
cc task create "Implement user authentication"

# List with filters
cc task list --status in_progress --priority high

# Update
cc task edit task-123 --status done

# View details
cc task view task-123

# Archive
cc task archive task-123
```

### AI Features

```bash
# Generate task breakdown
cc task ai "Build e-commerce checkout flow"
# ✅ Creates 8-12 related tasks with dependencies

# Expand complex task
cc task expand task-123
# ✅ Breaks into subtasks based on complexity

# Research implementation
cc task research "Implement real-time notifications"
# ✅ Multi-agent analysis with actionable tasks

# Estimate effort
cc task estimate task-123 --apply
# ✅ Story points, hours, and confidence level
```

### Templates

```bash
# List available templates
cc task template list
# 📚 webapp, api, mobile-app, cli-tool, microservice, machine-learning

# Show template details
cc task template show webapp

# Load with custom variables
cc task template api --framework express --database postgres

# Create custom template
cc task template create my-template
```

## Configuration

### Project Config (`cc.env`)

```env
# AI Provider
OPENAI_API_KEY=sk-...
# or
ANTHROPIC_API_KEY=sk-ant-...

# Project Settings
CC_PROJECT_NAME=my-project
CC_TEAM_SIZE=5
CC_EXPERIENCE_LEVEL=senior
```

### Claude Desktop Integration

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "critical-claude": {
      "command": "cc",
      "args": ["mcp-server"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## Advanced Usage

### Dependency Analysis

```bash
# Analyze all task dependencies
cc task deps

# Output:
# 🎯 Critical Path: 5 tasks
# 🚧 Bottlenecks: 2 tasks blocking progress
# 💡 18 tasks can run in parallel
```

### Bulk Operations

```bash
# Archive completed tasks
cc task list --status done | xargs -I {} cc task archive {}

# Update multiple tasks
cc task edit --status in_progress --assignee alice task-1 task-2 task-3
```

### Export/Import

```bash
# Backup tasks
cc task backup

# Export to JSON
cc task export --format json > tasks.json

# Import from file
cc task import tasks.json
```

## API Reference

### Task Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique identifier |
| `title` | string | Task title |
| `status` | enum | todo, in_progress, done, blocked |
| `priority` | enum | critical, high, medium, low |
| `assignee` | string | Username |
| `labels` | string[] | Tags |
| `storyPoints` | number | Estimation |
| `dependencies` | string[] | Task IDs |

### Status Workflow

```
todo → in_progress → done
         ↓
      blocked
```

## Development

### Architecture

```
critical-claude/
├── packages/
│   ├── critical-claude/    # Main CLI
│   ├── core/              # Shared utilities
│   ├── data-flow/         # Analysis tools
│   └── system-design/     # Architecture tools
└── templates/             # Task templates
```

### Building

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test

# Development mode
npm run dev
```

### Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push branch (`git push origin feature/amazing`)
5. Open Pull Request

## License

MIT © Critical Claude Team