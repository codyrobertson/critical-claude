/**
 * Search View
 * Provides fuzzy search interface for tasks
 */
import { BaseView, KeyModifiers } from './IView.js';
import { ITerminalUI } from '../../application/ports/ITerminalUI.js';
import { TaskViewModel } from '../view-models/TaskViewModel.js';
import { ILogger } from '../../application/ports/ILogger.js';
export interface SearchResult {
    task: TaskViewModel;
    score: number;
    highlights: Array<{
        start: number;
        end: number;
    }>;
}
export declare class SearchView extends BaseView {
    private readonly terminalUI;
    private readonly logger;
    private query;
    private results;
    private selectedIndex;
    private cursorPosition;
    private searchHistory;
    private historyIndex;
    private onSearchCallback?;
    private onSelectCallback?;
    constructor(terminalUI: ITerminalUI, logger: ILogger);
    initialize(): Promise<void>;
    onSearch(callback: (query: string) => void): void;
    onSelect(callback: (task: TaskViewModel) => void): void;
    setResults(results: SearchResult[]): void;
    render(): void;
    onKeyPress(key: string, modifiers: KeyModifiers): boolean;
    private drawSearchBox;
    private drawResults;
    private drawResult;
    private drawHelp;
    private insertCharacter;
    private deleteCharacter;
    private deleteForward;
    private deleteWord;
    private clearQuery;
    private moveCursorLeft;
    private moveCursorRight;
    private moveCursorToStart;
    private moveCursorToEnd;
    private moveResultDown;
    private moveResultUp;
    private triggerSearch;
    private executeSearch;
    private selectCurrent;
    private close;
    dispose(): void;
}
//# sourceMappingURL=SearchView.d.ts.map