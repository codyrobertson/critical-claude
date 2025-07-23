/**
 * Task Viewer Entry Point
 * Main entry point for the terminal task viewer application
 */
import { LogLevel } from './infrastructure/logging/ConsoleLogger.js';
export * from './domain/entities/Task.js';
export * from './domain/value-objects/TaskId.js';
export * from './domain/value-objects/TaskStatus.js';
export * from './domain/value-objects/TaskPriority.js';
export * from './domain/value-objects/TaskMetadata.js';
export * from './domain/repositories/ITaskRepository.js';
export * from './application/ports/IEventBus.js';
export * from './application/ports/ILogger.js';
export * from './application/ports/ITerminalUI.js';
export declare class TaskViewerApplication {
    private controller;
    private logger;
    private terminalUI;
    constructor(logLevel?: LogLevel);
    start(): Promise<void>;
    stop(): void;
    private startRenderLoop;
    private seedSampleData;
}
//# sourceMappingURL=index.d.ts.map