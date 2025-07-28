/**
 * Simple Logger for CLI
 * Provides configurable logging levels for debugging
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = 'info';

  private static readonly LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  private static readonly COLORS = {
    debug: '\x1b[36m', // Cyan
    info: '\x1b[32m',  // Green
    warn: '\x1b[33m',  // Yellow
    error: '\x1b[31m', // Red
    reset: '\x1b[0m'   // Reset
  };

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  getLevel(): LogLevel {
    return this.logLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return Logger.LEVELS[level] >= Logger.LEVELS[this.logLevel];
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const color = Logger.COLORS[level];
    const reset = Logger.COLORS.reset;
    const levelStr = level.toUpperCase().padEnd(5);
    
    let formattedMessage = `${color}[${timestamp}] ${levelStr}${reset} ${message}`;
    
    if (meta !== undefined) {
      if (typeof meta === 'object') {
        formattedMessage += `\n${JSON.stringify(meta, null, 2)}`;
      } else {
        formattedMessage += ` ${meta}`;
      }
    }
    
    return formattedMessage;
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, meta));
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, meta));
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  error(message: string, meta?: any): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, meta));
    }
  }

  // Convenience methods for common scenarios
  operation(operation: string, details?: any): void {
    this.debug(`Starting operation: ${operation}`, details);
  }

  result(operation: string, success: boolean, details?: any): void {
    if (success) {
      this.debug(`Operation completed: ${operation}`, details);
    } else {
      this.warn(`Operation failed: ${operation}`, details);
    }
  }

  performance(operation: string, startTime: number, details?: any): void {
    const duration = Date.now() - startTime;
    this.debug(`Performance: ${operation} took ${duration}ms`, details);
  }

  // Silent variants that only log in debug mode
  silentError(message: string, error?: Error): void {
    this.debug(`Silent error: ${message}`, error?.stack || error?.message);
  }

  silentWarn(message: string, details?: any): void {
    this.debug(`Silent warning: ${message}`, details);
  }
}

// Export singleton instance for convenience
export const logger = Logger.getInstance();