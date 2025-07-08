import { DataFlowAnalysis } from './types.js';
export declare class DataFlowAnalyzer {
    analyzeDataFlow(rootPath: string): Promise<DataFlowAnalysis>;
    private scanForDataNodes;
    private traceDataFlows;
    private identifyPatterns;
    private findBottlenecks;
    private generateRecommendations;
    private generateSummary;
    private scanDirectory;
    private isCodeFile;
    private detectDatabaseUsage;
    private identifyDatabaseType;
    private detectAPIEndpoints;
    private detectFramework;
    private detectCacheUsage;
    private detectCacheType;
}
//# sourceMappingURL=data-flow-analyzer.d.ts.map