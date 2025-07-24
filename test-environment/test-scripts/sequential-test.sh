#!/bin/bash

# Sequential operations test - Tests complex workflows

set -e

echo "🔄 Sequential Operations Test"
echo "============================"

# Create a project workflow simulation
echo "Creating project workflow..."

# Step 1: Create project tasks
cc task create -t "Setup Project" -d "Initialize new project repository" -p high -s todo
cc task create -t "Design Database Schema" -d "Design and document database structure" -p high -s todo  
cc task create -t "Implement Backend API" -d "Build REST API endpoints" -p medium -s todo
cc task create -t "Create Frontend UI" -d "Build user interface components" -p medium -s todo
cc task create -t "Write Tests" -d "Implement unit and integration tests" -p high -s todo
cc task create -t "Deploy to Production" -d "Deploy application to production environment" -p critical -s todo

echo "✅ Created 6 project tasks"

# Step 2: Update task statuses to simulate workflow
TASK_IDS=$(cc task list | grep "Setup Project\|Design Database" | grep "ID:" | awk '{print $2}')

for task_id in $TASK_IDS; do
    cc task update $task_id -s in_progress
    echo "✅ Updated task $task_id to in_progress"
done

# Step 3: Export project state
cc task export --format json --file /tmp/project-state.json
echo "✅ Exported project state"

# Step 4: Create backup
cc task backup
echo "✅ Created backup"

# Step 5: Apply template to add more tasks
# cc template apply basic-project (if available)

# Step 6: Generate analytics
cc analytics stats > /tmp/analytics-output.txt
echo "✅ Generated analytics"

echo "🎉 Sequential test completed successfully"