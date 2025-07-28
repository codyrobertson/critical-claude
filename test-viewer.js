#!/usr/bin/env node

// Quick test of the viewer using compiled JS
import { ViewerService } from './dist/services/ViewerService.js';
import { FileStorage } from './dist/storage/FileStorage.js';
import * as path from 'path';
import * as os from 'os';

async function testViewer() {
  try {
    console.log('🧪 Testing Simple CLI Viewer...\n');
    
    // Use the same storage path as the main CLI
    const storagePath = path.join(os.homedir(), '.critical-claude');
    console.log(`Using storage path: ${storagePath}`);
    
    const storage = new FileStorage(storagePath);
    const viewerService = new ViewerService(storage);
    
    // First check how many tasks are available
    const tasks = await storage.findAll('tasks');
    console.log(`Found ${tasks.length} tasks in storage\n`);
    
    const result = await viewerService.launchViewer({
      theme: 'dark',
      logLevel: 'info'
    });
    
    if (result.success) {
      console.log('✅ Viewer test completed successfully');
    } else {
      console.error('❌', result.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testViewer();