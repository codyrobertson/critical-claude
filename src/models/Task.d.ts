/**
 * Simplified Task Model
 * Consolidated from task-management and user-interface domains
 */
import { Priority, TaskStatus, BaseEntity } from '../../shared/domain-types';
export { Priority, TaskStatus } from '../../shared/domain-types';
export interface Task extends BaseEntity {
    title: string;
    description: string;
    status: TaskStatus;
    priority: Priority;
    labels: string[];
    assignee?: string;
    estimatedHours?: number;
    draft?: boolean;
}
export interface CreateTaskData {
    title: string;
    description?: string;
    priority?: Priority;
    status?: TaskStatus;
    assignee?: string;
    labels?: string[];
    estimatedHours?: number;
}
export interface UpdateTaskData {
    title?: string;
    description?: string;
    priority?: Priority;
    status?: TaskStatus;
    assignee?: string;
    labels?: string[];
    estimatedHours?: number;
}
export interface TaskFilters {
    status?: TaskStatus;
    priority?: Priority;
    assignee?: string;
    labels?: string[];
}
export declare function generateTaskId(title?: string): string;
export declare function createTask(data: CreateTaskData): Task;
export declare function updateTask(task: Task, updates: UpdateTaskData): Task;
export declare function applyFilters(tasks: Task[], filters: TaskFilters): Task[];
//# sourceMappingURL=Task.d.ts.map