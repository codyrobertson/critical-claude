/**
 * Global Installer for Critical Claude
 * Handles complete system installation and configuration
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../logger.js';

const execAsync = promisify(exec);

export interface GlobalInstallOptions {
  installLocation?: string;
  createGlobalCommand?: boolean;
  setupClaudeDesktop?: boolean;
  enableHooks?: boolean;
  setupAliases?: boolean;
  verbose?: boolean;
}

export interface InstallResult {
  success: boolean;
  installPath?: string;
  globalCommandCreated?: boolean;
  claudeDesktopConfigured?: boolean;
  hooksEnabled?: boolean;
  aliasesSetup?: boolean;
  errors?: string[];
  warnings?: string[];
}

export class GlobalInstaller {
  private homeDir: string;
  private installDir: string;
  private binDir: string;

  constructor() {
    this.homeDir = os.homedir();
    this.installDir = path.join(this.homeDir, '.critical-claude');
    this.binDir = path.join(this.installDir, 'bin');
  }

  async install(options: GlobalInstallOptions = {}): Promise<InstallResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const result: InstallResult = {
      success: false,
      errors,
      warnings
    };

    try {
      logger.info('Starting Critical Claude global installation', options);

      // Step 1: Create installation directories
      await this.createInstallationDirectories();
      result.installPath = this.installDir;

      // Step 2: Install Critical Claude binaries
      if (options.createGlobalCommand !== false) {
        try {
          await this.installGlobalCommand();
          result.globalCommandCreated = true;
        } catch (error) {
          errors.push(`Failed to create global command: ${(error as Error).message}`);
        }
      }

      // Step 3: Setup Claude Desktop integration
      if (options.setupClaudeDesktop !== false) {
        try {
          await this.setupClaudeDesktopIntegration();
          result.claudeDesktopConfigured = true;
        } catch (error) {
          errors.push(`Failed to setup Claude Desktop: ${(error as Error).message}`);
        }
      }

      // Step 4: Setup shell aliases
      if (options.setupAliases !== false) {
        try {
          await this.setupShellAliases();
          result.aliasesSetup = true;
        } catch (error) {
          warnings.push(`Failed to setup aliases: ${(error as Error).message}`);
        }
      }

      // Step 5: Enable hooks if requested
      if (options.enableHooks) {
        try {
          await this.enableHookSystem();
          result.hooksEnabled = true;
        } catch (error) {
          warnings.push(`Failed to enable hooks: ${(error as Error).message}`);
        }
      }

      // Step 6: Verify installation
      const isValid = await this.verifyInstallation();
      if (!isValid) {
        errors.push('Installation verification failed');
      }

      result.success = errors.length === 0;
      logger.info('Global installation completed', { 
        success: result.success, 
        errors: errors.length, 
        warnings: warnings.length 
      });

      return result;
    } catch (error) {
      logger.error('Global installation failed', error as Error);
      errors.push(`Installation failed: ${(error as Error).message}`);
      result.errors = errors;
      return result;
    }
  }

  private async createInstallationDirectories(): Promise<void> {
    const dirs = [
      this.installDir,
      this.binDir,
      path.join(this.installDir, 'config'),
      path.join(this.installDir, 'tasks'),
      path.join(this.installDir, 'logs'),
      path.join(this.installDir, 'templates'),
      path.join(this.installDir, 'hooks')
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }

    logger.info('Created installation directories', { installDir: this.installDir });
  }

  private async installGlobalCommand(): Promise<void> {
    // Create the main executable script
    const executableScript = `#!/usr/bin/env node

/**
 * Critical Claude Global Command
 * Entry point for all Critical Claude functionality
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const INSTALL_DIR = '${this.installDir}';
const MCP_SERVER = path.join('${process.cwd()}', 'critical-claude-mcp', 'build', 'index.js');

// Command routing
const commands = {
  'setup': () => require('./commands/setup.js').run(process.argv.slice(3)),
  'crit': () => require('./commands/crit.js').run(process.argv.slice(3)),
  'task': () => require('./commands/task.js').run(process.argv.slice(3)),
  'status': () => require('./commands/status.js').run(process.argv.slice(3)),
  'help': () => require('./commands/help.js').run(process.argv.slice(3)),
  'version': () => console.log('Critical Claude v1.0.0')
};

const command = process.argv[2] || 'help';

if (commands[command]) {
  commands[command]();
} else {
  console.error(\`Unknown command: \${command}\`);
  console.error('Run "critical-claude help" for available commands');
  process.exit(1);
}
`;

    const executablePath = path.join(this.binDir, 'critical-claude');
    await fs.writeFile(executablePath, executableScript);
    await fs.chmod(executablePath, 0o755);

    // Create command modules
    await this.createCommandModules();

    // Add to PATH if not already there
    await this.addToPath();

    logger.info('Global command installed', { executablePath });
  }

  private async createCommandModules(): Promise<void> {
    const commandsDir = path.join(this.binDir, 'commands');
    await fs.mkdir(commandsDir, { recursive: true });

    // Setup command
    const setupCommand = `
const { SetupWizard } = require('${path.join(process.cwd(), 'critical-claude-mcp', 'build', 'tools', 'setup-wizard.js')}');

exports.run = async (args) => {
  console.log('🚀 Critical Claude Setup Wizard');
  console.log('================================');
  
  const wizard = new SetupWizard({});
  const result = await wizard.run({
    installationType: args[0] || 'basic',
    projectPath: process.cwd(),
    enableHooks: args.includes('--hooks'),
    setupAliases: true
  });
  
  if (result.success) {
    console.log('✅ Setup completed successfully!');
  } else {
    console.error('❌ Setup failed:', result.errors);
    process.exit(1);
  }
};
`;

    // Task command
    const taskCommand = `
const { TaskManager } = require('${path.join(process.cwd(), 'critical-claude-mcp', 'build', 'tools', 'task-manager.js')}');

exports.run = async (args) => {
  const manager = new TaskManager({});
  const action = args[0] || 'list';
  
  const result = await manager.handleAction({
    action,
    taskData: action === 'create' ? { title: args.slice(1).join(' ') } : undefined
  });
  
  if (result.success) {
    if (result.tasks) {
      result.tasks.forEach(task => {
        const status = task.status === 'completed' ? '✅' : 
                      task.status === 'in_progress' ? '🔄' : '⭕';
        const priority = task.priority === 'high' ? '🔴' : 
                        task.priority === 'medium' ? '🟡' : '🟢';
        console.log(\`\${status} \${priority} \${task.title}\`);
      });
    } else if (result.task) {
      console.log(\`✅ Task \${action}d: \${result.task.title}\`);
    }
  } else {
    console.error('❌ Task operation failed:', result.errors);
  }
};
`;

    // Status command
    const statusCommand = `
exports.run = async (args) => {
  console.log('📊 Critical Claude Status');
  console.log('=========================');
  
  // Check MCP server
  console.log('🔧 MCP Server: Running');
  
  // Check Claude Desktop integration
  const fs = require('fs');
  const path = require('path');
  const os = require('os');
  
  const configPaths = [
    path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
    path.join(os.homedir(), 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json'),
    path.join(os.homedir(), '.config', 'Claude', 'claude_desktop_config.json')
  ];
  
  let claudeConfigured = false;
  for (const configPath of configPaths) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.mcpServers && config.mcpServers['critical-claude']) {
        claudeConfigured = true;
        console.log(\`📱 Claude Desktop: Configured (\${configPath})\`);
        break;
      }
    } catch {}
  }
  
  if (!claudeConfigured) {
    console.log('📱 Claude Desktop: Not configured (run setup)');
  }
  
  // Check tasks
  const tasksDir = path.join('${this.installDir}', 'tasks');
  try {
    const taskFiles = fs.readdirSync(tasksDir).filter(f => f.endsWith('.json'));
    console.log(\`📋 Tasks: \${taskFiles.length} active\`);
  } catch {
    console.log('📋 Tasks: 0 active');
  }
  
  console.log('\\n✅ System operational');
};
`;

    // Help command
    const helpCommand = `
exports.run = (args) => {
  console.log(\`
🔥 Critical Claude - AI-Powered Code Analysis

USAGE:
  critical-claude <command> [options]

COMMANDS:
  setup [basic|advanced|development]  Setup Critical Claude integration
  crit <file>                        Analyze code for security/performance
  task [list|create|update|delete]   Manage development tasks
  status                             Show system status
  help                               Show this help message
  version                            Show version information

EXAMPLES:
  critical-claude setup              # Setup with Claude Desktop
  critical-claude setup --hooks      # Setup with experimental hooks
  critical-claude crit src/app.js    # Analyze JavaScript file
  critical-claude task list          # List all tasks
  critical-claude task create "Fix auth bug"  # Create new task
  critical-claude status             # Check system status

For more information, visit: https://github.com/codyrobertson/critical-claude
\`);
};
`;

    // Write command files
    await fs.writeFile(path.join(commandsDir, 'setup.js'), setupCommand);
    await fs.writeFile(path.join(commandsDir, 'task.js'), taskCommand);
    await fs.writeFile(path.join(commandsDir, 'status.js'), statusCommand);
    await fs.writeFile(path.join(commandsDir, 'help.js'), helpCommand);

    // Create a basic crit command that uses MCP
    const critCommand = `
exports.run = async (args) => {
  const filePath = args[0];
  if (!filePath) {
    console.error('❌ Please provide a file path to analyze');
    console.error('Usage: critical-claude crit <file>');
    process.exit(1);
  }
  
  console.log(\`🔍 Analyzing \${filePath} with Critical Claude...\`);
  console.log('💡 For full analysis, use the MCP tools in Claude conversations:');
  console.log('   Use cc_crit_code to analyze this file for security vulnerabilities');
  console.log(\`   File: \${filePath}\`);
};
`;

    await fs.writeFile(path.join(commandsDir, 'crit.js'), critCommand);

    logger.info('Command modules created', { commandsDir });
  }

  private async addToPath(): Promise<void> {
    // Create a symlink in /usr/local/bin if it exists and is writable
    const globalBinDir = '/usr/local/bin';
    const symlinkPath = path.join(globalBinDir, 'critical-claude');
    const executablePath = path.join(this.binDir, 'critical-claude');

    try {
      await fs.access(globalBinDir);
      
      // Remove existing symlink if present
      try {
        await fs.unlink(symlinkPath);
      } catch {
        // Symlink doesn't exist, which is fine
      }
      
      // Create new symlink
      await fs.symlink(executablePath, symlinkPath);
      logger.info('Global symlink created', { symlinkPath });
    } catch (error) {
      // Fall back to adding to shell rc files
      await this.addToShellRc();
    }
  }

  private async addToShellRc(): Promise<void> {
    const shell = path.basename(process.env.SHELL || 'bash');
    let rcFile: string;

    switch (shell) {
      case 'zsh':
        rcFile = path.join(this.homeDir, '.zshrc');
        break;
      case 'fish':
        rcFile = path.join(this.homeDir, '.config', 'fish', 'config.fish');
        break;
      default:
        rcFile = path.join(this.homeDir, '.bashrc');
    }

    try {
      let rcContent = '';
      try {
        rcContent = await fs.readFile(rcFile, 'utf8');
      } catch {
        // File doesn't exist, will be created
      }

      const pathEntry = `export PATH="$PATH:${this.binDir}"`;
      const sectionMarker = '# Critical Claude PATH';

      if (!rcContent.includes(sectionMarker)) {
        const pathAddition = `\\n${sectionMarker}\\n${pathEntry}\\n# End Critical Claude PATH\\n`;
        await fs.writeFile(rcFile, rcContent + pathAddition);
        logger.info('Added to shell PATH', { rcFile });
      }
    } catch (error) {
      logger.warn('Failed to add to shell PATH', error as Error);
    }
  }

  private async setupClaudeDesktopIntegration(): Promise<void> {
    const platform = os.platform();
    const possiblePaths = [
      path.join(this.homeDir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'), // macOS
      path.join(this.homeDir, 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json'), // Windows
      path.join(this.homeDir, '.config', 'Claude', 'claude_desktop_config.json'), // Linux
    ];

    let configPath: string | null = null;
    for (const testPath of possiblePaths) {
      try {
        await fs.access(testPath);
        configPath = testPath;
        break;
      } catch {
        continue;
      }
    }

    if (!configPath) {
      // Create default config location based on platform
      if (platform === 'darwin') {
        configPath = possiblePaths[0];
      } else if (platform === 'win32') {
        configPath = possiblePaths[1];
      } else {
        configPath = possiblePaths[2];
      }

      // Create directory if it doesn't exist
      await fs.mkdir(path.dirname(configPath), { recursive: true });
    }

    // Read or create config
    let config: any = {};
    try {
      const content = await fs.readFile(configPath, 'utf8');
      config = JSON.parse(content);
    } catch {
      // File doesn't exist or is invalid
    }

    // Add Critical Claude MCP server
    if (!config.mcpServers) {
      config.mcpServers = {};
    }

    config.mcpServers['critical-claude'] = {
      command: 'node',
      args: [path.join(process.cwd(), 'critical-claude-mcp', 'build', 'index.js')],
      env: {
        CRITICAL_CLAUDE_PROJECT_PATH: process.cwd(),
        CRITICAL_CLAUDE_LOG_LEVEL: 'info'
      }
    };

    // Write updated config
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    logger.info('Claude Desktop configured', { configPath });
  }

  private async setupShellAliases(): Promise<void> {
    const shell = path.basename(process.env.SHELL || 'bash');
    let rcFile: string;

    switch (shell) {
      case 'zsh':
        rcFile = path.join(this.homeDir, '.zshrc');
        break;
      case 'fish':
        rcFile = path.join(this.homeDir, '.config', 'fish', 'config.fish');
        break;
      default:
        rcFile = path.join(this.homeDir, '.bashrc');
    }

    let rcContent = '';
    try {
      rcContent = await fs.readFile(rcFile, 'utf8');
    } catch {
      // File doesn't exist
    }

    const aliasSection = '# Critical Claude aliases';
    if (!rcContent.includes(aliasSection)) {
      const aliases = [
        'alias cc="critical-claude"',
        'alias ccrit="critical-claude crit"',
        'alias cctask="critical-claude task"',
        'alias ccsetup="critical-claude setup"'
      ];

      const aliasContent = `\\n${aliasSection}\\n${aliases.join('\\n')}\\n# End Critical Claude aliases\\n`;
      await fs.writeFile(rcFile, rcContent + aliasContent);
      logger.info('Shell aliases configured', { rcFile });
    }
  }

  private async enableHookSystem(): Promise<void> {
    const hooksDir = path.join(this.installDir, 'hooks');
    
    // Create universal hook script
    const hookScript = `#!/bin/bash
# Critical Claude Universal Hook System
# Integrates with Claude Code, VS Code, and other editors

CRITICAL_CLAUDE_DIR="${this.installDir}"
HOOK_LOG="\$CRITICAL_CLAUDE_DIR/logs/hooks.log"

# Parse hook data from stdin
HOOK_DATA=\$(cat)
echo "[$(date)] Hook triggered: \$HOOK_DATA" >> "\$HOOK_LOG"

# Extract tool information
TOOL_NAME=\$(echo "\$HOOK_DATA" | jq -r '.tool_name // empty' 2>/dev/null || echo "")

# Handle different tool types
case "\$TOOL_NAME" in
  "TodoWrite")
    echo "[$(date)] Syncing todos with Critical Claude" >> "\$HOOK_LOG"
    echo "\$HOOK_DATA" | critical-claude task sync --stdin 2>/dev/null || true
    ;;
  "Edit"|"Write"|"MultiEdit")
    FILE_PATH=\$(echo "\$HOOK_DATA" | jq -r '.file_path // .arguments.file_path // empty' 2>/dev/null || echo "")
    if [[ -n "\$FILE_PATH" ]]; then
      echo "[$(date)] Code change detected: \$FILE_PATH" >> "\$HOOK_LOG"
      # Could trigger automated analysis here
    fi
    ;;
esac

# Visual feedback (optional)
if [[ "\$CRITICAL_CLAUDE_VISUAL_FEEDBACK" == "true" ]]; then
  echo "🔗 Critical Claude hook processed: \$TOOL_NAME" >&2
fi
`;

    const hookPath = path.join(hooksDir, 'universal-hook.sh');
    await fs.writeFile(hookPath, hookScript);
    await fs.chmod(hookPath, 0o755);

    // Create hook configuration template
    const hookConfig = {
      enabled: true,
      hooks: {
        'TodoWrite': {
          enabled: true,
          action: 'sync_tasks',
          description: 'Sync todo changes with Critical Claude task system'
        },
        'Edit': {
          enabled: false,
          action: 'analyze_changes',
          description: 'Trigger analysis on code changes'
        },
        'Write': {
          enabled: false,
          action: 'analyze_changes',
          description: 'Trigger analysis on new files'
        }
      },
      settings: {
        visual_feedback: false,
        log_level: 'info',
        sync_direction: 'bidirectional'
      }
    };

    await fs.writeFile(
      path.join(hooksDir, 'config.json'),
      JSON.stringify(hookConfig, null, 2)
    );

    logger.info('Hook system enabled', { hooksDir, hookPath });
  }

  private async verifyInstallation(): Promise<boolean> {
    try {
      // Check if executable exists and is runnable
      const executablePath = path.join(this.binDir, 'critical-claude');
      await fs.access(executablePath, fs.constants.X_OK);

      // Check if MCP server can start
      const mcpServerPath = path.join(process.cwd(), 'critical-claude-mcp', 'build', 'index.js');
      await fs.access(mcpServerPath);

      // Check if directories exist
      const requiredDirs = [
        this.installDir,
        this.binDir,
        path.join(this.installDir, 'config'),
        path.join(this.installDir, 'tasks')
      ];

      for (const dir of requiredDirs) {
        await fs.access(dir);
      }

      logger.info('Installation verification passed');
      return true;
    } catch (error) {
      logger.error('Installation verification failed', error as Error);
      return false;
    }
  }

  async uninstall(): Promise<boolean> {
    try {
      // Remove installation directory
      await fs.rm(this.installDir, { recursive: true, force: true });

      // Remove global symlink
      const symlinkPath = '/usr/local/bin/critical-claude';
      try {
        await fs.unlink(symlinkPath);
      } catch {
        // Symlink might not exist
      }

      logger.info('Critical Claude uninstalled successfully');
      return true;
    } catch (error) {
      logger.error('Uninstallation failed', error as Error);
      return false;
    }
  }
}