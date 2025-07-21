/**
 * Task Viewer Controller
 * Orchestrates the interaction between views and use cases
 */
import { TaskListView } from '../views/TaskListView.js';
import { TaskDetailView } from '../views/TaskDetailView.js';
import { SearchView } from '../views/SearchView.js';
import { TaskViewModelMapper } from '../view-models/TaskViewModel.js';
export class TaskViewerController {
    viewTasksUseCase;
    searchTasksUseCase;
    updateTaskUseCase;
    subscriptionService;
    terminalUI;
    logger;
    taskListView;
    taskDetailView;
    searchView;
    layout = { type: 'single', activePane: 'left' };
    dimensions;
    isSearchMode = false;
    currentFilter;
    currentSort;
    constructor(viewTasksUseCase, searchTasksUseCase, updateTaskUseCase, subscriptionService, terminalUI, logger) {
        this.viewTasksUseCase = viewTasksUseCase;
        this.searchTasksUseCase = searchTasksUseCase;
        this.updateTaskUseCase = updateTaskUseCase;
        this.subscriptionService = subscriptionService;
        this.terminalUI = terminalUI;
        this.logger = logger;
        this.dimensions = this.terminalUI.getDimensions();
        // Initialize views
        this.taskListView = new TaskListView(terminalUI, logger);
        this.taskDetailView = new TaskDetailView(terminalUI, logger);
        this.searchView = new SearchView(terminalUI, logger);
        this.setupViews();
        this.setupEventHandlers();
        this.setupSubscriptions();
    }
    async initialize() {
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
    setupViews() {
        // Setup search view callbacks
        this.searchView.onSearch(async (query) => {
            await this.handleSearch(query);
        });
        this.searchView.onSelect((task) => {
            this.selectTask(TaskViewModelMapper.toViewModel(task));
            this.exitSearchMode();
        });
    }
    setupEventHandlers() {
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
    setupSubscriptions() {
        // Subscribe to all task changes
        this.subscriptionService.subscribeToAllTasks((tasks) => {
            const viewModels = TaskViewModelMapper.toViewModels(tasks);
            this.taskListView.setTasks(viewModels);
        });
    }
    async loadTasks() {
        try {
            const response = await this.viewTasksUseCase.execute({
                filter: this.currentFilter,
                sort: this.currentSort,
                page: 1,
                pageSize: 100
            });
            const viewModels = TaskViewModelMapper.toViewModels(response.tasks);
            this.taskListView.setTasks(viewModels);
        }
        catch (error) {
            this.logger.error('Failed to load tasks', error);
        }
    }
    async handleSearch(query) {
        try {
            const response = await this.searchTasksUseCase.execute({
                query,
                limit: 20
            });
            const results = response.tasks.map(task => ({
                task: TaskViewModelMapper.toViewModel(task),
                score: 1, // TODO: Implement proper scoring
                highlights: [] // TODO: Implement highlighting
            }));
            this.searchView.setResults(results);
        }
        catch (error) {
            this.logger.error('Search failed', error);
        }
    }
    handleGlobalKeyPress(key, modifiers) {
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
    getFocusedView() {
        if (this.isSearchMode)
            return this.searchView;
        switch (this.layout.activePane) {
            case 'left':
            case 'top':
                return this.taskListView;
            case 'right':
            case 'bottom':
                return this.taskDetailView;
        }
    }
    enterSearchMode() {
        this.isSearchMode = true;
        this.searchView.show();
        this.searchView.focus();
        this.taskListView.blur();
        this.taskDetailView.blur();
    }
    exitSearchMode() {
        this.isSearchMode = false;
        this.searchView.hide();
        this.taskListView.focus();
    }
    selectTask(task) {
        this.taskDetailView.setTask(task);
        if (this.layout.type !== 'single') {
            this.taskDetailView.show();
        }
    }
    switchFocus() {
        if (this.layout.type === 'single')
            return;
        if (this.layout.activePane === 'left' || this.layout.activePane === 'top') {
            this.layout.activePane = this.layout.type === 'split-horizontal' ? 'right' : 'bottom';
            this.taskListView.blur();
            this.taskDetailView.focus();
        }
        else {
            this.layout.activePane = this.layout.type === 'split-horizontal' ? 'left' : 'top';
            this.taskDetailView.blur();
            this.taskListView.focus();
        }
    }
    setLayout(layout) {
        this.layout = layout;
        this.updateLayout();
    }
    updateLayout() {
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
    render() {
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
    dispose() {
        this.taskListView.dispose();
        this.taskDetailView.dispose();
        this.searchView.dispose();
        this.terminalUI.dispose();
    }
}
//# sourceMappingURL=TaskViewerController.js.map