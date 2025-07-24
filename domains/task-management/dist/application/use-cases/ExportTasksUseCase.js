/**
 * Export Tasks Use Case
 * Exports tasks to various formats for backup and data portability
 */
import { ProgressIndicator } from '../../shared/progress-indicator.js';
export class ExportTasksUseCase {
    taskRepository;
    constructor(taskRepository) {
        this.taskRepository = taskRepository;
    }
    async execute(request) {
        const progress = new ProgressIndicator('Loading tasks...');
        try {
            progress.start();
            progress.updateMessage('Loading tasks...');
            const tasks = await this.taskRepository.findAll();
            progress.updateMessage('Filtering tasks...');
            const filteredTasks = request.includeArchived
                ? tasks
                : tasks.filter(task => task.status !== 'archived');
            progress.updateMessage(`Formatting ${filteredTasks.length} tasks as ${request.format}...`);
            const exportData = this.formatTasks(filteredTasks, request.format);
            const exportPath = request.outputPath || this.generateExportPath(request.format);
            progress.updateMessage('Writing export file...');
            await this.writeExportFile(exportPath, exportData);
            progress.success(`Exported ${filteredTasks.length} tasks to ${exportPath}`);
            return {
                success: true,
                exportPath,
                taskCount: filteredTasks.length
            };
        }
        catch (error) {
            progress.error('Export failed');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Export failed'
            };
        }
    }
    formatTasks(tasks, format) {
        switch (format) {
            case 'json':
                return this.formatAsJson(tasks);
            case 'csv':
                return this.formatAsCsv(tasks);
            case 'markdown':
                return this.formatAsMarkdown(tasks);
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }
    formatAsJson(tasks) {
        const exportData = {
            exportedAt: new Date().toISOString(),
            version: '1.0',
            taskCount: tasks.length,
            tasks: tasks.map(task => ({
                id: task.id.value,
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                assignee: task.assignee,
                labels: task.labels,
                estimatedHours: task.estimatedHours,
                createdAt: task.createdAt.toISOString(),
                updatedAt: task.updatedAt.toISOString(),
                isArchived: task.status === 'archived'
            }))
        };
        return JSON.stringify(exportData, null, 2);
    }
    formatAsCsv(tasks) {
        const headers = ['ID', 'Title', 'Description', 'Status', 'Priority', 'Assignee', 'Labels', 'Estimated Hours', 'Created At', 'Updated At', 'Archived'];
        const rows = tasks.map(task => [
            task.id.value,
            `"${task.title.replace(/"/g, '""')}"`,
            `"${(task.description || '').replace(/"/g, '""')}"`,
            task.status,
            task.priority,
            task.assignee || '',
            `"${task.labels.join(', ')}"`,
            task.estimatedHours?.toString() || '',
            task.createdAt.toISOString(),
            task.updatedAt.toISOString(),
            (task.status === 'archived').toString()
        ]);
        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }
    formatAsMarkdown(tasks) {
        const lines = [
            '# Task Export',
            '',
            `**Exported:** ${new Date().toISOString()}`,
            `**Total Tasks:** ${tasks.length}`,
            '',
            '## Tasks',
            ''
        ];
        for (const task of tasks) {
            lines.push(`### ${task.title}`);
            lines.push('');
            lines.push(`- **ID:** ${task.id.value}`);
            lines.push(`- **Status:** ${task.status}`);
            lines.push(`- **Priority:** ${task.priority}`);
            if (task.assignee)
                lines.push(`- **Assignee:** ${task.assignee}`);
            if (task.estimatedHours)
                lines.push(`- **Estimated Hours:** ${task.estimatedHours}`);
            if (task.labels.length > 0)
                lines.push(`- **Labels:** ${task.labels.join(', ')}`);
            lines.push(`- **Created:** ${task.createdAt.toLocaleDateString()}`);
            lines.push(`- **Updated:** ${task.updatedAt.toLocaleDateString()}`);
            if (task.description) {
                lines.push('');
                lines.push('**Description:**');
                lines.push('');
                lines.push(task.description);
            }
            lines.push('');
            lines.push('---');
            lines.push('');
        }
        return lines.join('\n');
    }
    generateExportPath(format) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        return `critical-claude-export-${timestamp}.${format}`;
    }
    async writeExportFile(path, content) {
        const fs = await import('fs/promises');
        const pathModule = await import('path');
        // Resolve relative paths to absolute paths relative to current working directory
        const absolutePath = pathModule.isAbsolute(path)
            ? path
            : pathModule.resolve(process.cwd(), path);
        // Ensure directory exists
        const dirname = pathModule.dirname(absolutePath);
        await fs.mkdir(dirname, { recursive: true });
        // Write the file
        await fs.writeFile(absolutePath, content, 'utf-8');
    }
}
//# sourceMappingURL=ExportTasksUseCase.js.map