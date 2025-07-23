/**
 * Usage Metric Entity
 * Anonymous usage tracking for product improvement
 */

export class UsageMetric {
  constructor(
    public readonly timestamp: Date,
    public readonly command: string,
    public readonly subcommand?: string,
    public readonly success: boolean = true,
    public readonly duration?: number,
    public readonly errorType?: string,
    public readonly version: string = '2.3.0'
  ) {}

  toJSON(): UsageMetricData {
    return {
      timestamp: this.timestamp.toISOString(),
      command: this.command,
      subcommand: this.subcommand,
      success: this.success,
      duration: this.duration,
      errorType: this.errorType,
      version: this.version
    };
  }

  static fromJSON(data: UsageMetricData): UsageMetric {
    return new UsageMetric(
      new Date(data.timestamp),
      data.command,
      data.subcommand,
      data.success,
      data.duration,
      data.errorType,
      data.version
    );
  }
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