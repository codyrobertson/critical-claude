/**
 * Task Viewer Controller
 * Orchestrates the interaction between views and use cases
 */
import { IViewTasksUseCase } from '../../application/use-cases/ViewTasksUseCase';
import { ISearchTasksUseCase } from '../../application/use-cases/SearchTasksUseCase';
import { IUpdateTaskUseCase } from '../../application/use-cases/UpdateTaskUseCase';
import { ITaskSubscriptionService } from '../../application/services/TaskSubscriptionService';
import { ITerminalUI } from '../../application/ports/ITerminalUI';
import { ILogger } from '../../application/ports/ILogger';
export interface ViewLayout {
    type: 'single' | 'split-horizontal' | 'split-vertical';
    activePane: 'left' | 'right' | 'top' | 'bottom';
}
export declare class TaskViewerController {
    private readonly viewTasksUseCase;
    private readonly searchTasksUseCase;
    private readonly updateTaskUseCase;
    private readonly subscriptionService;
    private readonly terminalUI;
    private readonly logger;
    private taskListView;
    private taskDetailView;
    private searchView;
    private layout;
    private dimensions;
    private isSearchMode;
    private currentFilter?;
    private currentSort?;
    constructor(viewTasksUseCase: IViewTasksUseCase, searchTasksUseCase: ISearchTasksUseCase, updateTaskUseCase: IUpdateTaskUseCase, subscriptionService: ITaskSubscriptionService, terminalUI: ITerminalUI, logger: ILogger);
    initialize(): Promise<void>;
    private setupViews;
    private setupEventHandlers;
    private setupSubscriptions;
    private loadTasks;
    private handleSearch;
    private handleGlobalKeyPress;
    private getFocusedView;
    private enterSearchMode;
    private exitSearchMode;
    private selectTask;
    private switchFocus;
    private setLayout;
    private updateLayout;
    render(): void;
    dispose(): void;
}
//# sourceMappingURL=TaskViewerController.d.ts.map