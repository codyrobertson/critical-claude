#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const tasksDir = './.critical-claude/tasks';
const archiveDir = './.critical-claude/archive';

// Ensure archive directory exists
if (!fs.existsSync(archiveDir)) {
  fs.mkdirSync(archiveDir, { recursive: true });
}

console.log('🔥 CRITICAL CLAUDE TASK RESET');
console.log('===============================');

// Archive all existing tasks
const existingTasks = fs.readdirSync(tasksDir).filter(f => f.endsWith('.json'));
console.log(`📦 Archiving ${existingTasks.length} existing tasks...`);

for (const taskFile of existingTasks) {
  const oldPath = path.join(tasksDir, taskFile);
  const newPath = path.join(archiveDir, taskFile);
  fs.renameSync(oldPath, newPath);
}

console.log('✅ All existing tasks archived');

// Create new priority tasks based on Critical Claude analysis
const newTasks = [
  {
    title: "Fix O(n²) performance bottleneck in backlog-manager.ts:486",
    description: "Critical Claude identified a performance issue causing O(n²) operations in the backlog manager. This needs immediate attention for production scalability.",
    priority: "critical",
    status: "todo",
    labels: ["performance", "critical-path", "production"],
    acceptanceCriteria: [
      "Performance bottleneck identified and resolved",
      "Algorithm complexity reduced from O(n²) to O(n) or better", 
      "Load testing shows improved performance metrics",
      "No regression in existing functionality"
    ],
    storyPoints: 5,
    timeTracking: { estimated: 8, actual: 0, remaining: 8 }
  },
  {
    title: "Add critical path test coverage for task management and MCP integration",
    description: "Add essential test coverage for the most critical code paths: task CRUD operations, MCP protocol integration, and keyboard navigation logic.",
    priority: "high",
    status: "todo", 
    labels: ["testing", "critical-path", "stability"],
    acceptanceCriteria: [
      "Unit tests for task creation, update, delete operations",
      "Integration tests for MCP communication",
      "Keyboard navigation tests for UI interactions",
      "Minimum 80% coverage on critical paths"
    ],
    storyPoints: 8,
    timeTracking: { estimated: 12, actual: 0, remaining: 12 }
  },
  {
    title: "Create one-script installation that does everything",
    description: "Build a single installation script that sets up Critical Claude, configures Claude Desktop MCP, and integrates custom prompts automatically.",
    priority: "high",
    status: "todo",
    labels: ["installation", "user-experience", "automation"],
    acceptanceCriteria: [
      "Single script installs all dependencies",
      "Automatically configures Claude Desktop MCP settings",
      "Sets up custom prompt integration",
      "Provides clear success/failure feedback",
      "Works on macOS and Linux",
      "Handles existing installations gracefully"
    ],
    storyPoints: 13,
    timeTracking: { estimated: 16, actual: 0, remaining: 16 }
  },
  {
    title: "Add custom prompt integration for task management workflow",
    description: "Create custom prompts that integrate with Claude Code to provide context-aware task management suggestions and workflows.",
    priority: "high",
    status: "todo",
    labels: ["integration", "claude-code", "prompts", "workflow"],
    acceptanceCriteria: [
      "Custom prompts for task creation from code analysis",
      "Context-aware suggestions based on current codebase",
      "Integration with Critical Claude's brutal code review",
      "Prompts for converting code issues to actionable tasks",
      "Documentation for prompt usage"
    ],
    storyPoints: 8,
    timeTracking: { estimated: 10, actual: 0, remaining: 10 }
  },
  {
    title: "Simplify data flow complexity - reduce from 27 data nodes",
    description: "Critical Claude analysis showed 27 data nodes which may be over-engineered for 5-user scale. Simplify to match actual usage patterns.",
    priority: "medium",
    status: "todo",
    labels: ["architecture", "simplification", "performance"],
    acceptanceCriteria: [
      "Data flow analysis shows reduced complexity",
      "Maintain all existing functionality",
      "Improved performance due to simpler flows",
      "Updated architecture documentation",
      "No breaking changes to existing APIs"
    ],
    storyPoints: 5,
    timeTracking: { estimated: 6, actual: 0, remaining: 6 }
  },
  {
    title: "Document MCP integration for team knowledge transfer",
    description: "Create comprehensive documentation for the MCP (Model Context Protocol) integration to enable team knowledge sharing and maintenance.",
    priority: "medium",
    status: "todo",
    labels: ["documentation", "mcp", "knowledge-transfer"],
    acceptanceCriteria: [
      "MCP integration architecture documented",
      "Setup and configuration guide",
      "Troubleshooting common issues",
      "Code examples and usage patterns",
      "Team can maintain integration without original author"
    ],
    storyPoints: 3,
    timeTracking: { estimated: 4, actual: 0, remaining: 4 }
  },
  {
    title: "Add monitoring and logging for production insights",
    description: "Implement basic monitoring and logging to understand how the tool is being used in production and identify issues early.",
    priority: "low",
    status: "todo",
    labels: ["monitoring", "logging", "production", "insights"],
    acceptanceCriteria: [
      "Error logging with proper context",
      "Usage metrics collection (anonymous)",
      "Performance monitoring for critical operations",
      "Log rotation and cleanup",
      "Dashboard or reporting mechanism"
    ],
    storyPoints: 5,
    timeTracking: { estimated: 6, actual: 0, remaining: 6 }
  }
];

console.log(`🚀 Creating ${newTasks.length} new priority tasks...`);

for (const taskData of newTasks) {
  const task = {
    id: uuidv4(),
    ...taskData,
    acceptanceCriteria: taskData.acceptanceCriteria.map(description => ({
      id: uuidv4(),
      description,
      verified: false
    })),
    dependencies: [],
    notes: [],
    codeReferences: [],
    generatedBy: 'analysis',
    aiMetadata: {
      confidence: 0.95,
      reasoning: 'Generated from Critical Claude project analysis',
      suggestedEffort: taskData.storyPoints,
      riskFactors: ['timeline estimation', 'scope creep']
    },
    stateHistory: [{
      id: uuidv4(),
      fromState: null,
      toState: 'todo',
      changedBy: 'critical-claude-analysis',
      changedAt: new Date(),
      reason: 'Task created from project analysis'
    }],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const filePath = path.join(tasksDir, `${task.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(task, null, 2));
  
  const priorityIcon = task.priority === 'critical' ? '🚨' : 
                      task.priority === 'high' ? '🔥' : 
                      task.priority === 'medium' ? '📋' : '📝';
  
  console.log(`${priorityIcon} ${task.title}`);
}

console.log('');
console.log('✅ Task reset complete!');
console.log('📊 Summary:');
console.log(`   Archived: ${existingTasks.length} old tasks`);
console.log(`   Created: ${newTasks.length} priority tasks`);
console.log('');
console.log('🎯 Next: Run "npm run build && node dist/cli/cc-main.js task ui" to view new tasks');