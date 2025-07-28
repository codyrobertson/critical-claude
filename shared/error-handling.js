/**
 * Standardized Error Handling
 * Replaces inconsistent error handling patterns across the codebase
 */
export class DomainError extends Error {
    constructor(message, context) {
        super(message);
        this.context = context;
        this.name = this.constructor.name;
    }
}
export class ValidationError extends DomainError {
    constructor() {
        super(...arguments);
        this.code = 'VALIDATION_ERROR';
        this.statusCode = 400;
    }
}
export class NotFoundError extends DomainError {
    constructor() {
        super(...arguments);
        this.code = 'NOT_FOUND';
        this.statusCode = 404;
    }
}
export class OperationError extends DomainError {
    constructor() {
        super(...arguments);
        this.code = 'OPERATION_ERROR';
        this.statusCode = 422;
    }
}
export class InfrastructureError extends DomainError {
    constructor() {
        super(...arguments);
        this.code = 'INFRASTRUCTURE_ERROR';
        this.statusCode = 500;
    }
}
export class ConfigurationError extends DomainError {
    constructor() {
        super(...arguments);
        this.code = 'CONFIGURATION_ERROR';
        this.statusCode = 500;
    }
}
/**
 * Creates a successful result
 */
export function success(data) {
    return { success: true, data };
}
/**
 * Creates a failed result
 */
export function failure(error) {
    return { success: false, error };
}
/**
 * Safe wrapper for operations that might throw
 */
export async function safeAsync(operation, errorFactory) {
    try {
        const data = await operation();
        return success(data);
    }
    catch (error) {
        let domainError;
        if (errorFactory) {
            try {
                domainError = errorFactory(error);
                // Validate that errorFactory actually returned a DomainError
                if (!domainError || !(domainError instanceof DomainError)) {
                    throw new Error('errorFactory must return a DomainError instance');
                }
            }
            catch (factoryError) {
                // Fallback if errorFactory itself throws or returns invalid result
                domainError = new OperationError(`Error factory failed: ${factoryError instanceof Error ? factoryError.message : 'Unknown factory error'}`, { originalError: error, factoryError });
            }
        }
        else {
            domainError = new OperationError(error instanceof Error ? error.message : 'Operation failed', { originalError: error });
        }
        return failure(domainError);
    }
}
/**
 * Safe wrapper for synchronous operations that might throw
 */
export function safe(operation, errorFactory) {
    try {
        const data = operation();
        return success(data);
    }
    catch (error) {
        const domainError = errorFactory
            ? errorFactory(error)
            : new OperationError(error instanceof Error ? error.message : 'Operation failed', { originalError: error });
        return failure(domainError);
    }
}
/**
 * Console error logger implementation
 */
export class ConsoleErrorLogger {
    logError(error, context) {
        console.error(`[${error.code}] ${error.message}`, {
            ...error.context,
            ...context
        });
    }
}
