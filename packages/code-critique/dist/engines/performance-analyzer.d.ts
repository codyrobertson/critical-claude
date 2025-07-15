/**
 * Performance Analyzer
 * Identifies performance bottlenecks and scalability issues
 */
export interface PerformanceIssue {
    type: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    location: {
        file: string;
        line: number;
    };
    description: string;
    impact: string;
    fix: string;
    complexity: 'simple' | 'moderate' | 'complex';
}
export declare class PerformanceAnalyzer {
    /**
     * Analyze code for performance issues
     */
    analyze(code: string, filename: string): PerformanceIssue[];
    private checkNestedLoops;
    private checkSynchronousOperations;
    private checkMemoryLeaks;
    private checkIneffientAlgorithms;
    private checkDatabaseQueries;
    private checkCaching;
    private getLineNumber;
}
//# sourceMappingURL=performance-analyzer.d.ts.map