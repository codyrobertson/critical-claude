#!/bin/bash

# FINAL REAL COMMAND TEST - ONLY VERIFIED CRITICAL CLAUDE COMMANDS
# Tests actual working commands with real execution and validation

echo "🎯 FINAL REAL CRITICAL CLAUDE COMMAND TEST"
echo "=========================================="

# API Key
export CLAUDE_API_KEY="${CLAUDE_API_KEY:-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}"

# Colors
G='\033[0;32m'  # Green
B='\033[0;34m'  # Blue  
Y='\033[1;33m'  # Yellow
R='\033[0;31m'  # Red
P='\033[0;35m'  # Purple
C='\033[0;36m'  # Cyan
NC='\033[0m'    # No Color

t() { date +%H:%M:%S; }

# Results tracking
RESULTS_DIR="./final-real-results/$(date +%H%M%S)"
mkdir -p "$RESULTS_DIR"
total_generated=0
total_executed=0
total_successful=0

echo "📁 Results: $RESULTS_DIR"
echo ""

# Test with REAL commands only
run_realistic_test() {
    local test_name="$1"
    local user_prompt="$2"
    
    echo ""
    echo -e "${P}[$(t)] 🧪 TEST: $test_name${NC}"
    echo -e "${C}[$(t)] 👤 USER: ${user_prompt:0:100}...${NC}"
    echo ""
    echo -e "${Y}[$(t)] 🤖 Claude's Response (Real Commands Only):${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    local test_generated=0
    local test_executed=0
    local test_successful=0
    local commands_file="$RESULTS_DIR/${test_name}_commands.txt"
    local execution_file="$RESULTS_DIR/${test_name}_execution.txt"
    
    # Stream Claude's response with real command execution
    echo "test critical claude adherence validation

$user_prompt" | claude --print 2>/dev/null | while IFS= read -r line; do
        case "$line" in
            *"CRITICAL CLAUDE TESTING MODE"*)
                echo -e "${P}[$(t)] 🚀 $line${NC}"
                ;;
            *"💭"*|*"# "*|*"Creating"*|*"Applying"*|*"Listing"*)
                echo -e "${Y}[$(t)] 💭 $line${NC}"
                ;;
            cc\ *)
                ((test_generated++))
                echo -e "${G}[$(t)] 🔧 [CMD $test_generated] $line${NC}"
                echo "$line" >> "$commands_file"
                
                # EXECUTE THE REAL COMMAND
                echo -e "${C}[$(t)] ⚡ Executing: $line${NC}"
                if timeout 10s $line >> "$execution_file" 2>&1; then
                    ((test_successful++))
                    echo -e "${G}[$(t)] ✅ SUCCESS${NC}"
                else
                    local exit_code=$?
                    echo -e "${R}[$(t)] ❌ FAILED (exit code: $exit_code)${NC}"
                fi
                ((test_executed++))
                ;;
            *"Expected:"*|*"└─"*)
                echo -e "${B}[$(t)] 📋 ${line#*Expected: }${NC}"
                ;;
            *"✅"*|*"🎯"*|*"Ready to"*|*"Proceeding"*)
                echo -e "${P}[$(t)] ✨ $line${NC}"
                ;;
            *"```bash"*)
                echo -e "${P}[$(t)] 📦 [CODE BLOCK START]${NC}"
                ;;
            *"```"*)
                echo -e "${P}[$(t)] 📦 [CODE BLOCK END]${NC}"
                ;;
            *)
                if [[ -n "$line" && ! "$line" =~ ^[[:space:]]*$ ]]; then
                    echo -e "${NC}[$(t)] 💬 $line${NC}"
                fi
                ;;
        esac
    done
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Count actual commands from file
    local actual_cmds=$(grep -c "^cc " "$commands_file" 2>/dev/null || echo "0")
    local actual_success=$(grep -c "SUCCESS" "$execution_file" 2>/dev/null || echo "0")
    
    # Update totals
    total_generated=$((total_generated + actual_cmds))
    total_executed=$((total_executed + actual_cmds))
    total_successful=$((total_successful + actual_success))
    
    # Test summary
    local success_rate=0
    if [[ $actual_cmds -gt 0 ]]; then
        success_rate=$((actual_success * 100 / actual_cmds))
    fi
    
    echo -e "${G}[$(t)] 📊 TEST RESULTS:${NC}"
    echo -e "  Generated: $actual_cmds commands"
    echo -e "  Executed: $actual_cmds commands"
    echo -e "  Successful: $actual_success commands"
    echo -e "  Success Rate: $success_rate%"
    
    # Save test summary
    cat > "$RESULTS_DIR/${test_name}_summary.txt" << EOF
Test: $test_name
Generated: $actual_cmds
Executed: $actual_cmds
Successful: $actual_success
Success Rate: $success_rate%
Timestamp: $(date)
EOF
    
    echo ""
}

echo -e "${B}[$(t)] 🚀 Starting Final Real Command Tests...${NC}"

# Test 1: Simple Project Creation
run_realistic_test "Simple_Project" \
"Create a basic web development project with 3-4 tasks for frontend, backend, and testing. Use Critical Claude CLI to create the tasks and apply a template."

# Test 2: Task Management Workflow  
run_realistic_test "Task_Workflow" \
"I need to manage a small team project. Create tasks for user authentication, database setup, and API development. Show me how to list tasks and update their status."

# Test 3: Data Management
run_realistic_test "Data_Management" \
"Create a few development tasks, then export them to JSON format and show analytics. Use Critical Claude CLI for all operations."

# Final comprehensive analysis
echo ""
echo -e "${P}[$(t)] 🎯 FINAL REAL COMMAND TEST COMPLETE${NC}"
echo "=============================================="

# Calculate overall success rate
overall_success_rate=0
if [[ $total_executed -gt 0 ]]; then
    overall_success_rate=$((total_successful * 100 / total_executed))
fi

echo -e "${G}📊 FINAL RESULTS:${NC}"
echo -e "  Commands Generated: $total_generated"
echo -e "  Commands Executed: $total_executed"  
echo -e "  Commands Successful: $total_successful"
echo -e "  Overall Success Rate: $overall_success_rate%"
echo ""

echo -e "${B}📁 DETAILED RESULTS:${NC}"
echo -e "  Generated Commands: $RESULTS_DIR/*_commands.txt"
echo -e "  Execution Logs: $RESULTS_DIR/*_execution.txt"
echo -e "  Test Summaries: $RESULTS_DIR/*_summary.txt"
echo ""

# Final assessment
if [[ $overall_success_rate -ge 90 ]]; then
    echo -e "${G}🎯 EXCELLENT: Critical Claude CLI working perfectly with real commands!${NC}"
elif [[ $overall_success_rate -ge 70 ]]; then
    echo -e "${Y}⚠️ GOOD: Most real commands executing successfully${NC}"
elif [[ $overall_success_rate -ge 50 ]]; then
    echo -e "${Y}⚠️ PARTIAL: Some real commands working${NC}"
else
    echo -e "${R}❌ POOR: Even real commands failing${NC}"
fi

echo ""
echo -e "${P}[$(t)] 🔥 REAL CRITICAL CLAUDE COMMAND VALIDATION COMPLETE${NC}"

# Show which commands actually worked
echo ""
echo -e "${C}📋 COMMAND EXECUTION ANALYSIS:${NC}"
for cmd_file in "$RESULTS_DIR"/*_commands.txt; do
    if [[ -f "$cmd_file" ]]; then
        echo -e "${Y}Commands in $(basename "$cmd_file"):${NC}"
        cat "$cmd_file" | sed 's/^/  /'
        echo ""
    fi
done