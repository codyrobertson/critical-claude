import { DataNode, DataFlow } from './types.js';
export declare class FlowTracer {
    traceRequestFlow(entryPoint: string, rootPath: string): Promise<{
        nodes: DataNode[];
        flows: DataFlow[];
    }>;
    private traceFromFile;
    private inferNodeType;
    private detectTechnology;
    private extractImports;
    private resolveImport;
    private traceFunctionCalls;
    generateCallGraph(entryPoint: string, rootPath: string): Promise<string>;
}
//# sourceMappingURL=flow-tracer.d.ts.map