/**
 * Canonical Domain Types - Single Source of Truth
 *
 * This file contains the authoritative type definitions for the entire application.
 * All other modules should import from this file to ensure consistency.
 */
// Priority Types - Canonical Definition
export const PRIORITIES = ['critical', 'high', 'medium', 'low'];
// Task Status Types - Canonical Definition
export const TASK_STATUSES = ['todo', 'in_progress', 'done', 'blocked', 'archived'];
// Type Guards for Runtime Validation
export const isPriority = (value) => PRIORITIES.includes(value);
export const isTaskStatus = (value) => TASK_STATUSES.includes(value);
// Default Values
export const DEFAULT_PRIORITY = 'medium';
export const DEFAULT_TASK_STATUS = 'todo';
export const validatePriority = (value) => {
    if (typeof value !== 'string') {
        return { isValid: false, error: 'Priority must be a string' };
    }
    if (!isPriority(value)) {
        return {
            isValid: false,
            error: `Invalid priority: ${value}. Must be one of: ${PRIORITIES.join(', ')}`
        };
    }
    return { isValid: true };
};
export const validateTaskStatus = (value) => {
    if (typeof value !== 'string') {
        return { isValid: false, error: 'Task status must be a string' };
    }
    if (!isTaskStatus(value)) {
        return {
            isValid: false,
            error: `Invalid task status: ${value}. Must be one of: ${TASK_STATUSES.join(', ')}`
        };
    }
    return { isValid: true };
};
//# sourceMappingURL=domain-types.js.map