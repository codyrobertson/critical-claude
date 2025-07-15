/**
 * Web Search Tool for Critical Claude
 * Integrates with Exa MCP for grounding facts and searching for vulnerabilities
 */
export interface SecurityFinding {
    vulnerability: string;
    cve?: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    source: string;
    publishedDate?: string;
}
export interface BestPractice {
    practice: string;
    description: string;
    source: string;
    confidence: number;
}
export interface LibraryIssue {
    library: string;
    version?: string;
    issues: string[];
    alternatives?: string[];
    source: string;
}
export declare class WebSearchTool {
    private enabled;
    private searchDepth;
    constructor(config?: {
        enabled?: boolean;
        searchDepth?: string;
    });
    /**
     * Search for known vulnerabilities in code patterns
     */
    searchForVulnerabilities(code: string, context: string): Promise<SecurityFinding[]>;
    /**
     * Verify best practices against current standards
     */
    verifyBestPractices(pattern: string, language: string): Promise<BestPractice[]>;
    /**
     * Check for known issues with specific library versions
     */
    checkLibraryIssues(dependencies: string[]): Promise<LibraryIssue[]>;
    /**
     * Extract potential vulnerability patterns from code
     */
    private extractVulnerabilityPatterns;
    /**
     * Simulate Exa search results (to be replaced with actual Exa MCP calls)
     */
    private simulateExaSearch;
    /**
     * Parse security search results into findings
     */
    private parseSecurityResults;
    /**
     * Determine severity based on vulnerability type
     */
    private determineSeverity;
    /**
     * Extract practice from search result title
     */
    private extractPractice;
    /**
     * Calculate confidence score for a search result
     */
    private calculateConfidence;
    /**
     * Suggest alternative libraries
     */
    private suggestAlternatives;
    private sanitizeSearchQuery;
}
//# sourceMappingURL=web-search.d.ts.map