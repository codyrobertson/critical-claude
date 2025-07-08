import { SystemComponent, ArchitectureDecision } from './types.js';
export declare class SystemDesignAnalyzer {
    analyzeArchitecture(rootPath: string): Promise<{
        components: SystemComponent[];
        decisions: ArchitectureDecision[];
        recommendations: string[];
    }>;
    private analyzeProjectStructure;
    private detectPatterns;
    private assessComplexity;
    private countFiles;
    analyzeSystemArchitecture(rootPath: string, focus?: string): Promise<any>;
    recommendTechStack(projectType: string, requirements: string[], teamExperience: string, constraints?: any): any;
}
//# sourceMappingURL=system-design-analyzer.d.ts.map