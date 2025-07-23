/**
 * Task Viewer Entry Point
 * Main entry point for the terminal task viewer application
 */
import { TaskViewerController } from './presentation/controllers/TaskViewerController.js';
import { ViewTasksUseCase } from './application/use-cases/ViewTasksUseCase.js';
import { SearchTasksUseCase } from './application/use-cases/SearchTasksUseCase.js';
import { UpdateTaskUseCase } from './application/use-cases/UpdateTaskUseCase.js';
import { TaskSubscriptionService } from './application/services/TaskSubscriptionService.js';
import { TaskRepositoryAdapter } from './infrastructure/data-access/TaskRepositoryAdapter.js';
import { EventEmitterBus } from './infrastructure/event-bus/EventEmitterBus.js';
import { DirectTerminalUI } from './infrastructure/terminal-ui/DirectTerminalUI.js';
import { SilentLogger } from './infrastructure/logging/SilentLogger.js';
import { LogLevel } from './infrastructure/logging/ConsoleLogger.js';
import { Task } from './domain/entities/Task.js';
import { TaskId } from './domain/value-objects/TaskId.js';
import { TaskStatus } from './domain/value-objects/TaskStatus.js';
import { TaskPriority } from './domain/value-objects/TaskPriority.js';
import { TaskMetadata } from './domain/value-objects/TaskMetadata.js';
// Export main types and interfaces for external use
export * from './domain/entities/Task.js';
export * from './domain/value-objects/TaskId.js';
export * from './domain/value-objects/TaskStatus.js';
export * from './domain/value-objects/TaskPriority.js';
export * from './domain/value-objects/TaskMetadata.js';
export * from './domain/repositories/ITaskRepository.js';
export * from './application/ports/IEventBus.js';
export * from './application/ports/ILogger.js';
export * from './application/ports/ITerminalUI.js';
// Main application class
export class TaskViewerApplication {
    controller = null;
    logger;
    terminalUI = null;
    constructor(logLevel = LogLevel.INFO) {
        this.logger = new SilentLogger(logLevel);
    }
    async start() {
        try {
            this.logger.info('Starting Task Viewer Application');
            // Initialize infrastructure
            const taskRepository = new TaskRepositoryAdapter();
            await taskRepository.initialize();
            const eventBus = new EventEmitterBus(this.logger);
            this.terminalUI = new DirectTerminalUI();
            // Initialize use cases
            const viewTasksUseCase = new ViewTasksUseCase(taskRepository, eventBus, this.logger);
            const searchTasksUseCase = new SearchTasksUseCase(taskRepository, this.logger);
            const updateTaskUseCase = new UpdateTaskUseCase(taskRepository, eventBus, this.logger);
            // Initialize services
            const subscriptionService = new TaskSubscriptionService(eventBus, taskRepository, this.logger);
            // Initialize controller
            this.controller = new TaskViewerController(viewTasksUseCase, searchTasksUseCase, updateTaskUseCase, subscriptionService, this.terminalUI, this.logger);
            // No need to seed - use existing tasks
            this.logger.info('Using existing Critical Claude tasks');
            // Start the application
            await this.controller.initialize();
            // Start render loop
            this.startRenderLoop();
            this.logger.info('Task Viewer Application started successfully');
        }
        catch (error) {
            this.logger.fatal('Failed to start application', error);
            throw error;
        }
    }
    stop() {
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
    startRenderLoop() {
        const render = () => {
            if (this.controller && this.terminalUI) {
                this.controller.render();
                this.terminalUI.refresh(); // Make sure content is displayed
                setImmediate(render); // Use setImmediate for better performance
            }
        };
        render();
    }
    async seedSampleData(repository) {
        const sampleTasks = [
            new Task(TaskId.generate(), 'Implement user authentication', 'Add JWT-based authentication to the API endpoints', TaskStatus.inProgress(), TaskPriority.high(), new TaskMetadata('backend', 'API Development', 240), new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            new Date(), undefined, new Set(['authentication', 'security', 'api']), []),
            new Task(TaskId.generate(), 'Write unit tests for TaskRepository', 'Create comprehensive unit tests for all repository methods', TaskStatus.pending(), TaskPriority.medium(), new TaskMetadata('testing', 'Quality Assurance', 180), new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            new Date(), undefined, new Set(['testing', 'repository', 'quality']), []),
            new Task(TaskId.generate(), 'Fix memory leak in event handler', 'Investigate and fix the memory leak in the event subscription system', TaskStatus.completed(), TaskPriority.critical(), new TaskMetadata('bug-fix', 'Performance', 120, 150), new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            new Date(), new Date(), new Set(['bug', 'performance', 'memory']), []),
            new Task(TaskId.generate(), 'Update documentation', 'Update README and API documentation with latest changes', TaskStatus.pending(), TaskPriority.low(), new TaskMetadata('documentation', 'Documentation', 60), new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
            new Date(), undefined, new Set(['documentation', 'readme']), []),
            new Task(TaskId.generate(), 'Implement fuzzy search', 'Add fuzzy search functionality to improve task searching', TaskStatus.blocked(), TaskPriority.high(), new TaskMetadata('feature', 'Search', 360), new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            new Date(), undefined, new Set(['search', 'feature', 'ux']), [])
        ];
        // Repository doesn't support seed - using existing tasks
    }
}
// CLI entry point  
if (import.meta.url === `file://${process.argv[1]}`) {
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
//# sourceMappingURL=index.js.map