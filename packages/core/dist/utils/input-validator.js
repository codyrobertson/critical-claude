/**
 * Input Validator
 * Comprehensive validation for all tool inputs
 */
import { logger } from '../logger/logger.js';
export class InputValidator {
    /**
     * Validate code input
     */
    static validateCode(code) {
        const errors = [];
        // Type check
        if (typeof code !== 'string') {
            errors.push('Code must be a string');
            return { valid: false, errors };
        }
        // Empty check
        if (!code || code.trim().length === 0) {
            errors.push('Code cannot be empty');
            return { valid: false, errors };
        }
        // Size check (10MB limit)
        const sizeInMB = Buffer.byteLength(code, 'utf8') / 1024 / 1024;
        if (sizeInMB > 10) {
            errors.push(`Code too large: ${sizeInMB.toFixed(2)}MB (max 10MB)`);
            return { valid: false, errors };
        }
        // Check for binary content
        if (code.includes('\0')) {
            errors.push('Code contains null bytes - possibly binary content');
            return { valid: false, errors };
        }
        return {
            valid: true,
            errors: [],
            sanitized: code.trim(),
        };
    }
    /**
     * Validate filename input
     */
    static validateFilename(filename) {
        const errors = [];
        // Type check
        if (typeof filename !== 'string') {
            errors.push('Filename must be a string');
            return { valid: false, errors };
        }
        // Empty check
        if (!filename || filename.trim().length === 0) {
            errors.push('Filename cannot be empty');
            return { valid: false, errors };
        }
        // Path traversal check
        if (filename.includes('..') || filename.includes('~')) {
            errors.push('Filename contains path traversal sequences');
            return { valid: false, errors };
        }
        // Null byte check
        if (filename.includes('\0')) {
            errors.push('Filename contains null bytes');
            return { valid: false, errors };
        }
        // Length check
        if (filename.length > 255) {
            errors.push('Filename too long (max 255 characters)');
            return { valid: false, errors };
        }
        // Invalid characters check
        const invalidChars = /[<>:"|?*]/g;
        if (invalidChars.test(filename)) {
            errors.push('Filename contains invalid characters');
            return { valid: false, errors };
        }
        return {
            valid: true,
            errors: [],
            sanitized: filename.trim(),
        };
    }
    /**
     * Validate path input
     */
    static validatePath(path) {
        const errors = [];
        // Type check
        if (typeof path !== 'string') {
            errors.push('Path must be a string');
            return { valid: false, errors };
        }
        // Empty check
        if (!path || path.trim().length === 0) {
            errors.push('Path cannot be empty');
            return { valid: false, errors };
        }
        // Path traversal check
        if (path.includes('..') || path.includes('./') || path.includes('.\\')) {
            errors.push('Path contains traversal sequences');
            return { valid: false, errors };
        }
        // Null byte check
        if (path.includes('\0')) {
            errors.push('Path contains null bytes');
            return { valid: false, errors };
        }
        // Length check
        if (path.length > 4096) {
            errors.push('Path too long (max 4096 characters)');
            return { valid: false, errors };
        }
        // Dangerous paths check
        const dangerousPaths = ['/etc', '/sys', '/proc', 'C:\\Windows', 'C:\\System'];
        const lowerPath = path.toLowerCase();
        for (const dangerous of dangerousPaths) {
            if (lowerPath.startsWith(dangerous.toLowerCase())) {
                errors.push(`Path points to system directory: ${dangerous}`);
                return { valid: false, errors };
            }
        }
        return {
            valid: true,
            errors: [],
            sanitized: path.trim(),
        };
    }
    /**
     * Validate brutality level
     */
    static validateBrutalityLevel(level) {
        const errors = [];
        // Type check
        const numLevel = Number(level);
        if (isNaN(numLevel)) {
            errors.push('Brutality level must be a number');
            return { valid: false, errors };
        }
        // Range check
        if (numLevel < 1 || numLevel > 10) {
            errors.push('Brutality level must be between 1 and 10');
            return { valid: false, errors };
        }
        return {
            valid: true,
            errors: [],
            sanitized: Math.round(numLevel),
        };
    }
    /**
     * Validate context object
     */
    static validateContext(context) {
        const errors = [];
        // Allow undefined/null
        if (context === undefined || context === null) {
            return { valid: true, errors: [], sanitized: {} };
        }
        // Type check
        if (typeof context !== 'object' || Array.isArray(context)) {
            errors.push('Context must be an object');
            return { valid: false, errors };
        }
        // Validate specific fields if present
        const sanitized = {};
        if ('teamSize' in context) {
            const teamSize = Number(context.teamSize);
            if (isNaN(teamSize) || teamSize < 1 || teamSize > 1000) {
                errors.push('Team size must be between 1 and 1000');
            }
            else {
                sanitized.teamSize = teamSize;
            }
        }
        if ('userCount' in context) {
            const userCount = Number(context.userCount);
            if (isNaN(userCount) || userCount < 0) {
                errors.push('User count must be a positive number');
            }
            else {
                sanitized.userCount = userCount;
            }
        }
        if ('techStack' in context) {
            if (!Array.isArray(context.techStack)) {
                errors.push('Tech stack must be an array');
            }
            else {
                sanitized.techStack = context.techStack
                    .filter((tech) => typeof tech === 'string')
                    .map((tech) => tech.trim())
                    .slice(0, 20); // Limit to 20 items
            }
        }
        if ('hasDeadline' in context) {
            sanitized.hasDeadline = Boolean(context.hasDeadline);
        }
        if ('complexityFactors' in context) {
            if (!Array.isArray(context.complexityFactors)) {
                errors.push('Complexity factors must be an array');
            }
            else {
                sanitized.complexityFactors = context.complexityFactors
                    .filter((factor) => typeof factor === 'string')
                    .slice(0, 20);
            }
        }
        if ('efficiencyFactors' in context) {
            if (!Array.isArray(context.efficiencyFactors)) {
                errors.push('Efficiency factors must be an array');
            }
            else {
                sanitized.efficiencyFactors = context.efficiencyFactors
                    .filter((factor) => typeof factor === 'string')
                    .slice(0, 20);
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            sanitized,
        };
    }
    /**
     * Validate natural language input
     */
    static validateNaturalLanguageInput(input) {
        const errors = [];
        // Type check
        if (typeof input !== 'string') {
            errors.push('Input must be a string');
            return { valid: false, errors };
        }
        // Empty check
        if (!input || input.trim().length === 0) {
            errors.push('Input cannot be empty');
            return { valid: false, errors };
        }
        // Size check (100KB limit for PRDs)
        const sizeInKB = Buffer.byteLength(input, 'utf8') / 1024;
        if (sizeInKB > 100) {
            errors.push(`Input too large: ${sizeInKB.toFixed(2)}KB (max 100KB)`);
            return { valid: false, errors };
        }
        // Check for potential code injection
        const dangerousPatterns = [
            '<script',
            'javascript:',
            'onerror=',
            'onclick=',
            'eval(',
            'Function(',
        ];
        const lowerInput = input.toLowerCase();
        for (const pattern of dangerousPatterns) {
            if (lowerInput.includes(pattern)) {
                logger.warn('Potentially dangerous pattern in input', { pattern });
                // Don't reject, just sanitize
                input = input.replace(new RegExp(pattern, 'gi'), '[REMOVED]');
            }
        }
        return {
            valid: true,
            errors: [],
            sanitized: input.trim(),
        };
    }
    /**
     * Generic validation wrapper
     */
    static validate(inputs, schema) {
        const errors = {};
        const sanitized = {};
        let valid = true;
        for (const [key, validator] of Object.entries(schema)) {
            const result = validator(inputs[key]);
            if (!result.valid) {
                valid = false;
                errors[key] = result.errors;
            }
            else {
                sanitized[key] = result.sanitized;
            }
        }
        return { valid, errors, sanitized };
    }
}
//# sourceMappingURL=input-validator.js.map