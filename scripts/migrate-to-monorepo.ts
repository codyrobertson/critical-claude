#!/usr/bin/env node

/**
 * Critical Claude Migration Script
 * Migrates from monolithic MCP server to microservices architecture
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

interface MigrationConfig {
  sourceDir: string;
  targetDir: string;
  backupDir: string;
  claudeConfigPath: string;
}

interface ClaudeConfig {
  mcpServers: Record<string, {
    command: string;
    args: string[];
    cwd?: string;
  }>;
  [key: string]: any;
}

class CriticalClaudeMigrator {
  private config: MigrationConfig;

  constructor(config: MigrationConfig) {
    this.config = config;
  }

  /**
   * Run the complete migration process
   */
  async migrate(): Promise<void> {
    console.log('🚀 Starting Critical Claude migration to monorepo...');

    try {
      await this.validateEnvironment();
      await this.createBackup();
      await this.buildPackages();
      await this.updateClaudeConfig();
      await this.verifyMigration();
      
      console.log('✅ Migration completed successfully!');
      console.log('\\n📋 Next Steps:');
      console.log('1. Restart Claude Desktop');
      console.log('2. Test the new microservices');
      console.log('3. Remove the old monolithic server if everything works');
    } catch (error) {
      console.error('❌ Migration failed:', (error as Error).message);
      console.log('\\n🔄 To rollback, run: npm run rollback');
      process.exit(1);
    }
  }

  /**
   * Validate the environment before migration
   */
  private async validateEnvironment(): Promise<void> {
    console.log('🔍 Validating environment...');

    // Check if source directory exists
    try {
      await fs.access(this.config.sourceDir);
    } catch {
      throw new Error(`Source directory not found: ${this.config.sourceDir}`);
    }

    // Check if Claude config exists
    try {
      await fs.access(this.config.claudeConfigPath);
    } catch {
      throw new Error(`Claude config not found: ${this.config.claudeConfigPath}`);
    }

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 18) {
      throw new Error(`Node.js 18+ required, found: ${nodeVersion}`);
    }

    console.log('✅ Environment validation passed');
  }

  /**
   * Create backup of current configuration
   */
  private async createBackup(): Promise<void> {
    console.log('💾 Creating backup...');

    await fs.mkdir(this.config.backupDir, { recursive: true });

    // Backup Claude config
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupConfigPath = path.join(this.config.backupDir, `claude-settings-${timestamp}.json`);
    
    try {
      await fs.copyFile(this.config.claudeConfigPath, backupConfigPath);
      console.log(`✅ Claude config backed up to: ${backupConfigPath}`);
    } catch (error) {
      console.warn(`⚠️ Could not backup Claude config: ${(error as Error).message}`);
    }
  }

  /**
   * Build all packages in the monorepo
   */
  private async buildPackages(): Promise<void> {
    console.log('🔨 Building packages...');

    const packages = [
      'core',
      'code-critique',
      'project-management',
      'prompt-management',
      'web-search'
    ];

    // Install dependencies
    console.log('📦 Installing dependencies...');
    execSync('npm install', { cwd: this.config.targetDir, stdio: 'inherit' });

    // Build all packages
    console.log('🔨 Building all packages...');
    execSync('npm run build', { cwd: this.config.targetDir, stdio: 'inherit' });

    // Verify builds
    for (const pkg of packages) {
      const distPath = path.join(this.config.targetDir, 'packages', pkg, 'dist');
      try {
        await fs.access(distPath);
        console.log(`✅ ${pkg} built successfully`);
      } catch {
        throw new Error(`Build failed for package: ${pkg}`);
      }
    }
  }

  /**
   * Update Claude Desktop configuration
   */
  private async updateClaudeConfig(): Promise<void> {
    console.log('⚙️ Updating Claude Desktop configuration...');

    try {
      const configContent = await fs.readFile(this.config.claudeConfigPath, 'utf8');
      const config: ClaudeConfig = JSON.parse(configContent);

      // Remove old monolithic server configurations
      const oldKeys = ['brutal-critique', 'critical-claude'];
      for (const key of oldKeys) {
        if (config.mcpServers[key]) {
          delete config.mcpServers[key];
          console.log(`🗑️ Removed old server config: ${key}`);
        }
      }

      // Add new microservice configurations
      const newServers = {
        'critical-claude-code-critique': {
          command: 'node',
          args: [path.join(this.config.targetDir, 'packages/code-critique/dist/server.js')],
          cwd: path.join(this.config.targetDir, 'packages/code-critique')
        },
        'critical-claude-project-management': {
          command: 'node',
          args: [path.join(this.config.targetDir, 'packages/project-management/dist/server.js')],
          cwd: path.join(this.config.targetDir, 'packages/project-management')
        },
        'critical-claude-prompt-management': {
          command: 'node',
          args: [path.join(this.config.targetDir, 'packages/prompt-management/dist/server.js')],
          cwd: path.join(this.config.targetDir, 'packages/prompt-management')
        },
        'critical-claude-web-search': {
          command: 'node',
          args: [path.join(this.config.targetDir, 'packages/web-search/dist/server.js')],
          cwd: path.join(this.config.targetDir, 'packages/web-search')
        }
      };

      // Add new servers to config
      Object.assign(config.mcpServers, newServers);

      // Write updated config
      await fs.writeFile(
        this.config.claudeConfigPath,
        JSON.stringify(config, null, 2)
      );

      console.log('✅ Claude Desktop configuration updated');
      console.log('\\n📋 New MCP servers configured:');
      Object.keys(newServers).forEach(name => {
        console.log(`  - ${name}`);
      });
    } catch (error) {
      throw new Error(`Failed to update Claude config: ${(error as Error).message}`);
    }
  }

  /**
   * Verify migration by testing server startup
   */
  private async verifyMigration(): Promise<void> {
    console.log('🧪 Verifying migration...');

    const services = [
      'code-critique',
      'project-management', 
      'prompt-management',
      'web-search'
    ];

    for (const service of services) {
      try {
        const serverPath = path.join(this.config.targetDir, 'packages', service, 'dist/server.js');
        
        // Test that the server can be imported (basic syntax check)
        execSync(`node -e "require('${serverPath}')"`, { 
          stdio: 'pipe',
          timeout: 5000 
        });
        
        console.log(`✅ ${service} service verified`);
      } catch (error) {
        console.warn(`⚠️ ${service} service verification failed: ${(error as Error).message}`);
      }
    }
  }

  /**
   * Rollback migration by restoring backup
   */
  async rollback(): Promise<void> {
    console.log('🔄 Rolling back migration...');

    try {
      // Find the most recent backup
      const backupFiles = await fs.readdir(this.config.backupDir);
      const configBackups = backupFiles
        .filter(f => f.startsWith('claude-settings-'))
        .sort()
        .reverse();

      if (configBackups.length === 0) {
        throw new Error('No backup files found');
      }

      const latestBackup = path.join(this.config.backupDir, configBackups[0]);
      await fs.copyFile(latestBackup, this.config.claudeConfigPath);

      console.log(`✅ Rollback completed. Restored from: ${latestBackup}`);
      console.log('Please restart Claude Desktop');
    } catch (error) {
      console.error('❌ Rollback failed:', (error as Error).message);
      console.log('You may need to manually restore your Claude configuration');
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'migrate';

  const config: MigrationConfig = {
    sourceDir: path.resolve(__dirname, '../critical-claude-mcp'),
    targetDir: path.resolve(__dirname, '..'),
    backupDir: path.resolve(__dirname, '../.migration-backup'),
    claudeConfigPath: path.resolve(process.env.HOME || '~', '.claude/settings.json')
  };

  const migrator = new CriticalClaudeMigrator(config);

  switch (command) {
    case 'migrate':
      await migrator.migrate();
      break;
    
    case 'rollback':
      await migrator.rollback();
      break;
    
    default:
      console.log('Usage: npm run migrate [migrate|rollback]');
      process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}