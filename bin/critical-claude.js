#!/usr/bin/env node

// Critical Claude CLI Binary
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

// Get the installation directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const installDir = path.resolve(__dirname, '..');
const targetScript = path.join(installDir, 'applications/cli-application/dist/index.js');

const args = process.argv.slice(2);

// Check if target script exists
import fs from 'fs';
if (!fs.existsSync(targetScript)) {
  console.error('❌ Critical Claude not properly installed. Please reinstall:');
  console.error('   npm install -g critical-claude');
  process.exit(1);
}

const child = spawn('node', [targetScript, ...args], {
  stdio: 'inherit',
  cwd: installDir
});

child.on('error', (error) => {
  console.error('❌ Error running Critical Claude:', error.message);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code);
});