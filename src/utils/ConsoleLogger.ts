/**
 * Simple Console Logger
 * Basic logging implementation for the simplified architecture
 */

import { Logger } from '../models/index.js';

export class ConsoleLogger implements Logger {
  debug(message: string, context?: Record<string, unknown>): void {
    console.debug(`[DEBUG] ${message}`, context || '');
  }
  
  info(message: string, context?: Record<string, unknown>): void {
    console.log(`ℹ️ ${message}`, context ? JSON.stringify(context) : '');
  }
  
  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(`⚠️ ${message}`, context ? JSON.stringify(context) : '');
  }
  
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    console.error(`❌ ${message}`, error || '', context ? JSON.stringify(context) : '');
  }
}