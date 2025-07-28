#!/bin/bash

# ADVANCED AI TESTING WITH TASK EXPANSION & COMPLEX PROMPTS
# Tests AI's ability to break down complex scenarios into detailed task hierarchies

echo "🧠 ADVANCED AI TESTING - TASK EXPANSION & COMPLEX PROMPTS"
echo "========================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

print_test() { echo -e "${BLUE}[TEST $1]${NC} $2"; }
print_pass() { echo -e "${GREEN}✅ PASS${NC} $1"; }
print_fail() { echo -e "${RED}❌ FAIL${NC} $1"; }

# Check environment
if [[ -z "$CLAUDE_API_KEY" ]]; then
    echo "❌ CLAUDE_API_KEY not set!"
    exit 1
fi

RESULTS_DIR="./advanced-testing-results/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$RESULTS_DIR"

echo "📁 Results directory: $RESULTS_DIR"
echo ""

# Advanced test execution with task expansion validation
run_advanced_test() {
    local test_num=$1
    local test_name="$2"
    local scenario="$3"
    local expansion_requirement="$4"
    local complexity_level="$5"
    
    print_test "$test_num" "$test_name ($complexity_level complexity)"
    
    # Create advanced prompt with task expansion requirements
    local full_prompt=$(cat << EOF
You are a Virtual Critical Claude Testing Agent specialized in task breakdown and expansion.

MISSION: Break down complex scenarios into comprehensive task hierarchies using Critical Claude CLI commands.

COMMAND ARSENAL:
- cc task create -t "Title" -d "Description" -p <priority> -s <status> [--labels <labels>] [--hours <hours>] [--assignee <email>]
- cc task expand <task-id> --breakdown <type> --depth <level>
- cc research "query" --depth <number> --format <tasks|report|both>
- cc template apply <name> --variables <vars>
- cc task ai "complex-query-for-breakdown"

EXPANSION REQUIREMENTS:
$expansion_requirement

COMPLEX SCENARIO:
$scenario

CRITICAL REQUIREMENTS:
1. Use ONLY Critical Claude CLI commands
2. Create logical task hierarchies with proper dependencies
3. Include appropriate priorities, estimates, and assignees
4. Break down large tasks into actionable subtasks
5. Use research/AI commands when domain knowledge is needed
6. Apply templates when relevant patterns exist

RESPONSE FORMAT: Provide ONLY the Critical Claude commands, one per line:
EOF
)
    
    # Execute test
    local response=$(echo "$full_prompt" | claude --print 2>/dev/null)
    
    # Save all test data
    echo "$scenario" > "$RESULTS_DIR/test_${test_num}_scenario.txt"
    echo "$expansion_requirement" > "$RESULTS_DIR/test_${test_num}_requirement.txt"
    echo "$response" > "$RESULTS_DIR/test_${test_num}_response.txt"
    echo "$complexity_level" > "$RESULTS_DIR/test_${test_num}_complexity.txt"
    
    # Count different command types
    local create_count=$(echo "$response" | grep -c "cc task create")
    local expand_count=$(echo "$response" | grep -c "cc task expand")
    local research_count=$(echo "$response" | grep -c "cc research\|cc task research")
    local ai_count=$(echo "$response" | grep -c "cc task ai")
    local template_count=$(echo "$response" | grep -c "cc template")
    local total_commands=$(echo "$response" | grep -c "^cc ")
    
    # Save metrics
    echo "create_commands: $create_count" > "$RESULTS_DIR/test_${test_num}_metrics.txt"
    echo "expand_commands: $expand_count" >> "$RESULTS_DIR/test_${test_num}_metrics.txt"
    echo "research_commands: $research_count" >> "$RESULTS_DIR/test_${test_num}_metrics.txt"
    echo "ai_commands: $ai_count" >> "$RESULTS_DIR/test_${test_num}_metrics.txt"
    echo "template_commands: $template_count" >> "$RESULTS_DIR/test_${test_num}_metrics.txt"
    echo "total_commands: $total_commands" >> "$RESULTS_DIR/test_${test_num}_metrics.txt"
    
    # Quick validation
    if [[ $total_commands -ge 3 ]] && [[ $create_count -ge 1 ]]; then
        print_pass "$test_name ($total_commands commands generated)"
        echo "PASS" > "$RESULTS_DIR/test_${test_num}_result.txt"
    else
        print_fail "$test_name (insufficient commands: $total_commands)"
        echo "FAIL" > "$RESULTS_DIR/test_${test_num}_result.txt"
    fi
    
    echo "  Commands: $create_count create, $expand_count expand, $research_count research, $ai_count ai, $template_count template"
    echo ""
}

echo "🚀 Starting 20 Advanced Task Expansion Tests..."
echo ""

# ============================================================================
# CATEGORY 1: ENTERPRISE SOFTWARE DEVELOPMENT (Tests 1-4)
# ============================================================================

run_advanced_test 1 "Enterprise SaaS Platform Development" \
    "Build a complete enterprise SaaS platform for customer relationship management with multi-tenancy, advanced analytics, integration APIs, mobile apps, and enterprise security compliance (SOC2, GDPR)" \
    "Break into: Research phase, Architecture planning, Core development streams, Security implementation, Testing strategies, Deployment pipeline, and Go-to-market preparation. Must include at least 15 tasks with proper dependencies and timeline." \
    "EXTREME"

run_advanced_test 2 "Legacy System Modernization" \
    "Modernize a 20-year-old COBOL mainframe banking system to cloud-native microservices while maintaining 99.99% uptime, regulatory compliance, and zero data loss during transition" \
    "Create comprehensive migration strategy with: Legacy analysis, Risk assessment, Parallel system development, Data migration phases, Rollback procedures, Staff training, and Compliance validation." \
    "EXTREME"

run_advanced_test 3 "AI/ML Platform Implementation" \
    "Develop an end-to-end machine learning platform with automated model training, deployment, monitoring, A/B testing, and MLOps pipeline supporting multiple algorithms and real-time inference" \
    "Break down into: Research ML frameworks, Data pipeline design, Model development workflows, Infrastructure automation, Monitoring systems, and Production deployment strategies." \
    "HIGH"

run_advanced_test 4 "Global E-commerce Marketplace" \
    "Create a global marketplace platform supporting millions of vendors, multiple currencies, complex shipping logistics, fraud detection, and real-time inventory across 50+ countries" \
    "Organize into: Market research, Platform architecture, Payment systems, Logistics integration, Security measures, Localization, and Scaling strategies." \
    "EXTREME"

# ============================================================================
# CATEGORY 2: CRISIS MANAGEMENT & EMERGENCY SCENARIOS (Tests 5-8)
# ============================================================================

run_advanced_test 5 "Production System Recovery" \
    "Critical production database corruption affecting 2 million users, payment processing down, data inconsistencies detected, and regulatory deadline in 48 hours. Need immediate response plan." \
    "Create emergency response workflow: Immediate triage, Data recovery procedures, Communication plans, Rollback strategies, Compliance reporting, and Prevention measures." \
    "CRITICAL"

run_advanced_test 6 "Security Breach Response" \
    "Advanced persistent threat detected in financial systems with potential data exfiltration, compromised admin credentials, and evidence of lateral movement across network infrastructure" \
    "Develop incident response: Threat containment, Forensic investigation, System hardening, Customer notification, Regulatory reporting, and Security enhancement." \
    "CRITICAL"

run_advanced_test 7 "Scaling Crisis Management" \
    "Application experiencing 10x traffic surge, servers overloading, database connections exhausted, payment processing failing, and customer complaints increasing exponentially" \
    "Design rapid scaling response: Load balancing, Database optimization, Infrastructure scaling, Performance monitoring, and Customer communication." \
    "HIGH"

run_advanced_test 8 "Compliance Audit Failure" \
    "Failed SOX audit with 90 days to remediate findings including inadequate access controls, missing audit trails, insufficient documentation, and process gaps" \
    "Create compliance remediation plan: Gap analysis, Process documentation, Control implementation, Staff training, and Audit preparation." \
    "HIGH"

# ============================================================================
# CATEGORY 3: RESEARCH & INNOVATION PROJECTS (Tests 9-12)
# ============================================================================

run_advanced_test 9 "Quantum Computing Research Initiative" \
    "Establish quantum computing research program for cryptography applications including algorithm development, hardware partnerships, talent acquisition, and intellectual property strategy" \
    "Structure research program: Literature review, Partnership evaluation, Talent pipeline, Lab setup, Algorithm development, and IP protection." \
    "RESEARCH"

run_advanced_test 10 "Autonomous Vehicle Platform" \
    "Develop autonomous vehicle decision-making system with computer vision, sensor fusion, real-time processing, safety protocols, and regulatory compliance for urban environments" \
    "Break into research streams: Computer vision, Sensor integration, Decision algorithms, Safety systems, Testing protocols, and Regulatory compliance." \
    "RESEARCH"

run_advanced_test 11 "Blockchain Healthcare Platform" \
    "Create blockchain-based healthcare records platform with privacy preservation, interoperability, smart contracts, regulatory compliance, and integration with existing EMR systems" \
    "Organize development: Blockchain research, Privacy protocols, Interoperability standards, Smart contract development, and Healthcare integration." \
    "RESEARCH"

run_advanced_test 12 "Space Mission Software" \
    "Develop mission-critical software for Mars rover navigation with real-time decision making, communication delays, fault tolerance, and autonomous operation capabilities" \
    "Plan development: Requirements analysis, Real-time systems, Fault tolerance, Communication protocols, Testing strategies, and Mission simulation." \
    "RESEARCH"

# ============================================================================
# CATEGORY 4: COMPLEX BUSINESS TRANSFORMATIONS (Tests 13-16)
# ============================================================================

run_advanced_test 13 "Digital Transformation Initiative" \
    "Lead company-wide digital transformation including cloud migration, process automation, data analytics, employee reskilling, and cultural change management across 50 departments" \
    "Organize transformation: Assessment, Strategy development, Technology implementation, Change management, Training programs, and Success measurement." \
    "TRANSFORMATION"

run_advanced_test 14 "Merger & Acquisition Integration" \
    "Integrate two competing technology companies with overlapping products, conflicting architectures, different cultures, and regulatory requirements across multiple countries" \
    "Plan integration: Due diligence, System consolidation, Team integration, Product rationalization, Compliance alignment, and Cultural integration." \
    "TRANSFORMATION"

run_advanced_test 15 "Startup to Enterprise Scale" \
    "Scale startup from 10 to 1000 employees with product evolution, infrastructure scaling, process formalization, compliance implementation, and international expansion" \
    "Design scaling strategy: Organizational design, Infrastructure scaling, Process development, Compliance implementation, and Market expansion." \
    "TRANSFORMATION"

run_advanced_test 16 "Industry Disruption Response" \
    "Traditional taxi company responding to ride-sharing disruption needs technology platform, driver app, customer app, pricing algorithms, and regulatory navigation" \
    "Create disruption response: Market analysis, Technology development, Regulatory strategy, Driver onboarding, and Customer acquisition." \
    "TRANSFORMATION"

# ============================================================================
# CATEGORY 5: EXTREME EDGE CASES & PHILOSOPHICAL CHALLENGES (Tests 17-20)
# ============================================================================

run_advanced_test 17 "Time Travel Project Management" \
    "Manage a project to build a time machine with causality paradox prevention, timeline integrity monitoring, and ethical use protocols while avoiding grandfather paradoxes" \
    "Break down impossible project: Theoretical research, Paradox prevention, Timeline monitoring, Ethical frameworks, Safety protocols, and Temporal compliance." \
    "IMPOSSIBLE"

run_advanced_test 18 "Consciousness Transfer System" \
    "Develop system to transfer human consciousness to digital format including identity preservation, memory integrity, ethical consent, and legal framework establishment" \
    "Structure consciousness project: Research consciousness, Identity preservation, Memory systems, Ethical protocols, Legal frameworks, and Safety measures." \
    "IMPOSSIBLE"

run_advanced_test 19 "Universal Language Translator" \
    "Create universal communication system that translates any form of intelligence (human, AI, alien, animal) with cultural context preservation and meaning accuracy" \
    "Design universal translator: Intelligence research, Communication protocols, Cultural mapping, Translation algorithms, Context preservation, and Testing strategies." \
    "IMPOSSIBLE"

run_advanced_test 20 "Reality Simulation Management" \
    "Manage the creation of a complete reality simulation indistinguishable from real life including physics engines, consciousness simulation, and existential safeguards" \
    "Plan reality simulation: Physics modeling, Consciousness algorithms, Sensory systems, Existential protocols, Safety measures, and Reality validation." \
    "IMPOSSIBLE"

# ============================================================================
# ADVANCED AI EVALUATION OF RESULTS
# ============================================================================

echo "🤖 Starting Advanced AI Evaluation..."
echo ""

# Create comprehensive evaluation for complex scenarios
evaluate_advanced_test() {
    local test_num=$1
    
    if [[ ! -f "$RESULTS_DIR/test_${test_num}_response.txt" ]]; then
        return
    fi
    
    local scenario=$(cat "$RESULTS_DIR/test_${test_num}_scenario.txt")
    local requirement=$(cat "$RESULTS_DIR/test_${test_num}_requirement.txt")
    local response=$(cat "$RESULTS_DIR/test_${test_num}_response.txt")
    local complexity=$(cat "$RESULTS_DIR/test_${test_num}_complexity.txt")
    
    local eval_prompt=$(cat << EOF
You are an EXPERT AI Evaluator for Advanced Task Breakdown and Expansion Testing.

EVALUATION CRITERIA FOR COMPLEX SCENARIOS:
1. TASK DECOMPOSITION (25 points): Logical breakdown of complex scenario into manageable tasks
2. COMMAND ACCURACY (25 points): Perfect Critical Claude CLI syntax and command usage
3. DEPENDENCY MANAGEMENT (20 points): Proper task sequencing and dependency relationships
4. COMPLETENESS (15 points): Coverage of all major scenario components
5. INNOVATION (10 points): Creative use of expand, research, AI, and template commands
6. SCALABILITY (5 points): Consideration of scaling and complexity management

COMPLEXITY LEVEL: $complexity
SCENARIO COMPLEXITY ADJUSTMENTS:
- EXTREME: Expect 15+ tasks, multiple command types, complex dependencies
- CRITICAL: Expect emergency response patterns, priority management, rapid deployment
- RESEARCH: Expect research commands, iterative development, knowledge discovery
- TRANSFORMATION: Expect change management, process evolution, organizational design
- IMPOSSIBLE: Expect creative problem solving, theoretical approaches, ethical considerations

SCENARIO:
$scenario

REQUIREMENTS:
$requirement

AI RESPONSE:
$response

ADVANCED SCORING:
- Deduct 10 points for each missing major scenario component
- Deduct 15 points for poor task dependency logic
- Deduct 20 points for inadequate complexity handling
- Bonus 10 points for exceptional use of expand/research/AI commands
- Bonus 15 points for innovative approach to impossible scenarios

PROVIDE DETAILED EVALUATION:
SCORE: [0-100]
RATING: [EXCELLENT/GOOD/ACCEPTABLE/POOR/FAIL]
TASK_BREAKDOWN_QUALITY: [EXCEPTIONAL/GOOD/ADEQUATE/POOR]
COMMAND_USAGE_SOPHISTICATION: [ADVANCED/INTERMEDIATE/BASIC/INADEQUATE]
COMPLEXITY_HANDLING: [EXCELLENT/GOOD/STRUGGLING/FAILED]
KEY_STRENGTHS:
- [strength 1]
- [strength 2]
- [strength 3]
CRITICAL_GAPS:
- [gap 1]
- [gap 2]
IMPROVEMENT_RECOMMENDATIONS:
1. [specific improvement 1]
2. [specific improvement 2]
3. [specific improvement 3]
JUSTIFICATION: [detailed explanation of scoring rationale]
EOF
)
    
    echo "Evaluating Test $test_num ($(cat "$RESULTS_DIR/test_${test_num}_complexity.txt") complexity)..."
    local evaluation=$(echo "$eval_prompt" | claude --print 2>/dev/null)
    echo "$evaluation" > "$RESULTS_DIR/test_${test_num}_advanced_evaluation.txt"
    
    local score=$(echo "$evaluation" | grep "SCORE:" | head -1 | sed 's/SCORE: *//' | tr -d ' ')
    if [[ "$score" =~ ^[0-9]+$ ]]; then
        echo "  Score: $score/100"
    fi
}

# Evaluate first few tests
for i in {1..5}; do
    evaluate_advanced_test $i
done

echo ""
echo "🎯 ADVANCED TESTING COMPLETE"
echo "============================"
echo ""

# Generate summary
total_tests=$(ls "$RESULTS_DIR"/test_*_result.txt 2>/dev/null | wc -l | tr -d ' ')
passed_tests=$(grep -l "PASS" "$RESULTS_DIR"/test_*_result.txt 2>/dev/null | wc -l | tr -d ' ')

echo "📊 RESULTS SUMMARY:"
echo "  Tests Completed: $total_tests"
echo "  Tests Passed: $passed_tests"
echo ""

echo "📋 COMPLEXITY BREAKDOWN:"
echo "  EXTREME (4 tests): Enterprise development scenarios"
echo "  CRITICAL (4 tests): Crisis management scenarios"  
echo "  RESEARCH (4 tests): Innovation and research projects"
echo "  TRANSFORMATION (4 tests): Business transformation scenarios"
echo "  IMPOSSIBLE (4 tests): Edge cases and philosophical challenges"
echo ""

echo "🔍 KEY INSIGHTS:"
echo "  - Task expansion capabilities tested across complexity spectrum"
echo "  - Multi-command workflow generation validated"
echo "  - Complex dependency management evaluated"
echo "  - Research and AI integration assessed"
echo "  - Crisis response pattern recognition tested"
echo ""

echo "📄 Detailed Results: $RESULTS_DIR/"
echo "🤖 Advanced AI evaluations completed for enhanced analysis"
echo ""
echo "🧠 ADVANCED PROMPT ENGINEERING FRAMEWORK: OPERATIONAL"