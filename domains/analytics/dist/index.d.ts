/**
 * Analytics Domain Entry Point
 * Exports public interfaces for the analytics domain
 */
export { AnalyticsService } from './application/services/AnalyticsService.js';
export type { TrackingOptions } from './application/services/AnalyticsService.js';
export { UsageMetric } from './domain/entities/UsageMetric.js';
export type { UsageMetricData } from './domain/entities/UsageMetric.js';
export { AnalyticsRepository } from './infrastructure/AnalyticsRepository.js';
export type { UsageStats } from './infrastructure/AnalyticsRepository.js';
//# sourceMappingURL=index.d.ts.map