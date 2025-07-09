/**
 * Simple logger for backlog integration
 * Provides consistent logging across the module
 */
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
declare class Logger {
    private level;
    constructor();
    debug(message: string, data?: any): void;
    info(message: string, data?: any): void;
    warn(message: string, error?: Error | any): void;
    error(message: string, error?: Error): void;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map