export interface DataFlow {
    id: string;
    source: DataNode;
    destination: DataNode;
    dataType: string;
    protocol: 'http' | 'grpc' | 'websocket' | 'database' | 'file' | 'memory' | 'event';
    description: string;
    criticalPath: boolean;
}
export interface DataNode {
    id: string;
    name: string;
    type: 'service' | 'database' | 'cache' | 'queue' | 'external' | 'frontend' | 'file';
    location: string;
    technology?: string;
    inputs: string[];
    outputs: string[];
}
export interface FlowDiagram {
    title: string;
    nodes: DataNode[];
    flows: DataFlow[];
    format: 'mermaid' | 'plantuml' | 'graphviz';
    diagram: string;
}
export interface DataPattern {
    pattern: 'request-response' | 'pub-sub' | 'streaming' | 'batch' | 'event-driven';
    description: string;
    components: string[];
    pros: string[];
    cons: string[];
    useCases: string[];
}
export interface BottleNeck {
    location: string;
    type: 'database' | 'api' | 'computation' | 'network' | 'serialization';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    impact: string;
    suggestions: string[];
}
export interface DataFlowAnalysis {
    summary: string;
    nodes: DataNode[];
    flows: DataFlow[];
    patterns: DataPattern[];
    bottlenecks: BottleNeck[];
    recommendations: string[];
    diagrams: FlowDiagram[];
}
//# sourceMappingURL=types.d.ts.map