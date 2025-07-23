/**
 * Usage Metric Entity
 * Anonymous usage tracking for product improvement
 */
export class UsageMetric {
    constructor(timestamp, command, subcommand, success = true, duration, errorType, version = '2.3.0') {
        this.timestamp = timestamp;
        this.command = command;
        this.subcommand = subcommand;
        this.success = success;
        this.duration = duration;
        this.errorType = errorType;
        this.version = version;
    }
    toJSON() {
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
    static fromJSON(data) {
        return new UsageMetric(new Date(data.timestamp), data.command, data.subcommand, data.success, data.duration, data.errorType, data.version);
    }
}
//# sourceMappingURL=UsageMetric.js.map