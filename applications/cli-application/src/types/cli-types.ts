/**
 * CLI Application Types
 * Replaces 'any' types with proper interfaces
 */

import { Priority, TaskStatus } from '../../../../shared/domain-types';

export interface TaskCommandOptions {
  title?: string;
  description?: string;
  priority?: Priority;
  status?: TaskStatus;
  assignee?: string;
  labels?: string[];
  hours?: number;
  format?: 'json' | 'csv' | 'markdown';
  file?: string;
  includeArchived?: boolean;
  mergeStrategy?: 'replace' | 'merge' | 'skip';
}

export interface TemplateCommandOptions {
  variables?: Record<string, string>;
}

export interface ResearchCommandOptions {
  files?: string[];
  format?: 'tasks' | 'report' | 'both';
  depth?: number;
  target?: 'prd' | 'build-docs' | 'ux-flow' | 'market-analysis' | 'technical-spec' | 'comprehensive';
}

export interface ViewerCommandOptions {
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  theme?: 'dark' | 'light';
}

export interface AnalyticsCommandOptions {
  format?: 'json' | 'csv';
}

export interface VerifyCommandOptions {
  health?: boolean;
  skipDocker?: boolean;
  skipPerformance?: boolean;
  verbose?: boolean;
}

export interface CommandResult {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: string;
}

export type CommandAction = string;
export type CommandArgs = string[];

// Task display interfaces
export interface TaskDisplayData {
  id: { value: string };
  title: string;
  status: string;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
  description?: string;
  assignee?: string;
  estimatedHours?: number;
  labels: readonly string[];
}

export interface ServiceResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface TaskServiceResult {
  success: boolean;
  error?: string;
  task?: TaskDisplayData;
  tasks?: TaskDisplayData[];
}

export interface OperationResult {
  success: boolean;
  error?: string;
  reportPath?: string;
  tasksCreated?: number;
  taskCount?: number;
  exportPath?: string;
  backupPath?: string;
  cleanedUpCount?: number;
  summary?: string;
  errors?: string[];
}

export interface UpdateTaskData {
  taskId: string;
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  assignee?: string;
  labels?: string[];
  estimatedHours?: number;
}