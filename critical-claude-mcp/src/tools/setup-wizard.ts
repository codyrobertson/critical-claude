/**
 * Setup Wizard for Critical Claude + Claude Desktop Integration
 * Automates the complete setup process for seamless integration
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { logger } from '../logger.js';

export interface SetupOptions {
  installationType: 'basic' | 'advanced' | 'development';
  claudeDesktopConfigPath?: string;
  projectPath: string;
  enableHooks: boolean;
  setupAliases: boolean;
}

export interface SetupResult {
  success: boolean;
  claudeConfigUpdated: boolean;
  claudeConfigPath?: string;
  aliasesSetup: boolean;
  aliases?: Array<{ command: string; target: string }>;
  hooksEnabled: boolean;
  projectConfigured: boolean;
  errors?: string[];
}

export class SetupWizard {
  private config: any;

  constructor(config: any = {}) {
    this.config = config;
  }

  async run(options: SetupOptions): Promise<SetupResult> {
    const errors: string[] = [];
    const result: SetupResult = {
      success: false,
      claudeConfigUpdated: false,
      aliasesSetup: false,
      hooksEnabled: false,
      projectConfigured: false,
      errors
    };

    try {
      logger.info('Starting Critical Claude setup wizard', options);

      // Step 1: Detect Claude Desktop configuration
      const claudeConfigPath = await this.detectClaudeDesktopConfig(options.claudeDesktopConfigPath);
      if (!claudeConfigPath) {
        errors.push('Claude Desktop configuration not found. Please install Claude Desktop first.');
      } else {
        result.claudeConfigPath = claudeConfigPath;
      }

      // Step 2: Update Claude Desktop configuration
      if (claudeConfigPath) {
        try {
          await this.updateClaudeDesktopConfig(claudeConfigPath, options);
          result.claudeConfigUpdated = true;
          logger.info('Updated Claude Desktop configuration', { path: claudeConfigPath });
        } catch (error) {
          errors.push(`Failed to update Claude Desktop config: ${(error as Error).message}`);
        }
      }

      // Step 3: Set up global aliases if requested
      if (options.setupAliases) {
        try {
          const aliases = await this.setupGlobalAliases();
          result.aliasesSetup = true;
          result.aliases = aliases;
          logger.info('Set up global aliases', { count: aliases.length });
        } catch (error) {
          errors.push(`Failed to set up aliases: ${(error as Error).message}`);
        }
      }

      // Step 4: Configure project-specific settings
      try {
        await this.configureProject(options.projectPath, options);
        result.projectConfigured = true;
        logger.info('Configured project settings', { path: options.projectPath });
      } catch (error) {
        errors.push(`Failed to configure project: ${(error as Error).message}`);
      }

      // Step 5: Set up hooks if requested (experimental)
      if (options.enableHooks) {
        try {
          await this.setupHooks(options.projectPath);
          result.hooksEnabled = true;
          logger.info('Enabled Claude Code hooks (experimental)');
        } catch (error) {
          errors.push(`Failed to set up hooks: ${(error as Error).message}`);
        }
      }

      result.success = errors.length === 0;
      logger.info('Setup wizard completed', { success: result.success, errors: errors.length });

      return result;
    } catch (error) {
      logger.error('Setup wizard failed', error as Error);
      errors.push(`Setup failed: ${(error as Error).message}`);
      result.errors = errors;
      return result;
    }
  }

  private async detectClaudeDesktopConfig(providedPath?: string): Promise<string | null> {
    if (providedPath) {
      try {
        await fs.access(providedPath);
        return providedPath;
      } catch {
        logger.warn('Provided Claude Desktop config path not found', { path: providedPath });
      }
    }

    // Auto-detect based on platform
    const platform = os.platform();
    const homeDir = os.homedir();
    
    const possiblePaths = [
      // macOS
      path.join(homeDir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
      // Windows
      path.join(homeDir, 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json'),
      // Linux
      path.join(homeDir, '.config', 'Claude', 'claude_desktop_config.json'),
      // Alternative locations
      path.join(homeDir, '.claude', 'claude_desktop_config.json'),
      path.join(homeDir, '.claude', 'config.json')
    ];

    for (const configPath of possiblePaths) {
      try {
        await fs.access(configPath);
        logger.info('Found Claude Desktop config', { path: configPath });
        return configPath;
      } catch {
        // Continue to next path
      }
    }

    logger.warn('Claude Desktop configuration not found in standard locations');
    return null;
  }

  private async updateClaudeDesktopConfig(configPath: string, options: SetupOptions): Promise<void> {
    try {
      // Read existing config
      let config: any = {};
      try {
        const content = await fs.readFile(configPath, 'utf8');
        config = JSON.parse(content);
      } catch {
        // File doesn't exist or is invalid, start with empty config
      }

      // Initialize mcpServers if it doesn't exist
      if (!config.mcpServers) {
        config.mcpServers = {};
      }

      // Determine the MCP server command based on installation type
      const serverConfig = this.generateMcpServerConfig(options);
      config.mcpServers['critical-claude'] = serverConfig;

      // Write updated config
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
      logger.info('Updated Claude Desktop configuration', { configPath });
    } catch (error) {
      logger.error('Failed to update Claude Desktop config', error as Error);
      throw error;
    }
  }

  private generateMcpServerConfig(options: SetupOptions): any {
    const baseConfig = {
      env: {
        CRITICAL_CLAUDE_PROJECT_PATH: options.projectPath,
        CRITICAL_CLAUDE_LOG_LEVEL: 'info'
      }
    };

    switch (options.installationType) {
      case 'development':
        return {
          ...baseConfig,
          command: 'node',
          args: [path.join(process.cwd(), 'critical-claude-mcp', 'build', 'index.js')],
          env: {
            ...baseConfig.env,
            CRITICAL_CLAUDE_LOG_LEVEL: 'debug',
            CRITICAL_CLAUDE_DEV_MODE: 'true'
          }
        };

      case 'advanced':
        return {
          ...baseConfig,
          command: 'npx',
          args: ['critical-claude-mcp'],
          env: {
            ...baseConfig.env,
            CRITICAL_CLAUDE_ADVANCED_FEATURES: 'true'
          }
        };

      case 'basic':
      default:
        return {
          ...baseConfig,
          command: 'npx',
          args: ['critical-claude-mcp']
        };
    }
  }

  private async setupGlobalAliases(): Promise<Array<{ command: string; target: string }>> {
    const aliases = [
      { command: 'cc', target: 'critical-claude', description: 'Main Critical Claude command' },
      { command: 'ccrit', target: 'critical-claude crit', description: 'Code critique commands' },
      { command: 'cctask', target: 'critical-claude task', description: 'Task management commands' },
      { command: 'ccplan', target: 'critical-claude plan', description: 'Project planning commands' }
    ];

    try {
      // Detect shell
      const shell = process.env.SHELL || 'bash';
      const shellName = path.basename(shell);
      
      let rcFile: string;
      switch (shellName) {
        case 'zsh':
          rcFile = path.join(os.homedir(), '.zshrc');
          break;
        case 'fish':
          rcFile = path.join(os.homedir(), '.config', 'fish', 'config.fish');
          break;
        default:
          rcFile = path.join(os.homedir(), '.bashrc');
      }

      // Read existing RC file
      let rcContent = '';
      try {
        rcContent = await fs.readFile(rcFile, 'utf8');
      } catch {
        // File doesn't exist, will be created
      }

      // Check if aliases already exist
      const aliasSection = '# Critical Claude aliases';
      if (rcContent.includes(aliasSection)) {
        logger.info('Aliases already configured');
        return aliases;
      }

      // Add aliases to RC file
      let aliasContent = `\n${aliasSection}\n`;
      for (const alias of aliases) {
        if (shellName === 'fish') {
          aliasContent += `alias ${alias.command} '${alias.target}'\n`;
        } else {
          aliasContent += `alias ${alias.command}='${alias.target}'\n`;
        }
      }
      aliasContent += '# End Critical Claude aliases\n';

      // Write updated RC file
      await fs.writeFile(rcFile, rcContent + aliasContent);
      logger.info('Added aliases to shell configuration', { rcFile, shellName });

      return aliases;
    } catch (error) {
      logger.error('Failed to set up global aliases', error as Error);
      throw error;
    }
  }

  private async configureProject(projectPath: string, options: SetupOptions): Promise<void> {
    const configDir = path.join(projectPath, '.critical-claude');
    
    try {
      // Create config directory
      await fs.mkdir(configDir, { recursive: true });

      // Create project configuration
      const projectConfig = {
        version: '1.0.0',
        project: {
          name: path.basename(projectPath),
          type: 'auto-detected',
          language: 'auto-detected'
        },
        claude: {
          mcp_enabled: true,
          hooks_enabled: options.enableHooks,
          hooks_canary: options.enableHooks,
          visual_formatting: true,
          sync_mode: 'bidirectional'
        },
        analysis: {
          security_focus: true,
          performance_monitoring: true,
          architecture_review: true,
          code_quality_threshold: 'medium'
        },
        setup: {
          installation_type: options.installationType,
          setup_date: new Date().toISOString()
        }
      };

      await fs.writeFile(
        path.join(configDir, 'config.json'),
        JSON.stringify(projectConfig, null, 2)
      );

      // Create CLAUDE.md if it doesn't exist
      const claudeMdPath = path.join(projectPath, '.claude', 'CLAUDE.md');
      try {
        await fs.access(claudeMdPath);
      } catch {
        // Create .claude directory and CLAUDE.md
        await fs.mkdir(path.dirname(claudeMdPath), { recursive: true });
        await fs.writeFile(claudeMdPath, this.generateClaudeMd(path.basename(projectPath)));
      }

      logger.info('Created project configuration', { configDir });
    } catch (error) {
      logger.error('Failed to configure project', error as Error);
      throw error;
    }
  }

  private async setupHooks(projectPath: string): Promise<void> {
    // This is experimental - set up Claude Code hook integration
    try {
      const hooksDir = path.join(projectPath, '.claude', 'hooks');
      await fs.mkdir(hooksDir, { recursive: true });

      const hookScript = `#!/bin/bash
# Critical Claude Hook Integration (Experimental)
# This hook syncs Claude Code todos with Critical Claude task system

HOOK_DATA=$(cat)
TOOL_NAME=$(echo "$HOOK_DATA" | jq -r '.tool_name // empty')

if [ "$TOOL_NAME" = "TodoWrite" ]; then
    echo "Critical Claude task sync triggered" >> ~/.critical-claude/hook-debug.log
    echo "$HOOK_DATA" | npx critical-claude sync claude-code --stdin
fi
`;

      await fs.writeFile(path.join(hooksDir, 'critical-claude-sync.sh'), hookScript);
      await fs.chmod(path.join(hooksDir, 'critical-claude-sync.sh'), 0o755);

      logger.info('Set up Claude Code hooks (experimental)', { hooksDir });
    } catch (error) {
      logger.error('Failed to set up hooks', error as Error);
      throw error;
    }
  }

  private generateClaudeMd(projectName: string): string {
    return `# Critical Claude Project Configuration

## Project Context
- **Name**: ${projectName}
- **Type**: [Update with your project type: web-app, api, library, etc.]
- **Critical Paths**: [Update with your critical code paths]
- **Security Requirements**: [Update with your security standards]
- **Performance Targets**: [Update with your performance requirements]

## Project-Specific Standards

### Security Focus Areas
- Authentication/authorization patterns
- Input validation requirements
- Data encryption standards
- API security requirements

### Performance Requirements
- Response time targets: < 200ms for API calls
- Memory usage limits: [Define your limits]
- Database query performance: < 100ms
- Concurrent user capacity: [Define your targets]

### Architecture Patterns
- Preferred design patterns: [List your patterns]
- Dependency injection requirements
- Error handling standards
- Logging and monitoring requirements

## Critical Claude Integration

### Available MCP Tools
- \`cc_crit_code\` - Critical code review and analysis
- \`cc_crit_arch\` - Architecture review and recommendations
- \`cc_task_manage\` - Task management and tracking
- \`cc_project_setup\` - Project initialization and configuration

### Custom Commands
Project-specific critique commands can be added here.

---

*This configuration enables Critical Claude's AI-powered code analysis directly within Claude conversations.*
`;
  }
}