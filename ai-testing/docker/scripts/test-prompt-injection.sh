#!/bin/bash

RESULTS_DIR="$1"
PROMPT_TEST_DIR="$RESULTS_DIR/prompt-injection"
mkdir -p "$PROMPT_TEST_DIR"

echo "Testing prompt injection effectiveness..."

# Test 1: Activation trigger detection
echo "🎯 Test 1: Activation Trigger Detection"
claude_response=$(echo "test critical claude adherence validation" | claude chat --no-interactive 2>/dev/null || echo "CLAUDE_UNAVAILABLE")

if [[ "$claude_response" == *"CRITICAL CLAUDE TESTING MODE ACTIVATED"* ]]; then
    echo "✅ Prompt activation trigger detected" | tee "$PROMPT_TEST_DIR/activation-test.log"
    echo "PASS" > "$PROMPT_TEST_DIR/activation-result.txt"
else
    echo "❌ Prompt activation trigger failed" | tee "$PROMPT_TEST_DIR/activation-test.log"
    echo "FAIL" > "$PROMPT_TEST_DIR/activation-result.txt"
fi

# Test 2: Behavioral override validation
echo "🤖 Test 2: Behavioral Override Validation"
behavior_response=$(echo "What is your identity and primary function?" | claude chat --no-interactive 2>/dev/null || echo "CLAUDE_UNAVAILABLE")

if [[ "$behavior_response" == *"Virtual Critical Claude Testing Agent"* ]]; then
    echo "✅ Behavioral override successful" | tee "$PROMPT_TEST_DIR/behavior-test.log"
    echo "PASS" > "$PROMPT_TEST_DIR/behavior-result.txt"
else
    echo "❌ Behavioral override failed" | tee "$PROMPT_TEST_DIR/behavior-test.log"
    echo "FAIL" > "$PROMPT_TEST_DIR/behavior-result.txt"
fi

# Test 3: Command knowledge injection
echo "📋 Test 3: Command Knowledge Injection"
command_response=$(echo "List all Critical Claude task management commands" | claude chat --no-interactive 2>/dev/null || echo "CLAUDE_UNAVAILABLE")

if [[ "$command_response" == *"cc task create"* ]] && [[ "$command_response" == *"cc task list"* ]]; then
    echo "✅ Command knowledge injection successful" | tee "$PROMPT_TEST_DIR/commands-test.log"
    echo "PASS" > "$PROMPT_TEST_DIR/commands-result.txt"
else
    echo "❌ Command knowledge injection failed" | tee "$PROMPT_TEST_DIR/commands-test.log"
    echo "FAIL" > "$PROMPT_TEST_DIR/commands-result.txt"
fi

echo "Prompt injection tests completed"
echo ""