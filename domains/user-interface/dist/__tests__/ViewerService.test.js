/**
 * Viewer Service Unit Tests
 * Tests for user interface viewer functionality
 */
import { ViewerService } from '../application/services/ViewerService.js';
describe('ViewerService', () => {
    let viewerService;
    beforeEach(() => {
        viewerService = new ViewerService();
    });
    describe('getViewerStatus', () => {
        it('should return viewer status successfully', async () => {
            const result = await viewerService.getViewerStatus();
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(typeof result.data).toBe('string');
        });
    });
    describe('launchViewer', () => {
        it('should launch viewer with default settings', async () => {
            const result = await viewerService.launchViewer();
            expect(result.success).toBe(true);
            expect(result.viewerStarted).toBe(true);
            expect(result.data).toBeDefined();
        });
        it('should launch viewer with custom log level', async () => {
            const result = await viewerService.launchViewer({
                logLevel: 'debug'
            });
            expect(result.success).toBe(true);
            expect(result.viewerStarted).toBe(true);
        });
        it('should launch viewer with custom theme', async () => {
            const result = await viewerService.launchViewer({
                theme: 'light'
            });
            expect(result.success).toBe(true);
            expect(result.viewerStarted).toBe(true);
        });
        it('should handle invalid log level gracefully', async () => {
            const result = await viewerService.launchViewer({
                logLevel: 'invalid'
            });
            expect(result.success).toBe(true);
            expect(result.viewerStarted).toBe(true);
        });
    });
    describe('stopViewer', () => {
        it('should stop viewer successfully', async () => {
            // First launch viewer
            await viewerService.launchViewer();
            // Then stop it
            const result = await viewerService.stopViewer();
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
        });
        it('should handle stopping when not running', async () => {
            const result = await viewerService.stopViewer();
            expect(result.success).toBe(true);
        });
    });
});
// Simple test runner for smoke testing
export async function runViewerServiceTests() {
    console.log('🧪 Running ViewerService Tests...');
    try {
        const viewerService = new ViewerService();
        // Test 1: Get status
        const statusResult = await viewerService.getViewerStatus();
        if (!statusResult.success) {
            throw new Error('Failed to get viewer status');
        }
        console.log('✅ Viewer status test passed');
        // Test 2: Launch viewer (but don't actually launch to avoid blocking)
        // Just test the setup logic
        const service = new ViewerService();
        expect(service).toBeDefined();
        console.log('✅ Viewer service initialization test passed');
        console.log('🎉 All ViewerService tests passed!');
    }
    catch (error) {
        console.error('❌ ViewerService tests failed:', error);
        throw error;
    }
}
// Export for manual testing
if (typeof require !== 'undefined' && require.main === module) {
    runViewerServiceTests().catch(console.error);
}
//# sourceMappingURL=ViewerService.test.js.map