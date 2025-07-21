/**
 * Task View Model
 * Transforms domain entities for presentation layer
 */
import { Task } from '../../domain/entities/Task';
export interface TaskViewModel {
    id: string;
    title: string;
    description: string;
    status: string;
    statusIcon: string;
    statusColor: string;
    priority: string;
    priorityIcon: string;
    priorityColor: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
    duration?: string;
    hasSubtasks: boolean;
    subtaskCount: number;
    isOverdue: boolean;
    progress: number;
}
export declare class TaskViewModelMapper {
    private static readonly STATUS_ICONS;
    private static readonly STATUS_COLORS;
    private static readonly PRIORITY_ICONS;
    private static readonly PRIORITY_COLORS;
    static toViewModel(task: Task): TaskViewModel;
    static toViewModels(tasks: Task[]): TaskViewModel[];
    private static formatDate;
    private static calculateDuration;
    private static calculateProgress;
    private static checkIfOverdue;
}
//# sourceMappingURL=TaskViewModel.d.ts.map