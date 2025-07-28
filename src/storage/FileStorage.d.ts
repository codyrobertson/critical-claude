/**
 * Simplified File Storage
 * Replaces all Repository patterns with direct file operations + caching
 * Enhanced with file locking for concurrent access safety
 */
export declare class FileStorage {
    private basePath?;
    private cache;
    private loadedCollections;
    private fileLocks;
    private resolvedBasePath?;
    constructor(basePath?: string | undefined);
    /**
     * Get the resolved base path (project-aware or global)
     */
    private getBasePath;
    /**
     * Retry mechanism with exponential backoff for critical operations
     */
    private withRetry;
    ensureDirectory(): Promise<void>;
    private getCollectionPath;
    private getLockPath;
    private acquireLock;
    private createLock;
    private releaseLock;
    private ensureCollectionLoaded;
    private loadTasksFromDirectory;
    private loadUnifiedCollection;
    private saveCollectionToDisk;
    private saveTasksToDirectory;
    private saveUnifiedCollection;
    save<T extends {
        id: string;
    }>(collection: string, id: string, item: T): Promise<void>;
    findById<T>(collection: string, id: string): Promise<T | null>;
    findAll<T>(collection: string): Promise<T[]>;
    find<T>(collection: string, predicate: (item: T) => boolean): Promise<T[]>;
    delete(collection: string, id: string): Promise<boolean>;
    count(collection: string): Promise<number>;
    clear(collection: string): Promise<void>;
    backup(): Promise<string>;
    saveAll<T extends {
        id: string;
    }>(collection: string, items: T[]): Promise<void>;
    exists(collection: string, id: string): Promise<boolean>;
}
//# sourceMappingURL=FileStorage.d.ts.map