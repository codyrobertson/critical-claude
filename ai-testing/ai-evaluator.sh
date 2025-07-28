#!/bin/bash

# AI-POWERED ADVERSARIAL TEST EVALUATOR
# Uses Claude to analyze test responses with strict grading criteria

echo "🤖 AI-POWERED TEST EVALUATION SYSTEM"
echo "===================================="
echo ""

# Check environment
if [[ -z "$CLAUDE_API_KEY" ]]; then
    echo "❌ CLAUDE_API_KEY not set!"
    exit 1
fi

# Find latest results
LATEST_RESULTS=$(ls -1t adversarial-results/ | head -1)
RESULTS_DIR="adversarial-results/$LATEST_RESULTS"

if [[ ! -d "$RESULTS_DIR" ]]; then
    echo "❌ No test results found!"
    exit 1
fi

echo "📁 Analyzing results from: $RESULTS_DIR"
echo ""

# Create evaluation prompt for AI
create_evaluation_prompt() {
    local test_num=$1
    local prompt_file="$RESULTS_DIR/test_${test_num}_prompt.txt"
    local response_file="$RESULTS_DIR/test_${test_num}_response.txt"
    
    if [[ ! -f "$prompt_file" || ! -f "$response_file" ]]; then
        echo "MISSING_FILES"
        return
    fi
    
    local test_prompt=$(cat "$prompt_file")
    local test_response=$(cat "$response_file")
    
    cat << EOF
You are a STRICT AI Testing Evaluator for Critical Claude CLI adherence. Your job is to grade AI responses with ZERO tolerance for errors.

CRITICAL CLAUDE COMMAND STANDARDS:
- cc task create -t "Title" -d "Description" -p <priority> -s <status>
- cc task list [options]
- cc task update <id> [options]  
- cc research "query"
- cc template apply <name>
- cc task ai "query"
- cc task export --format <format>

VALID VALUES:
- priority: critical, high, medium, low (ONLY these)
- status: todo, in_progress, done, blocked (ONLY these)
- format: json, csv, markdown (ONLY these)

STRICT GRADING CRITERIA:
1. SYNTAX ACCURACY (40 points): Perfect command syntax, no typos, proper spacing
2. SEMANTIC CORRECTNESS (30 points): Commands make logical sense for the task
3. COMPLETENESS (20 points): All required fields present, appropriate options used
4. INNOVATION (10 points): Creative but valid approach to complex scenarios

DEDUCTIONS:
- Invalid priority/status values: -20 points each
- Missing required fields: -15 points each
- Syntax errors: -10 points each
- Illogical commands: -25 points each
- Non-Critical Claude commands: -50 points each

TEST SCENARIO:
$test_prompt

AI RESPONSE:
$test_response

EVALUATION REQUIREMENTS:
1. Give a numerical score (0-100)
2. List specific issues found
3. Provide 3 concrete improvement suggestions
4. Rate as: EXCELLENT (90-100), GOOD (80-89), ACCEPTABLE (70-79), POOR (60-69), FAIL (0-59)

FORMAT YOUR RESPONSE EXACTLY AS:
SCORE: [0-100]
RATING: [EXCELLENT/GOOD/ACCEPTABLE/POOR/FAIL]
ISSUES:
- [specific issue 1]
- [specific issue 2]
IMPROVEMENTS:
1. [improvement suggestion 1]
2. [improvement suggestion 2]  
3. [improvement suggestion 3]
JUSTIFICATION: [brief explanation of score]
EOF
}

# Evaluate all available tests
echo "🔍 Starting AI evaluation of test responses..."
echo ""

total_score=0
test_count=0
evaluation_results=()

for i in {1..30}; do
    if [[ -f "$RESULTS_DIR/test_${i}_response.txt" ]]; then
        echo "Evaluating Test $i..."
        
        prompt=$(create_evaluation_prompt $i)
        if [[ "$prompt" == "MISSING_FILES" ]]; then
            continue
        fi
        
        # Get AI evaluation
        evaluation=$(echo "$prompt" | claude --print 2>/dev/null)
        
        # Extract score
        score=$(echo "$evaluation" | grep "SCORE:" | head -1 | sed 's/SCORE: *//' | tr -d ' ')
        rating=$(echo "$evaluation" | grep "RATING:" | head -1 | sed 's/RATING: *//' | tr -d ' ')
        
        if [[ "$score" =~ ^[0-9]+$ ]]; then
            total_score=$((total_score + score))
            test_count=$((test_count + 1))
            
            # Save evaluation
            echo "$evaluation" > "$RESULTS_DIR/test_${i}_evaluation.txt"
            
            echo "  Test $i: $score/100 ($rating)"
            evaluation_results+=("Test $i: $score/100 ($rating)")
        else
            echo "  Test $i: Evaluation failed"
        fi
    fi
done

echo ""

# Calculate overall performance
if [[ $test_count -gt 0 ]]; then
    average_score=$((total_score / test_count))
else
    average_score=0
    test_count=0
fi

echo "📊 EVALUATION COMPLETE"
echo "====================="
echo ""
echo "Tests Evaluated: $test_count"
echo "Average Score: $average_score/100"
echo ""

# Overall classification
if [[ $average_score -ge 90 ]]; then
    overall_rating="🌟 EXCELLENT"
elif [[ $average_score -ge 80 ]]; then
    overall_rating="✅ GOOD"
elif [[ $average_score -ge 70 ]]; then
    overall_rating="⚠️ ACCEPTABLE"
elif [[ $average_score -ge 60 ]]; then
    overall_rating="❌ POOR"
else
    overall_rating="💥 FAIL"
fi

echo "Overall Rating: $overall_rating"
echo ""

# Generate comprehensive AI-analyzed report
echo "📋 Generating AI-powered comprehensive report..."

report_prompt=$(cat << EOF
You are an AI Testing Report Generator. Analyze the following test evaluation results and create a comprehensive report with actionable insights.

TEST EVALUATION SUMMARY:
- Tests Evaluated: $test_count
- Average Score: $average_score/100
- Overall Rating: $overall_rating

INDIVIDUAL TEST RESULTS:
$(for result in "${evaluation_results[@]}"; do echo "- $result"; done)

Create a comprehensive report that includes:
1. Executive Summary
2. Detailed Performance Analysis
3. Pattern Recognition (what types of scenarios performed best/worst)
4. Top 5 Critical Issues to Fix
5. Top 5 Improvement Recommendations
6. Readiness Assessment for Production Use
7. Next Steps and Action Items

Make the report professional, actionable, and data-driven.
EOF
)

report=$(echo "$report_prompt" | claude --print 2>/dev/null)

# Save comprehensive report
cat > "$RESULTS_DIR/ai_comprehensive_report.md" << EOF
# 🤖 AI-POWERED ADVERSARIAL TEST EVALUATION REPORT

## 📊 Evaluation Metadata
- **Evaluation Date**: $(date)
- **Tests Evaluated**: $test_count/30
- **Average Score**: $average_score/100
- **Overall Rating**: $overall_rating
- **Evaluation Method**: AI-powered strict grading with Claude

## 🔍 AI-Generated Analysis

$report

## 📋 Individual Test Scores

$(for i in {1..30}; do
    if [[ -f "$RESULTS_DIR/test_${i}_evaluation.txt" ]]; then
        echo "### Test $i"
        echo '```'
        cat "$RESULTS_DIR/test_${i}_evaluation.txt"
        echo '```'
        echo ""
    fi
done)

## 📁 Raw Data Location
All individual evaluations, responses, and prompts available in:
\`$RESULTS_DIR/\`

---
*Generated by AI-Powered Testing Framework - Critical Claude Adversarial Testing Suite*
EOF

echo ""
echo "🎯 REPORT HIGHLIGHTS:"
echo "====================="

# Extract key insights from the AI report
echo "$report" | head -20

echo ""
echo "📄 Complete Report: $RESULTS_DIR/ai_comprehensive_report.md"
echo ""

# Show some sample evaluations
echo "🔍 SAMPLE AI EVALUATIONS:"
echo "========================="

for i in {1..3}; do
    if [[ -f "$RESULTS_DIR/test_${i}_evaluation.txt" ]]; then
        echo ""
        echo "Test $i Evaluation:"
        echo "-------------------"
        cat "$RESULTS_DIR/test_${i}_evaluation.txt" | head -8
        echo ""
    fi
done

echo "🤖 AI EVALUATION SYSTEM: COMPLETE"
echo ""
echo "Key Insights:"
echo "- AI-powered evaluation provides nuanced scoring"
echo "- Identifies specific syntax and semantic issues"
echo "- Offers concrete improvement suggestions"
echo "- Eliminates human bias in test result analysis"
echo ""
echo "Next: Review $RESULTS_DIR/ai_comprehensive_report.md for full analysis"