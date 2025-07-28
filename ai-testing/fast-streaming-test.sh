#!/bin/bash

# FAST STREAMING CRITICAL CLAUDE TESTING SUITE
# Live streaming output with optimized performance

echo "🚀 FAST STREAMING CRITICAL CLAUDE TESTING"
echo "=========================================="
echo ""

# Colors for live output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Check environment
if [[ -z "$CLAUDE_API_KEY" ]]; then
    echo "❌ CLAUDE_API_KEY not set!"
    exit 1
fi

# Quick results directory
RESULTS_DIR="./fast-results/$(date +%H%M%S)"
mkdir -p "$RESULTS_DIR"

echo "📁 Results: $RESULTS_DIR"
echo ""

# Live streaming test function
run_streaming_test() {
    local test_num=$1
    local test_name="$2"
    local prompt="$3"
    
    echo -e "${BLUE}[TEST $test_num]${NC} $test_name"
    echo -e "${YELLOW}▶${NC} Starting..."
    
    # Show prompt preview
    echo -e "${CYAN}Prompt:${NC} ${prompt:0:80}..."
    
    # Start timing
    local start_time=$(date +%s)
    
    # Run test with streaming output
    echo "test critical claude adherence validation

$prompt" | claude --print 2>/dev/null | tee "$RESULTS_DIR/test_${test_num}_response.txt" | while IFS= read -r line; do
        # Live stream processing
        if [[ "$line" =~ ^cc\ ]]; then
            echo -e "${GREEN}  ✓${NC} $line"
        elif [[ "$line" =~ ^#\ ]]; then
            echo -e "${PURPLE}  💭${NC} ${line:2}"
        fi
    done
    
    # Calculate timing
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Quick metrics
    local cmd_count=$(grep -c "^cc " "$RESULTS_DIR/test_${test_num}_response.txt" 2>/dev/null || echo "0")
    local create_count=$(grep -c "cc task create" "$RESULTS_DIR/test_${test_num}_response.txt" 2>/dev/null || echo "0")
    local expand_count=$(grep -c "cc task expand" "$RESULTS_DIR/test_${test_num}_response.txt" 2>/dev/null || echo "0")
    
    # Live results
    echo -e "${GREEN}✅ COMPLETE${NC} | ${duration}s | ${cmd_count} commands (${create_count} create, ${expand_count} expand)"
    echo ""
    
    # Quick validation
    if [[ $cmd_count -ge 5 ]]; then
        echo -e "${GREEN}  🎯 EXCELLENT${NC} - Strong Critical Claude usage"
    elif [[ $cmd_count -ge 1 ]]; then
        echo -e "${YELLOW}  ⚠️ PARTIAL${NC} - Some Critical Claude commands"
    else
        echo -e "${RED}  ❌ FAILED${NC} - No Critical Claude commands"
    fi
    echo ""
}

# Multi-turn streaming test
run_multi_turn_streaming() {
    local project_name="$1"
    local initial_prompt="$2"
    
    echo -e "${PURPLE}🔄 MULTI-TURN PROJECT:${NC} $project_name"
    echo ""
    
    # Turn 1: Initial
    echo -e "${CYAN}Turn 1: Project Creation${NC}"
    local response1_file="$RESULTS_DIR/multiturn_1_response.txt"
    echo "test critical claude adherence validation

$initial_prompt" | claude --print 2>/dev/null | tee "$response1_file" | while IFS= read -r line; do
        if [[ "$line" =~ ^cc\ ]]; then
            echo -e "${GREEN}  ✓${NC} $line"
        fi
    done
    
    local cmd1=$(grep -c "^cc " "$response1_file" 2>/dev/null || echo "0")
    echo -e "${GREEN}✅ Turn 1 Complete:${NC} $cmd1 commands"
    echo ""
    
    # Turn 2: Status Update (faster)
    echo -e "${CYAN}Turn 2: Status Update${NC}"
    local update_prompt="Update project status: mark 3 tasks as completed, 2 as in progress, create 5 new tasks discovered during development. Use Critical Claude CLI only."
    local response2_file="$RESULTS_DIR/multiturn_2_response.txt"
    
    echo "$update_prompt" | claude --print 2>/dev/null | tee "$response2_file" | while IFS= read -r line; do
        if [[ "$line" =~ ^cc\ ]]; then
            echo -e "${GREEN}  ✓${NC} $line"
        fi
    done
    
    local cmd2=$(grep -c "^cc " "$response2_file" 2>/dev/null || echo "0")
    echo -e "${GREEN}✅ Turn 2 Complete:${NC} $cmd2 commands"
    echo ""
    
    # Turn 3: Expansion
    echo -e "${CYAN}Turn 3: Task Expansion${NC}"
    local expand_prompt="Expand the most complex task into 8 subtasks using cc task expand. Then create research tasks. Use only Critical Claude CLI."
    local response3_file="$RESULTS_DIR/multiturn_3_response.txt"
    
    echo "$expand_prompt" | claude --print 2>/dev/null | tee "$response3_file" | while IFS= read -r line; do
        if [[ "$line" =~ ^cc\ ]]; then
            echo -e "${GREEN}  ✓${NC} $line"
        fi
    done
    
    local cmd3=$(grep -c "^cc " "$response3_file" 2>/dev/null || echo "0")
    echo -e "${GREEN}✅ Turn 3 Complete:${NC} $cmd3 commands"
    echo ""
    
    # Quick summary
    local total_cmds=$((cmd1 + cmd2 + cmd3))
    echo -e "${PURPLE}🎯 PROJECT COMPLETE:${NC} $total_cmds total commands across 3 turns"
    echo ""
}

echo "🏃‍♂️ Starting Fast Streaming Tests..."
echo ""

# Quick single tests
run_streaming_test 1 "Basic Task Creation" \
"Create a comprehensive task for building a React dashboard with real-time updates. Use Critical Claude CLI."

run_streaming_test 2 "Complex Project Breakdown" \
"Build a complete CI/CD pipeline with Docker, Kubernetes, monitoring, and security scanning. Create full project breakdown using Critical Claude CLI."

run_streaming_test 3 "AI-Powered Research" \
"Research modern authentication patterns and create actionable tasks for implementation. Use cc research and cc task ai commands."

# Multi-turn streaming test
run_multi_turn_streaming "Enterprise API Platform" \
"Build an enterprise API platform with GraphQL, REST endpoints, authentication, rate limiting, monitoring, and documentation. Create comprehensive project plan using Critical Claude CLI."

run_multi_turn_streaming "Mobile App Development" \
"Develop a cross-platform mobile app with offline sync, push notifications, and real-time chat. Plan full development using Critical Claude CLI."

# Quick final summary
echo "📊 FAST TESTING COMPLETE"
echo "========================"
echo ""

# Count all commands quickly
total_commands=$(find "$RESULTS_DIR" -name "*.txt" -exec grep -c "^cc " {} \; | awk '{sum+=$1} END {print sum}')
total_files=$(ls "$RESULTS_DIR"/*.txt 2>/dev/null | wc -l | tr -d ' ')

echo "📈 QUICK STATS:"
echo "  Files: $total_files"
echo "  Commands: $total_commands"
echo "  Avg per test: $((total_commands / total_files))"
echo ""
echo "💾 Results saved to: $RESULTS_DIR"
echo ""
echo "🚀 FAST STREAMING CRITICAL CLAUDE TESTING: COMPLETE"