/**
 * Analytics Service
 * Anonymous usage tracking service
 */
import { UsageMetric } from '../../domain/entities/UsageMetric.js';
import { AnalyticsRepository } from '../../infrastructure/AnalyticsRepository.js';
export class AnalyticsService {
    constructor(repository = new AnalyticsRepository()) {
        this.repository = repository;
    }
    async trackCommand(command, subcommand, options = {}) {
        const metric = new UsageMetric(new Date(), command, subcommand, options.success ?? true, options.duration, options.errorType, options.version || '2.3.0');
        await this.repository.recordMetric(metric);
    }
    async trackError(command, subcommand, error, duration) {
        await this.trackCommand(command, subcommand, {
            success: false,
            errorType: error.constructor.name,
            duration
        });
    }
    async getUsageStats() {
        return this.repository.getUsageStats();
    }
    async exportMetrics(format = 'json') {
        const metrics = await this.repository.getMetrics();
        if (format === 'csv') {
            const headers = ['timestamp', 'command', 'subcommand', 'success', 'duration', 'errorType', 'version'];
            const rows = metrics.map(m => [
                m.timestamp.toISOString(),
                m.command,
                m.subcommand || '',
                m.success.toString(),
                m.duration?.toString() || '',
                m.errorType || '',
                m.version
            ]);
            return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        }
        return JSON.stringify(metrics.map(m => m.toJSON()), null, 2);
    }
    async clearAllMetrics() {
        await this.repository.clearMetrics();
    }
    // Wrapper to track function execution
    async withTracking(command, subcommand, fn) {
        const startTime = Date.now();
        try {
            const result = await fn();
            const duration = Date.now() - startTime;
            await this.trackCommand(command, subcommand, { success: true, duration });
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            await this.trackError(command, subcommand, error, duration);
            throw error;
        }
    }
}
//# sourceMappingURL=AnalyticsService.js.map