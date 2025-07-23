/**
 * Silent Logger Implementation
 * Discards all log messages to prevent UI corruption
 */

import { ILogger, LogLevel, LogContext } from '../../application/ports/ILogger.js';

export class SilentLogger implements ILogger {
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
    // Silent - no output
  }

  info(message: string, context?: LogContext): void {
    // Silent - no output
  }

  warn(message: string, context?: LogContext): void {
    // Silent - no output
  }

  error(message: string, error?: Error, context?: LogContext): void {
    // Silent - no output
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    // Silent - no output
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  child(context: LogContext): ILogger {
    return new SilentLogger(this.level, { ...this.context, ...context });
  }
}