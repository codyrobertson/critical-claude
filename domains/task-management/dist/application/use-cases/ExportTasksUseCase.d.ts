/**
 * Export Tasks Use Case
 * Exports tasks to various formats for backup and data portability
 */
import { ITaskRepository } from '../../domain/repositories/ITaskRepository.js';
export interface ExportTasksRequest {
    format: 'json' | 'csv' | 'markdown';
    includeArchived?: boolean;
    outputPath?: string;
}
export interface ExportTasksResponse {
    success: boolean;
    exportPath?: string;
    taskCount?: number;
    error?: string;
}
export declare class ExportTasksUseCase {
    private taskRepository;
    constructor(taskRepository: ITaskRepository);
    execute(request: ExportTasksRequest): Promise<ExportTasksResponse>;
    private formatTasks;
    private formatAsJson;
    private formatAsCsv;
    private formatAsMarkdown;
    private generateExportPath;
    private writeExportFile;
}
//# sourceMappingURL=ExportTasksUseCase.d.ts.map