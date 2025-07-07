/**
 * Shared type definitions for brutal-critique-mcp
 */
export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type IssueType = 'SECURITY' | 'PERFORMANCE' | 'ARCHITECTURE' | 'CODE_QUALITY' | 'TESTING';
export type SystemType = 'web_small' | 'web_large' | 'api' | 'enterprise' | 'startup' | 'unknown';
export interface CodeLocation {
    file: string;
    lines: number[];
    column?: number;
}
export interface CodeFix {
    description: string;
    working_code: string;
    complexity: 'simple' | 'moderate' | 'complex';
    roi: 'high' | 'medium' | 'low';
}
export interface CodeIssue {
    type: IssueType;
    severity: SeverityLevel;
    location: CodeLocation;
    brutal_feedback: string;
    actual_impact: string;
    fix: CodeFix;
}
export interface AnalysisResult {
    system_context: SystemType;
    deployment_verdict: string;
    critical_count: number;
    high_count: number;
    issues: CodeIssue[];
    good_decisions: string[];
    over_engineering_risks: string[];
    action_plan: string[];
}
export interface ArchitectureIssue {
    type: string;
    severity: SeverityLevel;
    description: string;
    impact: string;
    recommendation: string;
}
export interface PerformanceIssue {
    type: string;
    location: CodeLocation;
    impact: string;
    fix: string;
}
export interface ResourceLimits {
    maxFiles: number;
    maxFileSize: number;
    maxMemoryMB: number;
    maxDirectoryDepth: number;
}
export interface AnalysisConfig {
    resourceLimits: ResourceLimits;
    severityThresholds: {
        security: SeverityLevel;
        performance: SeverityLevel;
        architecture: SeverityLevel;
    };
    skipPatterns: string[];
}
//# sourceMappingURL=types.d.ts.map