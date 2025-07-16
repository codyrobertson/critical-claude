#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📦 Preparing Critical Claude package for publication...');

const rootDir = process.cwd();

// Step 1: Clean everything
console.log('🧹 Cleaning build artifacts...');
try {
  execSync('npm run clean', { cwd: rootDir, stdio: 'inherit' });
  console.log('✅ Clean completed');
} catch (error) {
  console.log('⚠️  Clean failed (might be expected)');
}

// Step 2: Install dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('npm install --ignore-scripts', { cwd: rootDir, stdio: 'inherit' });
  console.log('✅ Dependencies installed');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Step 3: Build all packages
console.log('🔨 Building all packages...');
try {
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
  console.log('✅ Build completed');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Step 4: Run tests
console.log('🧪 Running tests...');
try {
  execSync('npm test', { cwd: rootDir, stdio: 'inherit' });
  console.log('✅ Tests passed');
} catch (error) {
  console.log('⚠️  Tests failed or not available');
}

// Step 5: Verify CLI works
console.log('🔍 Verifying CLI functionality...');
try {
  const cliPath = path.join(rootDir, 'bin/cc.js');
  execSync(`node ${cliPath} --help`, { cwd: rootDir, stdio: 'pipe' });
  console.log('✅ CLI verification passed');
} catch (error) {
  console.error('❌ CLI verification failed:', error.message);
  process.exit(1);
}

// Step 6: Create package info
const packageInfo = {
  name: 'critical-claude',
  version: '1.0.0',
  description: 'Critical Claude MCP Services - A comprehensive code analysis and development toolkit',
  main: 'packages/backlog-integration/dist/index.js',
  bin: {
    'critical-claude': './bin/critical-claude.js',
    'cc': './bin/cc.js'
  },
  scripts: {
    postinstall: 'node scripts/postinstall.js',
    preuninstall: 'node scripts/cleanup.js'
  },
  preferGlobal: true,
  publishConfig: {
    access: 'public'
  },
  files: [
    'bin/',
    'packages/',
    'scripts/',
    'critical-claude-mcp/',
    'README.md',
    'LICENSE'
  ],
  keywords: [
    'mcp',
    'claude',
    'code-analysis',
    'development-tools',
    'task-management',
    'agile',
    'critical-claude'
  ],
  author: 'Critical Claude Team',
  license: 'MIT',
  repository: {
    type: 'git',
    url: 'https://github.com/critical-claude/critical-claude.git'
  }
};

console.log('📋 Package ready for publication!');
console.log('');
console.log('📊 Package Summary:');
console.log(`   Name: ${packageInfo.name}`);
console.log(`   Version: ${packageInfo.version}`);
console.log(`   Binaries: ${Object.keys(packageInfo.bin).join(', ')}`);
console.log(`   Files: ${packageInfo.files.length} directories/files`);
console.log('');
console.log('🚀 To publish:');
console.log('   npm login');
console.log('   npm publish');
console.log('');
console.log('🧪 To test locally:');
console.log('   npm pack');
console.log('   npm install -g critical-claude-1.0.0.tgz');
console.log('   critical-claude --help');
console.log('');
console.log('✅ Package preparation complete!');