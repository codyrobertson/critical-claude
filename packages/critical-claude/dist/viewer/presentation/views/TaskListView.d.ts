/**
 * Task List View
 * Main view for displaying tasks in a list format
 */
import { BaseView, KeyModifiers } from './IView';
import { ITerminalUI } from '../../application/ports/ITerminalUI';
import { TaskViewModel } from '../view-models/TaskViewModel';
import { ILogger } from '../../application/ports/ILogger';
export interface TaskListViewOptions {
    showLineNumbers: boolean;
    showPriority: boolean;
    showStatus: boolean;
    showTags: boolean;
    wrapText: boolean;
    highlightCurrentLine: boolean;
}
export declare class TaskListView extends BaseView {
    private readonly terminalUI;
    private readonly logger;
    private tasks;
    private selectedIndex;
    private scrollOffset;
    private options;
    constructor(terminalUI: ITerminalUI, logger: ILogger, options?: Partial<TaskListViewOptions>);
    initialize(): Promise<void>;
    setTasks(tasks: TaskViewModel[]): void;
    getSelectedTask(): TaskViewModel | null;
    render(): void;
    onKeyPress(key: string, modifiers: KeyModifiers): boolean;
    private drawBorder;
    private drawHeader;
    private drawTask;
    private drawScrollbar;
    private drawStatusLine;
    private getVisibleTasks;
    private getVisibleLines;
    private moveDown;
    private moveUp;
    private moveToStart;
    private moveToEnd;
    private pageDown;
    private pageUp;
    private ensureVisible;
    private openSelectedTask;
    private truncate;
}
//# sourceMappingURL=TaskListView.d.ts.map