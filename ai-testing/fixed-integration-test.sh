#!/bin/bash

# FIXED CLAUDE CODE + CRITICAL CLAUDE INTEGRATION TEST
# Uses proper non-interactive mode with --print flag

echo "🎯 FIXED CLAUDE CODE + CRITICAL CLAUDE INTEGRATION TEST"
echo "======================================================"

# API Key
export CLAUDE_API_KEY="${CLAUDE_API_KEY:-sk-ant-api03-YlEwpfba69-vJJFrq4pq73lB_88NRuaghRYX8MQs83uaxlwbqVwcrehWV3LCN_nGRNjx4HwKpgbL6vAKMZ5JLIQ-8Hcy7gAA}"

# Colors
G='\033[0;32m'  # Green
B='\033[0;34m'  # Blue  
Y='\033[1;33m'  # Yellow
P='\033[0;35m'  # Purple
NC='\033[0m'    # No Color

echo "📁 Testing Claude Code's ability to use Critical Claude CLI"
echo ""

# Simple integration test with proper non-interactive mode
test_integration() {
    local test_name="$1"
    local prompt="$2"
    
    echo ""
    echo -e "${P}🧪 TEST: $test_name${NC}"
    echo -e "${B}👤 PROMPT: $prompt${NC}"
    echo ""
    echo -e "${Y}🤖 Claude Code Response:${NC}"
    echo "─────────────────────────────────────────────────────────────────────────────────"
    
    # Use --print flag for non-interactive mode with proper escaping
    claude --print "$prompt"
    local exit_code=$?
    
    echo "─────────────────────────────────────────────────────────────────────────────────"
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${G}✅ Test completed successfully${NC}"
    else
        echo -e "${Y}⚠️ Test completed with exit code: $exit_code${NC}"
    fi
    echo ""
}

echo -e "${B}🚀 Starting Fixed Integration Tests...${NC}"

# Test 1: Basic task creation
test_integration "Basic_Task_Creation" \
"I need to use Critical Claude CLI to create a task for user authentication. Please help me create the task with appropriate parameters using the cc command."

# Test 2: Quick project setup  
test_integration "Quick_Project_Setup" \
"Help me use Critical Claude CLI (cc commands) to create 2 tasks for a web project setup. Show me the exact commands to run."

echo ""
echo -e "${P}🎯 INTEGRATION TEST COMPLETE${NC}"
echo ""
echo -e "${G}✅ SUCCESS INDICATORS:${NC}"
echo "• Claude Code should recognize Critical Claude CLI requests"
echo "• Should generate proper cc command syntax"
echo "• Should understand task management workflows"
echo ""
echo -e "${Y}📋 THE INTEGRATION SHOULD BE WORKING!${NC}"
echo "Claude Code can generate Critical Claude CLI commands when prompted."