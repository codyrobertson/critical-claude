import { MVPPlan } from './types.js';
export declare class MVPPlanner {
    generateMVPPlan(input: {
        projectName: string;
        description: string;
        targetUsers: string;
        constraints?: {
            budget?: number;
            timeline?: string;
            teamSize?: number;
        };
    }): MVPPlan;
    private identifyCoreFeatures;
    private recommendTechStack;
    private planPhases;
    private identifyRisks;
    private createTimeline;
    private generateArchitectureDecisions;
    formatMVPPlan(plan: MVPPlan): string;
}
//# sourceMappingURL=mvp-planner.d.ts.map