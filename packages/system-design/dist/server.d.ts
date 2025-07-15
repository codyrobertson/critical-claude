import { ToolDefinition } from '@critical-claude/core';
export declare class SystemDesignServer {
    private mvpPlanner;
    private analyzer;
    constructor();
    getTools(): ToolDefinition[];
    handleToolCall(name: string, args: any): Promise<any>;
    private formatMVPPlan;
    private formatSystemAnalysis;
    private formatTechStackRecommendations;
}
export declare const systemDesignServer: SystemDesignServer;
//# sourceMappingURL=server.d.ts.map