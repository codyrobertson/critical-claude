/**
 * Simplified Analytics Service
 * Consolidates AnalyticsService functionality into direct service methods
 */

import { 
  UsageMetric, 
  UsageStats, 
  CreateMetricData,
  createMetric,
  calculateStats,
  Result,
  createSuccessResult,
  createErrorResult
} from '../models/index.js';
import { FileStorage } from '../storage/index.js';
import { logger } from '../utils/Logger.js';

export class AnalyticsService {
  private readonly COLLECTION = 'metrics';

  constructor(private storage: FileStorage) {}

  // Core metrics operations
  async recordMetric(data: CreateMetricData): Promise<Result<UsageMetric>> {
    logger.debug('Recording metric', { command: data.command, success: data.success });
    
    try {
      const metric = createMetric(data);
      await this.storage.save(this.COLLECTION, metric.id, metric);
      
      return createSuccessResult(metric);
    } catch (error) {
      logger.silentError('Failed to record metric', error as Error);
      return createErrorResult(`Failed to record metric: ${error instanceof Error ? error.message : error}`);
    }
  }

  async getUsageStats(): Promise<UsageStats> {
    const startTime = Date.now();
    logger.operation('Getting usage stats');
    
    try {
      const metrics = await this.storage.findAll<UsageMetric>(this.COLLECTION);
      const stats = calculateStats(metrics);
      
      logger.performance('Usage stats calculation', startTime);
      logger.debug('Usage stats calculated', { totalMetrics: stats.totalMetrics });
      return stats;
    } catch (error) {
      logger.silentError('Failed to get usage stats', error as Error);
      // Return empty stats on error rather than failing
      return {
        totalMetrics: 0,
        recentCommands: 0,
        successRate: 0,
        topCommands: [],
        errorBreakdown: []
      };
    }
  }

  async exportMetrics(format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const metrics = await this.storage.findAll<UsageMetric>(this.COLLECTION);
      
      switch (format) {
        case 'json':
          return JSON.stringify(metrics, null, 2);
        case 'csv':
          return this.metricsToCSV(metrics);
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      throw new Error(`Failed to export metrics: ${error instanceof Error ? error.message : error}`);
    }
  }

  async clearAllMetrics(): Promise<Result<boolean>> {
    try {
      await this.storage.clear(this.COLLECTION);
      return createSuccessResult(true);
    } catch (error) {
      return createErrorResult(`Failed to clear metrics: ${error instanceof Error ? error.message : error}`);
    }
  }

  // Utility wrapper for tracking operations
  async withTracking<T>(
    command: string, 
    action: string | undefined, 
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    let success = false;
    let error: string | undefined;
    
    try {
      const result = await operation();
      success = true;
      return result;
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : String(err);
      throw err;
    } finally {
      const executionTime = Date.now() - startTime;
      
      // Record metric (but don't fail if recording fails)
      try {
        await this.recordMetric({
          command,
          action,
          success,
          executionTime,
          error
        });
      } catch (recordError) {
        // Silently ignore metric recording errors
        console.warn('Failed to record analytics metric:', recordError);
      }
    }
  }

  // Advanced analytics methods
  async getMetricsByCommand(command: string): Promise<UsageMetric[]> {
    try {
      const metrics = await this.storage.findAll<UsageMetric>(this.COLLECTION);
      return metrics.filter(m => m.command === command);
    } catch (error) {
      return [];
    }
  }

  async getMetricsByDateRange(startDate: Date, endDate: Date): Promise<UsageMetric[]> {
    try {
      const metrics = await this.storage.findAll<UsageMetric>(this.COLLECTION);
      return metrics.filter(m => 
        m.timestamp >= startDate && m.timestamp <= endDate
      );
    } catch (error) {
      return [];
    }
  }

  async getAverageExecutionTime(command?: string): Promise<number> {
    try {
      const metrics = await this.storage.findAll<UsageMetric>(this.COLLECTION);
      const filteredMetrics = command 
        ? metrics.filter(m => m.command === command)
        : metrics;
      
      if (filteredMetrics.length === 0) return 0;
      
      const totalTime = filteredMetrics.reduce((sum, m) => sum + m.executionTime, 0);
      return totalTime / filteredMetrics.length;
    } catch (error) {
      return 0;
    }
  }

  async getSuccessRate(command?: string): Promise<number> {
    try {
      const metrics = await this.storage.findAll<UsageMetric>(this.COLLECTION);
      const filteredMetrics = command 
        ? metrics.filter(m => m.command === command)
        : metrics;
      
      if (filteredMetrics.length === 0) return 0;
      
      const successfulMetrics = filteredMetrics.filter(m => m.success);
      return successfulMetrics.length / filteredMetrics.length;
    } catch (error) {
      return 0;
    }
  }

  async getErrorFrequency(): Promise<Array<{ error: string; count: number; percentage: number }>> {
    try {
      const metrics = await this.storage.findAll<UsageMetric>(this.COLLECTION);
      const errorMetrics = metrics.filter(m => !m.success && m.error);
      
      const errorCounts = new Map<string, number>();
      errorMetrics.forEach(metric => {
        const error = metric.error!;
        errorCounts.set(error, (errorCounts.get(error) || 0) + 1);
      });
      
      const totalErrors = errorMetrics.length;
      
      return Array.from(errorCounts.entries())
        .map(([error, count]) => ({
          error,
          count,
          percentage: totalErrors > 0 ? (count / totalErrors) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      return [];
    }
  }

  async getUsageTrends(days: number = 7): Promise<Array<{ date: string; count: number; successCount: number }>> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
      
      const metrics = await this.getMetricsByDateRange(startDate, endDate);
      
      const dailyStats = new Map<string, { count: number; successCount: number }>();
      
      // Initialize all days
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
        const dateKey = date.toISOString().split('T')[0];
        dailyStats.set(dateKey, { count: 0, successCount: 0 });
      }
      
      // Aggregate metrics by day
      metrics.forEach(metric => {
        const dateKey = metric.timestamp.toISOString().split('T')[0];
        const stats = dailyStats.get(dateKey);
        if (stats) {
          stats.count++;
          if (metric.success) {
            stats.successCount++;
          }
        }
      });
      
      return Array.from(dailyStats.entries())
        .map(([date, stats]) => ({
          date,
          count: stats.count,
          successCount: stats.successCount
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      return [];
    }
  }

  // System health monitoring
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    metrics: {
      errorRate: number;
      avgResponseTime: number;
      totalCommands: number;
      recentErrors: string[];
    };
    alerts: string[];
  }> {
    try {
      const stats = await this.getUsageStats();
      const avgResponseTime = await this.getAverageExecutionTime();
      const errorRate = 1 - stats.successRate;
      const recentErrors = stats.errorBreakdown.slice(0, 5).map(e => e.error);
      
      const alerts: string[] = [];
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      
      // Health checks
      if (errorRate > 0.5) {
        status = 'critical';
        alerts.push(`Critical: Error rate is ${(errorRate * 100).toFixed(1)}%`);
      } else if (errorRate > 0.2) {
        status = 'warning';
        alerts.push(`Warning: Error rate is ${(errorRate * 100).toFixed(1)}%`);
      }
      
      if (avgResponseTime > 5000) {
        status = status === 'critical' ? 'critical' : 'warning';
        alerts.push(`Warning: Average response time is ${avgResponseTime.toFixed(0)}ms`);
      }
      
      return {
        status,
        metrics: {
          errorRate,
          avgResponseTime,
          totalCommands: stats.totalMetrics,
          recentErrors
        },
        alerts
      };
    } catch (error) {
      return {
        status: 'critical',
        metrics: {
          errorRate: 1,
          avgResponseTime: 0,
          totalCommands: 0,
          recentErrors: ['Failed to get system health']
        },
        alerts: ['Critical: Unable to access analytics data']
      };
    }
  }

  // Helper method for CSV conversion
  private metricsToCSV(metrics: UsageMetric[]): string {
    const headers = ['id', 'command', 'action', 'success', 'executionTime', 'timestamp', 'error'];
    const rows = [headers.join(',')];
    
    metrics.forEach(metric => {
      const row = [
        metric.id,
        metric.command,
        metric.action || '',
        metric.success.toString(),
        metric.executionTime.toString(),
        metric.timestamp.toISOString(),
        metric.error ? `"${metric.error.replace(/"/g, '""')}"` : ''
      ];
      rows.push(row.join(','));
    });
    
    return rows.join('\n');
  }
}