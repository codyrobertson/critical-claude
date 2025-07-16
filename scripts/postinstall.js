#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// Skip if we're in development mode
if (process.env.NODE_ENV === 'development' || fs.existsSync('.git')) {
  console.log('🔧 Development mode detected - skipping postinstall setup');
  process.exit(0);
}

// Skip if already installed
const homeDir = os.homedir();
const criticalClaudeDir = path.join(homeDir, '.critical-claude');
const configPath = path.join(criticalClaudeDir, 'config.json');

if (fs.existsSync(configPath)) {
  console.log('✅ Critical Claude already configured');
  process.exit(0);
}

console.log('🚀 Installing Critical Claude...');

// Determine installation directory
const installDir = process.cwd();
const claudeDir = path.join(homeDir, '.claude');

// Create necessary directories
const binDir = path.join(installDir, 'bin');

// Ensure directories exist
[binDir, claudeDir, criticalClaudeDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Build the project if not already built
const distDir = path.join(installDir, 'packages/backlog-integration/dist');
if (!fs.existsSync(distDir)) {
  console.log('📦 Building Critical Claude...');
  try {
    execSync('npm run build', { cwd: installDir, stdio: 'inherit' });
    console.log('✅ Build completed successfully');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

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

fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

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

Happy coding! 🎯
`);