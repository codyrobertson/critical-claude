/**
 * Project Detection Utility
 * Detects current project context and provides project-specific storage paths
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { logger } from './Logger.js';
export class ProjectDetection {
    static cache = new Map();
    /**
     * Detect the current project from the working directory
     */
    static async detectProject(workingDir = process.cwd()) {
        // Check cache first
        if (this.cache.has(workingDir)) {
            return this.cache.get(workingDir) || null;
        }
        logger.debug('Detecting project', { workingDir });
        let projectInfo = null;
        try {
            // 1. Try to detect Git repository
            projectInfo = await this.detectGitProject(workingDir);
            // 2. If no Git repo, try NPM/Node.js project
            if (!projectInfo) {
                projectInfo = await this.detectNpmProject(workingDir);
            }
            // 3. If no specific project type, use directory name
            if (!projectInfo) {
                projectInfo = await this.detectDirectoryProject(workingDir);
            }
        }
        catch (error) {
            logger.warn('Failed to detect project', { error, workingDir });
        }
        // Cache the result
        this.cache.set(workingDir, projectInfo);
        if (projectInfo) {
            logger.info('Project detected', projectInfo);
        }
        else {
            logger.debug('No project detected, using global storage');
        }
        return projectInfo;
    }
    /**
     * Get storage path for the current project
     */
    static async getProjectStoragePath(workingDir = process.cwd()) {
        const project = await this.detectProject(workingDir);
        const globalStorage = path.join(os.homedir(), '.critical-claude');
        if (!project) {
            return globalStorage;
        }
        // Project-specific storage: ~/.critical-claude/projects/{project-name}/
        const projectStorage = path.join(globalStorage, 'projects', project.storagePrefix);
        // Ensure project storage directory exists
        try {
            await fs.mkdir(projectStorage, { recursive: true });
            await fs.mkdir(path.join(projectStorage, 'tasks'), { recursive: true });
            await fs.mkdir(path.join(projectStorage, 'backups'), { recursive: true });
        }
        catch (error) {
            logger.warn('Failed to create project storage directory', { projectStorage, error });
            return globalStorage;
        }
        return projectStorage;
    }
    /**
     * List all known projects
     */
    static async listProjects() {
        const globalStorage = path.join(os.homedir(), '.critical-claude');
        const projectsDir = path.join(globalStorage, 'projects');
        try {
            const projectNames = await fs.readdir(projectsDir);
            const projects = [];
            for (const projectName of projectNames) {
                const projectPath = path.join(projectsDir, projectName);
                const stats = await fs.stat(projectPath);
                if (stats.isDirectory()) {
                    // Try to read project metadata
                    try {
                        const metadataPath = path.join(projectPath, '.project-info.json');
                        const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
                        projects.push(metadata);
                    }
                    catch {
                        // Create basic project info from directory name
                        projects.push({
                            name: projectName,
                            root: projectPath,
                            type: 'directory',
                            storagePrefix: projectName
                        });
                    }
                }
            }
            return projects;
        }
        catch (error) {
            logger.debug('No projects directory found or error reading projects', { error });
            return [];
        }
    }
    static async detectGitProject(workingDir) {
        let currentDir = workingDir;
        while (currentDir !== path.dirname(currentDir)) {
            try {
                const gitDir = path.join(currentDir, '.git');
                await fs.access(gitDir);
                // Found git repository
                const projectName = path.basename(currentDir);
                const storagePrefix = this.sanitizeProjectName(projectName);
                const projectInfo = {
                    name: projectName,
                    root: currentDir,
                    type: 'git',
                    storagePrefix
                };
                // Save project metadata
                await this.saveProjectMetadata(projectInfo);
                return projectInfo;
            }
            catch {
                // Continue searching up the directory tree
            }
            currentDir = path.dirname(currentDir);
        }
        return null;
    }
    static async detectNpmProject(workingDir) {
        let currentDir = workingDir;
        while (currentDir !== path.dirname(currentDir)) {
            try {
                const packageJsonPath = path.join(currentDir, 'package.json');
                const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
                const packageJson = JSON.parse(packageJsonContent);
                // Found NPM project
                const projectName = packageJson.name || path.basename(currentDir);
                const storagePrefix = this.sanitizeProjectName(projectName);
                const projectInfo = {
                    name: projectName,
                    root: currentDir,
                    type: 'npm',
                    storagePrefix
                };
                // Save project metadata
                await this.saveProjectMetadata(projectInfo);
                return projectInfo;
            }
            catch {
                // Continue searching up the directory tree
            }
            currentDir = path.dirname(currentDir);
        }
        return null;
    }
    static async detectDirectoryProject(workingDir) {
        // Use current directory name as project
        const projectName = path.basename(workingDir);
        // Skip common non-project directories
        const skipDirs = ['/', os.homedir(), 'tmp', 'temp', 'Downloads', 'Desktop', 'Documents'];
        if (skipDirs.includes(workingDir) || projectName.startsWith('.')) {
            return null;
        }
        const storagePrefix = this.sanitizeProjectName(projectName);
        const projectInfo = {
            name: projectName,
            root: workingDir,
            type: 'directory',
            storagePrefix
        };
        // Save project metadata
        await this.saveProjectMetadata(projectInfo);
        return projectInfo;
    }
    static sanitizeProjectName(name) {
        // Remove scoped package prefix and sanitize for filesystem
        return name
            .replace(/^@[^\/]+\//, '') // Remove @scope/
            .replace(/[^a-zA-Z0-9\-_]/g, '-') // Replace invalid chars with -
            .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
            .toLowerCase();
    }
    static async saveProjectMetadata(projectInfo) {
        try {
            const globalStorage = path.join(os.homedir(), '.critical-claude');
            const projectDir = path.join(globalStorage, 'projects', projectInfo.storagePrefix);
            const metadataPath = path.join(projectDir, '.project-info.json');
            await fs.mkdir(projectDir, { recursive: true });
            await fs.writeFile(metadataPath, JSON.stringify(projectInfo, null, 2), 'utf-8');
        }
        catch (error) {
            logger.warn('Failed to save project metadata', { projectInfo, error });
        }
    }
    /**
     * Clear project detection cache
     */
    static clearCache() {
        this.cache.clear();
    }
}
//# sourceMappingURL=ProjectDetection.js.map