/**
 * Simple logger for backlog integration
 * Provides consistent logging across the module
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  private level: LogLevel;
  
  constructor() {
    // Set log level based on environment
    const envLevel = process.env.CC_LOG_LEVEL?.toUpperCase();
    this.level = envLevel ? LogLevel[envLevel as keyof typeof LogLevel] ?? LogLevel.INFO : LogLevel.INFO;
  }
  
  debug(message: string, data?: any): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  }
  
  info(message: string, data?: any): void {
    if (this.level <= LogLevel.INFO) {
      console.log(`[INFO] ${message}`, data || '');
    }
  }
  
  warn(message: string, error?: Error | any): void {
    if (this.level <= LogLevel.WARN) {
      if (error instanceof Error) {
        console.warn(`[WARN] ${message}:`, error.message);
      } else {
        console.warn(`[WARN] ${message}`, error || '');
      }
    }
  }
  
  error(message: string, error?: Error): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, error?.message || '');
      if (error?.stack && this.level === LogLevel.DEBUG) {
        console.error(error.stack);
      }
    }
  }
}

// Export singleton instance
export const logger = new Logger();