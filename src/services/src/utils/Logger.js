/**
 * Simple Logger for CLI
 * Provides configurable logging levels for debugging
 */
export class Logger {
    static instance;
    logLevel = 'info';
    static LEVELS = {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3
    };
    static COLORS = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m', // Green
        warn: '\x1b[33m', // Yellow
        error: '\x1b[31m', // Red
        reset: '\x1b[0m' // Reset
    };
    constructor() { }
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    setLevel(level) {
        this.logLevel = level;
    }
    getLevel() {
        return this.logLevel;
    }
    shouldLog(level) {
        return Logger.LEVELS[level] >= Logger.LEVELS[this.logLevel];
    }
    formatMessage(level, message, meta) {
        const timestamp = new Date().toISOString();
        const color = Logger.COLORS[level];
        const reset = Logger.COLORS.reset;
        const levelStr = level.toUpperCase().padEnd(5);
        let formattedMessage = `${color}[${timestamp}] ${levelStr}${reset} ${message}`;
        if (meta !== undefined) {
            if (typeof meta === 'object') {
                formattedMessage += `\n${JSON.stringify(meta, null, 2)}`;
            }
            else {
                formattedMessage += ` ${meta}`;
            }
        }
        return formattedMessage;
    }
    debug(message, meta) {
        if (this.shouldLog('debug')) {
            console.log(this.formatMessage('debug', message, meta));
        }
    }
    info(message, meta) {
        if (this.shouldLog('info')) {
            console.log(this.formatMessage('info', message, meta));
        }
    }
    warn(message, meta) {
        if (this.shouldLog('warn')) {
            console.warn(this.formatMessage('warn', message, meta));
        }
    }
    error(message, meta) {
        if (this.shouldLog('error')) {
            console.error(this.formatMessage('error', message, meta));
        }
    }
    // Convenience methods for common scenarios
    operation(operation, details) {
        this.debug(`Starting operation: ${operation}`, details);
    }
    result(operation, success, details) {
        if (success) {
            this.debug(`Operation completed: ${operation}`, details);
        }
        else {
            this.warn(`Operation failed: ${operation}`, details);
        }
    }
    performance(operation, startTime, details) {
        const duration = Date.now() - startTime;
        this.debug(`Performance: ${operation} took ${duration}ms`, details);
    }
    // Silent variants that only log in debug mode
    silentError(message, error) {
        this.debug(`Silent error: ${message}`, error?.stack || error?.message);
    }
    silentWarn(message, details) {
        this.debug(`Silent warning: ${message}`, details);
    }
}
// Export singleton instance for convenience
export const logger = Logger.getInstance();
