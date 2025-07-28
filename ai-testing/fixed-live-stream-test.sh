#!/bin/bash

# FIXED LIVE STREAMING CRITICAL CLAUDE TEST - WITH TIMESTAMPS
# Shows commands in real-time with proper counting and timestamps

echo "⚡ LIVE STREAMING CRITICAL CLAUDE TEST (FIXED)"
echo "============================================="

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
P='\033[0;35m' # Purple
C='\033[0;36m' # Cyan
NC='\033[0m'   # No Color

# Global counter
total_cmd_count=0

# Get timestamp
timestamp() {
    date '+%H:%M:%S'
}

# Live command processor with proper command counting
process_live_output() {
    local test_name="$1"
    local cmd_count=0
    local temp_file="/tmp/live_test_$$"
    
    while IFS= read -r line; do
        echo "$line" >> "$temp_file"
        
        if [[ "$line" =~ ^cc[[:space:]] ]]; then
            ((cmd_count++))
            ((total_cmd_count++))
            echo -e "${G}[$(timestamp)] [CMD $total_cmd_count]${NC} $line"
        elif [[ "$line" == *"Expected:"* ]]; then
            echo -e "${B}[$(timestamp)]   └─${NC} ${line#*Expected: }"
        elif [[ "$line" =~ ^#[[:space:]] ]]; then
            echo -e "${Y}[$(timestamp)]   💭${NC} ${line:2}"
        elif [[ "$line" == *"✅"* ]]; then
            echo -e "${C}[$(timestamp)]   ✓${NC} $line"
        fi
    done
    
    # Count actual cc commands from temp file
    local actual_count=$(grep -c "^cc " "$temp_file" 2>/dev/null || echo "0")
    rm -f "$temp_file"
    
    echo -e "${G}[$(timestamp)] ✅ $test_name Complete: $actual_count commands${NC}"
    echo ""
    
    return $actual_count
}

# Quick test function with timestamps
quick_test() {
    local test_name="$1"
    local prompt="$2"
    
    echo ""
    echo -e "${P}[$(timestamp)] 🧪 TEST:${NC} $test_name"
    echo -e "${Y}[$(timestamp)] ▶ Starting...${NC}"
    
    # Stream test with live processing
    echo "test critical claude adherence validation

$prompt" | claude --print 2>/dev/null | process_live_output "$test_name"
    
    local test_result=$?
    echo -e "${B}[$(timestamp)] Commands in this test: $test_result${NC}"
}

echo ""
echo -e "${P}[$(timestamp)] 🚀 Starting live streaming tests...${NC}"

# Test 1: Quick project
quick_test "Enterprise Dashboard" \
"Build an enterprise analytics dashboard with user management, real-time charts, and export features. Create comprehensive project breakdown using Critical Claude CLI commands only."

# Test 2: Multi-turn simulation
echo ""
echo -e "${P}[$(timestamp)] 🔄 MULTI-TURN: Project Evolution${NC}"

echo -e "${Y}[$(timestamp)] ▶ Turn 1: Initial creation...${NC}"
echo "test critical claude adherence validation

Create a comprehensive e-learning platform with video streaming, assessments, progress tracking, and certificates. Use Critical Claude CLI commands only." | claude --print 2>/dev/null | process_live_output "Multi-Turn Turn 1"

echo -e "${Y}[$(timestamp)] ▶ Turn 2: Scope expansion...${NC}"
echo "The client wants to add: live virtual classrooms, AI tutoring, social learning features, and mobile apps. Update the project using Critical Claude CLI commands only." | claude --print 2>/dev/null | process_live_output "Multi-Turn Turn 2"

echo -e "${Y}[$(timestamp)] ▶ Turn 3: Status updates...${NC}"
echo "Project update: mark 5 tasks complete, 3 in progress, create 4 new tasks discovered during development. Use only cc task update and cc task create commands." | claude --print 2>/dev/null | process_live_output "Multi-Turn Turn 3"

# Test 3: Feature expansion
quick_test "Microservices Architecture" \
"Design microservices architecture for social media platform with user service, content service, notification service, analytics service, and API gateway. Use cc task expand and cc task create extensively."

# Test 4: AI integration
quick_test "AI-Powered Research" \
"Research modern DevOps practices and create implementation tasks. Use cc research and cc task ai commands exclusively."

# Final summary with timestamp
echo ""
echo -e "${P}[$(timestamp)] ⚡ LIVE STREAMING TEST COMPLETE${NC}"
echo "================================================="
echo -e "${G}[$(timestamp)] Total Commands Generated: $total_cmd_count${NC}"
echo -e "${B}[$(timestamp)] Test Duration: $(date)${NC}"

if [[ $total_cmd_count -ge 50 ]]; then
    echo -e "${G}[$(timestamp)] 🎯 EXCELLENT: Strong Critical Claude adherence ($total_cmd_count commands)${NC}"
elif [[ $total_cmd_count -ge 20 ]]; then
    echo -e "${Y}[$(timestamp)] ⚠️ GOOD: Moderate Critical Claude usage ($total_cmd_count commands)${NC}"
else
    echo -e "${R}[$(timestamp)] ❌ POOR: Limited Critical Claude commands ($total_cmd_count commands)${NC}"
fi

echo ""
echo -e "${P}[$(timestamp)] 🚀 Live streaming validation complete!${NC}"

# Save summary to file
echo "Live Streaming Test Results - $(date)" > "/tmp/claude_test_results.txt"
echo "Total Commands: $total_cmd_count" >> "/tmp/claude_test_results.txt"
echo "Test Status: $(if [[ $total_cmd_count -ge 20 ]]; then echo "PASSED"; else echo "FAILED"; fi)" >> "/tmp/claude_test_results.txt"
echo ""
echo -e "${C}[$(timestamp)] 📄 Results saved to: /tmp/claude_test_results.txt${NC}"