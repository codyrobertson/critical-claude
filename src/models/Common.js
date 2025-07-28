/**
 * Shared Common Types
 * Consolidates common patterns across the application
 */
// Utility functions
export function createSuccessResult(data) {
    return { success: true, data };
}
export function createErrorResult(error) {
    return { success: false, error };
}
// Removed unused isSuccess function - can be added back if needed
//# sourceMappingURL=Common.js.map