/**
 * Research Service
 * Simplified research service that delegates to legacy implementation
 */
export class ResearchService {
    async executeResearch(request) {
        // For now, delegate to legacy implementation
        return {
            success: false,
            error: 'Research system not yet migrated. Use legacy CLI: npm run build:legacy && node packages/critical-claude/dist/cli/cc-main.js research'
        };
    }
    async getResearchHistory() {
        return {
            success: false,
            error: 'Research history not yet migrated. Use legacy CLI for research operations.'
        };
    }
}
//# sourceMappingURL=ResearchService.js.map