# Critical Claude CLI - Complete Feature Specification

## Overview

Critical Claude is a sophisticated task management CLI application built with Domain-Driven Design (DDD) architecture. It provides comprehensive task management, AI-powered research, template systems, analytics, and a rich terminal viewer interface.

**Version**: 2.3.9  
**Main Command**: `cc` (alias: `critical-claude`)  
**Storage**: `~/.critical-claude/`

---

## 1. TASK MANAGEMENT FEATURES

### 1.1 Core Task Operations

#### Task Creation
- **Command**: `cc task create`
- **Options**:
  - `-t, --title <title>` - Task title (required)
  - `-d, --description <desc>` - Task description
  - `-p, --priority <priority>` - Priority: critical, high, medium, low (default: medium)
  - `-s, --status <status>` - Status: todo, in_progress, done, blocked (default: todo)
  - `-a, --assignee <assignee>` - Task assignee email
  - `--labels <labels...>` - Task labels (space-separated)
  - `--hours <hours>` - Estimated hours (float)
- **Security Features**: Input sanitization, rate limiting
- **Output**: Task ID, title confirmation

#### Task Listing
- **Command**: `cc task list`
- **Filters**:
  - `--status <status>` - Filter by status
  - `--priority <priority>` - Filter by priority
  - `--assignee <email>` - Filter by assignee
  - `--labels <labels>` - Filter by labels
- **Output**: Formatted table with ID, title, status, priority, dates

#### Task Viewing
- **Command**: `cc task view <task-id>`
- **Output**: Complete task details including metadata, labels, timestamps

#### Task Updates
- **Command**: `cc task update <task-id>`
- **Options**: Same as create (all optional)
- **Behavior**: Partial updates supported

#### Task Deletion & Archiving
- **Commands**: 
  - `cc task delete <task-id>` - Permanent deletion
  - `cc task archive <task-id>` - Archive (preserves data)

### 1.2 Data Management Features

#### Export System
- **Command**: `cc task export`
- **Options**:
  - `--format <format>` - json, csv, markdown (default: json)
  - `--file <path>` - Output file path
  - `--include-archived` - Include archived tasks
- **Output**: File path confirmation, task count

#### Import System
- **Command**: `cc task import --file <path>`
- **Options**:
  - `--format <format>` - json, csv, markdown (auto-detected)
  - `--merge-strategy <strategy>` - replace, merge, skip (default: merge)
- **Features**: Validation, error reporting, conflict resolution

#### Backup System
- **Command**: `cc task backup`
- **Options**: `--format <format>` - json, csv (default: json)
- **Features**: Automatic timestamping, old backup cleanup
- **Output**: Backup file path

### 1.3 AI-Powered Task Features

#### AI Task Generation
- **Command**: `cc task ai "<query>"`
- **Behavior**: Generates structured task breakdown from natural language
- **Example**: `cc task ai "Create a web dashboard"`
- **Output**: Multiple tasks with priorities, descriptions, time estimates
- **Known Issue**: May timeout (2+ minutes)

#### AI Research & Task Creation
- **Command**: `cc task research "<query>"`
- **Behavior**: Conducts research and generates both report and tasks
- **Output**: Research report file + generated tasks
- **Features**: Configurable depth, file output
- **Known Issue**: May timeout (2+ minutes)

---

## 2. TEMPLATE SYSTEM

### 2.1 Template Operations

#### Template Listing
- **Command**: `cc template list` (alias: `cc template ls`)
- **Output**: Built-in and user templates with metadata
- **Categories**: Built-in (Critical Claude) vs User templates

#### Template Application
- **Command**: `cc template apply <template-name>`
- **Options**: `-v, --variables <vars...>` - key=value pairs
- **Behavior**: Creates tasks from template with variable substitution
- **Output**: Task creation summary

#### Template Viewing
- **Command**: `cc template view <template-name>` (alias: `cc template show`)
- **Output**: Template metadata, variables, task structure

### 2.2 Built-in Templates

#### Available Templates
- `basic-project` - Generic project structure
- `bug-fix` - Bug fix workflow
- `webapp` - Full-stack web application
- `api` - RESTful API service
- `mobile-app` - Cross-platform mobile app
- `cli-tool` - Command-line interface tool
- `microservice` - Microservice with Docker/K8s
- `machine-learning` - ML project with MLOps

#### Template Features
- **Format**: TOML-based configuration
- **Hierarchies**: Support for phases and dependencies
- **Metadata**: Timeline, team size, difficulty ratings
- **Variables**: Customizable placeholders
- **Inheritance**: Templates can extend other templates

---

## 3. VIEWER INTERFACE

### 3.1 Terminal Viewer
- **Command**: `cc viewer`
- **Options**:
  - `--theme <theme>` - dark, light (default: dark)
  - `--log-level <level>` - debug, info, warn, error (default: info)

### 3.2 Viewer Features

#### Navigation (Vim-style)
- **Movement**: h/j/k/l, arrow keys
- **Word Movement**: w/b/e
- **Line Movement**: 0/$//^
- **File Movement**: gg/G
- **Page Movement**: Ctrl+f/b/d/u

#### Interaction
- **Search**: `/` - Search tasks
- **Filter**: `f` - Filter by status
- **Select**: Enter - Select task
- **Toggle**: Space - Toggle task status
- **Help**: `?` - Show help
- **Quit**: `q` - Exit viewer

#### Display Features
- Real-time task updates
- Syntax highlighting
- Status indicators
- Keyboard shortcut overlay

---

## 4. RESEARCH & AI INTEGRATION

### 4.1 Research Service
- **Commands**: 
  - `cc research "<query>"`
  - `cc task research "<query>"` (creates tasks too)
- **Options**:
  - `-f, --files <files...>` - Include specific files
  - `--format <format>` - tasks, report, both (default: both)
  - `--depth <number>` - Max research depth (default: 3)

### 4.2 AI Provider Support
- **OpenAI**: Via OPENAI_API_KEY environment variable
- **Anthropic**: Via ANTHROPIC_API_KEY environment variable
- **Mock Provider**: Fallback when no API keys available

### 4.3 Research Features
- Multi-agent research system
- Web search integration
- Report generation (Markdown format)
- Automatic task creation from research
- Configurable research depth

---

## 5. ANALYTICS & MONITORING

### 5.1 Usage Analytics
- **Command**: `cc analytics [action]`
- **Actions**:
  - `stats` (default) - Show usage statistics
  - `export` - Export analytics data
  - `clear` - Clear all analytics

### 5.2 Analytics Features
- **Metrics Tracked**:
  - Command usage frequency
  - Success/failure rates
  - Execution times
  - Error types and counts
- **Privacy**: Anonymous usage tracking only
- **Export Formats**: JSON, CSV

### 5.3 Statistics Display
- Total commands tracked
- Recent commands (7 days)
- Success rate percentage
- Top commands ranking
- Error breakdown analysis

---

## 6. SYSTEM & VERIFICATION

### 6.1 Installation Verification
- **Command**: `cc verify` (alias: `cc check`)
- **Options**:
  - `--health` - Quick health check only
  - `--skip-docker` - Skip Docker-related tests
  - `--skip-performance` - Skip performance benchmarks
  - `-v, --verbose` - Verbose output

### 6.2 Verification Features
- System requirements check
- Storage permissions verification
- Dependency validation
- Performance benchmarking
- Docker environment testing
- Health status reporting

### 6.3 Help & Documentation
- **Command**: `cc shortcuts` (alias: `cc keys`)
- **Output**: Complete keyboard shortcuts reference
- **Features**: CLI shortcuts, viewer controls, documentation links

---

## 7. DATA STORAGE & ARCHITECTURE

### 7.1 Storage System
- **Location**: `~/.critical-claude/`
- **Format**: JSON-based persistent storage
- **Features**: Automatic directory creation, backup management

### 7.2 Domain Architecture
- **Task Management**: Core CRUD operations with business logic
- **Template System**: TOML-based template engine
- **Research Intelligence**: AI-powered research and analysis
- **User Interface**: Terminal-based viewer with Vim navigation
- **Analytics**: Usage tracking and reporting
- **Infrastructure**: Shared services and utilities

### 7.3 Error Handling
- Comprehensive input validation
- Graceful degradation on failures
- Detailed error messages with suggestions
- Automatic recovery mechanisms

---

## 8. TECHNICAL SPECIFICATIONS

### 8.1 Dependencies
- **Runtime**: Node.js ≥18.0.0, npm ≥9.0.0
- **Architecture**: Domain-Driven Design (DDD)
- **Language**: TypeScript with ES modules
- **CLI Framework**: Commander.js

### 8.2 Security Features
- Input sanitization for all user inputs
- Rate limiting on task creation
- Command injection prevention
- XSS protection in templates
- Secure file operations

### 8.3 Performance Features
- Lazy loading of AI services
- Efficient task storage and retrieval
- Memory usage optimization
- Asynchronous operations
- Performance metrics tracking

---

## 9. KNOWN LIMITATIONS

### 9.1 AI Command Issues
- `cc task ai` and `cc task research` frequently timeout (2+ minutes)
- AI features require API keys for full functionality
- Mock provider has limited capabilities

### 9.2 Template Limitations
- Only 2 built-in templates fully implemented: `bug-fix`, `basic-project`
- Advanced enterprise templates not yet available
- No visual template editor

### 9.3 Task System Limitations
- No task dependencies or hierarchies
- No task relationships or parent-child structures
- No task expansion or breakdown features
- Tasks are flat, independent items

---

## 10. INTEGRATION CAPABILITIES

### 10.1 File System Integration
- Import/export across multiple formats
- Template file management
- Research report generation
- Backup and restore functionality

### 10.2 Environment Integration
- Environment variable configuration
- Shell command execution for verification
- Docker integration (optional)
- CI/CD pipeline support

This specification represents the complete current state of Critical Claude CLI as implemented. The system is production-ready for task management with robust error handling, comprehensive CLI interface, and extensible architecture for future enhancements.