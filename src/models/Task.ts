/**
 * Simplified Task Model
 * Consolidated from task-management and user-interface domains
 */

import { Priority, TaskStatus, DEFAULT_PRIORITY, DEFAULT_TASK_STATUS, BaseEntity, Timestamp } from '../../shared/domain-types';

// Re-export types for external consumption
export { Priority, TaskStatus } from '../../shared/domain-types';

export interface Task extends BaseEntity {
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  labels: string[];
  assignee?: string;
  estimatedHours?: number;
  draft?: boolean;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  priority?: Priority;
  status?: TaskStatus;
  assignee?: string;
  labels?: string[];
  estimatedHours?: number;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  priority?: Priority;
  status?: TaskStatus;
  assignee?: string;
  labels?: string[];
  estimatedHours?: number;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: Priority;
  assignee?: string;
  labels?: string[];
}

// Utility functions
export function generateTaskId(title?: string): string {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const timeComponent = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  
  if (title) {
    // Create semantic slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .slice(0, 20); // Limit length
    
    return `${slug}-${timestamp}-${timeComponent}`;
  }
  
  return `task-${timestamp}-${timeComponent}`;
}

export function createTask(data: CreateTaskData): Task {
  const now = new Date().toISOString();
  return {
    id: generateTaskId(data.title),
    title: data.title,
    description: data.description || '',
    status: data.status || DEFAULT_TASK_STATUS,
    priority: data.priority || DEFAULT_PRIORITY,
    labels: data.labels || [],
    assignee: data.assignee,
    estimatedHours: data.estimatedHours,
    createdAt: now,
    updatedAt: now,
    draft: false
  };
}

export function updateTask(task: Task, updates: UpdateTaskData): Task {
  return {
    ...task,
    ...updates,
    updatedAt: new Date().toISOString()
  };
}

export function applyFilters(tasks: Task[], filters: TaskFilters): Task[] {
  return tasks.filter(task => {
    if (filters.status && task.status !== filters.status) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.assignee && task.assignee !== filters.assignee) return false;
    if (filters.labels && !filters.labels.every(label => task.labels.includes(label))) return false;
    return true;
  });
}