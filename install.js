#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

console.log('🚀 Installing Critical Claude (Development Mode)...');

// Determine installation directory
const installDir = process.cwd();
const homeDir = os.homedir();

// Create necessary directories
const binDir = path.join(installDir, 'bin');
const claudeDir = path.join(homeDir, '.claude');
const criticalClaudeDir = path.join(homeDir, '.critical-claude');

// Ensure directories exist
[binDir, claudeDir, criticalClaudeDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Install workspace dependencies
console.log('📦 Installing workspace dependencies...');
try {
  // Install root dependencies (skip postinstall to prevent loop)
  execSync('npm install --ignore-scripts', { cwd: installDir, stdio: 'inherit' });
  
  // Install and build all packages
  execSync('npm run install:all', { cwd: installDir, stdio: 'inherit' });
  execSync('npm run build', { cwd: installDir, stdio: 'inherit' });
  
  console.log('✅ Dependencies installed and built successfully');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Create bin executables
const binFiles = [
  {
    name: 'critical-claude.js',
    target: path.join(installDir, 'packages/backlog-integration/dist/cli/cc-main.js')
  },
  {
    name: 'cc.js', 
    target: path.join(installDir, 'packages/backlog-integration/dist/cli/cc-main.js')
  }
];

binFiles.forEach(({ name, target }) => {
  const binPath = path.join(binDir, name);
  const binContent = `#!/usr/bin/env node
// Critical Claude CLI Binary
const path = require('path');
const { spawn } = require('child_process');

const targetScript = '${target}';
const args = process.argv.slice(2);

const child = spawn('node', [targetScript, ...args], {
  stdio: 'inherit',
  cwd: process.cwd()
});

child.on('error', (error) => {
  console.error('❌ Error running Critical Claude:', error.message);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code);
});
`;

  fs.writeFileSync(binPath, binContent);
  fs.chmodSync(binPath, '755');
  console.log(`✅ Created binary: ${binPath}`);
});

// Create shell aliases script
const aliasScript = `#!/bin/bash
# Critical Claude Shell Aliases
alias critical-claude='node "${binDir}/critical-claude.js"'
alias cc='node "${binDir}/cc.js"'

# Add to PATH if not already there
if [[ ":$PATH:" != *":${binDir}:"* ]]; then
  export PATH="${binDir}:$PATH"
fi

echo "✅ Critical Claude aliases loaded"
`;

const aliasPath = path.join(criticalClaudeDir, 'aliases.sh');
fs.writeFileSync(aliasPath, aliasScript);
fs.chmodSync(aliasPath, '755');

// Create configuration file
const config = {
  version: '1.0.0',
  installPath: installDir,
  binPath: binDir,
  configPath: criticalClaudeDir,
  installedAt: new Date().toISOString(),
  commands: {
    'critical-claude': path.join(binDir, 'critical-claude.js'),
    'cc': path.join(binDir, 'cc.js')
  }
};

fs.writeFileSync(
  path.join(criticalClaudeDir, 'config.json'),
  JSON.stringify(config, null, 2)
);

// Setup Claude Code integration if available
const claudeConfigPath = path.join(claudeDir, 'claude_desktop_config.json');
if (fs.existsSync(claudeConfigPath)) {
  try {
    const claudeConfig = JSON.parse(fs.readFileSync(claudeConfigPath, 'utf8'));
    
    if (!claudeConfig.mcpServers) {
      claudeConfig.mcpServers = {};
    }
    
    claudeConfig.mcpServers['critical-claude'] = {
      command: 'node',
      args: [path.join(installDir, 'critical-claude-mcp/build/index.js')],
      env: {
        CRITICAL_CLAUDE_PROJECT_PATH: process.cwd(),
        CRITICAL_CLAUDE_LOG_LEVEL: 'info'
      }
    };
    
    fs.writeFileSync(claudeConfigPath, JSON.stringify(claudeConfig, null, 2));
    console.log('✅ Claude Code MCP integration configured');
  } catch (error) {
    console.log('⚠️  Claude Code config exists but could not be updated:', error.message);
  }
} else {
  console.log('ℹ️  Claude Code not found - MCP integration skipped');
}

// Print installation summary
console.log(`
🎉 Critical Claude Installation Complete!

📍 Installation Directory: ${installDir}
🔧 Binary Directory: ${binDir}
⚙️  Configuration: ${criticalClaudeDir}

🚀 Available Commands:
  • critical-claude --help
  • cc --help
  • cc live (live monitoring)
  • cc task "create new feature"
  • cc agile (full project management)

📚 Getting Started:
  1. Run: cc --help
  2. Try: cc status
  3. Start: cc live

🔗 Add to Shell (optional):
  source ${aliasPath}

Happy coding! 🎯
`);