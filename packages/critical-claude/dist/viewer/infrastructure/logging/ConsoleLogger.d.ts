/**
 * Console Logger Implementation
 * Simple console-based logger for development
 */
import { ILogger, LogLevel, LogContext } from '../../application/ports/ILogger';
export { LogLevel } from '../../application/ports/ILogger';
export declare class ConsoleLogger implements ILogger {
    private level;
    private context;
    constructor(initialLevel?: LogLevel, initialContext?: LogContext);
    debug(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    error(message: string, error?: Error, context?: LogContext): void;
    fatal(message: string, error?: Error, context?: LogContext): void;
    setLevel(level: LogLevel): void;
    getLevel(): LogLevel;
    child(context: LogContext): ILogger;
    private log;
    private getLevelColor;
}
//# sourceMappingURL=ConsoleLogger.d.ts.map