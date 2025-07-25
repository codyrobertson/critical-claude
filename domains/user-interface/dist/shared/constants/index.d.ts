/**
 * Shared Constants
 * Application-wide constant values
 */
export declare const APP_NAME = "Critical Claude Task Viewer";
export declare const APP_VERSION = "1.0.0";
export declare const TERMINAL_MIN_WIDTH = 80;
export declare const TERMINAL_MIN_HEIGHT = 24;
export declare const DEFAULT_FPS = 60;
export declare const MAX_TASK_TITLE_LENGTH = 200;
export declare const MAX_TASK_DESCRIPTION_LENGTH = 5000;
export declare const MAX_TAG_LENGTH = 50;
export declare const MAX_TAGS_PER_TASK = 20;
export declare const DEFAULT_PAGE_SIZE = 50;
export declare const MAX_PAGE_SIZE = 200;
export declare const MIN_SEARCH_LENGTH = 1;
export declare const MAX_SEARCH_LENGTH = 100;
export declare const SEARCH_DEBOUNCE_MS = 300;
export declare const MAX_SEARCH_RESULTS = 100;
export declare const RENDER_THROTTLE_MS = 16;
export declare const UPDATE_THROTTLE_MS = 100;
export declare const SCROLL_THROTTLE_MS = 50;
export declare const CACHE_TTL_MS: number;
export declare const MAX_CACHE_SIZE = 1000;
export declare const KEY_REPEAT_INITIAL_DELAY = 500;
export declare const KEY_REPEAT_INTERVAL = 50;
export declare const COLORS: {
    readonly BLACK: "#000000";
    readonly WHITE: "#FFFFFF";
    readonly GRAY: "#808080";
    readonly PENDING: "#808080";
    readonly IN_PROGRESS: "#3B82F6";
    readonly COMPLETED: "#10B981";
    readonly CANCELLED: "#EF4444";
    readonly BLOCKED: "#F59E0B";
    readonly CRITICAL: "#DC2626";
    readonly HIGH: "#F97316";
    readonly MEDIUM: "#FCD34D";
    readonly LOW: "#84CC16";
    readonly BORDER: "#374151";
    readonly BORDER_FOCUSED: "#06B6D4";
    readonly BACKGROUND: "#111827";
    readonly FOREGROUND: "#F3F4F6";
    readonly SELECTION: "#1F2937";
    readonly HIGHLIGHT: "#FCD34D";
    readonly SUCCESS: "#10B981";
    readonly WARNING: "#F59E0B";
    readonly ERROR: "#EF4444";
    readonly INFO: "#3B82F6";
};
export declare const ICONS: {
    readonly STATUS_PENDING: "○";
    readonly STATUS_IN_PROGRESS: "◐";
    readonly STATUS_COMPLETED: "●";
    readonly STATUS_CANCELLED: "✗";
    readonly STATUS_BLOCKED: "⊘";
    readonly PRIORITY_CRITICAL: "🔴";
    readonly PRIORITY_HIGH: "🟠";
    readonly PRIORITY_MEDIUM: "🟡";
    readonly PRIORITY_LOW: "🟢";
    readonly ARROW_RIGHT: "→";
    readonly ARROW_LEFT: "←";
    readonly ARROW_UP: "↑";
    readonly ARROW_DOWN: "↓";
    readonly CHECK: "✓";
    readonly CROSS: "✗";
    readonly STAR: "★";
    readonly SEARCH: "🔍";
    readonly FOLDER: "📁";
    readonly FILE: "📄";
    readonly TAG: "🏷️";
    readonly CLOCK: "🕐";
    readonly CALENDAR: "📅";
    readonly BOX_HORIZONTAL: "─";
    readonly BOX_VERTICAL: "│";
    readonly BOX_TOP_LEFT: "┌";
    readonly BOX_TOP_RIGHT: "┐";
    readonly BOX_BOTTOM_LEFT: "└";
    readonly BOX_BOTTOM_RIGHT: "┘";
    readonly BOX_CROSS: "┼";
    readonly BOX_T_DOWN: "┬";
    readonly BOX_T_UP: "┴";
    readonly BOX_T_RIGHT: "├";
    readonly BOX_T_LEFT: "┤";
};
export declare const DATE_FORMATS: {
    readonly SHORT: "MM/DD/YYYY";
    readonly LONG: "MMMM DD, YYYY";
    readonly TIME: "HH:mm:ss";
    readonly DATETIME: "MM/DD/YYYY HH:mm";
    readonly RELATIVE: "relative";
};
export declare const ERROR_MESSAGES: {
    readonly TASK_NOT_FOUND: "Task not found";
    readonly INVALID_TASK_ID: "Invalid task ID";
    readonly INVALID_STATUS: "Invalid task status";
    readonly INVALID_PRIORITY: "Invalid task priority";
    readonly SEARCH_FAILED: "Search failed";
    readonly UPDATE_FAILED: "Failed to update task";
    readonly NETWORK_ERROR: "Network error occurred";
    readonly UNKNOWN_ERROR: "An unknown error occurred";
};
export declare const SUCCESS_MESSAGES: {
    readonly TASK_CREATED: "Task created successfully";
    readonly TASK_UPDATED: "Task updated successfully";
    readonly TASK_DELETED: "Task deleted successfully";
    readonly TASK_COMPLETED: "Task marked as completed";
    readonly TASKS_LOADED: "Tasks loaded successfully";
};
//# sourceMappingURL=index.d.ts.map