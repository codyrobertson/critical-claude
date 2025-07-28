#!/usr/bin/env node

// Simple Critical Claude CLI that uses the DDD CLI Application
import { CLIApplication } from '../applications/cli-application/dist/index.js';

async function main() {
  try {
    const cli = new CLIApplication();
    await cli.start();
  } catch (error) {
    console.error('❌ CLI failed:', error.message);
    process.exit(1);
  }
}

main();