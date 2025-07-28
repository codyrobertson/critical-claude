/**
 * Simplified Analytics Model
 * Consolidated from analytics domain
 */
export interface UsageMetric {
    id: string;
    command: string;
    action?: string;
    success: boolean;
    executionTime: number;
    timestamp: Date;
    error?: string;
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
export interface CreateMetricData {
    command: string;
    action?: string;
    success: boolean;
    executionTime: number;
    error?: string;
}
export declare function generateMetricId(command?: string, action?: string): string;
export declare function createMetric(data: CreateMetricData): UsageMetric;
export declare function calculateStats(metrics: UsageMetric[]): UsageStats;
