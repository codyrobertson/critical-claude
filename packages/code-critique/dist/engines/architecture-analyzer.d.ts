/**
 * Architecture Analyzer
 * Analyzes code architecture and identifies anti-patterns based on context
 */
export interface ArchitectureContext {
    teamSize?: number;
    userCount?: number;
    currentProblems?: string[];
}
export interface ArchitectureIssue {
    pattern: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    impact: string;
    recommendation: string;
}
export declare class ArchitectureAnalyzer {
    /**
     * Analyze architecture based on problem size
     */
    analyzeArchitecture(code: string, filename: string, context: ArchitectureContext): {
        issues: ArchitectureIssue[];
        overEngineering: string[];
        goodPatterns: string[];
    };
    private estimateSystemSize;
    private checkSmallSystemOverEngineering;
    private checkLargeSystemUnderEngineering;
    private detectArchitecturalPatterns;
    private detectAntiPatterns;
    private calculateSimilarity;
}
//# sourceMappingURL=architecture-analyzer.d.ts.map