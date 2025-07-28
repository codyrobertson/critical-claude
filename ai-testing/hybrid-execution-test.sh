#!/bin/bash

# HYBRID EXECUTION TEST - AI GENERATION + REAL CC CLI EXECUTION
# Combines proven AI-to-AI framework with actual Critical Claude command execution

echo "🔥 HYBRID EXECUTION TEST - AI + REAL CC CLI"
echo "==========================================="

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
RESULTS_DIR="./hybrid-results/$(date +%H%M%S)"
mkdir -p "$RESULTS_DIR"
total_generated=0
total_executed=0
total_successful=0

echo "📁 Results: $RESULTS_DIR"
echo ""

# Enhanced streaming with thought capture and command execution
run_hybrid_test() {
    local test_name="$1"
    local user_prompt="$2"
    
    echo ""
    echo -e "${P}[$(t)] 🤖 TEST: $test_name${NC}"
    echo -e "${C}[$(t)] 👤 USER: ${user_prompt:0:100}...${NC}"
    echo ""
    echo -e "${Y}[$(t)] 🧠 Claude's Thought Process:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    local test_generated=0
    local test_executed=0
    local test_successful=0
    local commands_file="$RESULTS_DIR/${test_name}_commands.txt"
    local thoughts_file="$RESULTS_DIR/${test_name}_thoughts.txt"
    local execution_file="$RESULTS_DIR/${test_name}_execution.txt"
    
    # Stream Claude's response with thought capture
    echo "test critical claude adherence validation

$user_prompt" | claude --print 2>/dev/null | while IFS= read -r line; do
        # Capture different types of output
        case "$line" in
            *"CRITICAL CLAUDE TESTING MODE"*)
                echo -e "${P}[$(t)] 🚀 $line${NC}"
                echo "[$(t)] ACTIVATION: $line" >> "$thoughts_file"
                ;;
            *"💭"*|*"# "*|*"Creating"*|*"Expanding"*|*"Generating"*)
                echo -e "${Y}[$(t)] 💭 $line${NC}"
                echo "[$(t)] THOUGHT: $line" >> "$thoughts_file"
                ;;
            cc\ *)
                ((test_generated++))
                echo -e "${G}[$(t)] 🔧 [CMD $test_generated] $line${NC}"
                echo "$line" >> "$commands_file"
                
                # EXECUTE THE ACTUAL COMMAND
                echo -e "${C}[$(t)] ⚡ Executing: $line${NC}"
                if timeout 10s $line >> "$execution_file" 2>&1; then
                    ((test_successful++))
                    echo -e "${G}[$(t)] ✅ SUCCESS${NC}"
                else
                    echo -e "${R}[$(t)] ❌ FAILED (exit code: $?)${NC}"
                fi
                ((test_executed++))
                ;;
            *"Expected:"*|*"└─"*)
                echo -e "${B}[$(t)] 📋 ${line#*Expected: }${NC}"
                echo "[$(t)] EXPECTED: $line" >> "$thoughts_file"
                ;;
            *"✅"*|*"🎯"*|*"Ready to"*)
                echo -e "${P}[$(t)] ✨ $line${NC}"
                echo "[$(t)] STATUS: $line" >> "$thoughts_file"
                ;;
            *"Proceeding with"*|*"Initiating"*)
                echo -e "${C}[$(t)] 🎯 $line${NC}"
                echo "[$(t)] ACTION: $line" >> "$thoughts_file"
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
                    echo "[$(t)] MESSAGE: $line" >> "$thoughts_file"
                fi
                ;;
        esac
    done
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Update totals
    total_generated=$((total_generated + test_generated))
    total_executed=$((total_executed + test_executed))
    total_successful=$((total_successful + test_successful))
    
    # Test summary
    local success_rate=0
    if [[ $test_executed -gt 0 ]]; then
        success_rate=$((test_successful * 100 / test_executed))
    fi
    
    echo -e "${G}[$(t)] 📊 TEST RESULTS:${NC}"
    echo -e "  Generated: $test_generated commands"
    echo -e "  Executed: $test_executed commands"
    echo -e "  Successful: $test_successful commands"
    echo -e "  Success Rate: $success_rate%"
    
    # Save test summary
    cat > "$RESULTS_DIR/${test_name}_summary.txt" << EOF
Test: $test_name
Generated: $test_generated
Executed: $test_executed
Successful: $test_successful
Success Rate: $success_rate%
Timestamp: $(date)
EOF
    
    echo ""
}

echo -e "${B}[$(t)] 🚀 Starting Hybrid Execution Tests...${NC}"

# Test 1: Simple Dashboard Project
run_hybrid_test "Dashboard_Project" \
"Build a React analytics dashboard with user authentication, real-time charts, and data export features. Create comprehensive project breakdown using Critical Claude CLI."

# Test 2: Microservices Architecture  
run_hybrid_test "Microservices_Platform" \
"Design a microservices e-commerce platform with user service, product service, order service, payment gateway, and API gateway. Use cc task create and cc task expand extensively."

# Test 3: DevOps Pipeline
run_hybrid_test "DevOps_Pipeline" \
"Create a complete CI/CD pipeline with Docker, Kubernetes, automated testing, security scanning, and blue-green deployments. Include monitoring and logging setup."

# Final comprehensive analysis
echo ""
echo -e "${P}[$(t)] 🎯 HYBRID EXECUTION TEST COMPLETE${NC}"
echo "=============================================="

# Calculate overall success rate
overall_success_rate=0
if [[ $total_executed -gt 0 ]]; then
    overall_success_rate=$((total_successful * 100 / total_executed))
fi

echo -e "${G}📊 OVERALL RESULTS:${NC}"
echo -e "  Commands Generated: $total_generated"
echo -e "  Commands Executed: $total_executed"  
echo -e "  Commands Successful: $total_successful"
echo -e "  Overall Success Rate: $overall_success_rate%"
echo ""

echo -e "${B}📁 DETAILED RESULTS:${NC}"
echo -e "  Thoughts & Reasoning: $RESULTS_DIR/*_thoughts.txt"
echo -e "  Generated Commands: $RESULTS_DIR/*_commands.txt"
echo -e "  Execution Logs: $RESULTS_DIR/*_execution.txt"
echo -e "  Test Summaries: $RESULTS_DIR/*_summary.txt"
echo ""

# Assessment
if [[ $overall_success_rate -ge 80 ]]; then
    echo -e "${G}🎯 EXCELLENT: Critical Claude CLI integration working perfectly!${NC}"
elif [[ $overall_success_rate -ge 60 ]]; then
    echo -e "${Y}⚠️ GOOD: Most commands executing successfully${NC}"
elif [[ $overall_success_rate -ge 40 ]]; then
    echo -e "${Y}⚠️ PARTIAL: Some integration issues detected${NC}"
else
    echo -e "${R}❌ CRITICAL: Major integration problems detected${NC}"
fi

echo ""
echo -e "${P}[$(t)] 🔥 HYBRID AI + REAL CLI TESTING COMPLETE${NC}"

# Generate final analysis report
cat > "$RESULTS_DIR/ANALYSIS_REPORT.md" << EOF
# Hybrid Execution Test Analysis Report

## Test Overview
- **Date**: $(date)
- **Framework**: AI Generation + Real Critical Claude CLI Execution
- **Tests Executed**: 3 comprehensive scenarios

## Results Summary
- **Commands Generated**: $total_generated
- **Commands Executed**: $total_executed
- **Commands Successful**: $total_successful  
- **Overall Success Rate**: $overall_success_rate%

## Key Findings
1. **AI Command Generation**: $(if [[ $total_generated -ge 20 ]]; then echo "EXCELLENT - Comprehensive command generation"; else echo "LIMITED - Fewer commands than expected"; fi)
2. **CLI Integration**: $(if [[ $overall_success_rate -ge 80 ]]; then echo "WORKING - Commands execute successfully"; elif [[ $overall_success_rate -ge 40 ]]; then echo "PARTIAL - Some execution issues"; else echo "BROKEN - Major integration problems"; fi)
3. **Thought Process Capture**: $(if [[ -f "$RESULTS_DIR"/*_thoughts.txt ]]; then echo "SUCCESS - Claude's reasoning captured"; else echo "FAILED - No thought process captured"; fi)

## Recommendations
$(if [[ $overall_success_rate -ge 80 ]]; then 
    echo "- System ready for production use"
    echo "- Consider scaling to more complex scenarios"
else
    echo "- Investigate command execution failures"
    echo "- Check Critical Claude CLI installation and configuration"
    echo "- Review API permissions and authentication"
fi)

## File Locations
- Detailed logs: $RESULTS_DIR/
- Command files: *_commands.txt
- Thought processes: *_thoughts.txt
- Execution results: *_execution.txt
EOF

echo -e "${C}📋 Analysis report saved: $RESULTS_DIR/ANALYSIS_REPORT.md${NC}"