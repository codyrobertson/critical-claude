# 🎮 Critical Claude Keyboard Shortcuts

Critical Claude supports comprehensive Vim-style keyboard navigation and shortcuts across all interfaces. This guide covers all available keyboard shortcuts for maximum productivity.

## 📋 Task Viewer (cc viewer)

### 🧭 Navigation Commands

#### Movement
| Key | Description |
|-----|-------------|
| `h` | Move left |
| `j` | Move down |
| `k` | Move up |
| `l` | Move right |
| `↑` `↓` `←` `→` | Arrow keys (alternative movement) |

#### Word Movement
| Key | Description |
|-----|-------------|
| `w` | Move word forward |
| `b` | Move word backward |
| `e` | Move to word end |

#### Line Movement
| Key | Description |
|-----|-------------|
| `0` | Move to line start |
| `$` | Move to line end |
| `^` | Move to first non-blank character |

#### File Movement
| Key | Description |
|-----|-------------|
| `gg` | Move to file start (first task) |
| `G` | Move to file end (last task) |

#### Page Movement
| Key | Description |
|-----|-------------|
| `Ctrl+f` | Page down |
| `Ctrl+b` | Page up |
| `Ctrl+d` | Half page down |
| `Ctrl+u` | Half page up |

### 🎯 Mode Switching

| Key | Description |
|-----|-------------|
| `i` | Enter insert mode |
| `a` | Enter insert mode after cursor |
| `o` | Open line below and enter insert mode |
| `O` | Open line above and enter insert mode |
| `v` | Enter visual mode |
| `V` | Enter visual line mode |
| `Escape` | Return to normal mode |
| `:` | Enter command mode |

### ✏️ Task Editing

| Key | Description |
|-----|-------------|
| `x` | Delete character |
| `dd` | Delete current task |
| `dw` | Delete word |
| `cc` | Change (edit) current task |
| `cw` | Change word |
| `yy` | Copy (yank) current task |
| `p` | Paste after current position |
| `P` | Paste before current position |
| `u` | Undo last action |
| `Ctrl+r` | Redo last undone action |

### 🔍 Search Commands

| Key | Description |
|-----|-------------|
| `/` | Search forward (opens search modal) |
| `?` | Search backward |
| `n` | Next search result |
| `N` | Previous search result |
| `*` | Search for word under cursor (forward) |
| `#` | Search for word under cursor (backward) |

### 📝 Task-Specific Actions

| Key | Description |
|-----|-------------|
| `Enter` | Select/open current task |
| `Space` | Toggle task status (todo ↔ done) |
| `tc` | Mark task as complete |
| `tp` | Change task priority |
| `tt` | Add tag to task |
| `td` | Delete current task |

### 🎛️ View Controls

| Key | Description |
|-----|-------------|
| `f` | Filter tasks by status |
| `s` | Sort tasks |
| `r` | Refresh task list |
| `q` | Quit viewer |
| `?` | Show help/shortcuts |
| `Tab` | Switch between panes (in split view) |

### 🔢 Numeric Prefixes

You can prefix most movement and action commands with numbers to repeat them:

| Example | Description |
|---------|-------------|
| `5j` | Move down 5 lines |
| `3dd` | Delete 3 tasks |
| `10G` | Go to task number 10 |
| `2w` | Move forward 2 words |

---

## 🖥️ CLI Commands

### 📋 Task Management

```bash
# Create task
cc task create --title "Task title" --description "Description"

# List tasks
cc task list

# View specific task
cc task view <task-id>

# Update task
cc task update <task-id> --status done --priority high

# Delete task
cc task delete <task-id>

# Archive task
cc task archive <task-id>
```

### 💾 Data Management

```bash
# Export tasks
cc task export --format json --file backup.json --include-archived

# Import tasks
cc task import --file backup.json --merge-strategy merge

# Create backup
cc task backup --format json

# List backups
cc task backup --list
```

### 🔍 Search & Filter

```bash
# List by status
cc task list --status todo
cc task list --status in_progress
cc task list --status done

# List by priority
cc task list --priority critical
cc task list --priority high

# List by assignee
cc task list --assignee "john@example.com"
```

### 📊 Analytics

```bash
# View usage statistics
cc analytics stats

# Export analytics
cc analytics export --format csv

# Clear analytics data
cc analytics clear
```

### 🎨 Templates

```bash
# List available templates
cc template list

# Apply template
cc template apply <template-name>

# View template details
cc template view <template-name>
```

### 🔬 Research

```bash
# Generate tasks from research
cc research "implement authentication system" --format tasks

# Generate report and tasks
cc research "database optimization" --format both --depth 3
```

### 🖥️ Viewer

```bash
# Launch task viewer
cc viewer

# Launch with specific theme
cc viewer --theme light

# Launch with debug logging
cc viewer --log-level debug
```

---

## 🚀 Power User Tips

### ⚡ Quick Task Creation
```bash
# Quick task with all common options
cc task create -t "Fix login bug" -d "Users can't login with special characters" \
  -p high -s todo --assignee "dev@company.com" --labels bug,auth --hours 3
```

### 🔄 Batch Operations
```bash
# Export, modify externally, then import back
cc task export --format csv --file tasks.csv
# Edit tasks.csv in spreadsheet application
cc task import --file tasks.csv --merge-strategy replace
```

### 📈 Productivity Workflow
1. `cc viewer` - Launch viewer for overview
2. `f` - Filter by current status (e.g., todo)
3. `Enter` - Select high-priority task
4. Work on task in external tools
5. `Space` - Mark complete when done
6. `j` - Move to next task

### 🎯 Search Workflow
1. `/` - Open search
2. Type search query (searches title, description, tags)
3. `Enter` - Select first result
4. `n`/`N` - Navigate through results
5. `Escape` - Exit search

### 📊 Monitoring Usage
```bash
# Check your productivity patterns
cc analytics stats

# Export for external analysis
cc analytics export --format csv
```

---

## 🐛 Troubleshooting

### Common Issues

**Viewer won't start**: Check that you have tasks created first with `cc task create`

**Search not working**: Ensure you're in normal mode, then press `/`

**Keys not responding**: Press `Escape` to return to normal mode

**Can't exit viewer**: Press `q` in normal mode, or `Ctrl+C` as fallback

### 🆘 Getting Help

- Press `?` in the viewer for in-app help
- Run `cc --help` for CLI command help
- Run `cc <command> --help` for specific command help

---

## 🎨 Customization

The keyboard shortcuts follow Vim conventions and are currently not customizable. This ensures:
- ✅ Consistency across installations
- ✅ Muscle memory transfer from Vim/Vi
- ✅ Predictable behavior for all users
- ✅ Easier documentation and support

Future versions may include customizable keybindings for power users who want to adapt the interface to their specific workflows.

---

*Happy task managing! 🚀*