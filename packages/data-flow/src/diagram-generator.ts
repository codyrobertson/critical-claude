import { logger } from '@critical-claude/core';
import { DataNode, DataFlow, FlowDiagram, DataFlowAnalysis } from './types.js';

export class DiagramGenerator {
  generateDiagrams(analysis: DataFlowAnalysis): FlowDiagram[] {
    const diagrams: FlowDiagram[] = [];
    
    // Overall system diagram
    diagrams.push(this.generateSystemDiagram(analysis));
    
    // Critical path diagram
    const criticalFlows = analysis.flows.filter(f => f.criticalPath);
    if (criticalFlows.length > 0) {
      diagrams.push(this.generateCriticalPathDiagram(analysis.nodes, criticalFlows));
    }
    
    // Database interactions diagram
    const dbFlows = analysis.flows.filter(f => 
      f.destination.type === 'database' || f.source.type === 'database'
    );
    if (dbFlows.length > 0) {
      diagrams.push(this.generateDatabaseDiagram(analysis.nodes, dbFlows));
    }
    
    return diagrams;
  }
  
  private generateSystemDiagram(analysis: DataFlowAnalysis): FlowDiagram {
    const nodes = analysis.nodes;
    const flows = analysis.flows;
    
    let mermaid = 'graph TB\n';
    mermaid += '    %% System Overview Diagram\n';
    
    // Define node styles
    mermaid += '    classDef service fill:#f9f,stroke:#333,stroke-width:2px\n';
    mermaid += '    classDef database fill:#9ff,stroke:#333,stroke-width:2px\n';
    mermaid += '    classDef cache fill:#ff9,stroke:#333,stroke-width:2px\n';
    mermaid += '    classDef external fill:#f99,stroke:#333,stroke-width:2px\n';
    mermaid += '    classDef frontend fill:#9f9,stroke:#333,stroke-width:2px\n\n';
    
    // Add nodes
    const nodeMap = new Map<string, string>();
    nodes.forEach((node, idx) => {
      const nodeId = `N${idx}`;
      nodeMap.set(node.id, nodeId);
      
      const label = `${node.name}${node.technology ? `\\n[${node.technology}]` : ''}`;
      mermaid += `    ${nodeId}["${label}"]\n`;
      
      // Apply style based on type
      mermaid += `    class ${nodeId} ${node.type}\n`;
    });
    
    mermaid += '\n';
    
    // Add flows
    flows.forEach(flow => {
      const sourceId = nodeMap.get(flow.source.id) || 'Unknown';
      const destId = nodeMap.get(flow.destination.id) || 'Unknown';
      
      if (!nodeMap.has(flow.destination.id)) {
        // Add external nodes if not in node list
        const newId = `N${nodeMap.size}`;
        nodeMap.set(flow.destination.id, newId);
        mermaid += `    ${newId}["${flow.destination.name}"]\n`;
        mermaid += `    class ${newId} ${flow.destination.type}\n`;
      }
      
      const label = flow.dataType.replace('-', ' ');
      if (flow.criticalPath) {
        mermaid += `    ${sourceId} ==>|${label}| ${destId}\n`;
      } else {
        mermaid += `    ${sourceId} -->|${label}| ${destId}\n`;
      }
    });
    
    return {
      title: 'System Data Flow Overview',
      nodes: analysis.nodes,
      flows: analysis.flows,
      format: 'mermaid',
      diagram: mermaid
    };
  }
  
  private generateCriticalPathDiagram(
    allNodes: DataNode[], 
    criticalFlows: DataFlow[]
  ): FlowDiagram {
    let mermaid = 'graph LR\n';
    mermaid += '    %% Critical Path Diagram\n';
    mermaid += '    %% Shows only flows marked as critical\n\n';
    
    // Get unique nodes involved in critical flows
    const criticalNodeIds = new Set<string>();
    criticalFlows.forEach(flow => {
      criticalNodeIds.add(flow.source.id);
      criticalNodeIds.add(flow.destination.id);
    });
    
    const criticalNodes = allNodes.filter(n => criticalNodeIds.has(n.id));
    
    // Add nodes
    const nodeMap = new Map<string, string>();
    criticalNodes.forEach((node, idx) => {
      const nodeId = `C${idx}`;
      nodeMap.set(node.id, nodeId);
      mermaid += `    ${nodeId}["${node.name}"]\n`;
    });
    
    mermaid += '\n';
    
    // Add critical flows with timing annotations
    criticalFlows.forEach((flow, idx) => {
      const sourceId = nodeMap.get(flow.source.id) || 'Unknown';
      const destId = nodeMap.get(flow.destination.id) || 'Unknown';
      
      mermaid += `    ${sourceId} ==>|"${flow.dataType}<br/>Critical"| ${destId}\n`;
    });
    
    mermaid += '\n    style C0 fill:#f96,stroke:#333,stroke-width:4px\n';
    
    return {
      title: 'Critical Data Path',
      nodes: criticalNodes,
      flows: criticalFlows,
      format: 'mermaid',
      diagram: mermaid
    };
  }
  
  private generateDatabaseDiagram(
    allNodes: DataNode[], 
    dbFlows: DataFlow[]
  ): FlowDiagram {
    let mermaid = 'erDiagram\n';
    mermaid += '    %% Database Interaction Diagram\n\n';
    
    // Group flows by source service
    const serviceGroups = new Map<string, DataFlow[]>();
    dbFlows.forEach(flow => {
      const key = flow.source.id;
      if (!serviceGroups.has(key)) {
        serviceGroups.set(key, []);
      }
      serviceGroups.get(key)!.push(flow);
    });
    
    // Generate entity relationships
    serviceGroups.forEach((flows, serviceId) => {
      const service = allNodes.find(n => n.id === serviceId);
      if (service) {
        flows.forEach(flow => {
          const operation = this.inferDatabaseOperation(flow.dataType);
          mermaid += `    "${service.name}" ||--o{ "${flow.destination.name}" : "${operation}"\n`;
        });
      }
    });
    
    return {
      title: 'Database Interactions',
      nodes: allNodes.filter(n => 
        n.type === 'database' || dbFlows.some(f => f.source.id === n.id)
      ),
      flows: dbFlows,
      format: 'mermaid',
      diagram: mermaid
    };
  }
  
  private inferDatabaseOperation(dataType: string): string {
    if (dataType.includes('query') || dataType.includes('select')) return 'reads';
    if (dataType.includes('insert') || dataType.includes('create')) return 'creates';
    if (dataType.includes('update')) return 'updates';
    if (dataType.includes('delete')) return 'deletes';
    return 'accesses';
  }
  
  generateSequenceDiagram(flows: DataFlow[]): string {
    let mermaid = 'sequenceDiagram\n';
    mermaid += '    %% Request Flow Sequence\n\n';
    
    // Extract unique participants
    const participants = new Set<string>();
    flows.forEach(flow => {
      participants.add(flow.source.name);
      participants.add(flow.destination.name);
    });
    
    // Declare participants
    participants.forEach(p => {
      mermaid += `    participant ${p.replace(/\s+/g, '_')}\n`;
    });
    
    mermaid += '\n';
    
    // Add interactions
    flows.forEach(flow => {
      const source = flow.source.name.replace(/\s+/g, '_');
      const dest = flow.destination.name.replace(/\s+/g, '_');
      
      if (flow.criticalPath) {
        mermaid += `    ${source}->>+${dest}: ${flow.dataType}\n`;
        mermaid += `    ${dest}-->>-${source}: Response\n`;
      } else {
        mermaid += `    ${source}--)${dest}: ${flow.dataType} (async)\n`;
      }
    });
    
    return mermaid;
  }
}