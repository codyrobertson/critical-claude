/**
 * Get Task Stats Use Case
 * Application service for retrieving task statistics and metrics
 */
export class GetTaskStatsUseCase {
    taskRepository;
    constructor(taskRepository) {
        this.taskRepository = taskRepository;
    }
    async execute() {
        try {
            // Get all tasks
            const allTasks = await this.taskRepository.findAll();
            // Calculate basic counts
            const totalTasks = allTasks.length;
            const archivedTasks = allTasks.filter(task => task.status === 'archived').length;
            const activeTasks = totalTasks - archivedTasks;
            // Group by status
            const tasksByStatus = {
                todo: 0,
                in_progress: 0,
                done: 0,
                blocked: 0,
                archived: 0
            };
            // Group by priority  
            const tasksByPriority = {
                critical: 0,
                high: 0,
                medium: 0,
                low: 0
            };
            // Count tasks by status and priority
            for (const task of allTasks) {
                tasksByStatus[task.status]++;
                tasksByPriority[task.priority]++;
            }
            // Calculate completion rate (done / (total - archived))
            const completedTasks = tasksByStatus.done;
            const nonArchivedTasks = activeTasks;
            const completionRate = nonArchivedTasks > 0 ?
                Math.round((completedTasks / nonArchivedTasks) * 100) : 0;
            const stats = {
                totalTasks,
                archivedTasks,
                activeTasks,
                tasksByStatus,
                tasksByPriority,
                completionRate
            };
            return {
                success: true,
                stats
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
//# sourceMappingURL=GetTaskStatsUseCase.js.map