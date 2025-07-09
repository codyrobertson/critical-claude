#!/usr/bin/env node

/**
 * Test Claude CLI integration and diagnose MCP tool schema issues
 */

import { EnhancedClaudeCodeProvider } from '../core/enhanced-claude-code-provider.js';

async function testClaudeIntegration() {
  console.log('🧪 Testing Claude CLI Integration\n');

  // Test 0: Check Claude CLI installation and auth
  console.log('0. Checking Claude CLI installation...');
  try {
    const { promisify } = await import('util');
    const exec = promisify((await import('child_process')).exec);
    
    // Check if claude command exists
    try {
      const { stdout: whichOutput } = await exec('which claude');
      console.log(`✅ Claude CLI found at: ${whichOutput.trim()}`);
    } catch {
      console.log('❌ Claude CLI not found in PATH');
      console.log('   Install with: npm install -g @anthropic-ai/claude-code');
      return;
    }

    // Check Claude version
    try {
      const { stdout: versionOutput } = await exec('claude --version');
      console.log(`✅ Claude version: ${versionOutput.trim()}`);
    } catch (error) {
      console.log('⚠️  Could not get Claude version');
    }

    // Check authentication status
    try {
      const { stdout: authOutput } = await exec('claude auth status');
      console.log(`✅ Authentication: ${authOutput.trim()}`);
    } catch (error) {
      console.log('❌ Authentication issue - run: claude auth login');
      console.log(`   Error: ${error}`);
      return;
    }

  } catch (error) {
    console.log('❌ Failed to check Claude CLI status:', error);
    return;
  }

  // Test 1: Basic Claude CLI connection
  console.log('\n1. Testing basic Claude CLI connection...');
  const provider = new EnhancedClaudeCodeProvider({
    modelId: 'sonnet',
    temperature: 0.1,
    permissionMode: 'plan',
    allowedTools: ['Read', 'LS'] // Minimal tool set
  });

  const connectionTest = await provider.testClaudeConnection();
  
  if (connectionTest.success) {
    console.log('✅ Claude CLI connection successful');
    console.log(`   Response: ${connectionTest.output}`);
  } else {
    console.log('❌ Claude CLI connection failed');
    console.log(`   Error: ${connectionTest.error}`);
    console.log('\n🔧 Troubleshooting:');
    console.log('   - Ensure Claude CLI is installed: npm install -g @anthropic-ai/claude-code');
    console.log('   - Check if claude command is in PATH: which claude');
    console.log('   - Verify authentication: claude auth status');
    return;
  }

  // Test 2: Task generation with minimal prompt
  console.log('\n2. Testing AI task generation...');
  try {
    const tasks = await provider.generateTasksFromFeature(
      'Add user authentication to the app',
      { teamSize: 2, sprintLength: 10 }
    );

    console.log(`✅ Task generation successful - generated ${tasks.length} tasks`);
    tasks.forEach((task, index) => {
      console.log(`   ${index + 1}. ${task.title} (${task.estimatedEffort} pts, ${task.priority})`);
    });

  } catch (error) {
    console.log('❌ Task generation failed');
    console.log(`   Error: ${error instanceof Error ? error.message : error}`);
    
    if (error instanceof Error && error.message.includes('MCP tool schema')) {
      console.log('\n🔧 MCP Tool Schema Issue Detected:');
      console.log('   - This error indicates incompatible tool schemas with oneOf/allOf/anyOf');
      console.log('   - The provider has schema sanitization built-in');
      console.log('   - Consider updating your MCP configuration or tool definitions');
    }
  }

  // Test 3: Code analysis
  console.log('\n3. Testing code analysis...');
  try {
    const analysisResults = await provider.analyzeCodeForTasks(__filename);
    
    console.log(`✅ Code analysis successful - found ${analysisResults.length} improvement tasks`);
    analysisResults.forEach((task, index) => {
      console.log(`   ${index + 1}. ${task.title} (${task.priority})`);
    });

  } catch (error) {
    console.log('❌ Code analysis failed');
    console.log(`   Error: ${error instanceof Error ? error.message : error}`);
  }

  console.log('\n🎯 Test completed!');
}

// Run the test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testClaudeIntegration().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

export { testClaudeIntegration };