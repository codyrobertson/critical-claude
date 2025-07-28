/**
 * Simplified File Storage
 * Replaces all Repository patterns with direct file operations + caching
 * Enhanced with file locking for concurrent access safety
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../utils/Logger.js';
import { ProjectDetection } from '../utils/ProjectDetection.js';
export class FileStorage {
    basePath;
    cache = new Map();
    loadedCollections = new Set();
    fileLocks = new Map();
    resolvedBasePath;
    constructor(basePath) {
        this.basePath = basePath;
    }
    /**
     * Get the resolved base path (project-aware or global)
     */
    async getBasePath() {
        if (this.resolvedBasePath) {
            return this.resolvedBasePath;
        }
        if (this.basePath) {
            this.resolvedBasePath = this.basePath;
        }
        else {
            // Use project-aware storage
            this.resolvedBasePath = await ProjectDetection.getProjectStoragePath();
            logger.debug('Using project-aware storage', { path: this.resolvedBasePath });
        }
        return this.resolvedBasePath;
    }
    /**
     * Retry mechanism with exponential backoff for critical operations
     */
    async withRetry(operation, operationName, maxRetries = 3, baseDelay = 100) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await operation();
                if (attempt > 1) {
                    logger.info(`${operationName} succeeded on attempt ${attempt}`);
                }
                return result;
            }
            catch (error) {
                lastError = error;
                logger.warn(`${operationName} failed on attempt ${attempt}`, { error: lastError.message });
                if (attempt === maxRetries) {
                    logger.error(`${operationName} failed after ${maxRetries} attempts`, lastError);
                    break;
                }
                // Exponential backoff: wait 100ms, 200ms, 400ms, etc.
                const delay = baseDelay * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw lastError || new Error(`${operationName} failed after ${maxRetries} attempts`);
    }
    async ensureDirectory() {
        const basePath = await this.getBasePath();
        await this.withRetry(async () => {
            try {
                await fs.mkdir(basePath, { recursive: true });
            }
            catch (error) {
                if (error.code !== 'EEXIST') {
                    throw new Error(`Failed to create directory ${basePath}: ${error}`);
                }
            }
        }, 'ensureDirectory');
    }
    async getCollectionPath(collection) {
        const basePath = await this.getBasePath();
        return path.join(basePath, `${collection}.json`);
    }
    async getLockPath(collection) {
        const basePath = await this.getBasePath();
        return path.join(basePath, `.${collection}.lock`);
    }
    async acquireLock(collection) {
        const lockPath = await this.getLockPath(collection);
        const existingLock = this.fileLocks.get(collection);
        if (existingLock) {
            await existingLock;
        }
        const lockPromise = this.createLock(lockPath);
        this.fileLocks.set(collection, lockPromise);
        await lockPromise;
    }
    async createLock(lockPath) {
        const maxRetries = 10;
        const retryDelay = 50; // ms
        for (let i = 0; i < maxRetries; i++) {
            try {
                // Try to create lock file exclusively
                await fs.writeFile(lockPath, process.pid.toString(), { flag: 'wx' });
                return;
            }
            catch (error) {
                if (error.code === 'EEXIST') {
                    // Check if lock file is stale (process no longer exists)
                    try {
                        const lockContent = await fs.readFile(lockPath, 'utf8');
                        const lockPid = parseInt(lockContent);
                        // Check if process still exists
                        try {
                            process.kill(lockPid, 0); // Signal 0 tests if process exists
                        }
                        catch {
                            // Process doesn't exist, remove stale lock
                            await fs.unlink(lockPath);
                            continue; // Retry acquiring lock
                        }
                    }
                    catch {
                        // Couldn't read lock file, remove it
                        try {
                            await fs.unlink(lockPath);
                        }
                        catch {
                            // Ignore unlink errors
                        }
                        continue;
                    }
                    // Wait and retry
                    await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)));
                }
                else {
                    throw error;
                }
            }
        }
        throw new Error(`Failed to acquire lock for ${lockPath} after ${maxRetries} attempts`);
    }
    async releaseLock(collection) {
        const lockPath = await this.getLockPath(collection);
        try {
            await fs.unlink(lockPath);
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                console.warn(`Failed to release lock ${lockPath}:`, error.message);
            }
        }
        this.fileLocks.delete(collection);
    }
    async ensureCollectionLoaded(collection) {
        if (this.loadedCollections.has(collection))
            return;
        // Use directory-based storage for tasks to match main CLI
        if (collection === 'tasks') {
            await this.loadTasksFromDirectory();
        }
        else {
            await this.loadUnifiedCollection(collection);
        }
        this.loadedCollections.add(collection);
    }
    async loadTasksFromDirectory() {
        try {
            const basePath = await this.getBasePath();
            const tasksDir = path.join(basePath, 'tasks');
            await this.withRetry(async () => {
                await fs.mkdir(tasksDir, { recursive: true });
            }, 'createTasksDirectory');
            const collectionCache = new Map();
            try {
                const files = await fs.readdir(tasksDir);
                const taskFiles = files.filter(f => f.endsWith('.json') && !f.startsWith('.'));
                logger.debug(`Loading ${taskFiles.length} task files from directory`, { tasksDir });
                for (const file of taskFiles) {
                    try {
                        const filePath = path.join(tasksDir, file);
                        const content = await fs.readFile(filePath, 'utf-8');
                        const task = JSON.parse(content);
                        if (task.id) {
                            collectionCache.set(task.id, task);
                        }
                    }
                    catch (error) {
                        logger.warn(`Failed to load task file ${file}`, error);
                    }
                }
            }
            catch (error) {
                logger.debug('Tasks directory not found or empty, starting with empty collection');
            }
            this.cache.set('tasks', collectionCache);
            logger.info(`Loaded ${collectionCache.size} tasks from individual files`, { tasksDir });
        }
        catch (error) {
            logger.error('Failed to load tasks from directory', error);
            this.cache.set('tasks', new Map());
        }
    }
    async loadUnifiedCollection(collection) {
        const collectionPath = await this.getCollectionPath(collection);
        try {
            await this.withRetry(async () => {
                const data = await fs.readFile(collectionPath, 'utf8');
                const items = JSON.parse(data);
                const collectionCache = new Map();
                if (Array.isArray(items)) {
                    // Array format - index by id
                    items.forEach((item) => {
                        if (item.id) {
                            collectionCache.set(item.id, item);
                        }
                    });
                }
                else if (typeof items === 'object' && items !== null) {
                    // Object format - use keys as ids
                    Object.entries(items).forEach(([id, item]) => {
                        collectionCache.set(id, item);
                    });
                }
                this.cache.set(collection, collectionCache);
            }, `loadCollection-${collection}`);
        }
        catch (error) {
            // File doesn't exist or is invalid, start with empty collection
            logger.debug(`Collection ${collection} not found or invalid, starting with empty collection`);
            this.cache.set(collection, new Map());
        }
    }
    async saveCollectionToDisk(collection) {
        await this.acquireLock(collection);
        try {
            await this.ensureDirectory();
            if (collection === 'tasks') {
                await this.saveTasksToDirectory();
            }
            else {
                await this.saveUnifiedCollection(collection);
            }
        }
        finally {
            await this.releaseLock(collection);
        }
    }
    async saveTasksToDirectory() {
        const basePath = await this.getBasePath();
        const tasksDir = path.join(basePath, 'tasks');
        await fs.mkdir(tasksDir, { recursive: true });
        const collectionCache = this.cache.get('tasks');
        if (!collectionCache)
            return;
        for (const [taskId, task] of collectionCache.entries()) {
            const taskPath = path.join(tasksDir, `${taskId}.json`);
            await this.withRetry(async () => {
                const tempPath = `${taskPath}.tmp`;
                await fs.writeFile(tempPath, JSON.stringify(task, null, 2), 'utf8');
                await fs.rename(tempPath, taskPath);
            }, `saveTask-${taskId}`);
        }
        logger.debug(`Saved ${collectionCache.size} tasks to individual files`, { tasksDir });
    }
    async saveUnifiedCollection(collection) {
        const collectionCache = this.cache.get(collection);
        if (!collectionCache)
            return;
        const items = Array.from(collectionCache.values());
        const collectionPath = await this.getCollectionPath(collection);
        // Use retry mechanism for critical file write operations
        await this.withRetry(async () => {
            // Write to temporary file first, then atomic rename
            const tempPath = `${collectionPath}.tmp`;
            await fs.writeFile(tempPath, JSON.stringify(items, null, 2), 'utf8');
            await fs.rename(tempPath, collectionPath);
        }, `saveCollection-${collection}`);
    }
    async save(collection, id, item) {
        await this.ensureCollectionLoaded(collection);
        const collectionCache = this.cache.get(collection);
        collectionCache.set(id, item);
        await this.saveCollectionToDisk(collection);
    }
    async findById(collection, id) {
        await this.ensureCollectionLoaded(collection);
        const collectionCache = this.cache.get(collection);
        const item = collectionCache.get(id);
        return item ? item : null;
    }
    async findAll(collection) {
        await this.ensureCollectionLoaded(collection);
        const collectionCache = this.cache.get(collection);
        return Array.from(collectionCache.values());
    }
    async find(collection, predicate) {
        const allItems = await this.findAll(collection);
        return allItems.filter(predicate);
    }
    async delete(collection, id) {
        await this.ensureCollectionLoaded(collection);
        const collectionCache = this.cache.get(collection);
        const existed = collectionCache.has(id);
        if (existed) {
            collectionCache.delete(id);
            // For tasks, also delete the individual file
            if (collection === 'tasks') {
                try {
                    const basePath = await this.getBasePath();
                    const taskPath = path.join(basePath, 'tasks', `${id}.json`);
                    await fs.unlink(taskPath);
                    logger.debug(`Deleted task file: ${taskPath}`);
                }
                catch (error) {
                    logger.warn(`Failed to delete task file for ${id}`, error);
                }
            }
            else {
                await this.saveCollectionToDisk(collection);
            }
        }
        return existed;
    }
    async count(collection) {
        await this.ensureCollectionLoaded(collection);
        const collectionCache = this.cache.get(collection);
        return collectionCache.size;
    }
    async clear(collection) {
        await this.ensureCollectionLoaded(collection);
        const collectionCache = this.cache.get(collection);
        collectionCache.clear();
        await this.saveCollectionToDisk(collection);
    }
    async backup() {
        await this.ensureDirectory();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const basePath = await this.getBasePath();
        const backupPath = path.join(basePath, `backup-${timestamp}.json`);
        const backup = {};
        // Load all collections and create backup
        for (const collection of Array.from(this.loadedCollections)) {
            backup[collection] = await this.findAll(collection);
        }
        // Also check for collections not yet loaded
        try {
            const files = await fs.readdir(basePath);
            const jsonFiles = files.filter(f => f.endsWith('.json') && !f.startsWith('backup-'));
            for (const file of jsonFiles) {
                const collection = path.basename(file, '.json');
                if (!backup[collection]) {
                    backup[collection] = await this.findAll(collection);
                }
            }
        }
        catch (error) {
            console.warn('Could not read directory for backup:', error);
        }
        // Use retry mechanism for critical backup write operation
        await this.withRetry(async () => {
            await fs.writeFile(backupPath, JSON.stringify(backup, null, 2), 'utf8');
        }, 'backup-write');
        return backupPath;
    }
    // Utility methods for common operations
    async saveAll(collection, items) {
        await this.ensureCollectionLoaded(collection);
        const collectionCache = this.cache.get(collection);
        collectionCache.clear();
        items.forEach(item => {
            collectionCache.set(item.id, item);
        });
        await this.saveCollectionToDisk(collection);
    }
    async exists(collection, id) {
        await this.ensureCollectionLoaded(collection);
        const collectionCache = this.cache.get(collection);
        return collectionCache.has(id);
    }
}
