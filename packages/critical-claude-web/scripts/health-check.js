#!/usr/bin/env node

import { createConnection } from 'net';
import { fileURLToPath } from 'url';

// Check if a port is open
function checkPort(port, host = 'localhost', timeout = 3000) {
  return new Promise((resolve) => {
    const socket = new createConnection(port, host);
    
    const timer = setTimeout(() => {
      socket.end();
      resolve(false);
    }, timeout);
    
    socket.on('connect', () => {
      clearTimeout(timer);
      socket.end();
      resolve(true);
    });
    
    socket.on('error', () => {
      clearTimeout(timer);
      resolve(false);
    });
  });
}

async function healthCheck() {
  const ports = [3003, 3004, 3005, 5173, 5174, 5175];
  
  console.log('🏥 Health Check - Scanning for running services...\n');
  
  for (const port of ports) {
    const isOpen = await checkPort(port);
    const status = isOpen ? '✅ RUNNING' : '❌ STOPPED';
    const service = port >= 5173 ? 'Frontend' : 'Backend';
    console.log(`Port ${port} (${service}): ${status}`);
  }
  
  console.log('\n💡 Use `npm start` to launch the orchestrated services');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  healthCheck();
}