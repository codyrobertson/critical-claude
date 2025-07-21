/**
 * Console Logger Implementation
 * Simple console-based logger for development
 */

import { ILogger, LogLevel, LogContext } from '../../application/ports/ILogger';

// Re-export LogLevel for external use
export { LogLevel } from '../../application/ports/ILogger';

export class ConsoleLogger implements ILogger {
  private level: LogLevel = LogLevel.INFO;
  private context: LogContext = {};

  constructor(initialLevel?: LogLevel, initialContext?: LogContext) {
    if (initialLevel !== undefined) {
      this.level = initialLevel;
    }
    if (initialContext) {
      this.context = initialContext;
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.level <= LogLevel.DEBUG) {
      this.log('DEBUG', message, context);
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.level <= LogLevel.INFO) {
      this.log('INFO', message, context);
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.level <= LogLevel.WARN) {
      this.log('WARN', message, context);
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.level <= LogLevel.ERROR) {
      const errorContext = {
        ...context,
        error: error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : undefined
      };
      this.log('ERROR', message, errorContext);
    }
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    if (this.level <= LogLevel.FATAL) {
      const errorContext = {
        ...context,
        error: error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : undefined
      };
      this.log('FATAL', message, errorContext);
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  child(context: LogContext): ILogger {
    return new ConsoleLogger(this.level, { ...this.context, ...context });
  }

  private log(level: string, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const mergedContext = { ...this.context, ...context };
    
    const logEntry = {
      timestamp,
      level,
      message,
      ...mergedContext
    };

    // Format based on level
    const color = this.getLevelColor(level);
    const prefix = `\x1b[${color}m[${timestamp}] [${level}]\x1b[0m`;
    
    console.log(`${prefix} ${message}`);
    
    // Log context if present
    if (Object.keys(mergedContext).length > 0) {
      console.log(`  Context:`, JSON.stringify(mergedContext, null, 2));
    }
  }

  private getLevelColor(level: string): number {
    switch (level) {
      case 'DEBUG': return 90; // Gray
      case 'INFO': return 36;  // Cyan
      case 'WARN': return 33;  // Yellow
      case 'ERROR': return 31; // Red
      case 'FATAL': return 35; // Magenta
      default: return 37;      // White
    }
  }
}