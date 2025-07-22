/**
 * View Task Use Case
 * Application service for retrieving a single task by ID
 */
export class ViewTaskUseCase {
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
            // Find task by ID
            const task = await this.taskRepository.findById(request.taskId.trim());
            if (!task) {
                return {
                    success: false,
                    error: `Task not found: ${request.taskId}`
                };
            }
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
//# sourceMappingURL=ViewTaskUseCase.js.map