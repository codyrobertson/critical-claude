#!/bin/bash

# Empty config test - Tests CLI behavior with no existing data

set -e

echo "🗂️ Empty Config Test"
echo "==================="

# Backup existing config if any
if [ -d "$HOME/.critical-claude" ]; then
    mv "$HOME/.critical-claude" "$HOME/.critical-claude.backup"
    echo "✅ Backed up existing config"
fi

# Test CLI with completely fresh state
echo "🆕 Testing with fresh state..."

# Test basic commands work with no data
cc task list
echo "✅ List command works with no tasks"

cc template list
echo "✅ Template list works"

cc analytics stats
echo "✅ Analytics works with no data"

# Create first task
cc task create -t "First Task Ever" -d "Testing empty state"
echo "✅ Created first task successfully"

# Test that task appears
cc task list | grep "First Task Ever"
echo "✅ First task appears in list"

# Restore original config if it existed
if [ -d "$HOME/.critical-claude.backup" ]; then
    rm -rf "$HOME/.critical-claude"
    mv "$HOME/.critical-claude.backup" "$HOME/.critical-claude"
    echo "✅ Restored original config"
fi

echo "🎉 Empty config test completed successfully"