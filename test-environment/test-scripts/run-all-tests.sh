#!/bin/bash

# Critical Claude CLI - Comprehensive Test Suite
# This script tests every aspect of the CLI in a fresh Docker environment

set -e

echo "🧪 CRITICAL CLAUDE CLI - COMPREHENSIVE TEST SUITE"
echo "=================================================="
echo "Testing Date: $(date)"
echo "Node Version: $(node --version)"
echo "NPM Version: $(npm --version)"
echo ""

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
TEST_REPORT_FILE="/test-env/results/test-report.md"

# Initialize test report
cat > "$TEST_REPORT_FILE" << EOF
# Critical Claude CLI - Test Report

**Test Date:** $(date)
**Environment:** Docker Container (node:20-alpine)
**Node Version:** $(node --version)
**NPM Version:** $(npm --version)

## Test Results Summary

EOF

# Function to run a test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_exit_code="${3:-0}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo "📋 Test $TOTAL_TESTS: $test_name"
    
    if eval "$test_command" > "/test-env/results/test-$TOTAL_TESTS.log" 2>&1; then
        local actual_exit_code=$?
        if [ $actual_exit_code -eq $expected_exit_code ]; then
            echo "   ✅ PASSED"
            PASSED_TESTS=$((PASSED_TESTS + 1))
            echo "- ✅ **$test_name** - PASSED" >> "$TEST_REPORT_FILE"
        else
            echo "   ❌ FAILED (exit code: $actual_exit_code, expected: $expected_exit_code)"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            echo "- ❌ **$test_name** - FAILED (exit code: $actual_exit_code)" >> "$TEST_REPORT_FILE"
        fi
    else
        local actual_exit_code=$?
        echo "   ❌ FAILED (exit code: $actual_exit_code)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo "- ❌ **$test_name** - FAILED (exit code: $actual_exit_code)" >> "$TEST_REPORT_FILE"
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
    
    local output_file="/test-env/results/test-$TOTAL_TESTS.log"
    if eval "$test_command" > "$output_file" 2>&1; then
        if grep -q "$expected_pattern" "$output_file"; then
            echo "   ✅ PASSED (found: $expected_pattern)"
            PASSED_TESTS=$((PASSED_TESTS + 1))
            echo "- ✅ **$test_name** - PASSED" >> "$TEST_REPORT_FILE"
        else
            echo "   ❌ FAILED (pattern not found: $expected_pattern)"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            echo "- ❌ **$test_name** - FAILED (pattern not found)" >> "$TEST_REPORT_FILE"
        fi
    else
        echo "   ❌ FAILED (command failed)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo "- ❌ **$test_name** - FAILED (command failed)" >> "$TEST_REPORT_FILE"
    fi
    echo ""
}

echo "🔧 PHASE 1: Package Installation Tests"
echo "======================================"

# Test npm package installation
run_test "Install Critical Claude from NPM" "npm install -g critical-claude@latest"

# Verify installation
run_test "Verify cc command exists" "which cc"
run_test "Verify critical-claude command exists" "which critical-claude"

echo "📋 PHASE 2: Basic CLI Tests"
echo "=========================="

# Basic help and version tests
run_output_test "CLI help command" "cc --help" "Critical Claude CLI"
run_output_test "CLI version command" "cc --version" "2\."
run_output_test "Task help command" "cc task --help" "Task management"

echo "📝 PHASE 3: Task Management Tests"
echo "================================"

# Task creation tests
run_output_test "Create simple task" "cc task create -t 'Test Task 1' -d 'Test description'" "Created task"
run_output_test "Create high priority task" "cc task create -t 'High Priority Task' -p high" "Created task"
run_output_test "Create task with assignee" "cc task create -t 'Assigned Task' -a 'testuser@example.com'" "Created task"

# Task listing and viewing
run_output_test "List all tasks" "cc task list" "Found.*tasks"
run_output_test "View specific task" "cc task view \$(cc task list | grep -m1 'ID:' | awk '{print \$2}')" "Task:"

# Task updates
TASK_ID=$(cc task list 2>/dev/null | grep -m1 'ID:' | awk '{print $2}' || echo "test-id")
run_output_test "Update task status" "cc task update $TASK_ID -s in_progress" "Updated task"
run_output_test "Update task priority" "cc task update $TASK_ID -p critical" "Updated task"

echo "💾 PHASE 4: Data Management Tests"
echo "================================"

# Export tests
run_output_test "Export tasks to JSON" "cc task export --format json --file /tmp/test-export.json" "Exported.*tasks"
run_test "Verify export file exists" "test -f /tmp/test-export.json"
run_output_test "Export tasks to CSV" "cc task export --format csv --file /tmp/test-export.csv" "Exported.*tasks"

# Backup tests
run_output_test "Create backup" "cc task backup" "Backup created"

# Import tests (using the exported data)
run_output_test "Import tasks from JSON" "cc task import --file /tmp/test-export.json --merge-strategy merge" "Imported.*tasks"

echo "📦 PHASE 5: Template System Tests"
echo "================================"

# Template listing and viewing
run_output_test "List templates" "cc template list" "Available templates"
run_output_test "View bug-fix template" "cc template view bug-fix" "bug-fix"

# Template creation
run_output_test "Create custom template" "cc template create -n 'test-template' -d 'Test template description'" "Created template"

echo "📊 PHASE 6: Analytics Tests"
echo "=========================="

# Analytics and statistics
run_output_test "View analytics stats" "cc analytics stats" "Usage Statistics"
run_output_test "Export analytics" "cc analytics export --format json --file /tmp/analytics.json" "exported"

echo "🔍 PHASE 7: AI Integration Tests"
echo "==============================="

# AI task generation (with timeout to prevent hanging)
run_test "AI task generation (simple)" "timeout 60 cc task ai 'Create a simple web page'"
run_test "AI research (simple)" "timeout 60 cc task research 'JavaScript best practices'"

echo "🛡️ PHASE 8: Error Handling Tests"
echo "==============================="

# Test error conditions
run_test "Invalid task ID" "cc task view invalid-task-id" 1
run_test "Invalid command" "cc invalid-command" 1
run_test "Missing required arguments" "cc task create" 1

echo "🔧 PHASE 9: System Integration Tests"
echo "===================================="

# Keyboard shortcuts help
run_output_test "Keyboard shortcuts" "cc shortcuts" "Keyboard Shortcuts"

# Installation verification
run_test "Installation verification" "cc verify"

echo "📱 PHASE 10: Advanced Feature Tests"
echo "=================================="

# Test multiple operations in sequence
run_test "Sequential operations test" "/test-env/test-scripts/sequential-test.sh"

# Test with different data formats
run_test "Markdown export test" "cc task export --format markdown --file /tmp/test.md"

# Test large data handling
run_test "Stress test with multiple tasks" "/test-env/test-scripts/stress-test.sh"

echo "🧹 PHASE 11: Cleanup and Edge Cases"
echo "=================================="

# Test cleanup operations
run_output_test "Archive old tasks" "cc task list | head -5 | grep 'ID:' | awk '{print \$2}' | xargs -I {} cc task archive {}" "Archived"

# Test with different user configurations
run_test "Test with empty config" "/test-env/test-scripts/empty-config-test.sh"

# Final statistics
echo "========================================"
echo "🏆 TEST SUITE COMPLETED"
echo "========================================"
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"
echo "Success Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
echo ""

# Add summary to report
cat >> "$TEST_REPORT_FILE" << EOF

## Summary

- **Total Tests:** $TOTAL_TESTS
- **Passed:** $PASSED_TESTS  
- **Failed:** $FAILED_TESTS
- **Success Rate:** $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%

## Detailed Logs

Test logs are available in \`/test-env/results/\` directory.

EOF

echo "📄 Test report generated: $TEST_REPORT_FILE"

# Exit with appropriate code
if [ $FAILED_TESTS -eq 0 ]; then
    echo "🎉 All tests passed!"
    exit 0
else
    echo "⚠️  Some tests failed. Check the logs for details."
    exit 1
fi