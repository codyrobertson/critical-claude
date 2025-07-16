# Claude Code Hook Integration Demo

## Current Status

The hook integration has been configured but requires Claude Code to be restarted with the hooks in place for them to take effect.

## Configuration

### 1. User-level hooks (`~/.claude/settings.json`)
```json
{
  "model": "sonnet",
  "hooks": [
    {
      "name": "critical-claude-sync",
      "event": "PostToolUse",
      "command": "/Users/Cody/.critical-claude/claude-code-sync.sh",
      "enabled": true,
      "matcher": {
        "tools": ["Write", "Edit", "MultiEdit", "TodoWrite", "TodoRead"]
      }
    },
    {
      "name": "critical-claude-sync-on-stop",
      "event": "Stop",
      "command": "/Users/Cody/.critical-claude/claude-code-sync.sh",
      "enabled": true
    }
  ]
}
```

### 2. Project-level hooks (`.claude/settings.json`)
Created the same configuration at the project level for redundancy.

### 3. Hook Script (`~/.critical-claude/claude-code-sync.sh`)
```bash
#!/bin/bash
# Logs hook triggers for debugging
echo "[$(date)] Hook triggered! Event: $CLAUDE_HOOK_EVENT, Tool: $CLAUDE_HOOK_TOOL, PWD: $PWD" >> "$HOME/.critical-claude/hook-debug.log"

# Always run sync - Critical Claude manages tasks globally, not per-project
echo "[$(date)] Running Critical Claude sync..." >> "$HOME/.critical-claude/hook-debug.log"

# Run sync command from any directory
node "/Users/Cody/code_projects/critical_claude/packages/backlog-integration/dist/cli/cc-main.js" sync-claude-code --execute 2>&1 | tee -a "$HOME/.critical-claude/sync.log"
```

## How It Works (When Active)

1. **Tool Usage**: When you use tools like Write, Edit, or TodoWrite in Claude Code from ANY directory
2. **Hook Trigger**: The PostToolUse event fires after the tool completes
3. **Global Sync**: The hook script runs and syncs ALL Critical Claude tasks to Claude Code todos (not project-specific)
4. **Logging**: All sync operations are logged to:
   - `~/.critical-claude/sync.log` - Full sync output
   - `~/.critical-claude/hook-debug.log` - Hook trigger events

## Manual Testing

You can manually test the sync at any time:
```bash
~/.critical-claude/claude-code-sync.sh
```

Or use the CLI directly:
```bash
node dist/cli/cc-main.js sync-claude-code --execute
```

## Expected Behavior

When hooks are active:
- Every file edit triggers a sync
- Todo operations automatically sync between systems
- Stop events ensure final sync at conversation end
- Debug logs track all hook activations

## Troubleshooting

If hooks aren't triggering:
1. Restart Claude Code after configuring hooks
2. Check Claude Code was started from the project directory
3. Verify hook script has execute permissions: `chmod +x ~/.critical-claude/claude-code-sync.sh`
4. Check logs: `~/.critical-claude/hook-debug.log` and `~/.critical-claude/sync.log`