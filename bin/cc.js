#!/usr/bin/env node

// Critical Claude CLI Binary (short alias)
const path = require('path');
const { spawn } = require('child_process');

// Get the installation directory
const installDir = path.resolve(__dirname, '..');
const targetScript = path.join(installDir, 'packages/backlog-integration/dist/cli/unified-cc-router.js');

const args = process.argv.slice(2);

// Check if target script exists
const fs = require('fs');
if (!fs.existsSync(targetScript)) {
  console.error('❌ Critical Claude not properly installed. Please reinstall:');
  console.error('   npm install -g critical-claude');
  process.exit(1);
}

const child = spawn('node', [targetScript, ...args], {
  stdio: 'inherit',
  cwd: path.join(installDir, 'packages/backlog-integration')
});

child.on('error', (error) => {
  console.error('❌ Error running Critical Claude:', error.message);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code);
});