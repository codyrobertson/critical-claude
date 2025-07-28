/**
 * Input Validation - Data Corruption Prevention
 *
 * Comprehensive validation using canonical domain types to prevent data corruption
 * across all collections and operations.
 */
import { Priority, TaskStatus, ValidationResult } from './domain-types';
export declare const EMAIL_REGEX: RegExp;
export declare const ID_REGEX: RegExp;
export declare const SAFE_STRING_REGEX: RegExp;
export interface FieldValidationResult extends ValidationResult {
    field?: string;
    value?: unknown;
}
export interface ValidationReport {
    isValid: boolean;
    errors: FieldValidationResult[];
    warnings: FieldValidationResult[];
}
export declare function validateRequiredString(value: unknown, fieldName: string, minLength?: number, maxLength?: number): FieldValidationResult;
export declare function validateOptionalString(value: unknown, fieldName: string, maxLength?: number): FieldValidationResult;
export declare function validateId(value: unknown, fieldName?: string): FieldValidationResult;
export declare function validateEmail(value: unknown, fieldName?: string): FieldValidationResult;
export declare function validateArray(value: unknown, fieldName: string, itemValidator?: (item: unknown) => FieldValidationResult): FieldValidationResult;
export declare function validateNumber(value: unknown, fieldName: string, min?: number, max?: number): FieldValidationResult;
export declare function validateTimestamp(value: unknown, fieldName: string): FieldValidationResult;
export declare function validateBaseEntity(entity: unknown): ValidationReport;
export interface TaskValidationData {
    id?: string;
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: Priority;
    labels?: string[];
    assignee?: string;
    estimatedHours?: number;
    createdAt?: string;
    updatedAt?: string;
}
export declare function validateTaskData(data: unknown): ValidationReport;
export declare function validateCollection<T>(items: unknown[], itemValidator: (item: unknown) => ValidationReport): ValidationReport;
export declare function sanitizeTaskData(data: unknown): TaskValidationData | null;
export declare function formatValidationErrors(report: ValidationReport): string;
//# sourceMappingURL=input-validation.d.ts.map