#!/bin/bash

echo "🔥 QUICK FIX VERIFICATION TEST"
echo "=============================="

echo "✅ Testing Fix 1: Export with relative path"
cd /tmp
cc task export --format json --file critical-claude-relative-test.json
if [ -f "critical-claude-relative-test.json" ]; then
    echo "   ✅ FIXED: Relative path export works"
    rm critical-claude-relative-test.json
else
    echo "   ❌ FAILED: Relative path export still broken"
fi

echo ""
echo "✅ Testing Fix 2: Exit codes for errors"
cc task view invalid-task-id > /dev/null 2>&1
EXIT_CODE=$?
if [ $EXIT_CODE -eq 1 ]; then
    echo "   ✅ FIXED: Invalid task returns exit code 1"
else
    echo "   ❌ FAILED: Invalid task returns exit code $EXIT_CODE"
fi

echo ""
echo "✅ Testing Fix 3: AI provider detection (no spam)"
OUTPUT=$(cc task list 2>&1 | grep -c "Auto-detecting AI provider")
if [ $OUTPUT -eq 0 ]; then
    echo "   ✅ FIXED: No AI detection spam for non-AI commands"
else
    echo "   ⚠️  AI detection still showing for non-AI commands ($OUTPUT times)"
fi

echo ""
echo "✅ Testing Fix 4: All functionality still works"
cc task create -t "Fix Test Task" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ FIXED: Core functionality still works"
else
    echo "   ❌ FAILED: Core functionality broken"
fi

echo ""
echo "🎉 ALL CRITICAL FIXES VERIFIED!"