# 🚀 Critical Claude Quick Reference

## Essential Commands

### ⚡ Getting Started
```bash
cc task create -t "My first task"          # Create a task
cc task list                               # List all tasks  
cc viewer                                  # Launch visual interface
cc shortcuts                               # Show all shortcuts
```

### 📋 Task Management
```bash
cc task create -t "Title" -p high         # Create high priority task
cc task list --status todo                # List pending tasks
cc task update <id> --status done         # Mark task complete
cc task archive <id>                      # Archive completed task
```

### 💾 Data Operations
```bash
cc task export --format json              # Export to JSON
cc task backup                            # Create backup
cc task import --file backup.json         # Import from file
```

## Viewer Shortcuts (cc viewer)

### 🧭 Navigation
- `j/k` or `↑/↓` - Move up/down
- `h/l` or `←/→` - Move left/right  
- `gg` / `G` - Go to first/last task
- `Ctrl+f/b` - Page up/down

### 🎯 Actions
- `/` - Search tasks
- `Enter` - Select task
- `Space` - Toggle task status
- `f` - Filter by status
- `q` - Quit

### ✏️ Quick Edits
- `dd` - Delete task
- `tc` - Complete task
- `tp` - Change priority
- `u` - Undo

## 💡 Pro Tips

**Quick Task Creation**
```bash
cc task create -t "Fix login bug" -d "Description" -p high -s todo --labels bug,auth
```

**Batch Export/Import**
```bash
cc task export --format csv --file tasks.csv --include-archived
# Edit in spreadsheet, then:
cc task import --file tasks.csv --merge-strategy replace
```

**Productivity Workflow**
1. `cc viewer` - Visual overview
2. `f` - Filter current work
3. `Enter` - Select priority task
4. `Space` - Mark complete
5. `j` - Next task

Run `cc --help` or `cc shortcuts` for complete documentation!