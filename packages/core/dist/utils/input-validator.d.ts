/**
 * Input Validator
 * Comprehensive validation for all tool inputs
 */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    sanitized?: any;
}
export declare class InputValidator {
    /**
     * Validate code input
     */
    static validateCode(code: any): ValidationResult;
    /**
     * Validate filename input
     */
    static validateFilename(filename: any): ValidationResult;
    /**
     * Validate path input
     */
    static validatePath(path: any): ValidationResult;
    /**
     * Validate brutality level
     */
    static validateBrutalityLevel(level: any): ValidationResult;
    /**
     * Validate context object
     */
    static validateContext(context: any): ValidationResult;
    /**
     * Validate natural language input
     */
    static validateNaturalLanguageInput(input: any): ValidationResult;
    /**
     * Generic validation wrapper
     */
    static validate(inputs: Record<string, any>, schema: Record<string, (value: any) => ValidationResult>): {
        valid: boolean;
        errors: Record<string, string[]>;
        sanitized: Record<string, any>;
    };
}
//# sourceMappingURL=input-validator.d.ts.map