/**
 * Analytics Service
 * Anonymous usage tracking service
 */
import { AnalyticsRepository, UsageStats } from '../../infrastructure/AnalyticsRepository.js';
export declare class AnalyticsService {
    private repository;
    constructor(repository?: AnalyticsRepository);
    trackCommand(command: string, subcommand?: string, options?: TrackingOptions): Promise<void>;
    trackError(command: string, subcommand: string | undefined, error: Error, duration?: number): Promise<void>;
    getUsageStats(): Promise<UsageStats>;
    exportMetrics(format?: 'json' | 'csv'): Promise<string>;
    clearAllMetrics(): Promise<void>;
    withTracking<T>(command: string, subcommand: string | undefined, fn: () => Promise<T>): Promise<T>;
}
export interface TrackingOptions {
    success?: boolean;
    duration?: number;
    errorType?: string;
    version?: string;
}
//# sourceMappingURL=AnalyticsService.d.ts.map