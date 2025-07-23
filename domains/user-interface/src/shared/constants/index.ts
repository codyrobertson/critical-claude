/**
 * Shared Constants
 * Application-wide constant values
 */

// Application metadata
export const APP_NAME = 'Critical Claude Task Viewer';
export const APP_VERSION = '1.0.0';

// Terminal UI constants
export const TERMINAL_MIN_WIDTH = 80;
export const TERMINAL_MIN_HEIGHT = 24;
export const DEFAULT_FPS = 60;

// Task constants
export const MAX_TASK_TITLE_LENGTH = 200;
export const MAX_TASK_DESCRIPTION_LENGTH = 5000;
export const MAX_TAG_LENGTH = 50;
export const MAX_TAGS_PER_TASK = 20;

// Pagination constants
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;

// Search constants
export const MIN_SEARCH_LENGTH = 1;
export const MAX_SEARCH_LENGTH = 100;
export const SEARCH_DEBOUNCE_MS = 300;
export const MAX_SEARCH_RESULTS = 100;

// Performance constants
export const RENDER_THROTTLE_MS = 16; // ~60 FPS
export const UPDATE_THROTTLE_MS = 100;
export const SCROLL_THROTTLE_MS = 50;

// Cache constants
export const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
export const MAX_CACHE_SIZE = 1000;

// Key binding constants
export const KEY_REPEAT_INITIAL_DELAY = 500;
export const KEY_REPEAT_INTERVAL = 50;

// Colors (for terminal UI)
export const COLORS = {
  // Base colors
  BLACK: '#000000',
  WHITE: '#FFFFFF',
  GRAY: '#808080',
  
  // Status colors
  PENDING: '#808080',
  IN_PROGRESS: '#3B82F6',
  COMPLETED: '#10B981',
  CANCELLED: '#EF4444',
  BLOCKED: '#F59E0B',
  
  // Priority colors
  CRITICAL: '#DC2626',
  HIGH: '#F97316',
  MEDIUM: '#FCD34D',
  LOW: '#84CC16',
  
  // UI colors
  BORDER: '#374151',
  BORDER_FOCUSED: '#06B6D4',
  BACKGROUND: '#111827',
  FOREGROUND: '#F3F4F6',
  SELECTION: '#1F2937',
  HIGHLIGHT: '#FCD34D',
  
  // Semantic colors
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6'
} as const;

// Icons (Unicode characters)
export const ICONS = {
  // Status icons
  STATUS_PENDING: '○',
  STATUS_IN_PROGRESS: '◐',
  STATUS_COMPLETED: '●',
  STATUS_CANCELLED: '✗',
  STATUS_BLOCKED: '⊘',
  
  // Priority icons
  PRIORITY_CRITICAL: '🔴',
  PRIORITY_HIGH: '🟠',
  PRIORITY_MEDIUM: '🟡',
  PRIORITY_LOW: '🟢',
  
  // UI icons
  ARROW_RIGHT: '→',
  ARROW_LEFT: '←',
  ARROW_UP: '↑',
  ARROW_DOWN: '↓',
  CHECK: '✓',
  CROSS: '✗',
  STAR: '★',
  SEARCH: '🔍',
  FOLDER: '📁',
  FILE: '📄',
  TAG: '🏷️',
  CLOCK: '🕐',
  CALENDAR: '📅',
  
  // Box drawing
  BOX_HORIZONTAL: '─',
  BOX_VERTICAL: '│',
  BOX_TOP_LEFT: '┌',
  BOX_TOP_RIGHT: '┐',
  BOX_BOTTOM_LEFT: '└',
  BOX_BOTTOM_RIGHT: '┘',
  BOX_CROSS: '┼',
  BOX_T_DOWN: '┬',
  BOX_T_UP: '┴',
  BOX_T_RIGHT: '├',
  BOX_T_LEFT: '┤'
} as const;

// Date formats
export const DATE_FORMATS = {
  SHORT: 'MM/DD/YYYY',
  LONG: 'MMMM DD, YYYY',
  TIME: 'HH:mm:ss',
  DATETIME: 'MM/DD/YYYY HH:mm',
  RELATIVE: 'relative' // Special format for "2 hours ago" style
} as const;

// Error messages
export const ERROR_MESSAGES = {
  TASK_NOT_FOUND: 'Task not found',
  INVALID_TASK_ID: 'Invalid task ID',
  INVALID_STATUS: 'Invalid task status',
  INVALID_PRIORITY: 'Invalid task priority',
  SEARCH_FAILED: 'Search failed',
  UPDATE_FAILED: 'Failed to update task',
  NETWORK_ERROR: 'Network error occurred',
  UNKNOWN_ERROR: 'An unknown error occurred'
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  TASK_CREATED: 'Task created successfully',
  TASK_UPDATED: 'Task updated successfully',
  TASK_DELETED: 'Task deleted successfully',
  TASK_COMPLETED: 'Task marked as completed',
  TASKS_LOADED: 'Tasks loaded successfully'
} as const;