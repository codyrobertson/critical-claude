/**
 * Production-ready logging system
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  error?: Error;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    if (level > this.logLevel) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      error
    };

    const formattedMessage = this.formatLogEntry(entry);
    
    if (level === LogLevel.ERROR) {
      console.error(formattedMessage);
    } else if (level === LogLevel.WARN) {
      console.warn(formattedMessage);
    } else {
      console.log(formattedMessage);
    }
  }

  private formatLogEntry(entry: LogEntry): string {
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

  error(message: string, context?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }
}

export const logger = Logger.getInstance();