/**
 * Task Repository Interface
 * Simple repository interface for task persistence
 */
import { Task } from '../entities/Task.js';
import { Repository } from '../../shared/types.js';
export interface ITaskRepository extends Repository<Task> {
    findByStatus(status: string): Promise<Task[]>;
    findByAssignee(assignee: string): Promise<Task[]>;
    findByLabels(labels: string[]): Promise<Task[]>;
    countTotal(): Promise<number>;
}
//# sourceMappingURL=ITaskRepository.d.ts.map