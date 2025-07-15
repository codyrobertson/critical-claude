/**
 * Smart Security Analyzer that avoids false positives
 * Understands context like comments, strings, and example code
 */
export interface CodeIssue {
    type: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    location: {
        file: string;
        lines: number[];
    };
    critical_feedback: string;
    actual_impact: string;
    fix?: {
        description: string;
        working_code: string;
        complexity: 'simple' | 'moderate' | 'complex';
        roi: 'high' | 'medium' | 'low';
    };
}
export interface SecurityFinding {
    type: string;
    severity: string;
    description: string;
    vulnerability: string;
    cve?: string;
    source?: string;
}
export interface WebSearchTool {
    searchForVulnerabilities(code: string, context: string): Promise<SecurityFinding[]>;
    verifyBestPractices(pattern: string, language: string): Promise<BestPractice[]>;
    checkLibraryIssues(dependencies: string[]): Promise<LibraryIssue[]>;
}
export interface BestPractice {
    practice: string;
    recommendation: string;
    confidence: string;
    source?: string;
    lastUpdated?: string;
}
export interface LibraryIssue {
    library: string;
    vulnerability: string;
    severity: string;
    cve?: string;
    fixVersion?: string;
    advisory?: string;
    issues: string[];
    alternatives?: string[];
}
export declare class SecurityAnalyzer {
    private webSearchTool;
    constructor(webSearchTool?: WebSearchTool);
    /**
     * Check if a code snippet is within a comment or string literal
     */
    private isInCommentOrString;
    /**
     * Find actual vulnerable patterns, not example code
     */
    private findVulnerablePattern;
    /**
     * Get line number from position
     */
    private getLineNumber;
    /**
     * Analyze SQL injection vulnerabilities
     */
    analyzeSQLInjection(code: string, filename: string): CodeIssue[];
    /**
     * Analyze XSS vulnerabilities
     */
    analyzeXSS(code: string, filename: string): CodeIssue[];
    /**
     * Analyze code execution vulnerabilities
     */
    analyzeCodeExecution(code: string, filename: string): CodeIssue[];
    /**
     * Main analysis function
     */
    analyze(code: string, filename: string): Promise<CodeIssue[]>;
    /**
     * Convert web search findings to CodeIssue format
     */
    private convertWebFindings;
}
//# sourceMappingURL=security-analyzer.d.ts.map