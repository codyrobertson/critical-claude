/**
 * Codebase Explorer for Brutal Critique MCP
 * Analyzes entire project structure to provide architectural insights
 */
export type FileInfo = {
    path: string;
    size: number;
    extension: string;
    type: 'source' | 'config' | 'test' | 'doc' | 'other';
};
export type DirectoryInfo = {
    path: string;
    fileCount: number;
    totalSize: number;
    subdirectories: string[];
};
export type CodebaseStructure = {
    rootPath: string;
    totalFiles: number;
    totalSize: number;
    filesByType: Map<string, FileInfo[]>;
    directories: DirectoryInfo[];
    mainLanguages: string[];
    frameworkIndicators: string[];
    architecturePatterns: string[];
};
export type ArchitecturalPlan = {
    title: string;
    currentState: {
        strengths: string[];
        weaknesses: string[];
        risks: string[];
    };
    recommendations: {
        immediate: string[];
        shortTerm: string[];
        longTerm: string[];
    };
    antiPatterns: string[];
    estimatedEffort: {
        immediate: string;
        shortTerm: string;
        longTerm: string;
    };
};
export declare class CodebaseExplorer {
    private readonly IGNORED_DIRS;
    private readonly SOURCE_EXTENSIONS;
    private readonly CONFIG_FILES;
    exploreCodebase(rootPath: string): Promise<CodebaseStructure>;
    private walkDirectory;
    private classifyFile;
    private static readonly LANGUAGE_CACHE;
    private detectLanguages;
    private detectFrameworks;
    private detectArchitecturePatterns;
    private extToLanguage;
    createCriticalPlan(structure: CodebaseStructure, issues: any[]): Promise<ArchitecturalPlan>;
}
//# sourceMappingURL=codebase-explorer.d.ts.map