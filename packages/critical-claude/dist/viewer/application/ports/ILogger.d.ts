/**
 * Logger Port Interface
 * Abstracts logging functionality
 */
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    FATAL = 4
}
export interface LogContext {
    [key: string]: unknown;
}
export interface ILogger {
    debug(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    error(message: string, error?: Error, context?: LogContext): void;
    fatal(message: string, error?: Error, context?: LogContext): void;
    setLevel(level: LogLevel): void;
    getLevel(): LogLevel;
    child(context: LogContext): ILogger;
}
//# sourceMappingURL=ILogger.d.ts.map