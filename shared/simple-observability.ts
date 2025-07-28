/**
 * Ultra-Simple Observability
 * No Prometheus, No PID files, No complexity - Just works
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

interface SimpleMetric {
  timestamp: string;
  component: string;
  operation: string;
  status: 'success' | 'error' | 'warning';
  duration_ms?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

interface PerformanceSnapshot {
  memory_mb: number;
  uptime_seconds: number;
  operations_count: number;
  errors_count: number;
  avg_response_time_ms: number;
}

export class SimpleObservability {
  private metricsFile: string;
  private perfFile: string;
  private maxMetrics = 1000; // Keep only recent metrics
  private operationTimes: number[] = [];
  private operationCount = 0;
  private errorCount = 0;
  private startTime = Date.now();

  constructor(baseDir?: string) {
    const obsDir = path.join(baseDir || os.homedir(), '.critical-claude', 'observability');
    this.metricsFile = path.join(obsDir, 'metrics.jsonl'); // JSON Lines format
    this.perfFile = path.join(obsDir, 'performance.json');
    
    // Ensure directory exists
    this.ensureDirectory();
  }

  private async ensureDirectory(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.metricsFile), { recursive: true });
    } catch (error) {
      // Fail silently - observability should never break the app
    }
  }

  /**
   * Log a simple metric - fire and forget
   */
  async logMetric(component: string, operation: string, status: 'success' | 'error' | 'warning', metadata?: {
    duration_ms?: number;
    error?: string;
    [key: string]: unknown;
  }): Promise<void> {
    try {
      const metric: SimpleMetric = {
        timestamp: new Date().toISOString(),
        component,
        operation,
        status,
        duration_ms: metadata?.duration_ms,
        error: metadata?.error,
        metadata: metadata ? { ...metadata } : undefined
      };

      // Track performance stats
      this.operationCount++;
      if (status === 'error') this.errorCount++;
      if (metadata?.duration_ms) {
        this.operationTimes.push(metadata.duration_ms);
        // Keep only last 100 operation times for average calculation
        if (this.operationTimes.length > 100) {
          this.operationTimes = this.operationTimes.slice(-100);
        }
      }

      // Write metric as JSON line (one JSON object per line)
      const metricLine = JSON.stringify(metric) + '\n';
      await fs.appendFile(this.metricsFile, metricLine);

      // Rotate metrics file if it gets too big
      await this.rotateMetricsIfNeeded();

    } catch (error) {
      // Never throw - observability failures should be silent
    }
  }

  /**
   * Time an operation automatically
   */
  async timeOperation<T>(
    component: string, 
    operation: string, 
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const start = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - start;
      
      await this.logMetric(component, operation, 'success', { 
        duration_ms: duration,
        ...metadata 
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      await this.logMetric(component, operation, 'error', {
        duration_ms: duration,
        error: error instanceof Error ? error.message : String(error),
        ...metadata
      });
      
      throw error; // Re-throw the original error
    }
  }

  /**
   * Get current performance snapshot
   */
  getPerformanceSnapshot(): PerformanceSnapshot {
    const memoryUsage = process.memoryUsage();
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const avgResponseTime = this.operationTimes.length > 0 
      ? this.operationTimes.reduce((a, b) => a + b, 0) / this.operationTimes.length 
      : 0;

    return {
      memory_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      uptime_seconds: uptimeSeconds,
      operations_count: this.operationCount,
      errors_count: this.errorCount,
      avg_response_time_ms: Math.round(avgResponseTime)
    };
  }

  /**
   * Save performance snapshot to file
   */
  async savePerformanceSnapshot(): Promise<void> {
    try {
      const snapshot = this.getPerformanceSnapshot();
      await fs.writeFile(this.perfFile, JSON.stringify(snapshot, null, 2));
    } catch (error) {
      // Fail silently
    }
  }

  /**
   * Get recent metrics (last N entries)
   */
  async getRecentMetrics(count = 50): Promise<SimpleMetric[]> {
    try {
      const content = await fs.readFile(this.metricsFile, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      
      // Get last N lines
      const recentLines = lines.slice(-count);
      
      return recentLines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean) as SimpleMetric[];
      
    } catch (error) {
      return [];
    }
  }

  /**
   * Simple health check
   */
  getHealthStatus(): { status: 'healthy' | 'degraded' | 'unhealthy', details: Record<string, unknown> } {
    const perf = this.getPerformanceSnapshot();
    const errorRate = perf.operations_count > 0 ? perf.errors_count / perf.operations_count : 0;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (perf.memory_mb > 500) status = 'degraded'; // High memory usage
    if (perf.avg_response_time_ms > 5000) status = 'degraded'; // Slow responses
    if (errorRate > 0.1) status = 'degraded'; // More than 10% error rate
    if (errorRate > 0.5) status = 'unhealthy'; // More than 50% error rate
    if (perf.memory_mb > 1000) status = 'unhealthy'; // Very high memory
    
    return {
      status,
      details: {
        ...perf,
        error_rate: Math.round(errorRate * 100) / 100
      }
    };
  }

  private async rotateMetricsIfNeeded(): Promise<void> {
    try {
      const stats = await fs.stat(this.metricsFile);
      const fileSizeMB = stats.size / 1024 / 1024;
      
      // Rotate if file is larger than 10MB
      if (fileSizeMB > 10) {
        const backupFile = this.metricsFile.replace('.jsonl', `-${Date.now()}.jsonl`);
        await fs.rename(this.metricsFile, backupFile);
        
        // Keep only last 3 backup files
        const dir = path.dirname(this.metricsFile);
        const files = await fs.readdir(dir);
        const backupFiles = files
          .filter(f => f.startsWith('metrics-') && f.endsWith('.jsonl'))
          .sort()
          .reverse();
          
        // Remove old backups
        for (const file of backupFiles.slice(3)) {
          await fs.unlink(path.join(dir, file));
        }
      }
    } catch (error) {
      // Fail silently
    }
  }
}

// Global instance for easy access
export const obs = new SimpleObservability();

// Convenience functions
export const logMetric = obs.logMetric.bind(obs);
export const timeOperation = obs.timeOperation.bind(obs);
export const getHealthStatus = obs.getHealthStatus.bind(obs);
export const getPerformanceSnapshot = obs.getPerformanceSnapshot.bind(obs);

// Auto-save performance snapshot every 30 seconds
setInterval(() => {
  obs.savePerformanceSnapshot();
}, 30000);