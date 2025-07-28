# 🎯 REAL CRITICAL CLAUDE COMMANDS - VERIFIED WORKING

## ✅ VERIFIED WORKING COMMANDS

### Task Management Commands
```bash
# Core CRUD operations
cc task create -t "Title" -d "Description" -p <priority> -s <status> -a <assignee> --labels label1,label2 --hours <number>
cc task list [--status <status>] [--priority <priority>] [--assignee <email>] [--labels <labels>]
cc task view <task-id>
cc task update <task-id> [-t "New Title"] [-d "New Description"] [-s <status>] [-p <priority>] [-a <assignee>]
cc task delete <task-id>
cc task archive <task-id>

# Data management
cc task export [--format json|csv|markdown] [--file <path>] [--include-archived]
cc task import --file <path> [--format json|csv|markdown] [--merge-strategy replace|merge|skip]
cc task backup [--format json|csv|markdown]

# AI-powered operations (WARNING: These timeout frequently)
cc task ai "<query>"
cc task research "<query>" [--format tasks|report|both] [--depth <number>]
```

### Template Operations
```bash
cc template list
cc template apply <template-name> [-v key=value,key2=value2]
cc template view <template-name>
```

### Analytics & System
```bash
cc analytics [stats|export|clear] [--format json|csv]
cc viewer [--theme dark|light] [--log-level debug|info|warn|error]
cc verify [--health] [--skip-docker] [--skip-performance] [-v|--verbose]
cc shortcuts
```

## ❌ COMMANDS THAT DON'T EXIST (AI HALLUCINATIONS)

### Non-existent Task Commands
- `cc task expand` ❌
- `cc task dependencies` ❌ 
- `cc task start` ❌
- `cc task complete` ❌
- `cc task block` ❌
- `cc task suggest` ❌

### Non-existent Analytics Commands
- `cc analytics insights` ❌
- `cc analytics burndown` ❌
- `cc analytics velocity` ❌
- `cc analytics timeline` ❌

### Non-existent Integration Commands
- `cc integration github` ❌
- `cc integration jira` ❌
- `cc integration slack` ❌

## 📋 EXACT PARAMETER VALUES

### Priority Values
- `critical`
- `high` 
- `medium` (default)
- `low`

### Status Values
- `todo` (default)
- `in_progress`
- `done`
- `blocked`

### Export/Import Formats
- `json` (default)
- `csv`
- `markdown`

### Merge Strategies
- `merge` (default)
- `replace`
- `skip`

### Template Variables
- Basic templates: `bug-fix`, `basic-project`
- Variables: `-v key=value,key2=value2`

## ⚠️ KNOWN ISSUES

### AI Commands Timeout
- `cc task ai` and `cc task research` frequently timeout (2+ minutes)
- They work but are unreliable for testing
- Use with long timeouts only

### Template System Limited
- Only 2 built-in templates: `bug-fix`, `basic-project`
- No complex enterprise templates exist

### No Task Relationships
- No dependencies, hierarchies, or task expansion
- Tasks are flat, independent items

## 🎯 RECOMMENDED USAGE PATTERNS

### Reliable Commands (Fast)
```bash
cc task create -t "Build dashboard" -p high -s todo --labels frontend,react --hours 8
cc task list --status todo --priority high
cc task update <task-id> -s in_progress
cc template apply basic-project
cc analytics stats
```

### Unreliable Commands (Slow/Timeout)
```bash
# Use with caution - may timeout
cc task ai "Create auth system"
cc task research "authentication patterns"
```