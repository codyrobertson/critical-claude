/**
 * Viewer Service
 * Simplified viewer service that delegates to legacy implementation
 */
export class ViewerService {
    async launchViewer(request) {
        // For now, delegate to legacy implementation
        return {
            success: false,
            error: 'Viewer system not yet migrated. Use legacy CLI: npm run build:legacy && node packages/critical-claude/dist/cli/cc-main.js viewer'
        };
    }
    async getViewerStatus() {
        return {
            success: true,
            data: false
        };
    }
}
//# sourceMappingURL=ViewerService.js.map