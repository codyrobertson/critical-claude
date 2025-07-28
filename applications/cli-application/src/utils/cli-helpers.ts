/**
 * CLI Helper Utilities
 * Common patterns extracted from command handlers
 */

import { CommandResult, TaskDisplayData, ServiceResult, OperationResult } from '../types/cli-types.js';
import { DomainError, Result, safeAsync } from '../../../../shared/error-handling.js';

export class CliHelpers {
  
  /**
   * Validates required arguments and provides consistent error messaging
   */
  static validateRequired(value: unknown, fieldName: string, usageExample?: string): asserts value is NonNullable<typeof value> {
    if (!value) {
      console.error(`❌ ${fieldName} is required`);
      if (usageExample) {
        console.log(`Usage: ${usageExample}`);
      }
      process.exit(1);
    }
  }

  /**
   * Handles service results with consistent success/error messaging
   */
  static handleServiceResult<T>(
    result: ServiceResult<T>,
    successMessage: string,
    errorPrefix: string = 'Operation failed'
  ): T {
    if (result.success && result.data !== undefined) {
      console.log(`✅ ${successMessage}`);
      return result.data;
    } else {
      console.error(`❌ ${errorPrefix}: ${result.error || 'Unknown error'}`);
      process.exit(1);
    }
  }

  /**
   * Handles service results that don't return data
   */
  static handleVoidServiceResult(
    result: ServiceResult<void>,
    successMessage: string,
    errorPrefix: string = 'Operation failed'
  ): void {
    if (result.success) {
      console.log(`✅ ${successMessage}`);
    } else {
      console.error(`❌ ${errorPrefix}: ${result.error || 'Unknown error'}`);
      process.exit(1);
    }
  }

  /**
   * Safe error handling wrapper for async operations with graceful error handling
   */
  static async safeExecute<T>(
    operation: () => Promise<T>,
    errorMessage: string = 'Operation failed'
  ): Promise<T> {
    const result = await safeAsync(operation);
    if (result.success) {
      return result.data;
    } else {
      this.handleDomainError(result.error, errorMessage);
      process.exit(1);
    }
  }

  /**
   * Handles domain errors with consistent formatting
   */
  static handleDomainError(error: DomainError, context?: string): void {
    const prefix = context ? `${context}: ` : '';
    console.error(`❌ ${prefix}${error.message}`);
    
    if (error.context) {
      console.error('   Details:', error.context);
    }
  }

  /**
   * Graceful error handler that doesn't exit the process
   */
  static handleNonFatalError(error: unknown, context: string): void {
    if (error instanceof DomainError) {
      this.handleDomainError(error, context);
    } else {
      console.error(`❌ ${context}: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Formats task display with consistent styling
   */
  static displayTask(task: TaskDisplayData): void {
    console.log(`📋 Task: ${task.title}`);
    console.log(`   ID: ${task.id.value}`);
    console.log(`   Status: ${task.status}`);
    console.log(`   Priority: ${task.priority}`);
    console.log(`   Created: ${task.createdAt.toLocaleDateString()}`);
    console.log(`   Updated: ${task.updatedAt.toLocaleDateString()}`);
    if (task.description) console.log(`   Description: ${task.description}`);
    if (task.assignee) console.log(`   Assignee: ${task.assignee}`);
    if (task.estimatedHours) console.log(`   Estimated: ${task.estimatedHours}h`);
    if (task.labels.length > 0) console.log(`   Labels: ${task.labels.join(', ')}`);
  }

  /**
   * Formats task list with consistent styling
   */
  static displayTaskList(tasks: TaskDisplayData[]): void {
    console.log(`📋 Found ${tasks.length} tasks:\n`);
    tasks.forEach(task => {
      console.log(`${task.status === 'done' ? '✅' : '📌'} ${task.title}`);
      console.log(`   ID: ${task.id.value}`);
      console.log(`   Status: ${task.status} | Priority: ${task.priority}`);
      if (task.assignee) console.log(`   Assignee: ${task.assignee}`);
      if (task.labels.length > 0) console.log(`   Labels: ${task.labels.join(', ')}`);
      console.log('');
    });
  }

  /**
   * Displays operation result with optional details
   */
  static displayResult(result: OperationResult, operation: string): void {
    if (result.reportPath) {
      console.log(`   Report: ${result.reportPath}`);
    }
    if (result.tasksCreated) {
      console.log(`   Tasks created: ${result.tasksCreated}`);
    }
    if (result.taskCount !== undefined) {
      console.log(`   ${operation} ${result.taskCount} tasks`);
    }
    if (result.exportPath) {
      console.log(`   ${operation} to: ${result.exportPath}`);
    }
    if (result.backupPath) {
      console.log(`   Backup created: ${result.backupPath}`);
    }
  }
}