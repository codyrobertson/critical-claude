/**
 * Analytics Domain Entry Point
 * Exports public interfaces for the analytics domain
 */

// Application Services
export { AnalyticsService } from './application/services/AnalyticsService.js';
export type { TrackingOptions } from './application/services/AnalyticsService.js';

// Domain Entities
export { UsageMetric } from './domain/entities/UsageMetric.js';
export type { UsageMetricData } from './domain/entities/UsageMetric.js';

// Infrastructure
export { AnalyticsRepository } from './infrastructure/AnalyticsRepository.js';
export type { UsageStats } from './infrastructure/AnalyticsRepository.js';