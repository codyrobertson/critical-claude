/**
 * Research Project Entity
 * Represents a research project with query, findings, and metadata
 */
export declare class ResearchId {
    private readonly _value;
    private constructor();
    static create(value: string): ResearchId;
    static generate(): ResearchId;
    get value(): string;
    equals(other: ResearchId): boolean;
}
export interface ResearchQuery {
    query: string;
    files?: string[];
    maxDepth?: number;
    teamSize?: number;
    outputFormat?: 'tasks' | 'report' | 'both';
}
export interface ResearchFinding {
    area: string;
    summary: string;
    insights: string[];
    sources: string[];
    confidence: number;
}
export interface ResearchReport {
    executiveSummary: string;
    findings: ResearchFinding[];
    methodology: string;
    conclusions: string[];
    recommendations: string[];
    nextSteps: string[];
    qualityScore: number;
}
export interface ResearchMetadata {
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    duration?: number;
    researcher?: string;
}
export declare class ResearchProject {
    readonly id: ResearchId;
    readonly query: ResearchQuery;
    readonly report: ResearchReport | null;
    readonly metadata: ResearchMetadata;
    constructor(id: ResearchId, query: ResearchQuery, report: ResearchReport | null, metadata: ResearchMetadata);
    static create(query: ResearchQuery, researcher?: string): ResearchProject;
    startResearch(): ResearchProject;
    completeResearch(report: ResearchReport): ResearchProject;
    failResearch(error: string): ResearchProject;
    isCompleted(): boolean;
    getDuration(): number;
    getFormattedDuration(): string;
    generateTasksFromReport(): any[];
}
//# sourceMappingURL=ResearchProject.d.ts.map