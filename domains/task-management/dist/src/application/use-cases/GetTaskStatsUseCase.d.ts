/**
 * Get Task Stats Use Case
 * Application service for retrieving task statistics and metrics
 */
import { Task } from '../../domain/entities/Task.js';
import { Priority, TaskStatus, Repository } from '../../../../../shared/common-types.js';
export interface TaskStats {
    totalTasks: number;
    archivedTasks: number;
    activeTasks: number;
    tasksByStatus: Record<TaskStatus, number>;
    tasksByPriority: Record<Priority, number>;
    completionRate: number;
}
export interface GetTaskStatsResponse {
    success: boolean;
    stats?: TaskStats;
    error?: string;
}
export declare class GetTaskStatsUseCase {
    private readonly taskRepository;
    constructor(taskRepository: Repository<Task>);
    execute(): Promise<GetTaskStatsResponse>;
}
//# sourceMappingURL=GetTaskStatsUseCase.d.ts.map