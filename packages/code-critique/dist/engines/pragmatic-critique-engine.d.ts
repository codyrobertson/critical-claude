/**
 * Pragmatic Critique Engine
 * Analyzes code for real problems that affect users, not theoretical violations
 */
import { WebSearchTool, CodeIssue } from './security-analyzer.js';
type SystemType = 'web_small' | 'web_large' | 'api' | 'enterprise' | 'startup' | 'unknown';
type CritiqueResult = {
    system_context: SystemType;
    deployment_verdict: 'BLOCKED' | 'CONDITIONAL' | 'APPROVED';
    critical_count: number;
    high_count: number;
    issues: CodeIssue[];
    good_decisions: string[];
    over_engineering_risks: string[];
    action_plan: {
        immediate: string[];
        next_sprint: string[];
        nice_to_have: string[];
        avoid: string[];
    };
};
export declare class PragmaticCritiqueEngine {
    private securityAnalyzer;
    private webSearchTool;
    constructor(webSearchTool?: WebSearchTool);
    /**
     * Analyze code with pragmatic context
     */
    analyzeCode(code: string, filename: string, context?: any): Promise<CritiqueResult>;
    private detectSystemType;
    private analyzeSecurity;
    private analyzePerformance;
    private analyzeArchitecture;
    private analyzeQuality;
    private detectOverEngineering;
    private identifyGoodDecisions;
    private generateActionPlan;
    private findLineNumber;
    /**
     * Enhance critique results with fact-checking via web search
     */
    private enhanceWithFactChecking;
    /**
     * Detect programming language from filename
     */
    private detectLanguage;
    /**
     * Extract dependencies from code
     */
    private extractDependencies;
    /**
     * Formats pragmatic feedback for MCP response
     */
    formatPragmaticFeedback(result: CritiqueResult): string;
}
export {};
//# sourceMappingURL=pragmatic-critique-engine.d.ts.map