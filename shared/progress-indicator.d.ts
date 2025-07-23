/**
 * Progress Indicator Utilities
 * Simple progress indicators for long-running CLI operations
 */
export declare class ProgressIndicator {
    private interval;
    private frames;
    private currentFrame;
    private message;
    constructor(message?: string);
    start(): void;
    updateMessage(message: string): void;
    stop(finalMessage?: string): void;
    success(message: string): void;
    error(message: string): void;
}
export declare class ProgressBar {
    private total;
    private current;
    private width;
    private message;
    constructor(total: number, message?: string);
    update(current: number, message?: string): void;
    increment(message?: string): void;
    complete(message?: string): void;
}
export declare const withProgress: <T>(operation: (indicator: ProgressIndicator) => Promise<T>, message?: string) => Promise<T>;
export declare const withProgressBar: <T>(items: T[], processor: (item: T, index: number, bar: ProgressBar) => Promise<void>, message?: string) => Promise<void>;
//# sourceMappingURL=progress-indicator.d.ts.map