#!/usr/bin/env node

/**
 * Critical Claude CLI - Simplified Entry Point
 * No more lazy initialization, race conditions, or DI complexity
 */

import { SimplifiedCLI } from './cli/index.js';

async function main(): Promise<void> {
  let app: SimplifiedCLI;
  
  try {
    // Initialize CLI application upfront - fail fast if something's wrong
    app = new SimplifiedCLI();
    
    // Start the application
    await app.start();
  } catch (error) {
    console.error('❌ Critical Claude CLI failed to start:', error);
    
    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('ENOENT') || error.message.includes('permission')) {
        console.error('🔧 Storage access issue. Please ensure ~/.critical-claude directory is writable');
      } else if (error.message.includes('EADDRINUSE')) {
        console.error('🔧 Port already in use. Please close other instances');
      } else {
        console.error('💡 This appears to be an initialization error. Please try again.');
      }
    }
    
    process.exit(1);
  }
}

// Start the application with proper error handling
main().catch(error => {
  console.error('❌ Unexpected application error:', error);
  console.error('📧 Please report this issue if it persists');
  process.exit(1);
});