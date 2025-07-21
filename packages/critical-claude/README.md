# 🚀 Critical Claude

Production-ready task management CLI with unified Claude Code integration via Model Context Protocol (MCP). Combines AI-powered task analysis with seamless bidirectional sync between Claude Code's TodoWrite system and Critical Claude's unified storage.

## 🎯 Core Features

### 🔗 Unified Claude Code Integration
- **Bidirectional Task Sync**: Real-time sync between Claude Code TodoWrite and Critical Claude
- **MCP Server**: Production-ready Model Context Protocol server for Claude integration
- **Hook-Based Updates**: Live monitoring and sync of task changes
- **Auto-Detection**: Automatically detects Claude Code context and configures integration

### 🛠️ Unified Hook System
- **Centralized Management**: Single `UnifiedHookManager` replaces multiple overlapping systems
- **Real-time Synchronization**: Instant task updates between systems
- **Production-Ready**: Clean, maintainable architecture with proper error handling
- **Auto-Configuration**: Intelligent provider detection and configuration

### 🧠 AI-Powered Task Management  
- **Intelligent Task Analysis**: AI-driven task breakdown and complexity analysis
- **Code Quality Integration**: Automated task creation from code analysis
- **Smart Prioritization**: AI-assisted priority and effort estimation
- **Multi-Provider Support**: OpenAI, Anthropic, Claude Code, or local AI providers

### 📋 Task Management
- **Unified Storage**: Single source of truth for all task data
- **Rich Task Model**: Priority, status, labels, story points, and AI metadata
- **Search & Filtering**: Advanced task filtering and search capabilities
- **Import/Export**: Multiple format support for existing project data

### 🔄 Automation & Integration
- **Real-time Sync**: Instant updates between Claude Code and Critical Claude
- **Hook System**: Event-driven task updates and notifications
- **CLI Interface**: Full-featured command-line interface
- **MCP Server**: Production-ready Model Context Protocol integration

## 🏗️ Unified Architecture

### Core Components
```typescript
import { 
  UnifiedStorageManager, 
  UnifiedHookManager, 
  CriticalClaudeClient 
} from 'critical-claude';

// Unified storage for all task management
const storage = new UnifiedStorageManager();

// Centralized hook system with Claude Code integration
const hookManager = new UnifiedHookManager(storage);

// AI-powered task client with auto-detection
const client = new CriticalClaudeClient();
const tasks = await client.generateTasks("Feature description");

// Automatic sync to Claude Code via hooks
await hookManager.syncToClaude();
```

### MCP Integration
```typescript
// Available MCP tools for Claude Code integration:
// cc_task_create, cc_task_list, cc_task_update, cc_task_delete
// cc_sync_claude_code, cc_task_stats

// Example Claude Code usage:
// "Use cc_task_create to create a new high priority task"
// "Use cc_sync_claude_code with execute true to sync all tasks"
```

## 📋 Unified Task Model

### CommonTask Interface
```typescript
interface CommonTask {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked' | 'archived';
  priority: 'critical' | 'high' | 'medium' | 'low';
  assignee?: string;
  labels: string[];
  storyPoints?: number;
  source: 'claude-code' | 'manual' | 'ai-generated' | 'imported';
  metadata?: {
    claudeCodeId?: string;
    originalContent?: string;
    syncedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

### Claude Code Integration
```typescript
interface ClaudeCodeTodo {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  id: string;
}
```

## 🔗 Claude Code Integration

### Automatic Sync
```typescript
// Hook manager automatically syncs TodoWrite operations
const hookManager = new UnifiedHookManager(storage);

// When Claude Code creates todos, they automatically sync to Critical Claude
// When Critical Claude updates tasks, changes sync back to Claude Code

// Manual sync operations
await hookManager.syncFromClaude(); // Pull todos from Claude Code
await hookManager.syncToClaude();   // Push tasks to Claude Code

// Bidirectional sync (default behavior)
await hookManager.handleTodoWrite(claudeCodeTodos);
```

### MCP Tool Usage
```typescript
// Available in Claude Code conversations:

// Create tasks
// "Use cc_task_create to create a high priority task for implementing authentication"

// List and filter
// "Use cc_task_list with status 'in_progress' to see current work"

// Update tasks  
// "Use cc_task_update to mark task abc123 as completed"

// Sync operations
// "Use cc_sync_claude_code with execute true to sync all tasks"
```

## 🛠️ CLI Interface

### Task Management Commands
```bash
# Create tasks
cc task create "Implement user authentication" --priority high --labels auth,security

# List and filter tasks
cc task list --status in_progress --priority high
cc task list --assignee "john@example.com" --labels frontend

# Update tasks
cc task update abc123 --status done --assignee "jane@example.com"

# Task statistics
cc task stats

# Claude Code sync
cc sync claude-code --direction both
cc sync claude-code --dry-run  # Preview changes
```

### AI-Powered Features
```bash
# Generate tasks from description
cc ai generate "Build REST API for user management"

# Analyze task complexity
cc ai analyze "Implement OAuth integration with Google"

# Get AI service status
cc ai status
```

## ⚙️ Configuration

### MCP Server Setup
```json
// claude_desktop_config.json
{
  "mcpServers": {
    "critical-claude": {
      "command": "node",
      "args": ["/path/to/critical-claude/dist/mcp-server.js"],
      "env": {
        "CRITICAL_CLAUDE_PROJECT_PATH": "/path/to/your/project"
      }
    }
  }
}
```

### Project Configuration
```json
// .critical-claude.json
{
  "version": "2.0.0",
  "claude": {
    "mcp_enabled": true,
    "hooks_enabled": true,
    "sync_mode": "bidirectional"
  },
  "ai": {
    "provider": "claude-code",
    "auto_detect": true
  }
}
```

## 📊 Task Analytics

### Statistics & Insights
```bash
# Get comprehensive task statistics
cc task stats

# Output:
# 📊 Task Statistics
# Total Tasks: 45
# Archived Tasks: 12
# 
# By Status:
#   todo: 15
#   in_progress: 8
#   done: 20
#   blocked: 2
# 
# By Priority:
#   critical: 3
#   high: 12
#   medium: 25
#   low: 5
```

### Sync Status Monitoring
```bash
# Monitor Claude Code integration
cc sync status
cc sync claude-code --dry-run  # Preview sync operations
```

## 🔌 MCP Tools Reference

### Available MCP Tools

#### Task Management
- **`cc_task_create`**: Create new tasks with full metadata
- **`cc_task_list`**: List and filter tasks by status, priority, assignee
- **`cc_task_update`**: Update existing task properties
- **`cc_task_delete`**: Remove tasks by ID
- **`cc_task_stats`**: Get comprehensive task statistics

#### Claude Code Sync
- **`cc_sync_claude_code`**: Bidirectional sync with Claude Code TodoWrite
  - Support for dry-run mode
  - Direction control (to/from/both)
  - Real-time execution

### External Integrations
- **Claude Code**: Native TodoWrite/TodoRead integration
- **MCP Protocol**: Standard Model Context Protocol compliance
- **File System**: Local storage with JSON and YAML support
- **AI Providers**: OpenAI, Anthropic, local, and mock providers

## 🚀 Quick Start

### Installation
```bash
# Install globally for CLI access
npm install -g critical-claude

# Or install locally in project
npm install critical-claude
```

### CLI Setup
```bash
# Initialize in your project
cc init

# Create your first task
cc task create "Set up project structure" --priority high

# List tasks
cc task list

# Get help
cc --help
cc task --help
```

### MCP Integration Setup
```bash
# Start MCP server for Claude Code integration
cc mcp start

# In Claude Code, use MCP tools:
# "Use cc_task_create to create a new task"
# "Use cc_task_list to see all current tasks"
# "Use cc_sync_claude_code to sync with TodoWrite"
```

### Programmatic Usage
```typescript
import { 
  UnifiedStorageManager, 
  UnifiedHookManager, 
  CommonTask 
} from 'critical-claude';

// Initialize storage
const storage = new UnifiedStorageManager();
await storage.initialize();

// Create a task
const task = await storage.createTask({
  title: "Implement user authentication",
  priority: "high",
  labels: ["auth", "security"]
});

// Setup Claude Code integration
const hookManager = new UnifiedHookManager(storage);
await hookManager.syncToClaude();
```

## 📈 Production Benefits

### Unified Integration
- **Single Source of Truth**: Eliminates task fragmentation across tools
- **Real-time Sync**: Instant updates between Claude Code and task management
- **Zero Configuration**: Auto-detection and setup for Claude Code integration
- **Production Ready**: Clean architecture with proper error handling

### Development Workflow
- **Seamless Claude Code Integration**: Native TodoWrite/TodoRead support
- **MCP Protocol Compliance**: Standard integration with Claude ecosystem
- **CLI Productivity**: Full-featured command-line interface
- **Bidirectional Sync**: Changes propagate automatically between systems

### Code Quality
- **985+ Lines Removed**: Eliminated redundant integration code
- **Unified Architecture**: Single hook system replaces multiple overlapping implementations
- **TypeScript Support**: Full type safety and IDE integration
- **Comprehensive Testing**: Unit and integration test coverage

---

## 🔧 Development

### Building from Source
```bash
# Clone repository
git clone https://github.com/critical-claude/critical-claude.git
cd critical-claude/packages/critical-claude

# Install dependencies
npm install

# Build project
npm run build

# Run tests
npm test

# Start MCP server
npm start
```

### Contributing
- **Architecture**: Unified hook system with single responsibility
- **Testing**: Comprehensive unit and integration tests required
- **Documentation**: Update README and code comments for changes
- **Production Focus**: All code must be production-ready

---

*Production-ready task management with seamless Claude Code integration.*