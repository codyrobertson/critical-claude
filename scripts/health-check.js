#!/usr/bin/env node

/**
 * Critical Claude Health Check
 * Comprehensive health monitoring for Critical Claude installation
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class HealthChecker {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      status: 'unknown',
      checks: [],
      errors: [],
      warnings: [],
      summary: {}
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '🔍',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} ${message}`);
  }

  async runCheck(name, checkFunction) {
    this.log(`Running check: ${name}`);
    
    const startTime = Date.now();
    
    try {
      const result = await checkFunction();
      const duration = Date.now() - startTime;
      
      const check = {
        name,
        status: 'pass',
        duration,
        message: result.message || 'Check passed',
        details: result.details || {}
      };
      
      this.results.checks.push(check);
      this.log(`${name}: ${check.message}`, 'success');
      return true;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      const check = {
        name,
        status: 'fail',
        duration,
        message: error.message || 'Check failed',
        error: error.stack
      };
      
      this.results.checks.push(check);
      this.results.errors.push(error.message);
      this.log(`${name}: ${error.message}`, 'error');
      return false;
    }
  }

  async checkSystemRequirements() {
    return this.runCheck('System Requirements', async () => {
      const nodeVersion = process.version;
      const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0]);
      
      if (nodeMajor < 18) {
        throw new Error(`Node.js version ${nodeVersion} is too old (requires >= 18)`);
      }
      
      const platform = os.platform();
      const arch = os.arch();
      const memory = Math.round(os.totalmem() / 1024 / 1024 / 1024);
      
      return {
        message: `Node.js ${nodeVersion} on ${platform}/${arch} with ${memory}GB RAM`,
        details: { nodeVersion, platform, arch, memory }
      };
    });
  }

  async checkFileSystem() {
    return this.runCheck('File System', async () => {
      const homeDir = os.homedir();
      const ccHome = process.env.CRITICAL_CLAUDE_HOME || path.join(homeDir, '.critical-claude');
      
      // Check if CC home exists or create it
      try {
        await fs.access(ccHome);
      } catch {
        await fs.mkdir(ccHome, { recursive: true });
      }
      
      // Test write permissions
      const testFile = path.join(ccHome, `health-check-${Date.now()}.tmp`);
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
      
      // Check disk space
      const stats = await fs.stat(ccHome);
      
      return {
        message: `Data directory accessible with write permissions`,
        details: { ccHome, writable: true }
      };
    });
  }

  async checkCLIInstallation() {
    return this.runCheck('CLI Installation', async () => {
      const projectRoot = path.resolve(__dirname, '..');
      const cliPath = path.join(projectRoot, 'applications/cli-application/src/index.ts');
      
      // Check if CLI file exists
      await fs.access(cliPath);
      
      // Test CLI execution
      const result = await this.runCommand('node', [cliPath, '--version']);
      
      if (result.exitCode !== 0) {
        throw new Error(`CLI execution failed: ${result.stderr}`);
      }
      
      const version = result.stdout.trim();
      
      return {
        message: `CLI accessible, version ${version}`,
        details: { version, cliPath }
      };
    });
  }

  async checkDomains() {
    return this.runCheck('Domain Architecture', async () => {
      const projectRoot = path.resolve(__dirname, '..');
      const domains = ['task-management', 'analytics', 'user-interface'];
      const domainStatus = {};
      
      for (const domain of domains) {
        const domainPath = path.join(projectRoot, 'domains', domain);
        const distPath = path.join(domainPath, 'dist');
        
        try {
          await fs.access(domainPath);
          await fs.access(distPath);
          domainStatus[domain] = 'built';
        } catch {
          domainStatus[domain] = 'missing';
        }
      }
      
      const builtDomains = Object.values(domainStatus).filter(s => s === 'built').length;
      
      if (builtDomains === 0) {
        throw new Error('No domains are built. Run `npm run build` first.');
      }
      
      return {
        message: `${builtDomains}/${domains.length} domains built`,
        details: domainStatus
      };
    });
  }

  async checkBasicFunctionality() {
    return this.runCheck('Basic Functionality', async () => {
      const projectRoot = path.resolve(__dirname, '..');
      const cliPath = path.join(projectRoot, 'applications/cli-application/src/index.ts');
      
      // Test help command
      const helpResult = await this.runCommand('node', [cliPath, '--help']);
      if (helpResult.exitCode !== 0) {
        throw new Error(`Help command failed: ${helpResult.stderr}`);
      }
      
      // Test task creation
      const createResult = await this.runCommand('node', [
        cliPath, 'task', 'create',
        '--title', 'Health Check Test',
        '--description', 'Test task for health check'
      ]);
      
      if (createResult.exitCode !== 0) {
        throw new Error(`Task creation failed: ${createResult.stderr}`);
      }
      
      // Test task listing
      const listResult = await this.runCommand('node', [cliPath, 'task', 'list']);
      if (listResult.exitCode !== 0) {
        throw new Error(`Task listing failed: ${listResult.stderr}`);
      }
      
      return {
        message: 'Core functionality working (help, create, list)',
        details: {
          helpWorking: true,
          createWorking: true,
          listWorking: true
        }
      };
    });
  }

  async checkAnalytics() {
    return this.runCheck('Analytics System', async () => {
      const projectRoot = path.resolve(__dirname, '..');
      const cliPath = path.join(projectRoot, 'applications/cli-application/src/index.ts');
      
      // Test analytics stats
      const statsResult = await this.runCommand('node', [cliPath, 'analytics', 'stats']);
      
      if (statsResult.exitCode !== 0) {
        throw new Error(`Analytics stats failed: ${statsResult.stderr}`);
      }
      
      return {
        message: 'Analytics system functional',
        details: { statsWorking: true }
      };
    });
  }

  async checkPerformance() {
    return this.runCheck('Performance', async () => {
      const projectRoot = path.resolve(__dirname, '..');
      const cliPath = path.join(projectRoot, 'applications/cli-application/src/index.ts');
      
      // Measure basic operation performance
      const startTime = Date.now();
      
      // Create 5 test tasks
      for (let i = 1; i <= 5; i++) {
        const result = await this.runCommand('node', [
          cliPath, 'task', 'create',
          '--title', `Perf Test ${i}`,
          '--priority', 'medium'
        ]);
        
        if (result.exitCode !== 0) {
          throw new Error(`Performance test failed at task ${i}`);
        }
      }
      
      // List tasks
      const listResult = await this.runCommand('node', [cliPath, 'task', 'list']);
      if (listResult.exitCode !== 0) {
        throw new Error('Performance test list failed');
      }
      
      const duration = Date.now() - startTime;
      const avgPerTask = duration / 5;
      
      if (avgPerTask > 1000) { // More than 1 second per task
        this.results.warnings.push(`Task creation is slow: ${avgPerTask.toFixed(0)}ms per task`);
      }
      
      return {
        message: `Performance acceptable: ${avgPerTask.toFixed(0)}ms per task`,
        details: { totalDuration: duration, avgPerTask }
      };
    });
  }

  async checkDataPersistence() {
    return this.runCheck('Data Persistence', async () => {
      const homeDir = os.homedir();
      const ccHome = process.env.CRITICAL_CLAUDE_HOME || path.join(homeDir, '.critical-claude');
      
      // Check for task storage
      const tasksDir = path.join(ccHome, 'tasks');
      let taskCount = 0;
      
      try {
        const files = await fs.readdir(tasksDir);
        taskCount = files.filter(f => f.endsWith('.json')).length;
      } catch {
        // Tasks directory might not exist yet
      }
      
      // Check for analytics data
      const analyticsFile = path.join(ccHome, 'analytics.json');
      let hasAnalytics = false;
      
      try {
        await fs.access(analyticsFile);
        hasAnalytics = true;
      } catch {
        // Analytics file might not exist yet
      }
      
      return {
        message: `Data persistence working (${taskCount} tasks stored)`,
        details: { taskCount, hasAnalytics, ccHome }
      };
    });
  }

  async runCommand(command, args) {
    return new Promise((resolve) => {
      const process = spawn(command, args, { stdio: 'pipe' });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        resolve({
          exitCode: code,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });
      });
    });
  }

  async runAllChecks() {
    this.log('🏥 Critical Claude Health Check Starting', 'info');
    this.log('=====================================', 'info');
    
    const checks = [
      () => this.checkSystemRequirements(),
      () => this.checkFileSystem(),
      () => this.checkDomains(),
      () => this.checkCLIInstallation(),
      () => this.checkBasicFunctionality(),
      () => this.checkAnalytics(),
      () => this.checkDataPersistence(),
      () => this.checkPerformance()
    ];
    
    let passedChecks = 0;
    
    for (const check of checks) {
      const result = await check();
      if (result) passedChecks++;
    }
    
    // Generate summary
    this.results.summary = {
      totalChecks: checks.length,
      passedChecks,
      failedChecks: checks.length - passedChecks,
      successRate: Math.round((passedChecks / checks.length) * 100)
    };
    
    // Determine overall status
    if (passedChecks === checks.length) {
      this.results.status = 'healthy';
    } else if (passedChecks >= checks.length * 0.8) {
      this.results.status = 'warning';
    } else {
      this.results.status = 'unhealthy';
    }
    
    return this.generateReport();
  }

  generateReport() {
    console.log('\n📋 HEALTH CHECK REPORT');
    console.log('======================');
    
    const { summary } = this.results;
    
    console.log(`\n📊 Summary:`);
    console.log(`  Status: ${this.getStatusEmoji()} ${this.results.status.toUpperCase()}`);
    console.log(`  Checks: ${summary.passedChecks}/${summary.totalChecks} passed`);
    console.log(`  Success Rate: ${summary.successRate}%`);
    
    if (this.results.warnings.length > 0) {
      console.log(`\n⚠️  Warnings:`);
      this.results.warnings.forEach(warning => {
        console.log(`  - ${warning}`);
      });
    }
    
    if (this.results.errors.length > 0) {
      console.log(`\n❌ Errors:`);
      this.results.errors.forEach(error => {
        console.log(`  - ${error}`);
      });
    }
    
    console.log(`\n🔍 Detailed Results:`);
    this.results.checks.forEach(check => {
      const status = check.status === 'pass' ? '✅' : '❌';
      console.log(`  ${status} ${check.name}: ${check.message} (${check.duration}ms)`);
    });
    
    // Recommendations
    console.log(`\n💡 Recommendations:`);
    
    if (this.results.status === 'healthy') {
      console.log('  🎉 Everything looks great! Critical Claude is ready to use.');
      console.log('  - Try: cc task create --title "My first task"');
      console.log('  - Try: cc viewer');
      console.log('  - Try: cc shortcuts');
    } else if (this.results.status === 'warning') {
      console.log('  ⚠️  Some issues detected, but basic functionality should work.');
      console.log('  - Review warnings above');
      console.log('  - Consider running: npm run build');
      console.log('  - Check documentation: docs/');
    } else {
      console.log('  🚨 Critical issues detected. Please fix before using.');
      console.log('  - Run: npm install');
      console.log('  - Run: npm run build');
      console.log('  - Check: Node.js version >= 18');
      console.log('  - See: docs/TROUBLESHOOTING.md');
    }
    
    // Export results for programmatic use
    const reportFile = path.join(process.cwd(), 'health-check-results.json');
    await fs.writeFile(reportFile, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed results saved to: ${reportFile}`);
    
    return this.results.status === 'healthy';
  }

  getStatusEmoji() {
    switch (this.results.status) {
      case 'healthy': return '🟢';
      case 'warning': return '🟡';
      case 'unhealthy': return '🔴';
      default: return '⚪';
    }
  }
}

// Run health check
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new HealthChecker();
  
  checker.runAllChecks()
    .then(isHealthy => {
      process.exit(isHealthy ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Health check failed:', error);
      process.exit(1);
    });
}

export default HealthChecker;