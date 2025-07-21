#!/usr/bin/env node

// Test keyboard input detection
const readline = require('readline');

if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}

console.log('Press keys to test (Ctrl+C to exit):');
console.log('Try pressing: Space, Tab, j, k, /, etc.\n');

process.stdin.on('data', (data) => {
  const key = data.toString();
  const bytes = [];
  for (let i = 0; i < key.length; i++) {
    bytes.push('0x' + key.charCodeAt(i).toString(16).padStart(2, '0'));
  }
  
  let keyName = key;
  if (key === '\t') keyName = 'Tab';
  else if (key === ' ') keyName = 'Space';
  else if (key === '\r' || key === '\n') keyName = 'Enter';
  else if (key === '\x1b[A') keyName = 'ArrowUp';
  else if (key === '\x1b[B') keyName = 'ArrowDown';
  else if (key === '\x03') keyName = 'Ctrl+C';
  
  console.log(`Key: "${keyName}" | Raw: "${key}" | Bytes: [${bytes.join(', ')}]`);
  
  if (key === '\x03') {
    process.stdin.setRawMode(false);
    process.exit();
  }
});