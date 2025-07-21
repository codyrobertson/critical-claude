/**
 * Common Task Interface - Unified type for all task management systems
 * Provides consistent API across the entire unified task system
 */
// Type guards for custom fields
export function isValidCustomFieldValue(value) {
    return (value === null ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        value instanceof Date ||
        (Array.isArray(value) && value.every(v => typeof v === 'string')));
}
export function validateCustomFieldValue(value, definition) {
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
            if (value !== null && definition.options && !definition.options.includes(value)) {
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
// Type guards for legacy compatibility
export function isMCPSimpleTask(task) {
    return task && typeof task.id === 'string' && task.id.startsWith('task-');
}
export function isSimpleManagerTask(task) {
    return task && typeof task.id === 'string' && task.archived !== undefined;
}
// Conversion utilities
export function toCommonTask(task) {
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
    return task;
}
function normalizeStatus(status) {
    const statusMap = {
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
function normalizePriority(priority) {
    const priorityMap = {
        'critical': 'critical',
        'high': 'high',
        'medium': 'medium',
        'low': 'low'
    };
    return priorityMap[priority.toLowerCase()] || 'medium';
}
//# sourceMappingURL=common-task.js.map