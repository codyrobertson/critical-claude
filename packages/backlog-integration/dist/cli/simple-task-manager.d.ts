/**
 * Simple Task Manager - Simplified data flow for small teams (5 users)
 * Removes the complex Phase > Epic > Sprint hierarchy for direct task management
 */
export interface SimpleTask {
    id: string;
    title: string;
    description: string;
    status: 'todo' | 'in-progress' | 'blocked' | 'done' | 'archived';
    priority: 'low' | 'medium' | 'high' | 'critical';
    assignee?: string;
    storyPoints: number;
    labels: string[];
    dueDate?: Date;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}
export interface SimpleConfig {
    tasksPath: string;
    maxActiveTasks: number;
    autoArchiveDays: number;
}
export declare class SimpleTaskManager {
    private config;
    constructor(config?: Partial<SimpleConfig>);
    initialize(): Promise<void>;
    createTask(taskData: Partial<SimpleTask>): Promise<SimpleTask>;
    listTasks(filters?: {
        status?: string;
        assignee?: string;
        priority?: string;
        labels?: string[];
    }): Promise<SimpleTask[]>;
    getTask(id: string): Promise<SimpleTask | null>;
    updateTask(taskId: string, updates: Partial<SimpleTask>): Promise<SimpleTask>;
    deleteTask(taskId: string): Promise<void>;
    getStats(): Promise<{
        totalTasks: number;
        todoTasks: number;
        inProgressTasks: number;
        doneTasks: number;
        blockedTasks: number;
        overdueTasks: number;
        averageStoryPoints: number;
    }>;
    archiveOldTasks(): Promise<number>;
    getTasksByAssignee(): Promise<Record<string, SimpleTask[]>>;
    private saveTask;
}
//# sourceMappingURL=simple-task-manager.d.ts.map