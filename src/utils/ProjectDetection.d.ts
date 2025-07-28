/**
 * Project Detection Utility
 * Detects current project context and provides project-specific storage paths
 */
export interface ProjectInfo {
    name: string;
    root: string;
    type: 'git' | 'npm' | 'directory';
    storagePrefix: string;
}
export declare class ProjectDetection {
    private static cache;
    /**
     * Detect the current project from the working directory
     */
    static detectProject(workingDir?: string): Promise<ProjectInfo | null>;
    /**
     * Get storage path for the current project
     */
    static getProjectStoragePath(workingDir?: string): Promise<string>;
    /**
     * List all known projects
     */
    static listProjects(): Promise<ProjectInfo[]>;
    private static detectGitProject;
    private static detectNpmProject;
    private static detectDirectoryProject;
    private static sanitizeProjectName;
    private static saveProjectMetadata;
    /**
     * Clear project detection cache
     */
    static clearCache(): void;
}
//# sourceMappingURL=ProjectDetection.d.ts.map