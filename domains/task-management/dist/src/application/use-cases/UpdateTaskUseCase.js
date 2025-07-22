/**
 * Update Task Use Case
 * Application service for updating existing tasks
 */
import { Task } from '../../domain/entities/Task.js';
export class UpdateTaskUseCase {
    taskRepository;
    constructor(taskRepository) {
        this.taskRepository = taskRepository;
    }
    async execute(request) {
        try {
            // Validate input
            if (!request.taskId?.trim()) {
                return {
                    success: false,
                    error: 'Task ID is required'
                };
            }
            // Find existing task
            const existingTask = await this.taskRepository.findById(request.taskId.trim());
            if (!existingTask) {
                return {
                    success: false,
                    error: `Task not found: ${request.taskId}`
                };
            }
            // Validate business rules
            if (request.title !== undefined && !request.title.trim()) {
                return {
                    success: false,
                    error: 'Task title cannot be empty'
                };
            }
            // Create updated task with immutable pattern
            const updatedTask = new Task(existingTask.id, request.title?.trim() ?? existingTask.title, request.description ?? existingTask.description, request.status ?? existingTask.status, request.priority ?? existingTask.priority, request.labels ?? existingTask.labels, existingTask.createdAt, new Date(), // Update timestamp
            request.assignee ?? existingTask.assignee, request.estimatedHours ?? existingTask.estimatedHours, existingTask.dependencies, existingTask.draft);
            // Validate task can be updated based on business rules
            if (existingTask.status === 'archived' && request.status !== 'archived') {
                return {
                    success: false,
                    error: 'Cannot modify archived tasks'
                };
            }
            // Save updated task
            await this.taskRepository.save(updatedTask);
            return {
                success: true,
                task: updatedTask
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
//# sourceMappingURL=UpdateTaskUseCase.js.map