/**
 * Create Task Use Case
 * Application service for creating new tasks
 */
import { Task, TaskId } from '../../domain/entities/Task.js';
export class CreateTaskUseCase {
    taskRepository;
    constructor(taskRepository) {
        this.taskRepository = taskRepository;
    }
    async execute(request) {
        try {
            // Validate business rules
            if (!request.title?.trim()) {
                return {
                    success: false,
                    error: 'Task title is required'
                };
            }
            // Create task entity with simple pattern
            const task = new Task(TaskId.generate(), request.title.trim(), request.description || '', 'todo', request.priority || 'medium', request.labels || [], new Date(), new Date(), request.assignee, request.estimatedHours, [], request.draft || false);
            // Persist via repository
            await this.taskRepository.save(task);
            return {
                success: true,
                task
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
}
//# sourceMappingURL=CreateTaskUseCase.js.map