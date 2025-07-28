/**
 * Canonical Domain Types - Single Source of Truth
 *
 * This file contains the authoritative type definitions for the entire application.
 * All other modules should import from this file to ensure consistency.
 */
export declare const PRIORITIES: readonly ["critical", "high", "medium", "low"];
export type Priority = typeof PRIORITIES[number];
export declare const TASK_STATUSES: readonly ["todo", "in_progress", "done", "blocked", "archived"];
export type TaskStatus = typeof TASK_STATUSES[number];
export declare const isPriority: (value: string) => value is Priority;
export declare const isTaskStatus: (value: string) => value is TaskStatus;
export declare const DEFAULT_PRIORITY: Priority;
export declare const DEFAULT_TASK_STATUS: TaskStatus;
export interface ValidationResult {
    isValid: boolean;
    error?: string;
}
export declare const validatePriority: (value: unknown) => ValidationResult;
export declare const validateTaskStatus: (value: unknown) => ValidationResult;
export type TaskId = string;
export type TemplateId = string;
export type ResearchId = string;
export type AnalyticsId = string;
export type Timestamp = string;
export interface BaseEntity {
    id: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface EntityReference {
    entityType: 'task' | 'template' | 'research' | 'analytics';
    entityId: string;
    relationshipType: 'created_by' | 'depends_on' | 'derived_from' | 'relates_to';
}
//# sourceMappingURL=domain-types.d.ts.map