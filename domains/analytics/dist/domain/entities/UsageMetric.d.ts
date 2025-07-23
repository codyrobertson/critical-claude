/**
 * Usage Metric Entity
 * Anonymous usage tracking for product improvement
 */
export declare class UsageMetric {
    readonly timestamp: Date;
    readonly command: string;
    readonly subcommand?: string | undefined;
    readonly success: boolean;
    readonly duration?: number | undefined;
    readonly errorType?: string | undefined;
    readonly version: string;
    constructor(timestamp: Date, command: string, subcommand?: string | undefined, success?: boolean, duration?: number | undefined, errorType?: string | undefined, version?: string);
    toJSON(): UsageMetricData;
    static fromJSON(data: UsageMetricData): UsageMetric;
}
export interface UsageMetricData {
    timestamp: string;
    command: string;
    subcommand?: string;
    success: boolean;
    duration?: number;
    errorType?: string;
    version: string;
}
//# sourceMappingURL=UsageMetric.d.ts.map