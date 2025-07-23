/**
 * Execute Research Use Case - Migrated from legacy research.ts
 * 100% AI-Driven Multi-Agent Research System
 */
import { ResearchRequest, ComprehensiveReport } from '../../domain/entities/ResearchTypes.js';
import { Result } from '../../shared/types.js';
export interface ExecuteResearchResponse extends Result<ComprehensiveReport> {
    reportPath?: string;
    tasksCreated?: number;
}
export declare class ExecuteResearchUseCase {
    private aiService;
    private webSearch;
    constructor();
    execute(request: ResearchRequest): Promise<ExecuteResearchResponse>;
    private createResearchPlan;
    private distributeResearchAssignments;
    private executeParallelResearch;
    private performCriticalAnalysis;
    private generateComprehensiveReport;
    private generateSearchQueries;
    private readInputFiles;
    private fileExists;
    private saveReport;
    private generateMarkdownReport;
    private createTasksFromReport;
}
//# sourceMappingURL=ExecuteResearchUseCase.d.ts.map