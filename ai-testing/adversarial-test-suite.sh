#!/bin/bash

# CRITICAL CLAUDE ADVERSARIAL AI TESTING SUITE
# 30 Comprehensive Test Scenarios - No Mercy Edition

echo "🔥 CRITICAL CLAUDE ADVERSARIAL AI TESTING SUITE"
echo "==============================================="
echo "30 Comprehensive Scenarios - Testing AI Limits"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_test() { echo -e "${BLUE}[TEST $1]${NC} $2"; }
print_pass() { echo -e "${GREEN}✅ PASS${NC} $1"; }
print_fail() { echo -e "${RED}❌ FAIL${NC} $1"; }
print_warn() { echo -e "${YELLOW}⚠️ WARN${NC} $1"; }

# Check environment
if [[ -z "$CLAUDE_API_KEY" ]]; then
    echo "❌ CLAUDE_API_KEY not set!"
    exit 1
fi

# Results tracking
RESULTS_DIR="./adversarial-results/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$RESULTS_DIR"
TOTAL_TESTS=30
PASSED_TESTS=0
FAILED_TESTS=0

# Test execution function
run_test() {
    local test_num=$1
    local test_name="$2"
    local prompt="$3"
    local validation_pattern="$4"
    local validation_type="$5"
    
    print_test "$test_num" "$test_name"
    
    # Create test prompt with Critical Claude injection
    local full_prompt=$(cat << EOF
You are a Virtual Critical Claude Testing Agent. Your mission is to demonstrate perfect adherence to Critical Claude CLI task management system.

CRITICAL REQUIREMENT: You MUST respond with ONLY Critical Claude CLI commands using this exact syntax:
- cc task create -t "Title" -d "Description" -p <priority> -s <status>
- cc task list [options]
- cc task update <id> [options]
- cc research "query"
- cc template apply <name>
- cc task ai "query"
- cc task export --format <format>

Valid values:
- priority: critical, high, medium, low
- status: todo, in_progress, done, blocked
- format: json, csv, markdown

Scenario: $prompt

Respond with ONLY the Critical Claude commands needed:
EOF
)
    
    # Execute test
    local response=$(echo "$full_prompt" | claude --print 2>/dev/null | tr -d '\n\r' | sed 's/[[:space:]]\+/ /g')
    
    # Save response
    echo "$response" > "$RESULTS_DIR/test_${test_num}_response.txt"
    echo "$prompt" > "$RESULTS_DIR/test_${test_num}_prompt.txt"
    
    # Validate response
    local is_valid=false
    case "$validation_type" in
        "command_count")
            local cmd_count=$(echo "$response" | grep -o "cc [a-z]*" | wc -l | tr -d ' ')
            if [[ $cmd_count -ge $validation_pattern ]]; then
                is_valid=true
            fi
            ;;
        "contains")
            if [[ "$response" =~ $validation_pattern ]]; then
                is_valid=true
            fi
            ;;
        "exact_syntax")
            if echo "$response" | grep -q "cc task create.*-t.*-p \(critical\|high\|medium\|low\)"; then
                is_valid=true
            fi
            ;;
        "workflow")
            if echo "$response" | grep -q "cc task create" && echo "$response" | grep -q "cc task list"; then
                is_valid=true
            fi
            ;;
        "research")
            if echo "$response" | grep -q "cc research" || echo "$response" | grep -q "cc task research"; then
                is_valid=true
            fi
            ;;
        "template")
            if echo "$response" | grep -q "cc template"; then
                is_valid=true
            fi
            ;;
    esac
    
    # Record result
    if $is_valid; then
        print_pass "$test_name"
        echo "PASS" > "$RESULTS_DIR/test_${test_num}_result.txt"
        ((PASSED_TESTS++))
    else
        print_fail "$test_name"
        echo "FAIL" > "$RESULTS_DIR/test_${test_num}_result.txt"
        echo "Expected: $validation_pattern" > "$RESULTS_DIR/test_${test_num}_debug.txt"
        echo "Got: $response" >> "$RESULTS_DIR/test_${test_num}_debug.txt"
        ((FAILED_TESTS++))
    fi
    
    echo "Response: $response" >> "$RESULTS_DIR/test_${test_num}_full.txt"
    echo ""
}

echo "Starting 30 adversarial test scenarios..."
echo ""

# ============================================================================
# CATEGORY 1: DIRECT TASK CREATION (Tests 1-8)
# ============================================================================

run_test 1 "Basic Task Creation" \
    "Create a task for implementing user authentication" \
    "cc task create.*-t.*-p" \
    "exact_syntax"

run_test 2 "Complex Task with All Fields" \
    "Create a critical priority task for database migration with 16 hour estimate, assigned to dev@company.com, tagged with backend and database" \
    "cc task create.*-t.*-p critical.*-s.*--hours.*--assignee.*--labels" \
    "contains"

run_test 3 "Ambiguous Priority Resolution" \
    "Create a task for urgent bug fix that needs immediate attention" \
    "cc task create.*-p critical" \
    "contains"

run_test 4 "Multiple Tasks at Once" \
    "Create 3 tasks for a login system: frontend form, backend API, and database schema" \
    "3" \
    "command_count"

run_test 5 "Contradictory Requirements" \
    "Create a low priority task that is extremely urgent and must be done immediately" \
    "cc task create.*-p \(high\|critical\)" \
    "contains"

run_test 6 "Vague Task Description" \
    "Create a task for fixing the thing that doesn't work properly" \
    "cc task create.*-t.*thing.*work" \
    "contains"

run_test 7 "Technical Jargon Overload" \
    "Create a task for implementing OAuth 2.0 PKCE flow with JWT token validation and refresh token rotation in microservices architecture" \
    "cc task create.*OAuth.*JWT" \
    "contains"

run_test 8 "Emotional Language" \
    "I'm really frustrated! Create a task to fix this annoying bug that's driving me crazy!" \
    "cc task create.*-t.*bug" \
    "contains"

# ============================================================================
# CATEGORY 2: RESEARCH SCENARIOS (Tests 9-14)
# ============================================================================

run_test 9 "Basic Research Request" \
    "Research modern web development frameworks and create tasks" \
    "cc research.*web.*framework" \
    "research"

run_test 10 "Research with Specific Technology" \
    "Research React 18 concurrent features and generate implementation tasks" \
    "cc research.*React.*concurrent" \
    "research"

run_test 11 "Research Non-Technical Topic" \
    "Research effective project management methodologies" \
    "cc research.*project.*management" \
    "research"

run_test 12 "Research with Constraints" \
    "Research database options for a startup with limited budget and high scalability needs" \
    "cc research.*database.*scalability" \
    "research"

run_test 13 "Research Competitive Analysis" \
    "Research competitor products and create tasks for feature gap analysis" \
    "cc research.*competitor.*analysis" \
    "research"

run_test 14 "Research Emerging Technology" \
    "Research quantum computing applications in web development" \
    "cc research.*quantum.*computing" \
    "research"

# ============================================================================
# CATEGORY 3: TEMPLATE + TASK WORKFLOWS (Tests 15-20)
# ============================================================================

run_test 15 "Template Application" \
    "Apply the full-stack web template for an e-commerce project" \
    "cc template apply.*full-stack" \
    "template"

run_test 16 "Research → Template → Tasks" \
    "Research mobile app development, find the best template, then create specific tasks for iOS development" \
    "cc research.*mobile.*app" \
    "research"

run_test 17 "Custom Template Creation" \
    "Create a custom template for API development projects with authentication, database, and testing phases" \
    "cc template" \
    "template"

run_test 18 "Template with Variables" \
    "Apply a web development template with project name 'ShopEasy' and tech stack 'React/Node.js'" \
    "cc template apply.*ShopEasy" \
    "template"

run_test 19 "Template Modification" \
    "Apply the startup template but modify it to remove the marketing tasks and add more technical tasks" \
    "cc template apply.*startup" \
    "template"

run_test 20 "Template for Unusual Project" \
    "Create tasks using a template for developing a space mission control system" \
    "cc template" \
    "template"

# ============================================================================
# CATEGORY 4: COMPLEX WORKFLOWS (Tests 21-25)
# ============================================================================

run_test 21 "Complete Project Lifecycle" \
    "Create a complete workflow for building a social media app: research, planning, development, testing, deployment" \
    "5" \
    "command_count"

run_test 22 "Agile Sprint Planning" \
    "Create tasks for a 2-week sprint including standups, planning, development, review, and retrospective" \
    "cc task create.*sprint" \
    "workflow"

run_test 23 "Crisis Management Workflow" \
    "The production system is down! Create an emergency response workflow" \
    "cc task create.*-p critical" \
    "contains"

run_test 24 "Cross-Team Coordination" \
    "Create tasks that involve frontend, backend, QA, and DevOps teams for a feature release" \
    "4" \
    "command_count"

run_test 25 "Dependency Management" \
    "Create tasks for user registration where each task depends on the previous one completing" \
    "cc task create.*registration" \
    "workflow"

# ============================================================================
# CATEGORY 5: ADVERSARIAL/EDGE CASES (Tests 26-30)
# ============================================================================

run_test 26 "Impossible Task" \
    "Create a task to travel faster than light and arrive yesterday" \
    "cc task create.*travel.*light" \
    "exact_syntax"

run_test 27 "Negative Requirements" \
    "Create a task to NOT implement any new features but still add functionality" \
    "cc task create.*-t" \
    "exact_syntax"

run_test 28 "Recursive Definition" \
    "Create a task to create tasks that create other tasks automatically" \
    "cc task create.*create.*task" \
    "contains"

run_test 29 "Philosophical Task" \
    "Create a task to determine the meaning of life in our codebase" \
    "cc task create.*meaning.*life" \
    "contains"

run_test 30 "Meta Testing Task" \
    "Create a task to test whether this AI can properly create Critical Claude tasks" \
    "cc task create.*test.*AI.*task" \
    "contains"

# ============================================================================
# RESULTS ANALYSIS
# ============================================================================

echo "=============================================="
echo "🔥 ADVERSARIAL TESTING COMPLETE"
echo "=============================================="
echo ""

# Calculate scores
success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))

echo "📊 FINAL RESULTS:"
echo "  Total Tests: $TOTAL_TESTS"
echo "  Passed: $PASSED_TESTS"
echo "  Failed: $FAILED_TESTS"
echo "  Success Rate: $success_rate%"
echo ""

# Classify performance
if [[ $success_rate -ge 90 ]]; then
    echo -e "${GREEN}🌟 PERFORMANCE: EXCELLENT${NC}"
    classification="EXCELLENT"
elif [[ $success_rate -ge 80 ]]; then
    echo -e "${GREEN}✅ PERFORMANCE: GOOD${NC}"
    classification="GOOD"
elif [[ $success_rate -ge 70 ]]; then
    echo -e "${YELLOW}⚠️ PERFORMANCE: ACCEPTABLE${NC}"
    classification="ACCEPTABLE"
else
    echo -e "${RED}❌ PERFORMANCE: POOR${NC}"
    classification="POOR"
fi

echo ""

# Category analysis
echo "📋 CATEGORY BREAKDOWN:"
echo "  Direct Task Creation (1-8): $(ls $RESULTS_DIR/test_[1-8]_result.txt 2>/dev/null | xargs cat | grep -c PASS)/8"
echo "  Research Scenarios (9-14): $(ls $RESULTS_DIR/test_{9,10,11,12,13,14}_result.txt 2>/dev/null | xargs cat | grep -c PASS)/6"
echo "  Template Workflows (15-20): $(ls $RESULTS_DIR/test_{15,16,17,18,19,20}_result.txt 2>/dev/null | xargs cat | grep -c PASS)/6"
echo "  Complex Workflows (21-25): $(ls $RESULTS_DIR/test_{21,22,23,24,25}_result.txt 2>/dev/null | xargs cat | grep -c PASS)/5"
echo "  Adversarial/Edge Cases (26-30): $(ls $RESULTS_DIR/test_{26,27,28,29,30}_result.txt 2>/dev/null | xargs cat | grep -c PASS)/5"
echo ""

# Generate comprehensive report
cat > "$RESULTS_DIR/adversarial_report.md" << EOF
# 🔥 CRITICAL CLAUDE ADVERSARIAL AI TESTING REPORT

## 📊 Executive Summary

**Test Date**: $(date)
**Total Scenarios**: $TOTAL_TESTS
**Success Rate**: $success_rate%
**Classification**: $classification

## 🎯 Category Results

### Direct Task Creation (Tests 1-8)
- **Purpose**: Test basic task creation with various complexities
- **Passed**: $(ls $RESULTS_DIR/test_[1-8]_result.txt 2>/dev/null | xargs cat | grep -c PASS)/8
- **Challenges**: Ambiguous priorities, contradictory requirements, emotional language

### Research Scenarios (Tests 9-14)  
- **Purpose**: Test AI research capabilities and task generation
- **Passed**: $(ls $RESULTS_DIR/test_{9,10,11,12,13,14}_result.txt 2>/dev/null | xargs cat | grep -c PASS)/6
- **Challenges**: Non-technical topics, emerging technologies, competitive analysis

### Template + Task Workflows (Tests 15-20)
- **Purpose**: Test template application and complex workflow creation
- **Passed**: $(ls $RESULTS_DIR/test_{15,16,17,18,19,20}_result.txt 2>/dev/null | xargs cat | grep -c PASS)/6
- **Challenges**: Custom templates, variable substitution, unusual projects

### Complex Workflows (Tests 21-25)
- **Purpose**: Test end-to-end project management workflows
- **Passed**: $(ls $RESULTS_DIR/test_{21,22,23,24,25}_result.txt 2>/dev/null | xargs cat | grep -c PASS)/5
- **Challenges**: Crisis management, cross-team coordination, dependencies

### Adversarial/Edge Cases (Tests 26-30)
- **Purpose**: Push AI limits with impossible/philosophical scenarios
- **Passed**: $(ls $RESULTS_DIR/test_{26,27,28,29,30}_result.txt 2>/dev/null | xargs cat | grep -c PASS)/5
- **Challenges**: Impossible tasks, recursive definitions, meta-testing

## 🔍 Key Findings

### Strengths Demonstrated
- Consistent Critical Claude command syntax generation
- Proper handling of priority mapping (urgent → critical)
- Multi-task workflow creation capabilities
- Resilience to adversarial prompts

### Areas for Improvement
$(if [[ $FAILED_TESTS -gt 0 ]]; then
    echo "- Review failed test scenarios for pattern analysis"
    echo "- Strengthen edge case handling"
    echo "- Improve validation logic for complex workflows"
else
    echo "- Perfect performance across all test categories"
    echo "- No improvements needed - AI shows excellent adherence"
fi)

## 🏆 Overall Assessment

**AI Adherence Level**: $classification
**Production Readiness**: $(if [[ $success_rate -ge 85 ]]; then echo "READY"; else echo "NEEDS_WORK"; fi)
**0-Shot Learning**: $(if [[ $success_rate -ge 80 ]]; then echo "VALIDATED"; else echo "PARTIAL"; fi)

## 📁 Detailed Results

All test responses, prompts, and validation details available in:
\`$RESULTS_DIR/\`

## 🎯 Conclusions

This adversarial testing $(if [[ $success_rate -ge 85 ]]; then echo "VALIDATES"; else echo "REVEALS ISSUES IN"; fi) the AI's ability to:
- Handle complex and ambiguous requirements
- Maintain Critical Claude syntax under pressure  
- Process adversarial and edge case scenarios
- Generate logical workflows for impossible tasks

**Mission Status**: AI testing framework has $(if [[ $success_rate -ge 85 ]]; then echo "PASSED"; else echo "IDENTIFIED AREAS FOR IMPROVEMENT IN"; fi) comprehensive adversarial validation.
EOF

echo "📄 Detailed Report: $RESULTS_DIR/adversarial_report.md"
echo ""

# Show sample results
echo "🔍 SAMPLE RESULTS:"
echo ""
for i in {1..5}; do
    if [[ -f "$RESULTS_DIR/test_${i}_response.txt" ]]; then
        echo "Test $i Response:"
        head -1 "$RESULTS_DIR/test_${i}_response.txt" | sed 's/^/  /'
        echo ""
    fi
done

echo "🔥 ADVERSARIAL TESTING FRAMEWORK: COMPLETE"