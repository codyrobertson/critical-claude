/**
 * Critical Claude Task Repository
 * Integrates with the existing Critical Claude task storage
 */
import { Task } from '../../domain/entities/Task';
import { TaskId } from '../../domain/value-objects/TaskId';
import { TaskStatus } from '../../domain/value-objects/TaskStatus';
import { TaskPriority } from '../../domain/value-objects/TaskPriority';
import { TaskMetadata } from '../../domain/value-objects/TaskMetadata';
import { UnifiedStorageManager } from '../../../core/unified-storage';
export class CriticalClaudeTaskRepository {
    storage;
    initialized = false;
    constructor() {
        this.storage = new UnifiedStorageManager();
    }
    async initialize() {
        if (!this.initialized) {
            await this.storage.initialize();
            this.initialized = true;
        }
    }
    async getById(id) {
        await this.initialize();
        const commonTask = await this.storage.getTask(id.value);
        return commonTask ? this.convertFromCommonTask(commonTask) : null;
    }
    async getAll() {
        await this.initialize();
        const tasks = await this.storage.listTasks({
            filter: { includeArchived: false },
            sortBy: 'updatedAt',
            sortOrder: 'desc',
            plain: false
        });
        return tasks.map(task => this.convertFromCommonTask(task));
    }
    async save(task) {
        await this.initialize();
        // Convert to CommonTask format
        const commonTask = this.convertToCommonTask(task);
        // Check if task exists
        const existing = await this.storage.getTask(task.id.value);
        if (existing) {
            // Update existing task
            await this.storage.updateTask({
                id: task.id.value,
                title: commonTask.title,
                description: commonTask.description,
                status: commonTask.status,
                priority: commonTask.priority,
                assignee: commonTask.assignee,
                labels: Array.from(commonTask.labels),
                storyPoints: commonTask.storyPoints,
                estimatedHours: commonTask.estimatedHours,
                actualHours: commonTask.actualHours
            });
        }
        else {
            // Create new task
            await this.storage.createTask({
                title: commonTask.title,
                description: commonTask.description,
                status: commonTask.status,
                priority: commonTask.priority,
                assignee: commonTask.assignee,
                labels: Array.from(commonTask.labels),
                storyPoints: commonTask.storyPoints,
                estimatedHours: commonTask.estimatedHours,
                draft: false,
                aiGenerated: false,
                source: 'manual'
            });
        }
    }
    async delete(id) {
        await this.initialize();
        await this.storage.deleteTask(id.value);
    }
    async search(query) {
        await this.initialize();
        // Get all tasks and filter in memory
        const allTasks = await this.getAll();
        const lowerQuery = query.toLowerCase();
        return allTasks.filter(task => task.title.toLowerCase().includes(lowerQuery) ||
            (task.description?.toLowerCase().includes(lowerQuery) ?? false) ||
            Array.from(task.labels).some(label => label.toLowerCase().includes(lowerQuery)));
    }
    async getByStatus(status) {
        await this.initialize();
        const tasks = await this.storage.listTasks({
            filter: {
                status: this.mapStatusToString(status),
                includeArchived: false
            },
            sortBy: 'updatedAt',
            sortOrder: 'desc',
            plain: false
        });
        return tasks.map(task => this.convertFromCommonTask(task));
    }
    async getByPriority(priority) {
        await this.initialize();
        const tasks = await this.storage.listTasks({
            filter: {
                priority: this.mapPriorityToString(priority),
                includeArchived: false
            },
            sortBy: 'updatedAt',
            sortOrder: 'desc',
            plain: false
        });
        return tasks.map(task => this.convertFromCommonTask(task));
    }
    async getByAssignee(assignee) {
        await this.initialize();
        const tasks = await this.storage.listTasks({
            filter: {
                assignee,
                includeArchived: false
            },
            sortBy: 'updatedAt',
            sortOrder: 'desc',
            plain: false
        });
        return tasks.map(task => this.convertFromCommonTask(task));
    }
    async getByLabel(label) {
        await this.initialize();
        const tasks = await this.storage.listTasks({
            filter: {
                labels: [label],
                includeArchived: false
            },
            sortBy: 'updatedAt',
            sortOrder: 'desc',
            plain: false
        });
        return tasks.map(task => this.convertFromCommonTask(task));
    }
    async count() {
        await this.initialize();
        const stats = await this.storage.getStats();
        return stats.totalTasks - stats.archivedTasks;
    }
    async seed(tasks) {
        // Not needed - use existing task system
    }
    // Conversion helpers
    convertFromCommonTask(commonTask) {
        return new Task(new TaskId(commonTask.id), commonTask.title, commonTask.description || '', this.mapStringToStatus(commonTask.status), this.mapStringToPriority(commonTask.priority), new TaskMetadata(commonTask.assignee || 'unassigned', commonTask.epicId || 'General', commonTask.estimatedHours || 0, commonTask.actualHours), new Date(commonTask.createdAt), new Date(commonTask.updatedAt), commonTask.completedAt ? new Date(commonTask.completedAt) : undefined, new Set(commonTask.labels), commonTask.dependencies || []);
    }
    convertToCommonTask(task) {
        return {
            id: task.id.value,
            title: task.title,
            description: task.description || undefined,
            status: this.mapStatusToString(task.status),
            priority: this.mapPriorityToString(task.priority),
            assignee: task.metadata.assignee !== 'unassigned' ? task.metadata.assignee : undefined,
            labels: Array.from(task.labels),
            storyPoints: task.metadata.estimatedHours ? Math.ceil(task.metadata.estimatedHours / 4) : undefined,
            estimatedHours: task.metadata.estimatedHours || undefined,
            actualHours: task.metadata.actualHours || undefined,
            dependencies: task.dependencies.length > 0 ? task.dependencies : undefined,
            draft: false,
            archivedAt: undefined,
            aiGenerated: false,
            createdAt: task.createdAt.toISOString(),
            updatedAt: task.updatedAt.toISOString(),
            completedAt: task.completedAt?.toISOString(),
            source: 'manual'
        };
    }
    mapStatusToString(status) {
        if (status.equals(TaskStatus.pending()))
            return 'todo';
        if (status.equals(TaskStatus.inProgress()))
            return 'in_progress';
        if (status.equals(TaskStatus.completed()))
            return 'done';
        if (status.equals(TaskStatus.blocked()))
            return 'blocked';
        return 'todo';
    }
    mapStringToStatus(status) {
        switch (status) {
            case 'todo': return TaskStatus.pending();
            case 'in_progress': return TaskStatus.inProgress();
            case 'done': return TaskStatus.completed();
            case 'blocked': return TaskStatus.blocked();
            default: return TaskStatus.pending();
        }
    }
    mapPriorityToString(priority) {
        if (priority.equals(TaskPriority.critical()))
            return 'critical';
        if (priority.equals(TaskPriority.high()))
            return 'high';
        if (priority.equals(TaskPriority.medium()))
            return 'medium';
        if (priority.equals(TaskPriority.low()))
            return 'low';
        return 'medium';
    }
    mapStringToPriority(priority) {
        switch (priority) {
            case 'critical': return TaskPriority.critical();
            case 'high': return TaskPriority.high();
            case 'medium': return TaskPriority.medium();
            case 'low': return TaskPriority.low();
            default: return TaskPriority.medium();
        }
    }
}
//# sourceMappingURL=CriticalClaudeTaskRepository.js.map