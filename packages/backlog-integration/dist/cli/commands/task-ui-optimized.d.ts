/**
 * 🔥 BADASS TASK UI - Semantic Commands & Visual Excellence
 * Optimized performance with semantic command structure
 */
import { CommandHandler } from '../command-registry.js';
export declare class TaskUIOptimizedCommand implements CommandHandler {
    private backlogManager;
    private rl;
    private currentFilter;
    private currentSort;
    private showSemanticHelp;
    private animationFrame;
    private state;
    private readonly PAGE_SIZE;
    private terminalWidth;
    private terminalHeight;
    private renderThrottle;
    private readonly SEMANTIC_COMMANDS;
    private isExiting;
    private cacheStats;
    private readonly CACHE_TIMEOUT;
    constructor();
    private setupTerminal;
    private updateTerminalSize;
    private cleanup;
    private handleExit;
    execute(action: string, input: any, options: any): Promise<void>;
    private initializeAsync;
    private showUI;
    private refreshTasks;
    /**
     * Get a cached task by ID for fast lookups
     */
    private getCachedTask;
    /**
     * Clear cache when needed
     */
    private clearCache;
    private handleInput;
    private moveSelection;
    private adjustScrollOffset;
    /**
     * Throttled render to prevent excessive redraws
     */
    private throttledRender;
    private render;
    private buildBrowseView;
    private buildHeader;
    private buildQuickStats;
    private buildTaskList;
    /**
     * Build task lines efficiently with minimal string operations
     */
    private buildTaskLines;
    private buildTaskDetails;
    private buildBottomControls;
    private buildLoadingScreen;
    private buildSearchView;
    private buildHelpView;
    private renderLoadingScreen;
    private countLines;
    private wrapText;
    private handleSearchInput;
    private getSelectedTask;
    private getPriorityIcon;
    private getStatusIcon;
    private getStatusWithIcon;
    private getPriorityWithColor;
    private getTaskStats;
    private editSelectedTask;
    private toggleTaskCompletion;
    private focusSelectedTask;
    private createNewTask;
    private syncTasks;
    private getFilteredTasks;
}
//# sourceMappingURL=task-ui-optimized.d.ts.map