/**
 * Research Service - Migrated from legacy research system
 * 100% AI-Driven Multi-Agent Research System
 */
import { ResearchRequest } from '../../domain/entities/ResearchTypes.js';
export interface ResearchResponse {
    success: boolean;
    data?: string;
    error?: string;
    reportPath?: string;
    tasksCreated?: number;
}
export declare class ResearchService {
    private executeResearchUseCase;
    constructor();
    private getExecuteResearchUseCase;
    executeResearch(request: ResearchRequest): Promise<ResearchResponse>;
    getResearchHistory(): Promise<{
        success: boolean;
        data?: string[];
        error?: string;
    }>;
    getResearchStatus(): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
}
//# sourceMappingURL=ResearchService.d.ts.map