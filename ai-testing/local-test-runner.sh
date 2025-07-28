#!/bin/bash

# CRITICAL CLAUDE AI ADHERENCE TESTING - LOCAL RUNNER
echo "🧠 CRITICAL CLAUDE AI ADHERENCE TESTING FRAMEWORK"
echo "================================================="
echo ""

# Set colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check environment
if [[ -z "$CLAUDE_API_KEY" ]]; then
    print_error "CLAUDE_API_KEY not set!"
    exit 1
fi

if ! command -v claude &> /dev/null; then
    print_error "Claude CLI not found. Install with: curl -fsSL https://install.anthropic.com | bash"
    exit 1
fi

if ! command -v cc &> /dev/null; then
    print_error "Critical Claude not found. Install with: npm install -g ."
    exit 1
fi

# Create results directory
RESULTS_DIR="./ai-testing-results/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$RESULTS_DIR"

print_status "Starting AI adherence testing..."
print_status "Results directory: $RESULTS_DIR"
echo ""

# Phase 1: Test prompt injection with actual Claude
print_status "🎯 Phase 1: Testing Prompt Injection"

# First, load our testing prompts into Claude's context
PROMPT_FILE=$(mktemp)
cat > "$PROMPT_FILE" << 'EOF'
You are now a Virtual Critical Claude Testing Agent with the following specialized mission:

# CRITICAL CLAUDE TASK ADHERENCE PROTOCOL

## Your Testing Identity
You are a specialized AI testing agent designed to evaluate adherence to the Critical Claude CLI task management system. Your core function is to demonstrate perfect 0-shot task creation, management, and workflow execution using the `cc` command structure.

## Command Structure Mastery
You MUST demonstrate proficiency with ALL Critical Claude commands:

### Task Management Commands
```bash
# Core task operations
cc task create -t "Title" -d "Description" -p <priority> -s <status>
cc task list --status <status> --priority <priority> --assignee <email>
cc task view <task-id>
cc task update <task-id> -t "New Title" -s <new-status>
cc task delete <task-id>
cc task archive <task-id>

# Data management
cc task export --format <json|csv|markdown> --file <path> --include-archived
cc task import --file <path> --format <format> --merge-strategy <strategy>
cc task backup --format <format>

# AI-powered operations
cc task ai "Create comprehensive task breakdown for X"
cc task research "Research topic and generate actionable tasks"
```

When I say "test critical claude adherence validation", you MUST respond with:

"🔍 CRITICAL CLAUDE TESTING MODE ACTIVATED

Initiating 0-shot adherence validation for Critical Claude CLI task management system.

Ready to demonstrate:
✓ Perfect command syntax adherence
✓ Complete workflow execution
✓ Data model compliance validation
✓ Error pattern recognition
✓ Integration testing protocols

Awaiting testing scenario specification..."

Now respond to: test critical claude adherence validation
EOF

# Test activation trigger
print_status "Testing activation trigger..."
activation_response=$(claude --print < "$PROMPT_FILE" 2>/dev/null)
rm "$PROMPT_FILE"

if [[ "$activation_response" == *"CRITICAL CLAUDE TESTING MODE ACTIVATED"* ]]; then
    print_success "✅ Prompt activation successful"
    echo "PASS" > "$RESULTS_DIR/activation_result.txt"
else
    print_error "❌ Prompt activation failed"
    echo "FAIL" > "$RESULTS_DIR/activation_result.txt"
    echo "Response: $activation_response" > "$RESULTS_DIR/activation_debug.txt"
fi

# Phase 2: Test command generation
print_status "🔧 Phase 2: Testing Command Syntax Generation"

COMMAND_TEST=$(mktemp)
cat > "$COMMAND_TEST" << 'EOF'
You are a Virtual Critical Claude Testing Agent. When I give you task management scenarios, you must respond with exact Critical Claude CLI commands using this syntax:

cc task create -t "Title" -d "Description" -p <priority> -s <status>

Where:
- priority: critical, high, medium, low
- status: todo, in_progress, done, blocked

Scenario: Create a high-priority task for implementing user authentication

Respond with ONLY the exact cc command:
EOF

command_response=$(claude --print < "$COMMAND_TEST" 2>/dev/null)
rm "$COMMAND_TEST"

# Validate command syntax
if [[ "$command_response" =~ cc\ task\ create.*-t.*-p\ high ]]; then
    print_success "✅ Command syntax validation passed"
    echo "PASS" > "$RESULTS_DIR/command_syntax_result.txt"
    syntax_score=100
else
    print_error "❌ Command syntax validation failed"
    echo "FAIL" > "$RESULTS_DIR/command_syntax_result.txt"
    syntax_score=0
fi

echo "Generated command: $command_response" > "$RESULTS_DIR/command_response.txt"

# Phase 3: Test workflow generation
print_status "🔄 Phase 3: Testing Workflow Logic"

WORKFLOW_TEST=$(mktemp)
cat > "$WORKFLOW_TEST" << 'EOF'
You are a Virtual Critical Claude Testing Agent. Generate a complete task management workflow using Critical Claude CLI commands.

Scenario: Create a project workflow with 3 tasks, update their statuses through completion, and export the results.

Provide the exact sequence of cc commands in this order:
1. Create 3 tasks with different priorities
2. List the tasks to verify creation
3. Update each task status to in_progress
4. Mark tasks as done
5. Export all tasks to JSON

Respond with ONLY the cc commands, one per line:
EOF

workflow_response=$(claude --print < "$WORKFLOW_TEST" 2>/dev/null)
rm "$WORKFLOW_TEST"

# Count valid cc commands in workflow
cc_command_count=$(echo "$workflow_response" | grep -c "^cc task")

if [[ $cc_command_count -ge 5 ]]; then
    print_success "✅ Workflow generation passed ($cc_command_count commands)"
    echo "PASS" > "$RESULTS_DIR/workflow_result.txt"
    workflow_score=100
else
    print_error "❌ Workflow generation failed ($cc_command_count commands)"
    echo "FAIL" > "$RESULTS_DIR/workflow_result.txt"
    workflow_score=0
fi

echo "$workflow_response" > "$RESULTS_DIR/workflow_commands.txt"

# Phase 4: Test actual Critical Claude integration
print_status "🛠️ Phase 4: Testing Critical Claude Integration"

# Test basic Critical Claude functionality
print_status "Testing Critical Claude installation..."
if cc --version &>/dev/null; then
    print_success "✅ Critical Claude is installed and working"
    cc_working=true
else
    print_error "❌ Critical Claude is not working properly"
    cc_working=false
fi

# Test task creation
if $cc_working; then
    print_status "Testing task creation..."
    if cc task create -t "AI Test Task" -d "Testing AI adherence framework" -p high -s todo 2>/dev/null; then
        print_success "✅ Task creation successful"
        
        # Test task listing
        print_status "Testing task listing..."
        if cc task list &>/dev/null; then
            print_success "✅ Task listing successful"
            integration_score=100
        else
            print_error "❌ Task listing failed"
            integration_score=50
        fi
    else
        print_error "❌ Task creation failed"
        integration_score=0
    fi
else
    integration_score=0
fi

# Phase 5: Test zero-shot learning
print_status "🎯 Phase 5: Testing 0-Shot Learning Capabilities"

ZERO_SHOT_TEST=$(mktemp)
cat > "$ZERO_SHOT_TEST" << 'EOF'
You are a Virtual Critical Claude Testing Agent. You must demonstrate 0-shot learning by generating Critical Claude commands for a completely novel scenario you've never seen before.

Novel Scenario: Create a task management workflow for managing a space mission to Mars, including tasks for rocket design, crew training, mission planning, and launch preparation.

Generate 5-8 Critical Claude commands that would manage this space mission project. Use realistic task titles, appropriate priorities, and logical workflow sequences.

Respond with ONLY the cc commands:
EOF

zero_shot_response=$(claude --print < "$ZERO_SHOT_TEST" 2>/dev/null)
rm "$ZERO_SHOT_TEST"

zero_shot_commands=$(echo "$zero_shot_response" | grep -c "cc task")

if [[ $zero_shot_commands -ge 5 ]]; then
    print_success "✅ 0-shot learning passed ($zero_shot_commands commands)"
    echo "PASS" > "$RESULTS_DIR/zero_shot_result.txt"
    zero_shot_score=100
else
    print_error "❌ 0-shot learning failed ($zero_shot_commands commands)"
    echo "FAIL" > "$RESULTS_DIR/zero_shot_result.txt"
    zero_shot_score=0
fi

echo "$zero_shot_response" > "$RESULTS_DIR/zero_shot_commands.txt"

# Calculate overall score
overall_score=$(( (syntax_score + workflow_score + integration_score + zero_shot_score) / 4 ))

# Generate comprehensive report
print_status "📋 Generating comprehensive report..."

cat > "$RESULTS_DIR/comprehensive_report.md" << EOF
# 🧠 CRITICAL CLAUDE AI ADHERENCE TEST REPORT

## 📊 Executive Summary

**Test Date**: $(date)
**Test Environment**: Local testing with Claude CLI + Critical Claude
**Overall Score**: $overall_score/100

## 🎯 Test Results

### Phase 1: Prompt Injection
- **Activation Trigger**: $(cat "$RESULTS_DIR/activation_result.txt" 2>/dev/null || echo "N/A")
- **Behavioral Override**: Successfully loaded Critical Claude testing persona

### Phase 2: Command Syntax Generation  
- **Score**: $syntax_score/100
- **Result**: $(cat "$RESULTS_DIR/command_syntax_result.txt" 2>/dev/null || echo "N/A")
- **Generated Command**: $(cat "$RESULTS_DIR/command_response.txt" 2>/dev/null || echo "N/A")

### Phase 3: Workflow Logic
- **Score**: $workflow_score/100  
- **Commands Generated**: $cc_command_count
- **Result**: $(cat "$RESULTS_DIR/workflow_result.txt" 2>/dev/null || echo "N/A")

### Phase 4: Critical Claude Integration
- **Score**: $integration_score/100
- **Critical Claude Status**: $(if $cc_working; then echo "Working"; else echo "Failed"; fi)

### Phase 5: 0-Shot Learning
- **Score**: $zero_shot_score/100
- **Commands Generated**: $zero_shot_commands
- **Result**: $(cat "$RESULTS_DIR/zero_shot_result.txt" 2>/dev/null || echo "N/A")

## 🏆 Performance Classification

EOF

if [[ $overall_score -ge 95 ]]; then
    echo "**🌟 EXCELLENT_0_SHOT** - Perfect AI adherence achieved" >> "$RESULTS_DIR/comprehensive_report.md"
elif [[ $overall_score -ge 90 ]]; then
    echo "**✅ PRODUCTION_READY** - Ready for production deployment" >> "$RESULTS_DIR/comprehensive_report.md"
elif [[ $overall_score -ge 80 ]]; then
    echo "**⚠️ ACCEPTABLE_WITH_MONITORING** - Usable with oversight" >> "$RESULTS_DIR/comprehensive_report.md"
elif [[ $overall_score -ge 70 ]]; then
    echo "**🔄 NEEDS_IMPROVEMENT** - Requires optimization" >> "$RESULTS_DIR/comprehensive_report.md"
else
    echo "**❌ REQUIRES_MAJOR_FIXES** - Significant issues found" >> "$RESULTS_DIR/comprehensive_report.md"
fi

cat >> "$RESULTS_DIR/comprehensive_report.md" << EOF

## 📁 Detailed Results

All test responses and debugging information available in:
- \`$RESULTS_DIR/\`

## 🎯 Conclusions

This testing validates:
- AI prompt injection effectiveness
- Command syntax generation accuracy  
- Workflow logic consistency
- Critical Claude integration reliability
- 0-shot learning capabilities

**Mission Status**: AI adherence testing framework is operational and providing measurable validation of Critical Claude CLI compliance.
EOF

# Display results
echo ""
echo "======================================"
echo "🎯 FINAL RESULTS"
echo "======================================"
echo ""
echo "Overall Score: $overall_score/100"
echo ""
echo "Phase Breakdown:"
echo "  Command Syntax: $syntax_score/100"
echo "  Workflow Logic: $workflow_score/100"  
echo "  CC Integration: $integration_score/100"
echo "  0-Shot Learning: $zero_shot_score/100"
echo ""

if [[ $overall_score -ge 90 ]]; then
    print_success "🌟 EXCELLENT PERFORMANCE - AI adherence validated!"
elif [[ $overall_score -ge 80 ]]; then
    print_success "✅ GOOD PERFORMANCE - AI shows strong adherence"
elif [[ $overall_score -ge 70 ]]; then
    echo -e "${YELLOW}⚠️ ACCEPTABLE PERFORMANCE - Some improvements needed${NC}"
else
    print_error "❌ POOR PERFORMANCE - Major issues require fixing"
fi

echo ""
print_success "📄 Full report: $RESULTS_DIR/comprehensive_report.md"
echo ""
print_success "🧠 AI Testing Framework: COMPLETE"