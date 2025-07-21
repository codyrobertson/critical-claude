/**
 * Task Viewer Controller
 * Orchestrates the interaction between views and use cases
 */

import { IViewTasksUseCase } from '../../application/use-cases/ViewTasksUseCase.js';
import { ISearchTasksUseCase } from '../../application/use-cases/SearchTasksUseCase.js';
import { IUpdateTaskUseCase } from '../../application/use-cases/UpdateTaskUseCase.js';
import { ITaskSubscriptionService } from '../../application/services/TaskSubscriptionService.js';
import { TaskListView } from '../views/TaskListView.js';
import { TaskDetailView } from '../views/TaskDetailView.js';
import { SearchView, SearchResult } from '../views/SearchView.js';
import { TaskViewModelMapper } from '../view-models/TaskViewModel.js';
import { ITerminalUI, Dimensions } from '../../application/ports/ITerminalUI.js';
import { ILogger } from '../../application/ports/ILogger.js';
import { Task } from '../../domain/entities/Task.js';
import { TaskFilter, TaskSort } from '../../domain/repositories/ITaskRepository.js';

export interface ViewLayout {
  type: 'single' | 'split-horizontal' | 'split-vertical';
  activePane: 'left' | 'right' | 'top' | 'bottom';
}

export class TaskViewerController {
  private taskListView: TaskListView;
  private taskDetailView: TaskDetailView;
  private searchView: SearchView;
  private layout: ViewLayout = { type: 'single', activePane: 'left' };
  private dimensions: Dimensions;
  private isSearchMode: boolean = false;
  private currentFilter?: TaskFilter;
  private currentSort?: TaskSort;

  constructor(
    private readonly viewTasksUseCase: IViewTasksUseCase,
    private readonly searchTasksUseCase: ISearchTasksUseCase,
    private readonly updateTaskUseCase: IUpdateTaskUseCase,
    private readonly subscriptionService: ITaskSubscriptionService,
    private readonly terminalUI: ITerminalUI,
    private readonly logger: ILogger
  ) {
    this.dimensions = this.terminalUI.getDimensions();
    
    // Initialize views
    this.taskListView = new TaskListView(terminalUI, logger);
    this.taskDetailView = new TaskDetailView(terminalUI, logger);
    this.searchView = new SearchView(terminalUI, logger);
    
    this.setupViews();
    this.setupEventHandlers();
    this.setupSubscriptions();
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing TaskViewerController');
    
    await Promise.all([
      this.taskListView.initialize(),
      this.taskDetailView.initialize(),
      this.searchView.initialize()
    ]);

    await this.loadTasks();
    this.updateLayout();
    this.taskListView.show();
    this.taskListView.focus();
  }

  private setupViews(): void {
    // Setup search view callbacks
    this.searchView.onSearch(async (query) => {
      await this.handleSearch(query);
    });

    this.searchView.onSelect((task) => {
      this.selectTask(TaskViewModelMapper.toViewModel(task as any));
      this.exitSearchMode();
    });
  }

  private setupEventHandlers(): void {
    // Handle terminal resize
    this.terminalUI.onResize((dimensions) => {
      this.dimensions = dimensions;
      this.updateLayout();
    });

    // Handle global key bindings
    this.terminalUI.onKeyPress((key, modifiers) => {
      this.handleGlobalKeyPress(key, modifiers);
    });
  }

  private setupSubscriptions(): void {
    // Subscribe to all task changes
    this.subscriptionService.subscribeToAllTasks((tasks) => {
      const viewModels = TaskViewModelMapper.toViewModels(tasks);
      this.taskListView.setTasks(viewModels);
    });
  }

  private async loadTasks(): Promise<void> {
    try {
      const response = await this.viewTasksUseCase.execute({
        filter: this.currentFilter,
        sort: this.currentSort,
        page: 1,
        pageSize: 100
      });

      const viewModels = TaskViewModelMapper.toViewModels(response.tasks);
      this.taskListView.setTasks(viewModels);
    } catch (error) {
      this.logger.error('Failed to load tasks', error as Error);
    }
  }

  private async handleSearch(query: string): Promise<void> {
    try {
      const response = await this.searchTasksUseCase.execute({
        query,
        limit: 20
      });

      const results: SearchResult[] = response.tasks.map(task => ({
        task: TaskViewModelMapper.toViewModel(task),
        score: 1, // TODO: Implement proper scoring
        highlights: [] // TODO: Implement highlighting
      }));

      this.searchView.setResults(results);
    } catch (error) {
      this.logger.error('Search failed', error as Error);
    }
  }

  private handleGlobalKeyPress(key: string, modifiers: any): void {
    // Debug logging
    this.logger.debug('Global key press', { key, modifiers });
    
    // Let focused view handle the key first
    const focusedView = this.getFocusedView();
    if (focusedView && focusedView.onKeyPress(key, modifiers)) {
      return;
    }

    // Handle global shortcuts
    switch (key) {
      case '/':
        this.enterSearchMode();
        break;
      
      case 'Tab':
        this.switchFocus();
        break;
      
      case '1':
        this.setLayout({ type: 'single', activePane: 'left' });
        break;
      
      case '2':
        this.setLayout({ type: 'split-horizontal', activePane: 'left' });
        break;
      
      case '3':
        this.setLayout({ type: 'split-vertical', activePane: 'top' });
        break;
      
      case 'q':
        if (modifiers.ctrl) {
          this.dispose();
          process.exit(0);
        }
        break;
    }
  }

  private getFocusedView() {
    if (this.isSearchMode) return this.searchView;
    
    switch (this.layout.activePane) {
      case 'left':
      case 'top':
        return this.taskListView;
      case 'right':
      case 'bottom':
        return this.taskDetailView;
    }
  }

  private enterSearchMode(): void {
    this.isSearchMode = true;
    this.searchView.show();
    this.searchView.focus();
    this.taskListView.blur();
    this.taskDetailView.blur();
  }

  private exitSearchMode(): void {
    this.isSearchMode = false;
    this.searchView.hide();
    this.taskListView.focus();
  }

  private selectTask(task: any): void {
    this.taskDetailView.setTask(task);
    
    if (this.layout.type !== 'single') {
      this.taskDetailView.show();
    }
  }

  private switchFocus(): void {
    if (this.layout.type === 'single') return;

    if (this.layout.activePane === 'left' || this.layout.activePane === 'top') {
      this.layout.activePane = this.layout.type === 'split-horizontal' ? 'right' : 'bottom';
      this.taskListView.blur();
      this.taskDetailView.focus();
    } else {
      this.layout.activePane = this.layout.type === 'split-horizontal' ? 'left' : 'top';
      this.taskDetailView.blur();
      this.taskListView.focus();
    }
  }

  private setLayout(layout: ViewLayout): void {
    this.layout = layout;
    this.updateLayout();
  }

  private updateLayout(): void {
    const { width, height } = this.dimensions;

    switch (this.layout.type) {
      case 'single':
        this.taskListView.setPosition({ x: 0, y: 0 });
        this.taskListView.setDimensions({ width, height });
        this.taskDetailView.hide();
        break;
      
      case 'split-horizontal':
        const halfWidth = Math.floor(width / 2);
        this.taskListView.setPosition({ x: 0, y: 0 });
        this.taskListView.setDimensions({ width: halfWidth, height });
        this.taskDetailView.setPosition({ x: halfWidth, y: 0 });
        this.taskDetailView.setDimensions({ width: halfWidth, height });
        this.taskDetailView.show();
        break;
      
      case 'split-vertical':
        const halfHeight = Math.floor(height / 2);
        this.taskListView.setPosition({ x: 0, y: 0 });
        this.taskListView.setDimensions({ width, height: halfHeight });
        this.taskDetailView.setPosition({ x: 0, y: halfHeight });
        this.taskDetailView.setDimensions({ width, height: halfHeight });
        this.taskDetailView.show();
        break;
    }

    // Search view is always centered
    const searchWidth = Math.min(80, width - 10);
    const searchHeight = Math.min(20, height - 10);
    const searchX = Math.floor((width - searchWidth) / 2);
    const searchY = Math.floor((height - searchHeight) / 2);
    
    this.searchView.setPosition({ x: searchX, y: searchY });
    this.searchView.setDimensions({ width: searchWidth, height: searchHeight });
  }

  render(): void {
    const listState = this.taskListView.getState();
    if (listState.needsRedraw) {
      this.taskListView.render();
    }
    
    if (this.taskDetailView.getState().isVisible && 
        this.taskDetailView.getState().needsRedraw) {
      this.taskDetailView.render();
    }
    
    if (this.searchView.getState().isVisible && 
        this.searchView.getState().needsRedraw) {
      this.searchView.render();
    }
  }

  dispose(): void {
    this.taskListView.dispose();
    this.taskDetailView.dispose();
    this.searchView.dispose();
    this.terminalUI.dispose();
  }
}