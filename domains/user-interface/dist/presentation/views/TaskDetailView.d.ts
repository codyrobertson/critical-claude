/**
 * Task Detail View
 * Displays detailed information about a single task
 */
import { BaseView, KeyModifiers } from './IView.js';
import { ITerminalUI } from '../../application/ports/ITerminalUI.js';
import { TaskViewModel } from '../view-models/TaskViewModel.js';
import { ILogger } from '../../application/ports/ILogger.js';
export declare class TaskDetailView extends BaseView {
    private readonly terminalUI;
    private readonly logger;
    private task;
    private scrollOffset;
    private sections;
    private currentSection;
    constructor(terminalUI: ITerminalUI, logger: ILogger);
    initialize(): Promise<void>;
    setTask(task: TaskViewModel): void;
    render(): void;
    onKeyPress(key: string, modifiers: KeyModifiers): boolean;
    private drawBorder;
    private drawHeader;
    private drawSectionTabs;
    private drawOverview;
    private drawDescription;
    private drawMetadata;
    private drawSubtasks;
    private drawField;
    private drawProgressBar;
    private wrapText;
    private nextSection;
    private previousSection;
    private scrollDown;
    private scrollUp;
    private close;
}
//# sourceMappingURL=TaskDetailView.d.ts.map