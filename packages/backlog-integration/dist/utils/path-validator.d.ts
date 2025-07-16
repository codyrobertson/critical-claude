/**
 * Path Validator - Detect directory/configuration mismatches
 * Prevents issues like UI reading from different .critical-claude directories
 */
export interface PathValidationResult {
    isValid: boolean;
    warnings: string[];
    recommendations: string[];
    detectedPaths: string[];
}
export declare class PathValidator {
    /**
     * Detect multiple .critical-claude directories that could cause conflicts
     */
    static detectCriticalClaudeDirectories(rootPath?: string): Promise<string[]>;
    /**
     * Validate that task operations will use the expected directory
     */
    static validateTaskDirectory(): Promise<PathValidationResult>;
    /**
     * Display validation results with colors
     */
    static displayValidationResults(results: PathValidationResult): void;
    /**
     * Quick diagnostic command for troubleshooting
     */
    static runDiagnostic(): Promise<void>;
}
export default PathValidator;
//# sourceMappingURL=path-validator.d.ts.map