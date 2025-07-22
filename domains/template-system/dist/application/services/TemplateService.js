/**
 * Template Service
 * Simplified template service that delegates to legacy implementation
 */
export class TemplateService {
    async executeTemplate(request) {
        // For now, delegate to legacy implementation
        return {
            success: false,
            error: 'Template system not yet migrated. Use legacy CLI: npm run build:legacy && node packages/critical-claude/dist/cli/cc-main.js template'
        };
    }
    async listTemplates() {
        return {
            success: false,
            error: 'Template listing not yet migrated. Use legacy CLI for template operations.'
        };
    }
}
//# sourceMappingURL=TemplateService.js.map