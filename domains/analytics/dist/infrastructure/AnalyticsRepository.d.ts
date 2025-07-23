/**
 * Analytics Repository
 * Local storage for anonymous usage metrics
 */
import { UsageMetric } from '../domain/entities/UsageMetric.js';
export declare class AnalyticsRepository {
    private readonly analyticsPath;
    private readonly maxMetrics;
    constructor(basePath?: string);
    recordMetric(metric: UsageMetric): Promise<void>;
    getMetrics(startDate?: Date, endDate?: Date): Promise<UsageMetric[]>;
    getUsageStats(): Promise<UsageStats>;
    clearMetrics(): Promise<void>;
    private loadMetrics;
    private saveMetrics;
}
export interface UsageStats {
    totalMetrics: number;
    recentCommands: number;
    successRate: number;
    topCommands: Array<{
        command: string;
        count: number;
    }>;
    errorBreakdown: Array<{
        error: string;
        count: number;
    }>;
}
//# sourceMappingURL=AnalyticsRepository.d.ts.map