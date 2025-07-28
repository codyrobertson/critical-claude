/**
 * Input Validation - Data Corruption Prevention
 *
 * Comprehensive validation using canonical domain types to prevent data corruption
 * across all collections and operations.
 */

// Temporary stub functions to avoid dependency on domain-types
function validatePriority(value) {
  const validPriorities = ['low', 'medium', 'high', 'critical'];
  if (typeof value !== 'string' || !validPriorities.includes(value)) {
    return { isValid: false, error: `Priority must be one of: ${validPriorities.join(', ')}` };
  }
  return { isValid: true };
}

function validateTaskStatus(value) {
  const validStatuses = ['todo', 'in_progress', 'done', 'blocked'];
  if (typeof value !== 'string' || !validStatuses.includes(value)) {
    return { isValid: false, error: `Status must be one of: ${validStatuses.join(', ')}` };
  }
  return { isValid: true };
}
// Common validation patterns
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const ID_REGEX = /^[a-zA-Z0-9\-_]{1,100}$/;
export const SAFE_STRING_REGEX = /^[a-zA-Z0-9\s\-_.,!?()[\]{}'"]*$/;
// Core validation functions
export function validateRequiredString(value, fieldName, minLength = 1, maxLength = 500) {
    if (typeof value !== 'string') {
        return {
            isValid: false,
            field: fieldName,
            value,
            error: `${fieldName} must be a string`
        };
    }
    const trimmed = value.trim();
    if (trimmed.length < minLength) {
        return {
            isValid: false,
            field: fieldName,
            value,
            error: `${fieldName} must be at least ${minLength} characters long`
        };
    }
    if (trimmed.length > maxLength) {
        return {
            isValid: false,
            field: fieldName,
            value,
            error: `${fieldName} must be no more than ${maxLength} characters long`
        };
    }
    if (!SAFE_STRING_REGEX.test(trimmed)) {
        return {
            isValid: false,
            field: fieldName,
            value,
            error: `${fieldName} contains invalid characters`
        };
    }
    return { isValid: true };
}
export function validateOptionalString(value, fieldName, maxLength = 1000) {
    if (value === undefined || value === null || value === '') {
        return { isValid: true };
    }
    return validateRequiredString(value, fieldName, 0, maxLength);
}
export function validateId(value, fieldName = 'id') {
    if (typeof value !== 'string') {
        return {
            isValid: false,
            field: fieldName,
            value,
            error: `${fieldName} must be a string`
        };
    }
    if (!ID_REGEX.test(value)) {
        return {
            isValid: false,
            field: fieldName,
            value,
            error: `${fieldName} must contain only alphanumeric characters, hyphens, and underscores`
        };
    }
    return { isValid: true };
}
export function validateEmail(value, fieldName = 'email') {
    if (typeof value !== 'string') {
        return {
            isValid: false,
            field: fieldName,
            value,
            error: `${fieldName} must be a string`
        };
    }
    if (!EMAIL_REGEX.test(value)) {
        return {
            isValid: false,
            field: fieldName,
            value,
            error: `${fieldName} must be a valid email address`
        };
    }
    return { isValid: true };
}
export function validateArray(value, fieldName, itemValidator) {
    if (!Array.isArray(value)) {
        return {
            isValid: false,
            field: fieldName,
            value,
            error: `${fieldName} must be an array`
        };
    }
    if (itemValidator) {
        for (let i = 0; i < value.length; i++) {
            const itemResult = itemValidator(value[i]);
            if (!itemResult.isValid) {
                return {
                    isValid: false,
                    field: `${fieldName}[${i}]`,
                    value: value[i],
                    error: itemResult.error
                };
            }
        }
    }
    return { isValid: true };
}
export function validateNumber(value, fieldName, min, max) {
    if (typeof value !== 'number' || isNaN(value)) {
        return {
            isValid: false,
            field: fieldName,
            value,
            error: `${fieldName} must be a valid number`
        };
    }
    if (min !== undefined && value < min) {
        return {
            isValid: false,
            field: fieldName,
            value,
            error: `${fieldName} must be at least ${min}`
        };
    }
    if (max !== undefined && value > max) {
        return {
            isValid: false,
            field: fieldName,
            value,
            error: `${fieldName} must be no more than ${max}`
        };
    }
    return { isValid: true };
}
export function validateTimestamp(value, fieldName) {
    if (typeof value !== 'string') {
        return {
            isValid: false,
            field: fieldName,
            value,
            error: `${fieldName} must be a string`
        };
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
        return {
            isValid: false,
            field: fieldName,
            value,
            error: `${fieldName} must be a valid ISO 8601 timestamp`
        };
    }
    return { isValid: true };
}
// Entity-specific validation
export function validateBaseEntity(entity) {
    const errors = [];
    if (!entity || typeof entity !== 'object') {
        return {
            isValid: false,
            errors: [{ isValid: false, error: 'Entity must be an object' }],
            warnings: []
        };
    }
    const obj = entity;
    // Validate required BaseEntity fields
    const idResult = validateId(obj.id, 'id');
    if (!idResult.isValid)
        errors.push(idResult);
    const createdAtResult = validateTimestamp(obj.createdAt, 'createdAt');
    if (!createdAtResult.isValid)
        errors.push(createdAtResult);
    const updatedAtResult = validateTimestamp(obj.updatedAt, 'updatedAt');
    if (!updatedAtResult.isValid)
        errors.push(updatedAtResult);
    return {
        isValid: errors.length === 0,
        errors,
        warnings: []
    };
}
export function validateTaskData(data) {
    const errors = [];
    const warnings = [];
    if (!data || typeof data !== 'object') {
        return {
            isValid: false,
            errors: [{ isValid: false, error: 'Task data must be an object' }],
            warnings: []
        };
    }
    const task = data;
    // Validate required fields
    const titleResult = validateRequiredString(task.title, 'title', 1, 200);
    if (!titleResult.isValid)
        errors.push(titleResult);
    // Validate optional fields
    if (task.description !== undefined) {
        const descResult = validateOptionalString(task.description, 'description', 2000);
        if (!descResult.isValid)
            errors.push(descResult);
    }
    if (task.status !== undefined) {
        const statusResult = validateTaskStatus(task.status);
        if (!statusResult.isValid) {
            errors.push({
                isValid: false,
                field: 'status',
                value: task.status,
                error: statusResult.error
            });
        }
    }
    if (task.priority !== undefined) {
        const priorityResult = validatePriority(task.priority);
        if (!priorityResult.isValid) {
            errors.push({
                isValid: false,
                field: 'priority',
                value: task.priority,
                error: priorityResult.error
            });
        }
    }
    if (task.labels !== undefined) {
        const labelsResult = validateArray(task.labels, 'labels', (item) => validateRequiredString(item, 'label', 1, 50));
        if (!labelsResult.isValid)
            errors.push(labelsResult);
    }
    if (task.assignee !== undefined && task.assignee !== null && task.assignee !== '') {
        const assigneeResult = validateEmail(task.assignee, 'assignee');
        if (!assigneeResult.isValid) {
            // Treat as warning for backward compatibility
            warnings.push(assigneeResult);
        }
    }
    if (task.estimatedHours !== undefined) {
        const hoursResult = validateNumber(task.estimatedHours, 'estimatedHours', 0, 1000);
        if (!hoursResult.isValid)
            errors.push(hoursResult);
    }
    // Validate timestamps if present
    if (task.createdAt !== undefined) {
        const createdResult = validateTimestamp(task.createdAt, 'createdAt');
        if (!createdResult.isValid)
            errors.push(createdResult);
    }
    if (task.updatedAt !== undefined) {
        const updatedResult = validateTimestamp(task.updatedAt, 'updatedAt');
        if (!updatedResult.isValid)
            errors.push(updatedResult);
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}
// Collection validation for bulk operations
export function validateCollection(items, itemValidator) {
    const allErrors = [];
    const allWarnings = [];
    if (!Array.isArray(items)) {
        return {
            isValid: false,
            errors: [{ isValid: false, error: 'Collection must be an array' }],
            warnings: []
        };
    }
    items.forEach((item, index) => {
        const result = itemValidator(item);
        // Prefix field names with array index
        result.errors.forEach(error => {
            allErrors.push({
                ...error,
                field: error.field ? `[${index}].${error.field}` : `[${index}]`
            });
        });
        result.warnings.forEach(warning => {
            allWarnings.push({
                ...warning,
                field: warning.field ? `[${index}].${warning.field}` : `[${index}]`
            });
        });
    });
    return {
        isValid: allErrors.length === 0,
        errors: allErrors,
        warnings: allWarnings
    };
}
// Sanitization functions to clean data before validation
export function sanitizeTaskData(data) {
    if (!data || typeof data !== 'object') {
        return null;
    }
    const obj = data;
    return {
        id: typeof obj.id === 'string' ? obj.id.trim() : undefined,
        title: typeof obj.title === 'string' ? obj.title.trim() : '',
        description: typeof obj.description === 'string' ? obj.description.trim() : undefined,
        status: typeof obj.status === 'string' ? obj.status.trim() : undefined,
        priority: typeof obj.priority === 'string' ? obj.priority.trim() : undefined,
        labels: Array.isArray(obj.labels) ? obj.labels.filter(l => typeof l === 'string').map(l => l.trim()) : undefined,
        assignee: typeof obj.assignee === 'string' ? obj.assignee.trim() : undefined,
        estimatedHours: typeof obj.estimatedHours === 'number' ? obj.estimatedHours : undefined,
        createdAt: typeof obj.createdAt === 'string' ? obj.createdAt.trim() : undefined,
        updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt.trim() : undefined
    };
}
// Validation error formatting
export function formatValidationErrors(report) {
    if (report.isValid) {
        return 'Validation passed';
    }
    const errorMessages = report.errors.map(error => {
        const field = error.field ? `${error.field}: ` : '';
        return `${field}${error.error}`;
    });
    const warningMessages = report.warnings.map(warning => {
        const field = warning.field ? `${warning.field}: ` : '';
        return `Warning - ${field}${warning.error}`;
    });
    return [...errorMessages, ...warningMessages].join('\n');
}
//# sourceMappingURL=input-validation.js.map