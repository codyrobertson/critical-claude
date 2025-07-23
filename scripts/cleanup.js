#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';

console.log('🧹 Cleaning up Critical Claude installation...');

const homeDir = os.homedir();
const criticalClaudeDir = path.join(homeDir, '.critical-claude');
const claudeDir = path.join(homeDir, '.claude');

// Read config if it exists
let config = {};
const configPath = path.join(criticalClaudeDir, 'config.json');
if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('📖 Found configuration file');
  } catch (error) {
    console.log('⚠️  Could not read configuration file');
  }
}

// Remove binaries
if (config.binPath && fs.existsSync(config.binPath)) {
  try {
    fs.rmSync(config.binPath, { recursive: true, force: true });
    console.log('✅ Removed binary directory');
  } catch (error) {
    console.log('⚠️  Could not remove binary directory:', error.message);
  }
}

// Clean up Claude Code integration
const claudeConfigPath = path.join(claudeDir, 'claude_desktop_config.json');
if (fs.existsSync(claudeConfigPath)) {
  try {
    const claudeConfig = JSON.parse(fs.readFileSync(claudeConfigPath, 'utf8'));
    
    if (claudeConfig.mcpServers && claudeConfig.mcpServers['critical-claude']) {
      delete claudeConfig.mcpServers['critical-claude'];
      fs.writeFileSync(claudeConfigPath, JSON.stringify(claudeConfig, null, 2));
      console.log('✅ Removed Claude Code MCP integration');
    }
  } catch (error) {
    console.log('⚠️  Could not clean Claude Code config:', error.message);
  }
}

// Remove configuration directory (optional - keep user data)
console.log(`ℹ️  Configuration directory preserved: ${criticalClaudeDir}`);
console.log('   (Contains user data and settings)');

console.log(`
🎉 Critical Claude cleanup complete!

To fully remove all user data:
  rm -rf ${criticalClaudeDir}

Thank you for using Critical Claude! 👋
`);