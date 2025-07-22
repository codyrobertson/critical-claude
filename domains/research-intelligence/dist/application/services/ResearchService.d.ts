/**
 * Research Service
 * Simplified research service that delegates to legacy implementation
 */
import { Result } from '../../shared/types.js';
export interface ResearchRequest {
    query: string;
    files?: string[];
    outputFormat?: 'tasks' | 'report' | 'both';
    maxDepth?: number;
    teamSize?: number;
}
export interface ResearchResponse extends Result<string> {
    reportPath?: string;
    tasksCreated?: number;
}
export declare class ResearchService {
    executeResearch(request: ResearchRequest): Promise<ResearchResponse>;
    getResearchHistory(): Promise<Result<string[]>>;
}
//# sourceMappingURL=ResearchService.d.ts.map