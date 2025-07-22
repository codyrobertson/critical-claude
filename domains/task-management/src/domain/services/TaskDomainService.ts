
/**
 * Task Domain Service
 * Encapsulates complex business logic that doesn't belong to a single entity
 */

import { Task, TaskId } from '../entities/Task.js';
import { Repository } from '../../shared/types.js';

export class TaskDomainService {
  constructor(
    private readonly taskRepository: Repository<Task>
  ) {}

  async calculateTaskDependencies(task: Task): Promise<Task[]> {
    const dependencies: Task[] = [];
    
    for (const depId of task.dependencies) {
      const dependency = await this.taskRepository.findById(depId.value);
      if (dependency) {
        dependencies.push(dependency);
      }
    }
    
    return dependencies;
  }

  async canCompleteTask(taskId: TaskId): Promise<boolean> {
    const task = await this.taskRepository.findById(taskId.value);
    if (!task) return false;

    // Check if all dependencies are complete
    const dependencies = await this.calculateTaskDependencies(task);
    return dependencies.every(dep => dep.isComplete());
  }

  async estimateTaskComplexity(task: Task): Promise<number> {
    // Business logic for complexity estimation
    let complexity = 1;
    
    // Factor in dependencies
    complexity += task.dependencies.length * 0.5;
    
    // Factor in estimated hours
    if (task.estimatedHours) {
      complexity += Math.log(task.estimatedHours);
    }
    
    // Factor in labels (certain labels indicate complexity)
    const complexLabels = ['backend', 'database', 'integration', 'security'];
    complexity += task.labels.filter(label => 
      complexLabels.includes(label.toLowerCase())
    ).length * 0.3;
    
    return Math.min(complexity, 10); // Cap at 10
  }

  async suggestRelatedTasks(task: Task): Promise<Task[]> {
    // Find tasks with similar labels or assignee
    const allTasks = await this.taskRepository.findAll();
    
    return allTasks.filter(t => 
      t.id.value !== task.id.value &&
      (
        t.assignee === task.assignee ||
        task.labels.some(label => t.labels.includes(label))
      )
    );
  }
}
