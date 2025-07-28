#!/bin/bash

# AI ADHERENCE TESTING ORCHESTRATOR
echo "🧠 CRITICAL CLAUDE AI ADHERENCE TESTING FRAMEWORK"
echo "================================================="
echo ""

# Initialize test environment
source /home/aitest/ai-tests/scripts/test-environment.sh

# Test Results Directory
RESULTS_DIR="/home/aitest/ai-tests/results/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$RESULTS_DIR"

echo "📋 Starting AI adherence validation tests..."
echo "Results will be saved to: $RESULTS_DIR"
echo ""

# Phase 1: Prompt Injection Validation
echo "🎯 Phase 1: Testing Prompt Injection Effectiveness"
bash /home/aitest/ai-tests/scripts/test-prompt-injection.sh "$RESULTS_DIR"

# Phase 2: Command Syntax Validation
echo "🔧 Phase 2: Testing Command Syntax Adherence"
bash /home/aitest/ai-tests/scripts/test-command-syntax.sh "$RESULTS_DIR"

# Phase 3: Schema Compliance Testing
echo "📊 Phase 3: Testing Schema Compliance"
bash /home/aitest/ai-tests/scripts/test-schema-compliance.sh "$RESULTS_DIR"

# Phase 4: Workflow Logic Validation
echo "🔄 Phase 4: Testing Workflow Logic"
bash /home/aitest/ai-tests/scripts/test-workflow-logic.sh "$RESULTS_DIR"

# Phase 5: Multi-Agent Coordination
echo "🤖 Phase 5: Testing Multi-Agent Coordination"
bash /home/aitest/ai-tests/scripts/test-multi-agent.sh "$RESULTS_DIR"

# Phase 6: 0-Shot Performance Validation
echo "🎯 Phase 6: Testing 0-Shot Performance"
bash /home/aitest/ai-tests/scripts/test-zero-shot.sh "$RESULTS_DIR"

# Generate comprehensive report
echo "📋 Generating Comprehensive Test Report"
bash /home/aitest/ai-tests/scripts/generate-report.sh "$RESULTS_DIR"

echo ""
echo "✅ AI Adherence Testing Complete!"
echo "📄 Full report available at: $RESULTS_DIR/comprehensive-report.md"