/**
 * Viewer Service - Application service for launching the task viewer
 */
import { TaskViewerApplication } from '../../index.js';
import { LogLevel } from '../../infrastructure/logging/ConsoleLogger.js';
export class ViewerService {
    viewerApp = null;
    async launchViewer(request) {
        try {
            // Map log level string to enum
            let logLevel = LogLevel.INFO;
            switch (request?.logLevel?.toLowerCase()) {
                case 'debug':
                    logLevel = LogLevel.DEBUG;
                    break;
                case 'info':
                    logLevel = LogLevel.INFO;
                    break;
                case 'warn':
                    logLevel = LogLevel.WARN;
                    break;
                case 'error':
                    logLevel = LogLevel.ERROR;
                    break;
                default:
                    logLevel = LogLevel.INFO;
            }
            // Create and start the viewer application
            this.viewerApp = new TaskViewerApplication(logLevel);
            console.log('🖥️  Launching Critical Claude Task Viewer...');
            console.log('📋 Loading tasks from unified storage...');
            console.log('⌨️  Controls: Arrow keys to navigate, Enter to select, \'q\' to quit');
            console.log('🔍 Type \'/\' to search, \'f\' to filter by status');
            console.log('');
            await this.viewerApp.start();
            return {
                success: true,
                data: 'Task viewer launched successfully',
                viewerStarted: true
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to launch viewer',
                viewerStarted: false
            };
        }
    }
    async stopViewer() {
        if (this.viewerApp) {
            this.viewerApp.stop();
            this.viewerApp = null;
        }
    }
    async getViewerStatus() {
        return {
            success: true,
            data: this.viewerApp !== null
        };
    }
}
//# sourceMappingURL=ViewerService.js.map