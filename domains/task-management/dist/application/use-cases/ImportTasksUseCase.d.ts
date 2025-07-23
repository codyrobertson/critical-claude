/**
 * Import Tasks Use Case
 * Imports tasks from various formats for data migration and restoration
 */
import { ITaskRepository } from '../../domain/repositories/ITaskRepository.js';
export interface ImportTasksRequest {
    filePath: string;
    format?: 'json' | 'csv' | 'auto';
    mergeStrategy?: 'replace' | 'merge' | 'skip';
}
export interface ImportTasksResponse {
    success: boolean;
    importedCount?: number;
    skippedCount?: number;
    errors?: string[];
    summary?: string;
}
export declare class ImportTasksUseCase {
    private taskRepository;
    constructor(taskRepository: ITaskRepository);
    execute(request: ImportTasksRequest): Promise<ImportTasksResponse>;
    private readFile;
    private detectFormat;
    private parseContent;
    private parseJson;
    private parseCsv;
    private parseCsvRow;
    private importTasks;
}
//# sourceMappingURL=ImportTasksUseCase.d.ts.map