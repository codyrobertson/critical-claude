/**
 * Viewer Service
 * Simplified viewer service that delegates to legacy implementation
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
    launchViewer(request?: ViewerRequest): Promise<ViewerResponse>;
    getViewerStatus(): Promise<Result<boolean>>;
}
//# sourceMappingURL=ViewerService.d.ts.map