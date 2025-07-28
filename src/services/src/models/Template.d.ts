/**
 * Simplified Template Model
 * Consolidated from template-system domain
 */
import { Priority } from './Task.js';
export interface TemplateTask {
    title: string;
    description?: string;
    priority?: Priority;
    labels?: string[];
    points?: number;
    hours?: number;
    dependsOn?: string[];
    subtasks?: TemplateTask[];
}
export interface TemplateMetadata {
    version?: string;
    author?: string;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
}
export interface Template {
    id: string;
    name: string;
    description: string;
    tasks: TemplateTask[];
    variables: Record<string, string>;
    metadata: TemplateMetadata;
}
export interface CreateTemplateData {
    name: string;
    description: string;
    tasks: TemplateTask[];
    variables?: Record<string, string>;
    metadata?: Partial<TemplateMetadata>;
}
export interface ApplyTemplateData {
    templateName: string;
    variables: Record<string, string>;
}
export declare function generateTemplateId(name?: string): string;
export declare function createTemplate(data: CreateTemplateData): Template;
export declare function getTaskCount(template: Template): number;
export declare function processTemplateVariables(template: Template, values: Record<string, string>): Template;
