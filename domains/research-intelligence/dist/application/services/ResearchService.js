/**
 * Research Service - Migrated from legacy research system
 * 100% AI-Driven Multi-Agent Research System
 */
import { ExecuteResearchUseCase } from '../use-cases/ExecuteResearchUseCase.js';
export class ResearchService {
    executeResearchUseCase = null;
    constructor() {
        // Lazy-load the use case only when needed for AI operations
    }
    getExecuteResearchUseCase() {
        if (!this.executeResearchUseCase) {
            this.executeResearchUseCase = new ExecuteResearchUseCase();
        }
        return this.executeResearchUseCase;
    }
    async executeResearch(request) {
        try {
            const result = await this.getExecuteResearchUseCase().execute(request);
            if (result.success && result.data) {
                return {
                    success: true,
                    data: result.data.executive_summary || 'Research completed successfully',
                    reportPath: result.reportPath,
                    tasksCreated: result.tasksCreated
                };
            }
            else {
                return {
                    success: false,
                    error: result.error || 'Research execution failed'
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    async getResearchHistory() {
        // This would integrate with research repository to get history
        // For now, return empty history
        return {
            success: true,
            data: []
        };
    }
    async getResearchStatus() {
        return {
            success: true,
            data: {
                system: 'AI-Driven Multi-Agent Research System',
                status: 'operational',
                agents: ['Planner', 'Coordinator', 'Researchers', 'Analyst', 'Synthesizer']
            }
        };
    }
}
//# sourceMappingURL=ResearchService.js.map