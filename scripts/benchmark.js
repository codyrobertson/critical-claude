#!/usr/bin/env node

/**
 * Performance Benchmark Script
 * Measures Critical Claude CLI performance across various operations
 */

const { spawn } = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');

class BenchmarkRunner {
  constructor() {
    this.testDir = path.join(os.tmpdir(), `cc-benchmark-${Date.now()}`);
    this.results = [];
  }

  async setup() {
    await fs.mkdir(this.testDir, { recursive: true });
    process.env.CRITICAL_CLAUDE_HOME = this.testDir;
    console.log('🏁 Starting Critical Claude Performance Benchmarks');
    console.log(`Test directory: ${this.testDir}`);
  }

  async cleanup() {
    try {
      await fs.rm(this.testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  async runCommand(args, description) {
    const startTime = process.hrtime.bigint();
    
    return new Promise((resolve) => {
      const cli = spawn('node', ['applications/cli-application/src/index.ts', ...args], {
        stdio: 'pipe',
        env: { ...process.env, CRITICAL_CLAUDE_HOME: this.testDir }
      });

      let stdout = '';
      let stderr = '';

      cli.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      cli.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      cli.on('close', (code) => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

        const result = {
          description,
          command: args.join(' '),
          duration,
          success: code === 0,
          stdout: stdout.length,
          stderr: stderr.length
        };

        this.results.push(result);
        console.log(`✅ ${description}: ${duration.toFixed(2)}ms`);
        resolve(result);
      });
    });
  }

  async benchmark() {
    await this.setup();

    try {
      // Single task operations
      await this.runCommand(['task', 'create', '--title', 'Benchmark Task 1'], 'Create Single Task');
      await this.runCommand(['task', 'list'], 'List Single Task');
      
      // Batch task creation
      console.log('\n📊 Batch Operations');
      const batchStart = process.hrtime.bigint();
      
      for (let i = 2; i <= 100; i++) {
        await this.runCommand(['task', 'create', '--title', `Benchmark Task ${i}`, '--priority', 'medium'], `Create Task ${i}`);
      }
      
      const batchEnd = process.hrtime.bigint();
      const batchDuration = Number(batchEnd - batchStart) / 1000000;
      
      console.log(`\n📈 Created 99 tasks in ${batchDuration.toFixed(2)}ms (${(batchDuration/99).toFixed(2)}ms per task)`);

      // List operations with increasing load
      await this.runCommand(['task', 'list'], 'List 100 Tasks');
      await this.runCommand(['task', 'list', '--status', 'todo'], 'Filter by Status');
      await this.runCommand(['task', 'list', '--priority', 'medium'], 'Filter by Priority');

      // Export operations
      console.log('\n💾 Export/Import Operations');
      await this.runCommand(['task', 'export', '--format', 'json'], 'Export JSON');
      await this.runCommand(['task', 'export', '--format', 'csv'], 'Export CSV');
      await this.runCommand(['task', 'backup'], 'Create Backup');

      // Analytics operations
      console.log('\n📊 Analytics Operations');
      await this.runCommand(['analytics', 'stats'], 'Analytics Stats');
      await this.runCommand(['analytics', 'export', '--format', 'json'], 'Export Analytics');

      // Memory-intensive operations
      console.log('\n🧠 Memory-Intensive Operations');
      for (let i = 101; i <= 500; i++) {
        await this.runCommand(['task', 'create', '--title', `Large Dataset Task ${i}`], `Create Task ${i}`);
      }
      
      await this.runCommand(['task', 'list'], 'List 500 Tasks');
      await this.runCommand(['task', 'export', '--format', 'json'], 'Export 500 Tasks');

      // Generate report
      this.generateReport();

    } finally {
      await this.cleanup();
    }
  }

  generateReport() {
    console.log('\n📋 PERFORMANCE REPORT');
    console.log('======================');

    // Group results by operation type
    const groups = {
      'Task Operations': this.results.filter(r => r.command.startsWith('task')),
      'Analytics': this.results.filter(r => r.command.startsWith('analytics')),
      'Export/Import': this.results.filter(r => r.command.includes('export') || r.command.includes('backup'))
    };

    for (const [groupName, operations] of Object.entries(groups)) {
      if (operations.length === 0) continue;

      console.log(`\n${groupName}:`);
      console.log('-'.repeat(groupName.length + 1));

      const avgDuration = operations.reduce((sum, op) => sum + op.duration, 0) / operations.length;
      const maxDuration = Math.max(...operations.map(op => op.duration));
      const minDuration = Math.min(...operations.map(op => op.duration));

      console.log(`  Average: ${avgDuration.toFixed(2)}ms`);
      console.log(`  Min: ${minDuration.toFixed(2)}ms`);
      console.log(`  Max: ${maxDuration.toFixed(2)}ms`);
      console.log(`  Operations: ${operations.length}`);

      // Show slowest operations
      const slowest = operations
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 3);

      console.log('\n  Slowest operations:');
      slowest.forEach((op, i) => {
        console.log(`    ${i + 1}. ${op.description}: ${op.duration.toFixed(2)}ms`);
      });
    }

    // Overall statistics
    console.log('\n📊 OVERALL STATISTICS');
    console.log('======================');
    
    const totalOps = this.results.length;
    const successfulOps = this.results.filter(r => r.success).length;
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / totalOps;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`Total Operations: ${totalOps}`);
    console.log(`Successful: ${successfulOps} (${((successfulOps / totalOps) * 100).toFixed(1)}%)`);
    console.log(`Average Duration: ${avgDuration.toFixed(2)}ms`);
    console.log(`Total Time: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`Throughput: ${(totalOps / (totalDuration / 1000)).toFixed(2)} ops/sec`);

    // Performance thresholds
    console.log('\n⚡ PERFORMANCE ANALYSIS');
    console.log('=======================');

    const fastOps = this.results.filter(r => r.duration < 100).length;
    const mediumOps = this.results.filter(r => r.duration >= 100 && r.duration < 500).length;
    const slowOps = this.results.filter(r => r.duration >= 500).length;

    console.log(`Fast (< 100ms): ${fastOps} (${((fastOps / totalOps) * 100).toFixed(1)}%)`);
    console.log(`Medium (100-500ms): ${mediumOps} (${((mediumOps / totalOps) * 100).toFixed(1)}%)`);
    console.log(`Slow (> 500ms): ${slowOps} (${((slowOps / totalOps) * 100).toFixed(1)}%)`);

    if (slowOps > totalOps * 0.1) {
      console.log('\n⚠️  Warning: More than 10% of operations are slow (>500ms)');
    }

    if (avgDuration > 200) {
      console.log('⚠️  Warning: Average operation time is high (>200ms)');
    }

    // Export results for CI
    const benchmarkResults = {
      timestamp: new Date().toISOString(),
      summary: {
        totalOperations: totalOps,
        successRate: successfulOps / totalOps,
        averageDuration: avgDuration,
        totalDuration: totalDuration / 1000,
        throughput: totalOps / (totalDuration / 1000)
      },
      operations: this.results,
      thresholds: {
        fast: fastOps,
        medium: mediumOps,
        slow: slowOps
      }
    };

    // Write results to file for CI consumption
    require('fs').writeFileSync('benchmark-results.json', JSON.stringify(benchmarkResults, null, 2));
    console.log('\n📄 Results saved to benchmark-results.json');
  }
}

// Run benchmarks
const runner = new BenchmarkRunner();
runner.benchmark().catch(error => {
  console.error('❌ Benchmark failed:', error);
  process.exit(1);
});