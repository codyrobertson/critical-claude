#!/bin/bash

# ULTRA FAST STREAMING CRITICAL CLAUDE TEST - OPTIMIZED FOR SPEED
# Minimal overhead, maximum live feedback

echo "🚀 ULTRA FAST CRITICAL CLAUDE STREAMING TEST"
echo "============================================"

# API Key
export CLAUDE_API_KEY="${CLAUDE_API_KEY:-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}"

# Colors
G='\033[0;32m'
B='\033[0;34m' 
Y='\033[1;33m'
NC='\033[0m'

# Counter
cmd_total=0

# Fast test runner
fast_test() {
    local name="$1"
    local prompt="$2"
    
    echo ""
    echo -e "${B}$(date +%H:%M:%S) 🧪 $name${NC}"
    echo -e "${Y}$(date +%H:%M:%S) ▶ Streaming...${NC}"
    
    local start_time=$(date +%s)
    local test_cmds=0
    
    # Run and process in real-time
    echo "test critical claude adherence validation

$prompt" | claude --print 2>/dev/null | while IFS= read -r line; do
        if [[ "$line" =~ ^cc[[:space:]] ]]; then
            ((test_cmds++))
            ((cmd_total++))
            echo -e "${G}$(date +%H:%M:%S) [CMD] $line${NC}"
        fi
        # Save to temp for final count
        echo "$line" >> "/tmp/test_output_$$"
    done
    
    # Get actual count from file
    local actual_cmds=$(grep -c "^cc " "/tmp/test_output_$$" 2>/dev/null || echo "0")
    cmd_total=$((cmd_total + actual_cmds))
    rm -f "/tmp/test_output_$$"
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo -e "${G}$(date +%H:%M:%S) ✅ Complete: $actual_cmds commands in ${duration}s${NC}"
}

echo ""
echo -e "${B}$(date +%H:%M:%S) 🚀 Starting tests...${NC}"

# Test 1: Simple project
fast_test "Dashboard Project" \
"Build React dashboard with charts, user auth, and data export. Use Critical Claude CLI only."

# Test 2: Complex architecture
fast_test "Microservices Platform" \
"Design microservices e-commerce platform with API gateway, user service, product service, order service. Use cc task create and cc task expand."

# Test 3: Multi-turn quick test
echo ""
echo -e "${B}$(date +%H:%M:%S) 🔄 Multi-Turn Quick Test${NC}"

echo -e "${Y}$(date +%H:%M:%S) Turn 1: Create project${NC}"
echo "test critical claude adherence validation

Create mobile app project with authentication, real-time chat, push notifications. Use Critical Claude CLI." | claude --print 2>/dev/null | grep "^cc " | while read -r cmd; do
    echo -e "${G}$(date +%H:%M:%S) [CMD] $cmd${NC}"
    ((cmd_total++))
done

echo -e "${Y}$(date +%H:%M:%S) Turn 2: Update status${NC}"
echo "Mark 3 tasks complete, 2 in progress, create 3 new tasks. Use cc task update and cc task create only." | claude --print 2>/dev/null | grep "^cc " | while read -r cmd; do
    echo -e "${G}$(date +%H:%M:%S) [CMD] $cmd${NC}"
    ((cmd_total++))
done

# Quick AI test
fast_test "AI Research" \
"Research CI/CD best practices and create implementation tasks. Use cc research and cc task ai."

# Final results
echo ""
echo -e "${B}$(date +%H:%M:%S) ⚡ ULTRA FAST TEST COMPLETE${NC}"
echo "=========================================="
echo -e "${G}Total Commands: $cmd_total${NC}"
echo -e "${B}Duration: ~1-2 minutes${NC}"

if [[ $cmd_total -ge 30 ]]; then
    echo -e "${G}🎯 EXCELLENT Critical Claude usage!${NC}"
elif [[ $cmd_total -ge 15 ]]; then
    echo -e "${Y}⚠️ GOOD Critical Claude usage${NC}"
else
    echo -e "❌ POOR Critical Claude usage"
fi

echo ""
echo -e "${B}$(date +%H:%M:%S) 🚀 Test complete!${NC}"