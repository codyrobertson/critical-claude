/**
 * Archive Task Use Case
 * Application service for archiving tasks (soft delete)
 */
export class ArchiveTaskUseCase {
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
            // Business rule: Can't archive already archived tasks
            if (existingTask.status === 'archived') {
                return {
                    success: false,
                    error: 'Task is already archived'
                };
            }
            // Update task status to archived using domain method
            const archivedTask = existingTask.updateStatus('archived');
            // Save the archived task
            await this.taskRepository.save(archivedTask);
            return {
                success: true,
                archivedTask
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
//# sourceMappingURL=ArchiveTaskUseCase.js.map