/**
 * Common Task Interface - Unified type for all task management systems
 * Provides consistent API across the entire unified task system
 */

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked' | 'archived';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

// Custom field type definitions
export type CustomFieldType = 'string' | 'text' | 'number' | 'boolean' | 'array' | 'select' | 'date' | 'url';

export interface CustomFieldDefinition {
  type: CustomFieldType;
  required?: boolean;
  description?: string;
  default?: CustomFieldValue;
  options?: string[]; // For select type
  example?: string;
  validation?: {
    pattern?: string; // Regex pattern for string fields
    min?: number; // For number fields
    max?: number; // For number fields
    minLength?: number; // For string/text fields
    maxLength?: number; // For string/text fields
  };
}

export type CustomFieldValue = string | number | boolean | string[] | Date | null;
export type CustomFieldValues = Record<string, CustomFieldValue>;

// Type guards for custom fields
export function isValidCustomFieldValue(value: unknown): value is CustomFieldValue {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value instanceof Date ||
    (Array.isArray(value) && value.every(v => typeof v === 'string'))
  );
}

export function validateCustomFieldValue(
  value: unknown, 
  definition: CustomFieldDefinition
): { valid: boolean; error?: string } {
  // Check if required
  if (definition.required && (value === null || value === undefined || value === '')) {
    return { valid: false, error: 'Field is required' };
  }
  
  // Type-specific validation
  switch (definition.type) {
    case 'string':
    case 'text':
    case 'url':
      if (value !== null && typeof value !== 'string') {
        return { valid: false, error: 'Value must be a string' };
      }
      if (typeof value === 'string' && definition.validation) {
        if (definition.validation.minLength && value.length < definition.validation.minLength) {
          return { valid: false, error: `Minimum length is ${definition.validation.minLength}` };
        }
        if (definition.validation.maxLength && value.length > definition.validation.maxLength) {
          return { valid: false, error: `Maximum length is ${definition.validation.maxLength}` };
        }
        if (definition.validation.pattern) {
          const regex = new RegExp(definition.validation.pattern);
          if (!regex.test(value)) {
            return { valid: false, error: 'Value does not match required pattern' };
          }
        }
      }
      break;
      
    case 'number':
      if (value !== null && typeof value !== 'number') {
        return { valid: false, error: 'Value must be a number' };
      }
      if (typeof value === 'number' && definition.validation) {
        if (definition.validation.min !== undefined && value < definition.validation.min) {
          return { valid: false, error: `Minimum value is ${definition.validation.min}` };
        }
        if (definition.validation.max !== undefined && value > definition.validation.max) {
          return { valid: false, error: `Maximum value is ${definition.validation.max}` };
        }
      }
      break;
      
    case 'boolean':
      if (value !== null && typeof value !== 'boolean') {
        return { valid: false, error: 'Value must be a boolean' };
      }
      break;
      
    case 'array':
      if (value !== null && (!Array.isArray(value) || !value.every(v => typeof v === 'string'))) {
        return { valid: false, error: 'Value must be an array of strings' };
      }
      break;
      
    case 'select':
      if (value !== null && typeof value !== 'string') {
        return { valid: false, error: 'Value must be a string' };
      }
      if (value !== null && definition.options && !definition.options.includes(value as string)) {
        return { valid: false, error: `Value must be one of: ${definition.options.join(', ')}` };
      }
      break;
      
    case 'date':
      if (value !== null && !(value instanceof Date)) {
        return { valid: false, error: 'Value must be a Date' };
      }
      break;
  }
  
  return { valid: true };
}

export interface TaskDependency {
  from: string;
  to: string;
  type: 'prerequisite' | 'blocks' | 'related';
  createdAt: string;
}

export interface CommonTask {
  // Core fields (present in all systems)
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  
  // Assignment and collaboration
  assignee?: string;
  labels: string[];
  
  // AGILE hierarchy (optional for simple workflows)
  sprintId?: string;
  epicId?: string;
  phaseId?: string;
  
  // Estimation and tracking
  storyPoints?: number;
  estimatedHours?: number;
  actualHours?: number;
  
  // Dependencies and relationships
  dependencies?: string[];
  blockedBy?: string[];
  parentId?: string;          // Parent task ID for subtasks
  childTasks?: string[];      // Child task IDs for expanded tasks
  
  // AI and automation
  aiGenerated?: boolean;
  aiExpandable?: boolean;
  autoGeneratedDependencies?: boolean;
  aiEstimation?: {
    storyPoints: number;
    estimatedHours: number;
    complexity: 'low' | 'medium' | 'high' | 'very-high';
    confidence: number;
    factors: string[];
  };
  
  // Claude Code integration
  claudeCodeSynced?: boolean;
  lastSyncedAt?: string;
  
  // Additional metadata
  draft?: boolean;
  external?: boolean;
  source?: 'manual' | 'ai' | 'ai-generation' | 'ai-expansion' | 'import' | 'claude-code';
  
  // Custom fields for template-based tasks
  customFields?: CustomFieldValues;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assignee?: string;
  labels?: string[];
  sprintId?: string;
  epicId?: string;
  phaseId?: string;
  storyPoints?: number;
  estimatedHours?: number;
  dependencies?: string[];
  parentId?: string;
  draft?: boolean;
  aiGenerated?: boolean;
  source?: 'manual' | 'ai' | 'ai-generation' | 'ai-expansion' | 'import' | 'claude-code';
  customFields?: CustomFieldValues;
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assignee?: string;
  labels?: string[];
  sprintId?: string;
  epicId?: string;
  phaseId?: string;
  storyPoints?: number;
  estimatedHours?: number;
  actualHours?: number;
  dependencies?: string[];
  blockedBy?: string[];
  parentId?: string;
  childTasks?: string[];
  aiEstimation?: {
    storyPoints: number;
    estimatedHours: number;
    complexity: 'low' | 'medium' | 'high' | 'very-high';
    confidence: number;
    factors: string[];
  };
}

export interface TaskFilter {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  assignee?: string;
  labels?: string[];
  sprintId?: string;
  epicId?: string;
  phaseId?: string;
  includeDrafts?: boolean;
  includeArchived?: boolean;
  aiGenerated?: boolean;
  claudeCodeSynced?: boolean;
}

export interface TaskListOptions {
  filter?: TaskFilter;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'title' | 'status';
  sortOrder?: 'asc' | 'desc';
  plain?: boolean;
}

// Legacy type adapters for backward compatibility
// Legacy BacklogManager type removed - use CommonTask directly

export interface MCPSimpleTask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SimpleManagerTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
}

// Type guards for legacy compatibility

export function isMCPSimpleTask(task: any): task is MCPSimpleTask {
  return task && typeof task.id === 'string' && task.id.startsWith('task-');
}

export function isSimpleManagerTask(task: any): task is SimpleManagerTask {
  return task && typeof task.id === 'string' && task.archived !== undefined;
}

// Conversion utilities
export function toCommonTask(task: MCPSimpleTask | SimpleManagerTask): CommonTask {
  if (isMCPSimpleTask(task)) {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: normalizeStatus(task.status),
      priority: normalizePriority(task.priority),
      assignee: task.assignee || undefined,
      labels: task.labels || [],
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      source: 'manual'
    };
  }
  
  if (isSimpleManagerTask(task)) {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.archived ? 'archived' : task.status,
      priority: task.priority,
      assignee: task.assignee,
      labels: task.labels,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      source: 'manual'
    };
  }
  
  // Already a CommonTask
  return task as CommonTask;
}

function normalizeStatus(status: string): TaskStatus {
  const statusMap: Record<string, TaskStatus> = {
    'To Do': 'todo',
    'to_do': 'todo',
    'todo': 'todo',
    'In Progress': 'in_progress',
    'in_progress': 'in_progress',
    'Done': 'done',
    'done': 'done',
    'Blocked': 'blocked',
    'blocked': 'blocked',
    'Archived': 'archived',
    'archived': 'archived'
  };
  
  return statusMap[status] || 'todo';
}

function normalizePriority(priority: string): TaskPriority {
  const priorityMap: Record<string, TaskPriority> = {
    'critical': 'critical',
    'high': 'high',
    'medium': 'medium',
    'low': 'low'
  };
  
  return priorityMap[priority.toLowerCase()] || 'medium';
}