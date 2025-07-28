#!/bin/bash

# LIVE STREAMING CRITICAL CLAUDE TEST - ULTRA FAST
# Shows commands in real-time as they're generated

echo "⚡ LIVE STREAMING CRITICAL CLAUDE TEST"
echo "======================================"

# Check API key
export CLAUDE_API_KEY="${CLAUDE_API_KEY:-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}"

if [[ -z "$CLAUDE_API_KEY" ]]; then
    echo "❌ No API key!"
    exit 1
fi

# Colors
G='\033[0;32m' # Green  
B='\033[0;34m' # Blue
Y='\033[1;33m' # Yellow
R='\033[0;31m' # Red
NC='\033[0m'   # No Color

# Counter
cmd_count=0

# Live command processor
process_live_output() {
    while IFS= read -r line; do
        if [[ "$line" =~ ^cc[[:space:]] ]]; then
            ((cmd_count++))
            echo -e "${G}[CMD $cmd_count]${NC} $line"
        elif [[ "$line" == *"Expected:"* ]]; then
            echo -e "${B}  └─${NC} ${line#*Expected: }"
        elif [[ "$line" =~ ^#[[:space:]] ]]; then
            echo -e "${Y}  💭${NC} ${line:2}"
        fi
    done
}

# Quick test function
quick_test() {
    local test_name="$1"
    local prompt="$2"
    
    echo ""
    echo -e "${B}🧪 TEST:${NC} $test_name"
    echo -e "${Y}▶ Streaming...${NC}"
    
    local start_count=$cmd_count
    
    # Stream test with live processing
    echo "test critical claude adherence validation

$prompt" | claude --print 2>/dev/null | process_live_output
    
    local test_cmds=$((cmd_count - start_count))
    echo -e "${G}✅ Complete: $test_cmds commands${NC}"
}

echo ""
echo "🚀 Starting live streaming tests..."

# Test 1: Quick project
quick_test "Enterprise Dashboard" \
"Build an enterprise analytics dashboard with user management, real-time charts, export features, and mobile responsiveness. Create full breakdown using Critical Claude CLI."

# Test 2: Multi-turn simulation
echo ""
echo -e "${B}🔄 MULTI-TURN: Project Evolution${NC}"
echo -e "${Y}▶ Turn 1: Initial creation...${NC}"

turn1_start=$cmd_count
echo "test critical claude adherence validation

Create a comprehensive e-learning platform with video streaming, assessments, progress tracking, and certificates. Use Critical Claude CLI." | claude --print 2>/dev/null | process_live_output

turn1_cmds=$((cmd_count - turn1_start))
echo -e "${G}✅ Turn 1: $turn1_cmds commands${NC}"

echo -e "${Y}▶ Turn 2: Scope expansion...${NC}"
turn2_start=$cmd_count
echo "The client wants to add: live virtual classrooms, AI tutoring, social learning features, and mobile apps. Update the project using Critical Claude CLI." | claude --print 2>/dev/null | process_live_output

turn2_cmds=$((cmd_count - turn2_start))
echo -e "${G}✅ Turn 2: $turn2_cmds commands${NC}"

echo -e "${Y}▶ Turn 3: Status updates...${NC}"
turn3_start=$cmd_count
echo "Project update: mark 5 tasks complete, 3 in progress, create 4 new blockers discovered. Use cc task update and cc task create only." | claude --print 2>/dev/null | process_live_output

turn3_cmds=$((cmd_count - turn3_start))
echo -e "${G}✅ Turn 3: $turn3_cmds commands${NC}"

# Test 3: Feature expansion
quick_test "Microservices Architecture" \
"Design microservices architecture for social media platform with user service, content service, notification service, analytics service, and API gateway. Use cc task expand extensively."

# Test 4: AI integration
quick_test "AI-Powered Research" \
"Research modern DevOps practices and create implementation tasks. Use cc research and cc task ai commands."

# Final summary
echo ""
echo "⚡ LIVE STREAMING TEST COMPLETE"
echo "==============================="
echo -e "${G}Total Commands Generated: $cmd_count${NC}"
echo -e "${B}Multi-turn Commands: $((turn1_cmds + turn2_cmds + turn3_cmds))${NC}"
echo -e "${Y}Test Duration: ~2-3 minutes${NC}"

if [[ $cmd_count -ge 50 ]]; then
    echo -e "${G}🎯 EXCELLENT: Strong Critical Claude adherence${NC}"
elif [[ $cmd_count -ge 20 ]]; then
    echo -e "${Y}⚠️ GOOD: Moderate Critical Claude usage${NC}"
else
    echo -e "${R}❌ POOR: Limited Critical Claude commands${NC}"
fi

echo ""
echo "🚀 Live streaming validation complete!"