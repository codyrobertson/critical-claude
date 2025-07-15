/**
 * Project Initialization Wizard for Critical Claude
 * Helps users set up project-specific configuration and commands
 */
export type ProjectType = 'web-app' | 'cli-tool' | 'library' | 'api-service' | 'enterprise-app' | 'microservice' | 'monorepo' | 'unknown';
export interface ProjectConfig {
    name: string;
    type: ProjectType;
    language: string;
    framework?: string;
    teamSize?: number;
    userCount?: number;
    performanceRequirements?: {
        responseTime?: string;
        concurrentUsers?: number;
    };
    securityRequirements?: {
        level: 'basic' | 'standard' | 'high' | 'critical';
        compliance?: string[];
    };
}
export interface InitOptions {
    projectName?: string;
    interactive?: boolean;
}
export declare class InitWizard {
    private projectRoot;
    constructor(projectRoot?: string);
    /**
     * Run the initialization wizard
     */
    run(options?: InitOptions): Promise<void>;
    /**
     * Detect project type based on files present
     */
    detectProjectType(): Promise<ProjectType>;
    /**
     * Detect primary programming language
     */
    detectLanguage(): Promise<string>;
    /**
     * Detect framework based on language and dependencies
     */
    detectFramework(language: string): Promise<string | undefined>;
    /**
     * Create necessary directory structure
     */
    private createDirectoryStructure;
    /**
     * Generate project-specific configuration
     */
    private generateConfig;
    /**
     * Set up Claude commands for the project
     */
    private setupCommands;
    /**
     * Create CLAUDE.md for project-specific instructions
     */
    private createClaudeMd;
    /**
     * Create project metadata file
     */
    private createProjectMetadata;
    /**
     * Helper to check if file exists
     */
    private fileExists;
    /**
     * Get severity overrides based on project type
     */
    private getSeverityOverrides;
    /**
     * Get critical paths based on project type
     */
    private getCriticalPaths;
    /**
     * Get security focus areas based on project type
     */
    private getSecurityFocus;
    /**
     * Get performance requirements based on project type
     */
    private getPerformanceRequirements;
    /**
     * Get architecture patterns based on project type
     */
    private getArchitecturePatterns;
    private validateProjectRoot;
    private isPathWithinProject;
    private sanitizeConfig;
    private sanitizeString;
}
//# sourceMappingURL=init-wizard.d.ts.map