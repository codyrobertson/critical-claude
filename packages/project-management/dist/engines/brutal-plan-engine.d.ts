/**
 * Brutal Plan Engine - Reality-based project planning
 * Exposes hidden complexity and provides realistic timelines
 */
interface BrutalPlanRequest {
    requirement: string;
    estimatedDays?: number;
    context?: {
        teamSize?: number;
        hasDeadline?: boolean;
        techStack?: string[];
        projectType?: string;
        complexityFactors?: string[];
        efficiencyFactors?: string[];
        customMultiplier?: number;
        originalInput?: string;
    };
}
export declare class BrutalPlanEngine {
    private config;
    /**
     * Simple extraction - let the AI handle the complexity
     */
    extractRequirements(input: string): {
        requirement: string;
        estimatedDays: number;
        context: Partial<BrutalPlanRequest['context']>;
    };
    /**
     * Process natural language input using AI-style prompting
     * This simulates how an AI would understand and extract requirements
     */
    private processNaturalLanguageInput;
    /**
     * Analyze input as an AI would - understanding context, implications, and hidden complexity
     */
    private analyzeInputLikeAI;
    generatePlan(request: BrutalPlanRequest): Promise<{
        filename: string;
        content: string;
    }>;
    private analyzeRequirement;
    private calculateFinalMultiplier;
    private detectFeatureType;
    private extractTitle;
    private generateBrutalTruth;
    private getHiddenTasks;
    private getProductionRisks;
    private generatePhases;
    private getImplementationTasks;
    private buildMDX;
}
export {};
//# sourceMappingURL=brutal-plan-engine.d.ts.map