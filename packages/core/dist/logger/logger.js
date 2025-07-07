/**
 * Production-ready logging system
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (LogLevel = {}));
export class Logger {
    static instance;
    logLevel = LogLevel.INFO;
    constructor() { }
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    setLogLevel(level) {
        this.logLevel = level;
    }
    log(level, message, context, error) {
        if (level > this.logLevel)
            return;
        const entry = {
            level,
            message,
            timestamp: new Date(),
            context,
            error,
        };
        const formattedMessage = this.formatLogEntry(entry);
        if (level === LogLevel.ERROR) {
            console.error(formattedMessage);
        }
        else if (level === LogLevel.WARN) {
            console.warn(formattedMessage);
        }
        else {
            console.log(formattedMessage);
        }
    }
    formatLogEntry(entry) {
        const timestamp = entry.timestamp.toISOString();
        const level = LogLevel[entry.level];
        let message = `[${timestamp}] ${level}: ${entry.message}`;
        if (entry.context) {
            message += ` | Context: ${JSON.stringify(entry.context)}`;
        }
        if (entry.error) {
            message += ` | Error: ${entry.error.message}`;
            if (entry.error.stack) {
                message += `\nStack: ${entry.error.stack}`;
            }
        }
        return message;
    }
    error(message, context, error) {
        this.log(LogLevel.ERROR, message, context, error);
    }
    warn(message, context) {
        this.log(LogLevel.WARN, message, context);
    }
    info(message, context) {
        this.log(LogLevel.INFO, message, context);
    }
    debug(message, context) {
        this.log(LogLevel.DEBUG, message, context);
    }
}
export const logger = Logger.getInstance();
//# sourceMappingURL=logger.js.map