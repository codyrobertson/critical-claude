import { DataFlow, FlowDiagram, DataFlowAnalysis } from './types.js';
export declare class DiagramGenerator {
    generateDiagrams(analysis: DataFlowAnalysis): FlowDiagram[];
    private generateSystemDiagram;
    private generateCriticalPathDiagram;
    private generateDatabaseDiagram;
    private inferDatabaseOperation;
    generateSequenceDiagram(flows: DataFlow[]): string;
}
//# sourceMappingURL=diagram-generator.d.ts.map