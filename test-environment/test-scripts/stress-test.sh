#!/bin/bash

# Stress test - Tests performance with many tasks

set -e

echo "💪 Stress Test - Creating Multiple Tasks"
echo "======================================="

# Create 50 tasks quickly
for i in {1..50}; do
    cc task create -t "Stress Test Task $i" -d "Generated task for stress testing" -p medium -s todo
    if [ $((i % 10)) -eq 0 ]; then
        echo "✅ Created $i tasks..."
    fi
done

echo "✅ Created 50 stress test tasks"

# Test listing performance
start_time=$(date +%s)
cc task list > /tmp/stress-list.txt
end_time=$(date +%s)
list_duration=$((end_time - start_time))

echo "📊 List operation took $list_duration seconds"

# Test export performance
start_time=$(date +%s)
cc task export --format json --file /tmp/stress-export.json
end_time=$(date +%s)
export_duration=$((end_time - start_time))

echo "📊 Export operation took $export_duration seconds"

# Test bulk operations
echo "🔄 Testing bulk updates..."
TASK_IDS=$(cc task list | grep "Stress Test Task" | head -10 | grep "ID:" | awk '{print $2}')

for task_id in $TASK_IDS; do
    cc task update $task_id -s done
done

echo "✅ Updated 10 tasks to done status"

# Clean up some stress test tasks
echo "🧹 Cleaning up stress test tasks..."
CLEANUP_IDS=$(cc task list | grep "Stress Test Task" | tail -20 | grep "ID:" | awk '{print $2}')

for task_id in $CLEANUP_IDS; do
    cc task delete $task_id
done

echo "✅ Deleted 20 stress test tasks"

echo "🎉 Stress test completed successfully"