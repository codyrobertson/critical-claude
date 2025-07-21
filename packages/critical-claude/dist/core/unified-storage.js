/**
 * Unified Storage Manager - Single source of truth for all task data
 * Unified storage system replacing all fragmented task storage systems
 */
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
export class UnifiedStorageManager {
    config;
    initialized = false;
    constructor(config) {
        // Find the project root by looking for .critical-claude directory
        let basePath = process.cwd();
        let searchPath = basePath;
        // Search up to 5 levels for .critical-claude directory
        for (let i = 0; i < 5; i++) {
            const candidatePath = path.join(searchPath, '.critical-claude');
            try {
                const stats = fsSync.statSync(candidatePath);
                if (stats.isDirectory()) {
                    basePath = searchPath;
                    break;
                }
            }
            catch { }
            const parentPath = path.dirname(searchPath);
            if (parentPath === searchPath)
                break; // Reached root
            searchPath = parentPath;
        }
        this.config = {
            basePath: path.join(basePath, '.critical-claude'),
            migrationEnabled: true,
            backupEnabled: true,
            autoCleanup: false,
            ...config
        };
    }
    async initialize() {
        if (this.initialized)
            return;
        await this.ensureDirectories();
        if (this.config.migrationEnabled) {
            await this.migrateFromFragmentedStorage();
        }
        this.initialized = true;
    }
    async ensureDirectories() {
        const directories = [
            'tasks',
            'phases',
            'epics',
            'sprints',
            'archive',
            'backup',
            'temp'
        ];
        for (const dir of directories) {
            await fs.mkdir(path.join(this.config.basePath, dir), { recursive: true });
        }
    }
    async migrateFromFragmentedStorage() {
        const migrationSources = [
            // SimpleTaskManager storage
            path.join(process.cwd(), '.critical-claude-simple', 'tasks'),
            // Additional MCP simple storage paths that might exist
            path.join(process.cwd(), '.critical-claude', 'temp-tasks'),
        ];
        for (const sourcePath of migrationSources) {
            await this.migrateTasks(sourcePath);
        }
        // Clean up old directories after successful migration
        if (this.config.autoCleanup) {
            await this.cleanupOldDirectories();
        }
    }
    async migrateTasks(sourcePath) {
        try {
            const files = await fs.readdir(sourcePath);
            const targetPath = path.join(this.config.basePath, 'tasks');
            let migratedCount = 0;
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const sourceFile = path.join(sourcePath, file);
                    const targetFile = path.join(targetPath, file);
                    // Check if target exists to avoid conflicts
                    try {
                        await fs.access(targetFile);
                        console.warn(`Task conflict: ${file} exists in both locations - skipping migration`);
                        continue;
                    }
                    catch {
                        // File doesn't exist, safe to migrate
                    }
                    // Read and validate task before migration
                    try {
                        const taskData = await fs.readFile(sourceFile, 'utf-8');
                        const task = JSON.parse(taskData);
                        // Basic validation
                        if (!task.id || !task.title) {
                            console.warn(`Invalid task in ${file} - skipping migration`);
                            continue;
                        }
                        await fs.copyFile(sourceFile, targetFile);
                        migratedCount++;
                    }
                    catch (error) {
                        console.warn(`Failed to migrate ${file}: ${error.message}`);
                    }
                }
            }
            if (migratedCount > 0) {
                console.log(`Migrated ${migratedCount} tasks from ${sourcePath}`);
            }
        }
        catch (error) {
            // Source path doesn't exist, skip migration
        }
    }
    async cleanupOldDirectories() {
        const oldDirectories = [
            path.join(process.cwd(), '.critical-claude-simple'),
        ];
        for (const dir of oldDirectories) {
            try {
                await fs.rm(dir, { recursive: true, force: true });
                console.log(`Cleaned up old directory: ${dir}`);
            }
            catch {
                // Directory doesn't exist or can't be removed
            }
        }
    }
    // Task CRUD Operations
    async createTask(input) {
        await this.initialize();
        const taskId = this.generateTaskId();
        const now = new Date().toISOString();
        const task = {
            id: taskId,
            title: input.title,
            description: input.description || '',
            status: input.status || 'todo',
            priority: input.priority || 'medium',
            assignee: input.assignee,
            labels: input.labels || [],
            createdAt: now,
            updatedAt: now,
            sprintId: input.sprintId,
            epicId: input.epicId,
            phaseId: input.phaseId,
            storyPoints: input.storyPoints,
            estimatedHours: input.estimatedHours,
            dependencies: input.dependencies || [],
            draft: input.draft || false,
            aiGenerated: input.aiGenerated || false,
            source: input.source || 'manual'
        };
        await this.saveTask(task);
        return task;
    }
    async getTask(taskId) {
        await this.initialize();
        try {
            const taskPath = this.getTaskPath(taskId);
            const content = await fs.readFile(taskPath, 'utf-8');
            return JSON.parse(content);
        }
        catch {
            return null;
        }
    }
    async updateTask(input) {
        await this.initialize();
        const existingTask = await this.getTask(input.id);
        if (!existingTask) {
            return null;
        }
        const updatedTask = {
            ...existingTask,
            ...input,
            updatedAt: new Date().toISOString()
        };
        await this.saveTask(updatedTask);
        return updatedTask;
    }
    async deleteTask(taskId) {
        await this.initialize();
        try {
            const taskPath = this.getTaskPath(taskId);
            await fs.unlink(taskPath);
            return true;
        }
        catch {
            return false;
        }
    }
    async archiveTask(taskId) {
        await this.initialize();
        const task = await this.getTask(taskId);
        if (!task) {
            return null;
        }
        const archivedTask = {
            ...task,
            status: 'archived',
            archivedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        // Move to archive directory
        const archivePath = path.join(this.config.basePath, 'archive', `${taskId}.json`);
        await fs.writeFile(archivePath, JSON.stringify(archivedTask, null, 2));
        // Remove from active tasks
        await this.deleteTask(taskId);
        return archivedTask;
    }
    async listTasks(options = {}) {
        await this.initialize();
        const tasksDir = path.join(this.config.basePath, 'tasks');
        try {
            const files = await fs.readdir(tasksDir);
            const taskFiles = files.filter(f => f.endsWith('.json'));
            const tasks = [];
            for (const file of taskFiles) {
                try {
                    const content = await fs.readFile(path.join(tasksDir, file), 'utf-8');
                    const task = JSON.parse(content);
                    if (this.matchesFilter(task, options.filter)) {
                        tasks.push(task);
                    }
                }
                catch {
                    // Skip invalid task files
                }
            }
            // Include archived tasks if requested
            if (options.filter?.includeArchived) {
                const archivedTasks = await this.getArchivedTasks(options.filter);
                tasks.push(...archivedTasks);
            }
            // Sort tasks
            this.sortTasks(tasks, options.sortBy || 'updatedAt', options.sortOrder || 'desc');
            // Apply pagination
            const offset = options.offset || 0;
            const limit = options.limit || tasks.length;
            return tasks.slice(offset, offset + limit);
        }
        catch {
            return [];
        }
    }
    async getArchivedTasks(filter) {
        const archiveDir = path.join(this.config.basePath, 'archive');
        try {
            const files = await fs.readdir(archiveDir);
            const taskFiles = files.filter(f => f.endsWith('.json'));
            const tasks = [];
            for (const file of taskFiles) {
                try {
                    const content = await fs.readFile(path.join(archiveDir, file), 'utf-8');
                    const task = JSON.parse(content);
                    if (this.matchesFilter(task, filter)) {
                        tasks.push(task);
                    }
                }
                catch {
                    // Skip invalid task files
                }
            }
            return tasks;
        }
        catch {
            return [];
        }
    }
    matchesFilter(task, filter) {
        if (!filter)
            return true;
        // Status filter
        if (filter.status) {
            const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
            if (!statuses.includes(task.status))
                return false;
        }
        // Priority filter
        if (filter.priority) {
            const priorities = Array.isArray(filter.priority) ? filter.priority : [filter.priority];
            if (!priorities.includes(task.priority))
                return false;
        }
        // Assignee filter
        if (filter.assignee && task.assignee !== filter.assignee) {
            return false;
        }
        // Labels filter
        if (filter.labels && filter.labels.length > 0) {
            const hasMatchingLabel = filter.labels.some(label => task.labels.includes(label));
            if (!hasMatchingLabel)
                return false;
        }
        // Sprint filter
        if (filter.sprintId && task.sprintId !== filter.sprintId) {
            return false;
        }
        // Epic filter
        if (filter.epicId && task.epicId !== filter.epicId) {
            return false;
        }
        // Phase filter
        if (filter.phaseId && task.phaseId !== filter.phaseId) {
            return false;
        }
        // Draft filter
        if (!filter.includeDrafts && task.draft) {
            return false;
        }
        // AI generated filter
        if (filter.aiGenerated !== undefined && task.aiGenerated !== filter.aiGenerated) {
            return false;
        }
        // Claude Code sync filter
        if (filter.claudeCodeSynced !== undefined && task.claudeCodeSynced !== filter.claudeCodeSynced) {
            return false;
        }
        return true;
    }
    sortTasks(tasks, sortBy, sortOrder) {
        tasks.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'createdAt':
                    comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    break;
                case 'updatedAt':
                    comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
                    break;
                case 'priority':
                    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                    comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
                    break;
                case 'title':
                    comparison = a.title.localeCompare(b.title);
                    break;
                case 'status':
                    comparison = a.status.localeCompare(b.status);
                    break;
                default:
                    comparison = 0;
            }
            return sortOrder === 'desc' ? -comparison : comparison;
        });
    }
    async saveTask(task) {
        const taskPath = this.getTaskPath(task.id);
        await fs.writeFile(taskPath, JSON.stringify(task, null, 2));
    }
    generateTaskId() {
        return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    // Path utilities
    getTaskPath(taskId) {
        return path.join(this.config.basePath, 'tasks', `${taskId}.json`);
    }
    getSprintPath(sprintId) {
        return path.join(this.config.basePath, 'sprints', `${sprintId}.json`);
    }
    getEpicPath(epicId) {
        return path.join(this.config.basePath, 'epics', `${epicId}.json`);
    }
    getPhasePath(phaseId) {
        return path.join(this.config.basePath, 'phases', `${phaseId}.json`);
    }
    // Utility methods
    async getStats() {
        await this.initialize();
        const allTasks = await this.listTasks({ filter: { includeArchived: true } });
        const stats = {
            totalTasks: allTasks.filter(t => t.status !== 'archived').length,
            tasksByStatus: {},
            tasksByPriority: {},
            archivedTasks: allTasks.filter(t => t.status === 'archived').length
        };
        for (const task of allTasks) {
            if (task.status !== 'archived') {
                stats.tasksByStatus[task.status] = (stats.tasksByStatus[task.status] || 0) + 1;
                stats.tasksByPriority[task.priority] = (stats.tasksByPriority[task.priority] || 0) + 1;
            }
        }
        return stats;
    }
    async backup() {
        await this.initialize();
        if (!this.config.backupEnabled) {
            throw new Error('Backup is disabled in configuration');
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(this.config.basePath, 'backup', `backup-${timestamp}`);
        await fs.mkdir(backupDir, { recursive: true });
        // Copy all data directories
        const directories = ['tasks', 'phases', 'epics', 'sprints', 'archive'];
        for (const dir of directories) {
            const sourceDir = path.join(this.config.basePath, dir);
            const targetDir = path.join(backupDir, dir);
            try {
                await fs.mkdir(targetDir, { recursive: true });
                const files = await fs.readdir(sourceDir);
                for (const file of files) {
                    await fs.copyFile(path.join(sourceDir, file), path.join(targetDir, file));
                }
            }
            catch {
                // Directory doesn't exist, skip
            }
        }
        return backupDir;
    }
}
//# sourceMappingURL=unified-storage.js.map