/**
 * Simple logger for backlog integration
 * Provides consistent logging across the module
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (LogLevel = {}));
class Logger {
    level;
    constructor() {
        // Set log level based on environment
        const envLevel = process.env.CC_LOG_LEVEL?.toUpperCase();
        this.level = envLevel ? LogLevel[envLevel] ?? LogLevel.INFO : LogLevel.INFO;
    }
    debug(message, data) {
        if (this.level <= LogLevel.DEBUG) {
            console.debug(`[DEBUG] ${message}`, data || '');
        }
    }
    info(message, data) {
        if (this.level <= LogLevel.INFO) {
            console.log(`[INFO] ${message}`, data || '');
        }
    }
    warn(message, error) {
        if (this.level <= LogLevel.WARN) {
            if (error instanceof Error) {
                console.warn(`[WARN] ${message}:`, error.message);
            }
            else {
                console.warn(`[WARN] ${message}`, error || '');
            }
        }
    }
    error(message, error) {
        if (this.level <= LogLevel.ERROR) {
            console.error(`[ERROR] ${message}`, error?.message || '');
            if (error?.stack && this.level === LogLevel.DEBUG) {
                console.error(error.stack);
            }
        }
    }
}
// Export singleton instance
export const logger = new Logger();
//# sourceMappingURL=logger.js.map