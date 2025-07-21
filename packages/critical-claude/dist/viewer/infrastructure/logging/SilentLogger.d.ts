/**
 * Silent Logger Implementation
 * Discards all log messages to prevent UI corruption
 */
import { ILogger, LogLevel, LogContext } from '../../application/ports/ILogger.js';
export declare class SilentLogger implements ILogger {
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
}
//# sourceMappingURL=SilentLogger.d.ts.map