import { DataFlowAnalyzer } from './data-flow-analyzer.js';
import { DiagramGenerator } from './diagram-generator.js';
import { FlowTracer } from './flow-tracer.js';
export class DataFlowServer {
    analyzer;
    diagramGenerator;
    flowTracer;
    constructor() {
        this.analyzer = new DataFlowAnalyzer();
        this.diagramGenerator = new DiagramGenerator();
        this.flowTracer = new FlowTracer();
    }
    getTools() {
        return [
            {
                name: 'cc_data_flow_analyze',
                description: 'Analyze data flow patterns in a codebase',
                inputSchema: {
                    type: 'object',
                    properties: {
                        rootPath: {
                            type: 'string',
                            description: 'Root directory path of the codebase to analyze'
                        }
                    },
                    required: ['rootPath']
                }
            },
            {
                name: 'cc_data_flow_trace',
                description: 'Trace data flow from a specific entry point',
                inputSchema: {
                    type: 'object',
                    properties: {
                        entryPoint: {
                            type: 'string',
                            description: 'Path to the entry point file to trace from'
                        },
                        rootPath: {
                            type: 'string',
                            description: 'Root directory path of the codebase'
                        }
                    },
                    required: ['entryPoint', 'rootPath']
                }
            },
            {
                name: 'cc_data_flow_diagram',
                description: 'Generate data flow diagrams in Mermaid format',
                inputSchema: {
                    type: 'object',
                    properties: {
                        rootPath: {
                            type: 'string',
                            description: 'Root directory path of the codebase'
                        },
                        diagramType: {
                            type: 'string',
                            enum: ['system', 'critical-path', 'database', 'all'],
                            description: 'Type of diagram to generate',
                            default: 'all'
                        }
                    },
                    required: ['rootPath']
                }
            }
        ];
    }
    async handleToolCall(name, args) {
        switch (name) {
            case 'cc_data_flow_analyze': {
                const analysis = await this.analyzer.analyzeDataFlow(args.rootPath);
                // Generate diagrams for the analysis
                analysis.diagrams = this.diagramGenerator.generateDiagrams(analysis);
                return {
                    content: [
                        {
                            type: 'text',
                            text: this.formatAnalysisReport(analysis)
                        }
                    ]
                };
            }
            case 'cc_data_flow_trace': {
                const { nodes, flows } = await this.flowTracer.traceRequestFlow(args.entryPoint, args.rootPath);
                const callGraph = await this.flowTracer.generateCallGraph(args.entryPoint, args.rootPath);
                return {
                    content: [
                        {
                            type: 'text',
                            text: this.formatTraceReport(nodes, flows, callGraph)
                        }
                    ]
                };
            }
            case 'cc_data_flow_diagram': {
                const analysis = await this.analyzer.analyzeDataFlow(args.rootPath);
                const diagrams = this.diagramGenerator.generateDiagrams(analysis);
                let selectedDiagrams = diagrams;
                if (args.diagramType !== 'all') {
                    selectedDiagrams = diagrams.filter(d => d.title.toLowerCase().includes(args.diagramType));
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: this.formatDiagramsReport(selectedDiagrams)
                        }
                    ]
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    formatAnalysisReport(analysis) {
        let report = '🔍 DATA FLOW ANALYSIS REPORT\n';
        report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        report += `📊 SUMMARY\n${analysis.summary}\n\n`;
        if (analysis.bottlenecks.length > 0) {
            report += '🚨 BOTTLENECKS DETECTED\n';
            report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
            analysis.bottlenecks.forEach((bottleneck) => {
                const icon = bottleneck.severity === 'critical' ? '🔴' :
                    bottleneck.severity === 'high' ? '🟠' :
                        bottleneck.severity === 'medium' ? '🟡' : '🔵';
                report += `${icon} ${bottleneck.description}\n`;
                report += `   📍 Location: ${bottleneck.location}\n`;
                report += `   💥 Impact: ${bottleneck.impact}\n`;
                report += `   💡 Suggestions:\n`;
                bottleneck.suggestions.forEach((s) => {
                    report += `      - ${s}\n`;
                });
                report += '\n';
            });
        }
        if (analysis.patterns.length > 0) {
            report += '📋 PATTERNS IDENTIFIED\n';
            report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
            analysis.patterns.forEach((pattern) => {
                report += `🎯 ${pattern.pattern.toUpperCase()}\n`;
                report += `   ${pattern.description}\n`;
                report += `   ✅ Pros: ${pattern.pros.join(', ')}\n`;
                report += `   ❌ Cons: ${pattern.cons.join(', ')}\n`;
                report += `   📌 Use Cases: ${pattern.useCases.join(', ')}\n\n`;
            });
        }
        if (analysis.recommendations.length > 0) {
            report += '💡 RECOMMENDATIONS\n';
            report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
            analysis.recommendations.forEach((rec) => {
                report += `• ${rec}\n`;
            });
        }
        return report;
    }
    formatTraceReport(nodes, flows, callGraph) {
        let report = '🔄 REQUEST FLOW TRACE\n';
        report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        report += `📊 Found ${nodes.length} nodes and ${flows.length} data flows\n\n`;
        report += '📍 NODES:\n';
        nodes.forEach(node => {
            report += `   • ${node.name} [${node.type}] - ${node.location}\n`;
        });
        report += '\n🔗 FLOWS:\n';
        flows.forEach(flow => {
            const arrow = flow.criticalPath ? '==>' : '-->';
            report += `   • ${flow.source.name} ${arrow} ${flow.destination.name} (${flow.dataType})\n`;
        });
        report += '\n📈 CALL GRAPH:\n```mermaid\n';
        report += callGraph;
        report += '\n```\n';
        return report;
    }
    formatDiagramsReport(diagrams) {
        let report = '📊 DATA FLOW DIAGRAMS\n';
        report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        diagrams.forEach(diagram => {
            report += `### ${diagram.title}\n\n`;
            report += '```mermaid\n';
            report += diagram.diagram;
            report += '\n```\n\n';
        });
        return report;
    }
}
export const dataFlowServer = new DataFlowServer();
//# sourceMappingURL=server.js.map