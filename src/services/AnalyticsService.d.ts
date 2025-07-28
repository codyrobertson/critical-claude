/**
 * Simplified Analytics Service
 * Consolidates AnalyticsService functionality into direct service methods
 */
import { UsageMetric, UsageStats, CreateMetricData, Result } from '../models/index.js';
import { FileStorage } from '../storage/index.js';
export declare class AnalyticsService {
    private storage;
    private readonly COLLECTION;
    constructor(storage: FileStorage);
    recordMetric(data: CreateMetricData): Promise<Result<UsageMetric>>;
    getUsageStats(): Promise<UsageStats>;
    exportMetrics(format?: 'json' | 'csv'): Promise<string>;
    clearAllMetrics(): Promise<Result<boolean>>;
    withTracking<T>(command: string, action: string | undefined, operation: () => Promise<T>): Promise<T>;
    getMetricsByCommand(command: string): Promise<UsageMetric[]>;
    getMetricsByDateRange(startDate: Date, endDate: Date): Promise<UsageMetric[]>;
    getAverageExecutionTime(command?: string): Promise<number>;
    getSuccessRate(command?: string): Promise<number>;
    getErrorFrequency(): Promise<Array<{
        error: string;
        count: number;
        percentage: number;
    }>>;
    getUsageTrends(days?: number): Promise<Array<{
        date: string;
        count: number;
        successCount: number;
    }>>;
    getSystemHealth(): Promise<{
        status: 'healthy' | 'warning' | 'critical';
        metrics: {
            errorRate: number;
            avgResponseTime: number;
            totalCommands: number;
            recentErrors: string[];
        };
        alerts: string[];
    }>;
    private metricsToCSV;
}
//# sourceMappingURL=AnalyticsService.d.ts.map