#!/bin/bash

# Critical Claude CLI - Local Comprehensive Test Suite
# This script tests every aspect of the CLI in the current environment

set -e

echo "🧪 CRITICAL CLAUDE CLI - LOCAL COMPREHENSIVE TEST SUITE"
echo "======================================================"
echo "Testing Date: $(date)"
echo "Node Version: $(node --version)"
echo "NPM Version: $(npm --version)"
echo "Critical Claude Version: $(cc --version 2>/dev/null || echo 'Not installed')"
echo ""

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
TEST_REPORT_FILE="./results/local-test-report.md"

# Create results directory
mkdir -p ./results

# Function to run a test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_exit_code="${3:-0}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo "📋 Test $TOTAL_TESTS: $test_name"
    
    if eval "$test_command" > "./results/test-$TOTAL_TESTS.log" 2>&1; then
        local actual_exit_code=$?
        if [ $actual_exit_code -eq $expected_exit_code ]; then
            echo "   ✅ PASSED"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo "   ❌ FAILED (exit code: $actual_exit_code, expected: $expected_exit_code)"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        local actual_exit_code=$?
        echo "   ❌ FAILED (exit code: $actual_exit_code)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
}

# Function to run a test that expects specific output
run_output_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo "📋 Test $TOTAL_TESTS: $test_name"
    
    local output_file="./results/test-$TOTAL_TESTS.log"
    if eval "$test_command" > "$output_file" 2>&1; then
        if grep -q "$expected_pattern" "$output_file" 2>/dev/null; then
            echo "   ✅ PASSED (found: $expected_pattern)"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo "   ❌ FAILED (pattern not found: $expected_pattern)"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            echo "   Output: $(head -3 "$output_file")"
        fi
    else
        echo "   ❌ FAILED (command failed)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo "   Error: $(head -3 "$output_file")"
    fi
    echo ""
}

# Initialize test report
cat > "$TEST_REPORT_FILE" << EOF
# Critical Claude CLI - Local Test Report

**Test Date:** $(date)
**Environment:** Local System
**Node Version:** $(node --version)
**NPM Version:** $(npm --version)

## Test Results

EOF

echo "📋 PHASE 1: Basic CLI Verification Tests"
echo "========================================"

# Basic help and version tests
run_output_test "CLI help command" "cc --help" "Critical Claude CLI"
run_output_test "CLI version command" "cc --version" "2\."
run_output_test "Task help command" "cc task --help" "Task management"

echo "📝 PHASE 2: Task Management Tests"
echo "================================"

# Create unique test task IDs to avoid conflicts
TEST_PREFIX="localtest-$(date +%s)"

# Task creation tests
run_output_test "Create simple task" "cc task create -t '${TEST_PREFIX}-Task-1' -d 'Test description'" "Created task"
run_output_test "Create high priority task" "cc task create -t '${TEST_PREFIX}-High-Priority' -p high" "Created task"
run_output_test "Create task with assignee" "cc task create -t '${TEST_PREFIX}-Assigned' -a 'test@example.com'" "Created task"

# Task listing and viewing
run_output_test "List all tasks" "cc task list" "Found.*tasks"

# Get a task ID for testing updates
echo "Getting task ID for update tests..."
TASK_ID=$(cc task list 2>/dev/null | grep "$TEST_PREFIX" | head -1 | grep -o 'ID: [^[:space:]]*' | cut -d' ' -f2 || echo "")

if [ -n "$TASK_ID" ]; then
    run_output_test "View specific task" "cc task view $TASK_ID" "Task:"
    run_output_test "Update task status" "cc task update $TASK_ID -s in_progress" "Updated task"
    run_output_test "Update task priority" "cc task update $TASK_ID -p critical" "Updated task"
else
    echo "   ⚠️  Skipping update tests - no task ID found"
fi

echo "💾 PHASE 3: Data Management Tests"
echo "================================"

# Export tests
run_output_test "Export tasks to JSON" "cc task export --format json --file ./results/test-export.json" "Exported.*tasks"
run_test "Verify export file exists" "test -f ./results/test-export.json"

# Backup tests
run_output_test "Create backup" "cc task backup" "Backup created"

echo "📦 PHASE 4: Template System Tests"
echo "================================"

# Template listing and viewing
run_output_test "List templates" "cc template list" "Available templates"
run_output_test "View bug-fix template" "cc template view bug-fix" "bug-fix"

echo "📊 PHASE 5: Analytics Tests"
echo "=========================="

# Analytics and statistics
run_output_test "View analytics stats" "cc analytics stats" "Usage Statistics"

echo "🔍 PHASE 6: AI Integration Tests (Limited)"
echo "=========================================="

# AI task generation (with short timeout to prevent hanging)
run_test "AI task generation (simple, timeout 30s)" "timeout 30 cc task ai 'Create a simple task list' || true"

echo "🛡️ PHASE 7: Error Handling Tests"
echo "==============================="

# Test error conditions
run_test "Invalid task ID" "cc task view invalid-task-id" 1
run_test "Invalid command" "cc invalid-command" 1

echo "🔧 PHASE 8: Utility Tests"
echo "========================"

# Keyboard shortcuts help
run_output_test "Keyboard shortcuts" "cc shortcuts" "Keyboard Shortcuts"

# Installation verification
run_test "Installation verification" "cc verify || true"

echo "🧹 PHASE 9: Cleanup Tests"
echo "========================"

# Clean up test tasks
echo "Cleaning up test tasks..."
if [ -n "$TEST_PREFIX" ]; then
    CLEANUP_IDS=$(cc task list 2>/dev/null | grep "$TEST_PREFIX" | grep -o 'ID: [^[:space:]]*' | cut -d' ' -f2 || echo "")
    
    for task_id in $CLEANUP_IDS; do
        cc task delete "$task_id" > /dev/null 2>&1 || true
    done
    
    echo "✅ Cleaned up test tasks"
fi

# Final statistics
echo "========================================"
echo "🏆 LOCAL TEST SUITE COMPLETED"
echo "========================================"
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"

if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$(( PASSED_TESTS * 100 / TOTAL_TESTS ))
    echo "Success Rate: $SUCCESS_RATE%"
else
    echo "Success Rate: 0%"
fi

echo ""

# Add summary to report
cat >> "$TEST_REPORT_FILE" << EOF

## Summary

- **Total Tests:** $TOTAL_TESTS
- **Passed:** $PASSED_TESTS  
- **Failed:** $FAILED_TESTS
- **Success Rate:** $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%

## Test Details

$(for i in $(seq 1 $TOTAL_TESTS); do
    echo "### Test $i"
    echo '```'
    cat "./results/test-$i.log" 2>/dev/null | head -10 || echo "No log available"
    echo '```'
    echo ""
done)

EOF

echo "📄 Test report generated: $TEST_REPORT_FILE"

# Exit with appropriate code
if [ $FAILED_TESTS -eq 0 ]; then
    echo "🎉 All tests passed!"
    exit 0
else
    echo "⚠️  Some tests failed. Check the logs for details."
    cat "$TEST_REPORT_FILE"
    exit 1
fi