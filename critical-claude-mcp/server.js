#!/usr/bin/env node

/**
 * Brutal Code Critique MCP Server Runner
 * This runs the actual MCP server that can be connected to by Claude or other MCP clients
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔥 Starting Brutal Code Critique MCP Server...\n');

// Path to the built server
const serverPath = join(__dirname, 'build', 'index.js');

// Start the server with stdio transport
const server = spawn('node', [serverPath], {
  stdio: 'inherit',  // This passes through stdin/stdout/stderr directly
  env: {
    ...process.env,
    NODE_ENV: 'production'
  }
});

// Handle errors
server.on('error', (err) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});

// Handle server exit
server.on('exit', (code, signal) => {
  if (signal) {
    console.log(`\n⚠️  Server terminated by signal: ${signal}`);
  } else if (code !== 0) {
    console.error(`\n❌ Server exited with code: ${code}`);
  } else {
    console.log('\n✅ Server stopped gracefully');
  }
  process.exit(code || 0);
});

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Terminating server...');
  server.kill('SIGTERM');
});

console.log('✅ MCP Server is running and ready for connections');
console.log('📡 Using stdio transport - connect via MCP client\n');