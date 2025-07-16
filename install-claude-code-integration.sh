#!/bin/bash

# Critical Claude - Claude Code Integration Installer
# This sets up seamless integration with Claude Code

echo "🚀 Installing Critical Claude ↔ Claude Code Integration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if Claude Code is installed
if ! command -v claude &> /dev/null; then
    echo "❌ Claude Code not found. Please install Claude Code first."
    echo "   Visit: https://claude.ai/code"
    exit 1
fi

# Get Claude Code config directory
CLAUDE_CONFIG_DIR="$HOME/.claude"
if [ ! -d "$CLAUDE_CONFIG_DIR" ]; then
    mkdir -p "$CLAUDE_CONFIG_DIR"
fi

echo "📁 Claude Code config directory: $CLAUDE_CONFIG_DIR"

# Create the integration script
INTEGRATION_SCRIPT="$CLAUDE_CONFIG_DIR/critical-claude-integration.sh"

cat > "$INTEGRATION_SCRIPT" << 'EOF'
#!/bin/bash

# Critical Claude Integration Script
# Auto-syncs tasks when Claude Code is used

# Only run in Critical Claude projects
if [ ! -d ".critical-claude" ]; then
    exit 0
fi

# Set environment variable for this session
export CC_AUTO_SYNC=true

# Get the CLI path
CLI_PATH="/Users/Cody/code_projects/critical_claude/packages/backlog-integration/dist/cli/cc-main.js"

# Check if CLI exists
if [ ! -f "$CLI_PATH" ]; then
    echo "⚠️  Critical Claude CLI not found at $CLI_PATH"
    exit 0
fi

# Run sync quietly
echo "🔄 Syncing Critical Claude tasks..."
node "$CLI_PATH" sync-claude-code --execute --quiet 2>/dev/null
echo "✅ Sync complete"

exit 0
EOF

chmod +x "$INTEGRATION_SCRIPT"
echo "✅ Integration script created: $INTEGRATION_SCRIPT"

# Create Claude Code settings with hooks
CLAUDE_SETTINGS="$CLAUDE_CONFIG_DIR/settings.json"

# Backup existing settings if they exist
if [ -f "$CLAUDE_SETTINGS" ]; then
    cp "$CLAUDE_SETTINGS" "$CLAUDE_SETTINGS.backup.$(date +%Y%m%d_%H%M%S)"
    echo "📋 Backed up existing settings to $CLAUDE_SETTINGS.backup.*"
fi

# Create new settings with hooks
cat > "$CLAUDE_SETTINGS" << EOF
{
  "hooks": [
    {
      "name": "critical-claude-sync",
      "description": "Sync Critical Claude tasks automatically",
      "event": "PostToolUse",
      "command": "$INTEGRATION_SCRIPT",
      "enabled": true,
      "silent": false
    },
    {
      "name": "critical-claude-stop-sync",
      "description": "Sync Critical Claude tasks when Claude stops",
      "event": "Stop",
      "command": "$INTEGRATION_SCRIPT",
      "enabled": true,
      "silent": true
    }
  ],
  "autoSync": {
    "enabled": true,
    "interval": 30000
  }
}
EOF

echo "✅ Claude Code settings configured: $CLAUDE_SETTINGS"

# Create a simple alias for the CLI
ALIAS_FILE="$HOME/.critical-claude-aliases"
cat > "$ALIAS_FILE" << EOF
# Critical Claude CLI Aliases
alias cc='node /Users/Cody/code_projects/critical_claude/packages/backlog-integration/dist/cli/cc-main.js'
alias cc-sync='node /Users/Cody/code_projects/critical_claude/packages/backlog-integration/dist/cli/cc-main.js sync-claude-code'
alias cc-status='node /Users/Cody/code_projects/critical_claude/packages/backlog-integration/dist/cli/cc-main.js status'

# Enable auto-sync by default
export CC_AUTO_SYNC=true
EOF

echo "✅ CLI aliases created: $ALIAS_FILE"

# Add to shell profile
SHELL_PROFILE="$HOME/.zshrc"
if [ -f "$HOME/.bashrc" ]; then
    SHELL_PROFILE="$HOME/.bashrc"
fi

if ! grep -q "critical-claude-aliases" "$SHELL_PROFILE" 2>/dev/null; then
    echo "" >> "$SHELL_PROFILE"
    echo "# Critical Claude Integration" >> "$SHELL_PROFILE"
    echo "source $ALIAS_FILE" >> "$SHELL_PROFILE"
    echo "✅ Added to shell profile: $SHELL_PROFILE"
fi

echo ""
echo "🎉 Installation Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔄 How it works:"
echo "  • Hooks run automatically when Claude Code is used"
echo "  • Tasks sync seamlessly in the background"
echo "  • No manual intervention required"
echo ""
echo "🎯 Usage:"
echo "  • Use 'cc' command anywhere: cc task 'fix bug @high'"
echo "  • Run Claude Code in Critical Claude projects"
echo "  • Tasks automatically sync between systems"
echo ""
echo "⚙️  Configuration:"
echo "  • Settings: $CLAUDE_SETTINGS"
echo "  • Aliases: $ALIAS_FILE"
echo "  • Hook script: $INTEGRATION_SCRIPT"
echo ""
echo "🔧 Next steps:"
echo "  1. Restart your terminal (or run: source $SHELL_PROFILE)"
echo "  2. Go to a Critical Claude project directory"
echo "  3. Run: cc task 'test integration'"
echo "  4. Use Claude Code - tasks will sync automatically!"
echo ""
echo "🌟 Enjoy seamless task management across both systems!"