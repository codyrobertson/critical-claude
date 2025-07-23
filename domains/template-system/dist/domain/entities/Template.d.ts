/**
 * Template Entity
 * Represents a task template with variables and metadata
 */
export declare class TemplateId {
    private readonly _value;
    private constructor();
    static create(value: string): TemplateId;
    static generate(): TemplateId;
    get value(): string;
    equals(other: TemplateId): boolean;
}
export interface TemplateTask {
    title: string;
    description?: string;
    priority?: 'critical' | 'high' | 'medium' | 'low';
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
export declare class Template {
    readonly id: TemplateId;
    readonly name: string;
    readonly description: string;
    readonly tasks: TemplateTask[];
    readonly variables: Record<string, string>;
    readonly metadata: TemplateMetadata;
    constructor(id: TemplateId, name: string, description: string, tasks: TemplateTask[], variables: Record<string, string>, metadata: TemplateMetadata);
    static create(name: string, description: string, tasks: TemplateTask[], variables?: Record<string, string>, metadata?: Partial<TemplateMetadata>): Template;
    updateDescription(description: string): Template;
    addVariable(key: string, value: string): Template;
    getTaskCount(): number;
    processVariables(values: Record<string, string>): Template;
}
//# sourceMappingURL=Template.d.ts.map