import { ToolDefinition } from '@critical-claude/core';
export declare class DataFlowServer {
    private analyzer;
    private diagramGenerator;
    private flowTracer;
    constructor();
    getTools(): ToolDefinition[];
    handleToolCall(name: string, args: any): Promise<any>;
    private formatAnalysisReport;
    private formatTraceReport;
    private formatDiagramsReport;
}
export declare const dataFlowServer: DataFlowServer;
//# sourceMappingURL=server.d.ts.map