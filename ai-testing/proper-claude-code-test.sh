#!/bin/bash

# PROPER CLAUDE CODE + CRITICAL CLAUDE INTEGRATION TEST
# Tests how Claude Code (the AI assistant) uses Critical Claude CLI (cc commands)

echo "🤖 PROPER CLAUDE CODE + CRITICAL CLAUDE INTEGRATION TEST"
echo "========================================================"

# API Key
export CLAUDE_API_KEY="${CLAUDE_API_KEY:-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}"

# Colors
G='\033[0;32m'  # Green
B='\033[0;34m'  # Blue  
Y='\033[1;33m'  # Yellow
R='\033[0;31m'  # Red
P='\033[0;35m'  # Purple
NC='\033[0m'    # No Color

t() { date +%H:%M:%S; }

echo "📁 Results will be shown in real-time"
echo ""

# Test Claude Code's ability to use Critical Claude CLI
test_claude_code_integration() {
    local test_name="$1"
    local prompt="$2"
    
    echo ""
    echo -e "${P}[$(t)] 🧪 TEST: $test_name${NC}"
    echo -e "${C}[$(t)] 👤 PROMPT: $prompt${NC}"
    echo ""
    echo -e "${Y}[$(t)] 🤖 Claude Code Response:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Ask Claude Code to use Critical Claude CLI
    claude --print "$prompt" 2>/dev/null | while IFS= read -r line; do
        case "$line" in
            *"cc "*|*"./cc "*|*"bash"*"cc "*)
                echo -e "${G}[$(t)] 🔧 COMMAND: $line${NC}"
                ;;
            *"task"*|*"create"*|*"list"*|*"Critical Claude"*)
                echo -e "${C}[$(t)] 📋 TASK: $line${NC}"
                ;;
            *"Error"*|*"error"*|*"failed"*|*"Failed"*)
                echo -e "${R}[$(t)] ❌ ERROR: $line${NC}"
                ;;
            *)
                if [[ -n "$line" && ! "$line" =~ ^[[:space:]]*$ ]]; then
                    echo -e "${NC}[$(t)] 💬 $line${NC}"
                fi
                ;;
        esac
    done
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

echo -e "${B}[$(t)] 🚀 Starting Proper Integration Tests...${NC}"

# Test 1: Direct request to use Critical Claude
test_claude_code_integration "Direct_CC_Usage" \
"I have a Critical Claude CLI tool (cc command) available. Please help me create a task for building a React dashboard. Use the cc task create command with appropriate parameters."

# Test 2: Project management request
test_claude_code_integration "Project_Management" \
"I'm using Critical Claude for task management. Help me set up a small web development project by creating 3-4 tasks and showing me how to list them. Use the cc commands available in my system."

# Test 3: Workflow demonstration
test_claude_code_integration "Workflow_Demo" \
"Show me how to use Critical Claude CLI (cc commands) to manage a development workflow. Create a task, list tasks, and update a task status. Execute the actual commands."

echo ""
echo -e "${P}[$(t)] 🎯 PROPER INTEGRATION TEST COMPLETE${NC}"
echo ""
echo -e "${Y}This test shows how Claude Code (the AI) actually uses Critical Claude CLI (cc commands).${NC}"
echo -e "${B}Claude Code should use the Bash tool to execute cc commands, not generate them as text.${NC}"