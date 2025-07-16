# Critical Claude Monitor

A beautiful real-time task and hook monitoring system for Critical Claude.

## Features

### 🚀 Beautiful Startup Sequence
- MCP-style startup with ASCII art banner
- Service initialization with progress indicators
- Real-time status updates

### 📋 Task Monitor (Electron GUI)
- **Real-time Task Display**: See all your tasks with status indicators
- **Live Statistics**: Track progress, completion rates, and blocked tasks
- **Hook Activity Monitor**: Watch Claude Code hooks trigger in real-time
- **Sync Status**: See when tasks sync between Critical Claude and Claude Code
- **Beautiful Dark UI**: Modern, responsive interface

### 🪝 Hook Integration
- Automatic sync when using Claude Code tools
- Debug logging for troubleshooting
- Works globally from any directory

## Usage

### Start the Monitor

```bash
# Beautiful startup sequence
npm start

# Or from any directory with cc installed:
cc monitor

# Terminal-based monitor (coming soon):
cc monitor --terminal
```

### Monitor Interface

The Electron app shows:
- **Stats Panel**: Total tasks, in progress, completed, blocked
- **Task List**: All tasks with status symbols, priority colors, and metadata
- **Activity Panel**: Toggle between sync logs and hook activity
- **Hook Events**: Real-time display of Claude Code hook triggers
- **Sync Button**: Manual sync trigger with animation

### Status Symbols

- `○` Pending
- `◐` In Progress  
- `●` Completed
- `■` Blocked

### Priority Colors

- 🔴 Critical (Red)
- 🟠 High (Orange)
- 🔵 Medium (Blue)
- ⚫ Low (Gray)

## Hook Configuration

The setup script automatically configures Claude Code hooks:

```json
{
  "hooks": [
    {
      "name": "critical-claude-sync",
      "event": "PostToolUse",
      "command": "/Users/[username]/.critical-claude/claude-code-sync.sh",
      "enabled": true,
      "matcher": {
        "tools": ["Write", "Edit", "MultiEdit", "TodoWrite", "TodoRead"]
      }
    },
    {
      "name": "critical-claude-sync-on-stop",
      "event": "Stop",
      "command": "/Users/[username]/.critical-claude/claude-code-sync.sh",
      "enabled": true
    }
  ]
}
```

## Architecture

### Components

1. **Startup Script** (`startup.ts`)
   - Beautiful CLI startup sequence
   - Service initialization
   - Hook status checking

2. **Electron App** (`electron-main.ts`, `monitor.html`)
   - Main process handles file watching and IPC
   - Renderer displays real-time updates
   - Preload script for secure context bridge

3. **Task Monitor** (`task-monitor.ts`)
   - Terminal-based monitor using blessed
   - Real-time task and hook monitoring

4. **Monitor Command** (`monitor.ts`)
   - CLI command to launch the monitor
   - Handles Electron process spawning

## Development

```bash
# Build the project
npm run build

# Run in development
npm run dev

# Launch monitor directly
electron dist/monitor/electron-main.js
```

## Logs

- **Sync Log**: `~/.critical-claude/sync.log`
- **Hook Debug Log**: `~/.critical-claude/hook-debug.log`

## Troubleshooting

### Hooks Not Triggering
1. Restart Claude Code after configuring hooks
2. Check `~/.claude/settings.json` has the hook configuration
3. Look for errors in `~/.critical-claude/hook-debug.log`

### Monitor Won't Start
1. Ensure Electron is installed: `npm install`
2. Build the project first: `npm run build`
3. Check for port conflicts on 3001-3004

### Sync Issues
1. Run manual sync: `cc sync-claude-code --execute`
2. Check sync log: `tail -f ~/.critical-claude/sync.log`
3. Verify tasks exist: `cc status`