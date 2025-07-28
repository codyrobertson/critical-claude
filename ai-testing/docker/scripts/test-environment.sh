#!/bin/bash

# TEST ENVIRONMENT SETUP
export CLAUDE_API_KEY="${CLAUDE_API_KEY:-test-mode}"
export CC_HOME="/home/aitest/.critical-claude"
export TESTING_MODE=true
export VALIDATION_STRICT=true

# Initialize Critical Claude
mkdir -p "$CC_HOME"

# Verify installations
echo "🔍 Verifying test environment..."

# Check Claude CLI
if ! command -v claude &> /dev/null; then
    echo "❌ Claude CLI not found"
    exit 1
fi

# Check Critical Claude
if ! command -v cc &> /dev/null; then
    echo "❌ Critical Claude not found"  
    exit 1
fi

echo "✅ Test environment ready"
echo "   Claude CLI: $(claude --version 2>/dev/null || echo 'installed')"
echo "   Critical Claude: $(cc --version 2>/dev/null || echo '2.3.9')"
echo ""