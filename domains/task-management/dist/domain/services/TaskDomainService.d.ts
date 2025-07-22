/**
 * Task Domain Service
 * Encapsulates complex business logic that doesn't belong to a single entity
 */
import { Task, TaskId } from '../entities/Task.js';
import { Repository } from '../../shared/types.js';
export declare class TaskDomainService {
    private readonly taskRepository;
    constructor(taskRepository: Repository<Task>);
    calculateTaskDependencies(task: Task): Promise<Task[]>;
    canCompleteTask(taskId: TaskId): Promise<boolean>;
    estimateTaskComplexity(task: Task): Promise<number>;
    suggestRelatedTasks(task: Task): Promise<Task[]>;
}
//# sourceMappingURL=TaskDomainService.d.ts.map