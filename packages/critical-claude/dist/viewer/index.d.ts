/**
 * Task Viewer Entry Point
 * Main entry point for the terminal task viewer application
 */
import { LogLevel } from './infrastructure/logging/ConsoleLogger';
export * from './domain/entities/Task';
export * from './domain/value-objects/TaskId';
export * from './domain/value-objects/TaskStatus';
export * from './domain/value-objects/TaskPriority';
export * from './domain/value-objects/TaskMetadata';
export * from './domain/repositories/ITaskRepository';
export * from './application/ports/IEventBus';
export * from './application/ports/ILogger';
export * from './application/ports/ITerminalUI';
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