#!/usr/bin/env node

import { spawn, exec } from 'child_process';
import { createServer } from 'net';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, prefix, message) {
  console.log(`${colors[color]}${colors.bright}[${prefix}]${colors.reset} ${message}`);
}

// Find an available port starting from a base port
async function findAvailablePort(startPort = 3000) {
  return new Promise((resolve, reject) => {
    const server = createServer();
    
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Port is busy, try next one
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });
  });
}

// Update configuration files with dynamic ports
async function updatePorts(backendPort, frontendPort) {
  const files = [
    {
      path: path.join(projectRoot, 'server', 'index.js'),
      replacements: [
        {
          search: /const PORT = process\.env\.PORT \|\| \d+;/,
          replace: `const PORT = process.env.PORT || ${backendPort};`
        },
        {
          search: /origin: \[.*?\]/,
          replace: `origin: ["http://localhost:${frontendPort}", "http://localhost:5173"]`
        }
      ]
    },
    {
      path: path.join(projectRoot, 'vite.config.ts'),
      replacements: [
        {
          search: /port: \d+,/,
          replace: `port: ${frontendPort},`
        },
        {
          search: /target: 'http:\/\/localhost:\d+'/,
          replace: `target: 'http://localhost:${backendPort}'`
        }
      ]
    },
    {
      path: path.join(projectRoot, 'src', 'App.tsx'),
      replacements: [
        {
          search: /io\('http:\/\/localhost:\d+'\)/,
          replace: `io('http://localhost:${backendPort}')`
        }
      ]
    }
  ];

  for (const file of files) {
    try {
      let content = await readFile(file.path, 'utf-8');
      
      for (const { search, replace } of file.replacements) {
        content = content.replace(search, replace);
      }
      
      await writeFile(file.path, content);
      log('cyan', 'CONFIG', `Updated ${path.basename(file.path)}`);
    } catch (error) {
      log('red', 'ERROR', `Failed to update ${file.path}: ${error.message}`);
    }
  }
}

// Start a process and handle output
function startProcess(command, args, label, color) {
  return new Promise((resolve, reject) => {
    log(color, label, `Starting: ${command} ${args.join(' ')}`);
    
    const process = spawn(command, args, {
      cwd: projectRoot,
      stdio: 'pipe',
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    process.stdout.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          log(color, label, line.trim());
        }
      });
    });

    process.stderr.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          log('red', `${label}-ERR`, line.trim());
        }
      });
    });

    process.on('close', (code) => {
      if (code === 0) {
        log('green', label, 'Process completed successfully');
        resolve(code);
      } else {
        log('red', label, `Process exited with code ${code}`);
        reject(new Error(`Process exited with code ${code}`));
      }
    });

    process.on('error', (error) => {
      log('red', label, `Process error: ${error.message}`);
      reject(error);
    });

    // Return the process so we can kill it later
    return process;
  });
}

async function main() {
  try {
    log('blue', 'ORCHESTRATOR', 'Starting Critical Claude Web App...');
    
    // Find available ports
    const backendPort = await findAvailablePort(3003);
    const frontendPort = await findAvailablePort(5173);
    
    log('green', 'PORTS', `Backend: ${backendPort}, Frontend: ${frontendPort}`);
    
    // Update configuration files
    await updatePorts(backendPort, frontendPort);
    
    // Start both processes
    const processes = [];
    
    // Start backend server
    const backendProcess = spawn('node', ['server/index.js'], {
      cwd: projectRoot,
      stdio: 'pipe',
      env: { ...process.env, PORT: backendPort }
    });
    
    backendProcess.stdout.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          log('yellow', 'BACKEND', line.trim());
        }
      });
    });
    
    backendProcess.stderr.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          log('red', 'BACKEND-ERR', line.trim());
        }
      });
    });
    
    processes.push(backendProcess);
    
    // Wait a moment for backend to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Start frontend
    const frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: projectRoot,
      stdio: 'pipe',
      env: { ...process.env }
    });
    
    frontendProcess.stdout.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          log('cyan', 'FRONTEND', line.trim());
        }
      });
    });
    
    frontendProcess.stderr.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          log('red', 'FRONTEND-ERR', line.trim());
        }
      });
    });
    
    processes.push(frontendProcess);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      log('yellow', 'ORCHESTRATOR', 'Shutting down...');
      processes.forEach(proc => {
        if (!proc.killed) {
          proc.kill('SIGTERM');
        }
      });
      process.exit(0);
    });
    
    log('green', 'ORCHESTRATOR', `🚀 Services started!`);
    log('green', 'ORCHESTRATOR', `📱 Frontend: http://localhost:${frontendPort}`);
    log('green', 'ORCHESTRATOR', `🔌 Backend: http://localhost:${backendPort}`);
    
    // Auto-open browser after a short delay
    setTimeout(async () => {
      const url = `http://localhost:${frontendPort}`;
      try {
        const platform = process.platform;
        const command = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
        await execAsync(`${command} ${url}`);
        log('cyan', 'BROWSER', `Opened ${url}`);
      } catch (error) {
        log('yellow', 'BROWSER', `Please open http://localhost:${frontendPort} manually`);
      }
    }, 3000);
    
    log('yellow', 'ORCHESTRATOR', 'Press Ctrl+C to stop all services');
    
    // Keep the process alive
    await new Promise(() => {});
    
  } catch (error) {
    log('red', 'ORCHESTRATOR', `Failed to start: ${error.message}`);
    process.exit(1);
  }
}

// Run if this is the main module
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}