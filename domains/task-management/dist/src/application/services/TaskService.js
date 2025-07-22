/**
 * Task Service
 * High-level application service orchestrating task operations
 */
import { CreateTaskUseCase, ListTasksUseCase, ViewTaskUseCase, UpdateTaskUseCase, DeleteTaskUseCase, ArchiveTaskUseCase, GetTaskStatsUseCase } from '../use-cases/index.js';
export class TaskService {
    createTaskUseCase;
    listTasksUseCase;
    viewTaskUseCase;
    updateTaskUseCase;
    deleteTaskUseCase;
    archiveTaskUseCase;
    getTaskStatsUseCase;
    constructor(taskRepository) {
        this.createTaskUseCase = new CreateTaskUseCase(taskRepository);
        this.listTasksUseCase = new ListTasksUseCase(taskRepository);
        this.viewTaskUseCase = new ViewTaskUseCase(taskRepository);
        this.updateTaskUseCase = new UpdateTaskUseCase(taskRepository);
        this.deleteTaskUseCase = new DeleteTaskUseCase(taskRepository);
        this.archiveTaskUseCase = new ArchiveTaskUseCase(taskRepository);
        this.getTaskStatsUseCase = new GetTaskStatsUseCase(taskRepository);
    }
    // Core task operations
    async createTask(request) {
        return this.createTaskUseCase.execute(request);
    }
    async listTasks(request) {
        return this.listTasksUseCase.execute(request);
    }
    async viewTask(request) {
        return this.viewTaskUseCase.execute(request);
    }
    async updateTask(request) {
        return this.updateTaskUseCase.execute(request);
    }
    async deleteTask(request) {
        return this.deleteTaskUseCase.execute(request);
    }
    async archiveTask(request) {
        return this.archiveTaskUseCase.execute(request);
    }
    async getStats() {
        return this.getTaskStatsUseCase.execute();
    }
    // Convenience methods for common operations
    async getActiveTaskCount() {
        const response = await this.listTasks({ includeArchived: false });
        return response.success ? response.count || 0 : 0;
    }
    async getTasksByPriority(priority) {
        const response = await this.listTasks({ priority, includeArchived: false });
        return response.success ? response.tasks || [] : [];
    }
    async getTasksByAssignee(assignee) {
        const response = await this.listTasks({ assignee, includeArchived: false });
        return response.success ? response.tasks || [] : [];
    }
}
//# sourceMappingURL=TaskService.js.map