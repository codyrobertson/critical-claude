/**
 * Task Viewer Entry Point
 * Main entry point for the terminal task viewer application
 */

import { TaskViewerController } from './presentation/controllers/TaskViewerController';
import { ViewTasksUseCase } from './application/use-cases/ViewTasksUseCase';
import { SearchTasksUseCase } from './application/use-cases/SearchTasksUseCase';
import { UpdateTaskUseCase } from './application/use-cases/UpdateTaskUseCase';
import { TaskSubscriptionService } from './application/services/TaskSubscriptionService';
import { TaskRepositoryAdapter } from './infrastructure/data-access/TaskRepositoryAdapter';
import { EventEmitterBus } from './infrastructure/event-bus/EventEmitterBus';
import { BlessedTerminalUI } from './infrastructure/terminal-ui/BlessedTerminalUI';
import { ConsoleLogger, LogLevel } from './infrastructure/logging/ConsoleLogger';
import { Task } from './domain/entities/Task';
import { TaskId } from './domain/value-objects/TaskId';
import { TaskStatus } from './domain/value-objects/TaskStatus';
import { TaskPriority } from './domain/value-objects/TaskPriority';
import { TaskMetadata } from './domain/value-objects/TaskMetadata';

// Export main types and interfaces for external use
export * from './domain/entities/Task';
export * from './domain/value-objects/TaskId';
export * from './domain/value-objects/TaskStatus';
export * from './domain/value-objects/TaskPriority';
export * from './domain/value-objects/TaskMetadata';
export * from './domain/repositories/ITaskRepository';
export * from './application/ports/IEventBus';
export * from './application/ports/ILogger';
export * from './application/ports/ITerminalUI';

// Main application class
export class TaskViewerApplication {
  private controller: TaskViewerController | null = null;
  private logger: ConsoleLogger;
  private terminalUI: BlessedTerminalUI | null = null;

  constructor(logLevel: LogLevel = LogLevel.INFO) {
    this.logger = new ConsoleLogger(logLevel);
  }

  async start(): Promise<void> {
    try {
      this.logger.info('Starting Task Viewer Application');

      // Initialize infrastructure
      const taskRepository = new TaskRepositoryAdapter();
      await taskRepository.initialize();
      const eventBus = new EventEmitterBus(this.logger);
      this.terminalUI = new BlessedTerminalUI();

      // Initialize use cases
      const viewTasksUseCase = new ViewTasksUseCase(
        taskRepository,
        eventBus,
        this.logger
      );

      const searchTasksUseCase = new SearchTasksUseCase(
        taskRepository,
        this.logger
      );

      const updateTaskUseCase = new UpdateTaskUseCase(
        taskRepository,
        eventBus,
        this.logger
      );

      // Initialize services
      const subscriptionService = new TaskSubscriptionService(
        eventBus,
        taskRepository,
        this.logger
      );

      // Initialize controller
      this.controller = new TaskViewerController(
        viewTasksUseCase,
        searchTasksUseCase,
        updateTaskUseCase,
        subscriptionService,
        this.terminalUI,
        this.logger
      );

      // No need to seed - use existing tasks
      this.logger.info('Using existing Critical Claude tasks');

      // Start the application
      await this.controller.initialize();

      // Start render loop
      this.startRenderLoop();

      this.logger.info('Task Viewer Application started successfully');
    } catch (error) {
      this.logger.fatal('Failed to start application', error as Error);
      throw error;
    }
  }

  stop(): void {
    this.logger.info('Stopping Task Viewer Application');

    if (this.controller) {
      this.controller.dispose();
      this.controller = null;
    }

    if (this.terminalUI) {
      this.terminalUI.dispose();
      this.terminalUI = null;
    }

    this.logger.info('Task Viewer Application stopped');
  }

  private startRenderLoop(): void {
    const render = () => {
      if (this.controller) {
        this.controller.render();
        setImmediate(render); // Use setImmediate for better performance
      }
    };
    
    render();
  }

  private async seedSampleData(repository: TaskRepositoryAdapter): Promise<void> {
    const sampleTasks = [
      new Task(
        TaskId.generate(),
        'Implement user authentication',
        'Add JWT-based authentication to the API endpoints',
        TaskStatus.inProgress(),
        TaskPriority.high(),
        new TaskMetadata('backend', 'API Development', 240),
        new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        new Date(),
        undefined,
        new Set(['authentication', 'security', 'api']),
        []
      ),
      new Task(
        TaskId.generate(),
        'Write unit tests for TaskRepository',
        'Create comprehensive unit tests for all repository methods',
        TaskStatus.pending(),
        TaskPriority.medium(),
        new TaskMetadata('testing', 'Quality Assurance', 180),
        new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        new Date(),
        undefined,
        new Set(['testing', 'repository', 'quality']),
        []
      ),
      new Task(
        TaskId.generate(),
        'Fix memory leak in event handler',
        'Investigate and fix the memory leak in the event subscription system',
        TaskStatus.completed(),
        TaskPriority.critical(),
        new TaskMetadata('bug-fix', 'Performance', 120, 150),
        new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        new Date(),
        new Date(),
        new Set(['bug', 'performance', 'memory']),
        []
      ),
      new Task(
        TaskId.generate(),
        'Update documentation',
        'Update README and API documentation with latest changes',
        TaskStatus.pending(),
        TaskPriority.low(),
        new TaskMetadata('documentation', 'Documentation', 60),
        new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        new Date(),
        undefined,
        new Set(['documentation', 'readme']),
        []
      ),
      new Task(
        TaskId.generate(),
        'Implement fuzzy search',
        'Add fuzzy search functionality to improve task searching',
        TaskStatus.blocked(),
        TaskPriority.high(),
        new TaskMetadata('feature', 'Search', 360),
        new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        new Date(),
        undefined,
        new Set(['search', 'feature', 'ux']),
        []
      )
    ];

    // Repository doesn't support seed - using existing tasks
  }
}

// CLI entry point
if (require.main === module) {
  const app = new TaskViewerApplication();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    app.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    app.stop();
    process.exit(0);
  });

  // Start the application
  app.start().catch(error => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });
}