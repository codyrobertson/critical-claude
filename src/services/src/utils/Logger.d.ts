/**
 * Simple Logger for CLI
 * Provides configurable logging levels for debugging
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export declare class Logger {
    private static instance;
    private logLevel;
    private static readonly LEVELS;
    private static readonly COLORS;
    private constructor();
    static getInstance(): Logger;
    setLevel(level: LogLevel): void;
    getLevel(): LogLevel;
    private shouldLog;
    private formatMessage;
    debug(message: string, meta?: any): void;
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, meta?: any): void;
    operation(operation: string, details?: any): void;
    result(operation: string, success: boolean, details?: any): void;
    performance(operation: string, startTime: number, details?: any): void;
    silentError(message: string, error?: Error): void;
    silentWarn(message: string, details?: any): void;
}
export declare const logger: Logger;
