/**
 * Analytics Repository
 * Local storage for anonymous usage metrics
 */

import { UsageMetric, UsageMetricData } from '../domain/entities/UsageMetric.js';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';

export class AnalyticsRepository {
  private readonly analyticsPath: string;
  private readonly maxMetrics = 1000; // Keep only recent metrics

  constructor(basePath?: string) {
    const storagePath = basePath || path.join(os.homedir(), '.critical-claude');
    this.analyticsPath = path.join(storagePath, 'analytics.json');
  }

  async recordMetric(metric: UsageMetric): Promise<void> {
    try {
      const metrics = await this.loadMetrics();
      metrics.push(metric);

      // Keep only recent metrics to prevent unbounded growth
      if (metrics.length > this.maxMetrics) {
        metrics.splice(0, metrics.length - this.maxMetrics);
      }

      await this.saveMetrics(metrics);
    } catch (error) {
      // Fail silently - analytics should never break the app
      console.debug('Failed to record analytics:', error);
    }
  }

  async getMetrics(startDate?: Date, endDate?: Date): Promise<UsageMetric[]> {
    try {
      const metrics = await this.loadMetrics();
      
      if (!startDate && !endDate) {
        return metrics;
      }

      return metrics.filter(metric => {
        const metricDate = metric.timestamp;
        const afterStart = !startDate || metricDate >= startDate;
        const beforeEnd = !endDate || metricDate <= endDate;
        return afterStart && beforeEnd;
      });
    } catch (error) {
      return [];
    }
  }

  async getUsageStats(): Promise<UsageStats> {
    try {
      const metrics = await this.loadMetrics();
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const recentMetrics = metrics.filter(m => m.timestamp >= sevenDaysAgo);
      
      const commandCounts: Record<string, number> = {};
      const errorCounts: Record<string, number> = {};
      let totalCommands = 0;
      let successfulCommands = 0;

      for (const metric of recentMetrics) {
        const fullCommand = metric.subcommand ? `${metric.command} ${metric.subcommand}` : metric.command;
        commandCounts[fullCommand] = (commandCounts[fullCommand] || 0) + 1;
        
        totalCommands++;
        if (metric.success) {
          successfulCommands++;
        } else if (metric.errorType) {
          errorCounts[metric.errorType] = (errorCounts[metric.errorType] || 0) + 1;
        }
      }

      return {
        totalMetrics: metrics.length,
        recentCommands: totalCommands,
        successRate: totalCommands > 0 ? successfulCommands / totalCommands : 1,
        topCommands: Object.entries(commandCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([command, count]) => ({ command, count })),
        errorBreakdown: Object.entries(errorCounts)
          .sort(([,a], [,b]) => b - a)
          .map(([error, count]) => ({ error, count }))
      };
    } catch (error) {
      return {
        totalMetrics: 0,
        recentCommands: 0,
        successRate: 1,
        topCommands: [],
        errorBreakdown: []
      };
    }
  }

  async clearMetrics(): Promise<void> {
    try {
      await fs.unlink(this.analyticsPath);
    } catch (error) {
      // File doesn't exist, which is fine
    }
  }

  private async loadMetrics(): Promise<UsageMetric[]> {
    try {
      const content = await fs.readFile(this.analyticsPath, 'utf-8');
      const data: UsageMetricData[] = JSON.parse(content);
      return data.map(d => UsageMetric.fromJSON(d));
    } catch (error) {
      return [];
    }
  }

  private async saveMetrics(metrics: UsageMetric[]): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.analyticsPath), { recursive: true });
      const data = metrics.map(m => m.toJSON());
      await fs.writeFile(this.analyticsPath, JSON.stringify(data, null, 2));
    } catch (error) {
      // Fail silently
    }
  }
}

export interface UsageStats {
  totalMetrics: number;
  recentCommands: number;
  successRate: number;
  topCommands: Array<{ command: string; count: number }>;
  errorBreakdown: Array<{ error: string; count: number }>;
}