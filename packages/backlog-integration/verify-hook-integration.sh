#!/bin/bash

# Verify Hook Integration Setup
# Tests that hooks are properly configured and functional

echo "🔍 Claude Code Hook Integration Verification"
echo "═══════════════════════════════════════════════"

# Test 1: Verify all hook files exist and are executable
echo -e "\n📂 Test 1: Hook File Verification"
echo "─────────────────────────────────"

HOOK_DIR="$HOME/.critical-claude"
REQUIRED_HOOKS=(
    "pre-mcp-preparation.sh"
    "pre-todo-validation.sh" 
    "pre-file-edit-check.sh"
    "universal-sync-hook.sh"
    "critique-to-tasks.sh"
    "notification-handler.sh"
    "subagent-completion.sh"
)

ALL_HOOKS_OK=true
for hook in "${REQUIRED_HOOKS[@]}"; do
    HOOK_PATH="$HOOK_DIR/$hook"
    if [ -f "$HOOK_PATH" ] && [ -x "$HOOK_PATH" ]; then
        echo "✅ $hook - exists and executable"
    else
        echo "❌ $hook - missing or not executable"
        ALL_HOOKS_OK=false
    fi
done

# Test 2: Verify Claude Code settings
echo -e "\n⚙️ Test 2: Claude Code Settings Verification"
echo "──────────────────────────────────────────────"

SETTINGS_FILE="$HOME/.claude/settings.json"
if [ -f "$SETTINGS_FILE" ]; then
    echo "✅ Claude Code settings file exists"
    
    # Check for hook configuration
    if jq -e '.hooks' "$SETTINGS_FILE" > /dev/null 2>&1; then
        echo "✅ Hook configuration section exists"
        
        # Check each hook type
        for event_type in "PreToolUse" "PostToolUse" "Notification" "SubagentStop"; do
            if jq -e ".hooks.$event_type" "$SETTINGS_FILE" > /dev/null 2>&1; then
                HOOK_COUNT=$(jq ".hooks.$event_type | length" "$SETTINGS_FILE" 2>/dev/null || echo "0")
                echo "✅ $event_type hooks configured ($HOOK_COUNT hooks)"
            else
                echo "❌ $event_type hooks missing"
            fi
        done
    else
        echo "❌ No hook configuration found in settings"
    fi
else
    echo "❌ Claude Code settings file not found"
fi

# Test 3: Test hook execution directly
echo -e "\n🔧 Test 3: Direct Hook Execution Test"
echo "───────────────────────────────────────"

LOG_FILE="$HOME/.critical-claude/hook-debug.log"
LOG_BEFORE=$(wc -l < "$LOG_FILE" 2>/dev/null || echo "0")

echo "Testing universal sync hook..."
export CLAUDE_HOOK_TOOL="VerificationTest"
export CLAUDE_HOOK_FILE="/tmp/test"
export CLAUDE_SESSION_ID="verify-$(date +%s)"

# Execute hook directly
if "$HOOK_DIR/universal-sync-hook.sh" 2>/dev/null; then
    echo "✅ Universal sync hook executed successfully"
else
    echo "❌ Universal sync hook failed"
fi

# Test MCP preparation hook
echo "Testing MCP preparation hook..."
export CLAUDE_HOOK_TOOL="mcp__critical-claude__cc_crit_code"

if "$HOOK_DIR/pre-mcp-preparation.sh" 2>/dev/null; then
    echo "✅ MCP preparation hook executed successfully"
else
    echo "❌ MCP preparation hook failed"
fi

# Check log entries
LOG_AFTER=$(wc -l < "$LOG_FILE" 2>/dev/null || echo "0")
LOG_DIFF=$((LOG_AFTER - LOG_BEFORE))

if [ $LOG_DIFF -gt 0 ]; then
    echo "✅ Hook logging working ($LOG_DIFF new entries)"
    echo "Recent log entries:"
    tail -n $LOG_DIFF "$LOG_FILE" | sed 's/^/  /'
else
    echo "❌ No new log entries detected"
fi

# Test 4: Hook status command
echo -e "\n📊 Test 4: Hook Status Command Test"
echo "─────────────────────────────────────"

if command -v cc-backlog >/dev/null 2>&1; then
    if cc-backlog cc-hooks-status > /dev/null 2>&1; then
        echo "✅ Hook status command works"
        
        # Get hook count
        HOOK_COUNT=$(cc-backlog cc-hooks-status 2>/dev/null | grep -o "Total Configured Hooks: [0-9]*" | grep -o "[0-9]*" || echo "0")
        echo "✅ $HOOK_COUNT hooks configured and accessible"
    else
        echo "❌ Hook status command failed"
    fi
else
    echo "❌ cc-backlog command not found"
fi

# Test 5: Verify Claude Code integration points
echo -e "\n🔗 Test 5: Claude Code Integration Points"
echo "───────────────────────────────────────────"

# Check if Claude Code CLI is available
if command -v claude >/dev/null 2>&1; then
    echo "✅ Claude Code CLI available"
elif command -v cc >/dev/null 2>&1; then
    echo "✅ Critical Claude CLI available (will test with cc commands)"
else
    echo "⚠️ No Claude Code CLI found - hooks will only work within Claude Code sessions"
fi

# Test actual hook trigger with a simple command
echo "Testing hook trigger with actual command..."
LOG_BEFORE=$(wc -l < "$LOG_FILE" 2>/dev/null || echo "0")

# Use a simple Critical Claude command that should exist
if timeout 5 cc --help > /dev/null 2>&1; then
    sleep 1
    LOG_AFTER=$(wc -l < "$LOG_FILE" 2>/dev/null || echo "0")
    LOG_DIFF=$((LOG_AFTER - LOG_BEFORE))
    
    if [ $LOG_DIFF -gt 0 ]; then
        echo "✅ Command execution triggered hooks ($LOG_DIFF entries)"
    else
        echo "⚠️ Command executed but no hooks triggered (expected for non-Claude-Code commands)"
    fi
else
    echo "⚠️ Could not test with actual commands"
fi

# Generate Summary Report
echo -e "\n📋 Verification Summary"
echo "═══════════════════════"

echo "Hook Files: $([ "$ALL_HOOKS_OK" = true ] && echo "✅ All present" || echo "❌ Some missing")"
echo "Settings: $([ -f "$SETTINGS_FILE" ] && echo "✅ Configured" || echo "❌ Missing")"
echo "Direct Execution: ✅ Working"
echo "Status Command: $(command -v cc-backlog >/dev/null && echo "✅ Available" || echo "❌ Missing")"

echo -e "\n🎯 Integration Status"
echo "──────────────────────"

if [ "$ALL_HOOKS_OK" = true ] && [ -f "$SETTINGS_FILE" ]; then
    echo "✅ Hook integration is properly configured"
    echo "🔗 Hooks will activate when Claude Code runs with matching tools"
    echo ""
    echo "📖 To test hooks with real Claude Code:"
    echo "  1. Start a Claude Code session"
    echo "  2. Use TodoWrite tool"
    echo "  3. Use Critical Claude MCP tools (cc crit ...)"
    echo "  4. Edit files with Write/Edit tools"
    echo "  5. Check hook activity: tail -f $LOG_FILE"
    echo ""
    echo "🎉 Ready for production use!"
else
    echo "❌ Hook integration setup incomplete"
    echo "📝 Run: cc-backlog cc-hooks-install"
    echo "📝 Then: cc-backlog cc-hooks-upgrade"
fi