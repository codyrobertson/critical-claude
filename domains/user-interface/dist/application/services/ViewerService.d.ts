/**
 * Viewer Service - Application service for launching the task viewer
 */
import { Result } from '../../shared/types.js';
export interface ViewerRequest {
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
    theme?: 'dark' | 'light';
}
export interface ViewerResponse extends Result<string> {
    viewerStarted?: boolean;
}
export declare class ViewerService {
    private viewerApp;
    launchViewer(request?: ViewerRequest): Promise<ViewerResponse>;
    stopViewer(): Promise<void>;
    getViewerStatus(): Promise<Result<boolean>>;
}
//# sourceMappingURL=ViewerService.d.ts.map