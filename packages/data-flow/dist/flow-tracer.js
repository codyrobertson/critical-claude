import { logger } from '@critical-claude/core';
import * as fs from 'fs/promises';
import * as path from 'path';
export class FlowTracer {
    async traceRequestFlow(entryPoint, rootPath) {
        logger.info('Tracing request flow', { entryPoint, rootPath });
        const nodes = [];
        const flows = [];
        const visited = new Set();
        // Start tracing from entry point
        await this.traceFromFile(entryPoint, rootPath, nodes, flows, visited);
        return { nodes, flows };
    }
    async traceFromFile(filePath, rootPath, nodes, flows, visited) {
        if (visited.has(filePath))
            return;
        visited.add(filePath);
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const relativePath = path.relative(rootPath, filePath);
            // Create node for this file
            const currentNode = {
                id: `node-${nodes.length}`,
                name: path.basename(filePath),
                type: this.inferNodeType(filePath, content),
                location: relativePath,
                technology: this.detectTechnology(content),
                inputs: [],
                outputs: []
            };
            nodes.push(currentNode);
            // Find imports and trace them
            const imports = this.extractImports(content);
            for (const importPath of imports) {
                const resolvedPath = await this.resolveImport(importPath, filePath, rootPath);
                if (resolvedPath && resolvedPath.startsWith(rootPath)) {
                    await this.traceFromFile(resolvedPath, rootPath, nodes, flows, visited);
                    // Create flow from import
                    const importedNode = nodes.find(n => n.location === path.relative(rootPath, resolvedPath));
                    if (importedNode) {
                        flows.push({
                            id: `flow-${flows.length}`,
                            source: currentNode,
                            destination: importedNode,
                            dataType: 'import',
                            protocol: 'file',
                            description: `Imports from ${importedNode.name}`,
                            criticalPath: false
                        });
                    }
                }
            }
            // Find function calls and API interactions
            await this.traceFunctionCalls(content, currentNode, nodes, flows);
        }
        catch (error) {
            logger.error('Failed to trace file', { filePath, error });
        }
    }
    inferNodeType(filePath, content) {
        const fileName = path.basename(filePath).toLowerCase();
        if (fileName.includes('controller') || fileName.includes('router'))
            return 'service';
        if (fileName.includes('model') || fileName.includes('schema'))
            return 'database';
        if (fileName.includes('cache'))
            return 'cache';
        if (fileName.includes('queue') || fileName.includes('worker'))
            return 'queue';
        if (fileName.includes('.html') || fileName.includes('.jsx') || fileName.includes('.tsx'))
            return 'frontend';
        // Check content patterns
        if (content.includes('app.get') || content.includes('router.'))
            return 'service';
        if (content.includes('mongoose.model') || content.includes('sequelize.define'))
            return 'database';
        return 'service';
    }
    detectTechnology(content) {
        if (content.includes('express'))
            return 'Express.js';
        if (content.includes('react'))
            return 'React';
        if (content.includes('vue'))
            return 'Vue.js';
        if (content.includes('angular'))
            return 'Angular';
        if (content.includes('django'))
            return 'Django';
        if (content.includes('flask'))
            return 'Flask';
        if (content.includes('spring'))
            return 'Spring';
        return 'JavaScript';
    }
    extractImports(content) {
        const imports = [];
        // ES6 imports
        const es6Regex = /import\s+.*?from\s+['"](.+?)['"]/g;
        let match;
        while ((match = es6Regex.exec(content)) !== null) {
            imports.push(match[1]);
        }
        // CommonJS requires
        const cjsRegex = /require\s*\(['"](.+?)['"]\)/g;
        while ((match = cjsRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }
        return imports;
    }
    async resolveImport(importPath, fromFile, rootPath) {
        // Skip node_modules and external packages
        if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
            return null;
        }
        const dir = path.dirname(fromFile);
        let resolvedPath = path.resolve(dir, importPath);
        // Try different extensions
        const extensions = ['.js', '.ts', '.jsx', '.tsx', '.json'];
        // Check if file exists with extension
        try {
            await fs.access(resolvedPath);
            return resolvedPath;
        }
        catch { }
        // Try adding extensions
        for (const ext of extensions) {
            try {
                const pathWithExt = resolvedPath + ext;
                await fs.access(pathWithExt);
                return pathWithExt;
            }
            catch { }
        }
        // Try index file
        try {
            const indexPath = path.join(resolvedPath, 'index.js');
            await fs.access(indexPath);
            return indexPath;
        }
        catch { }
        return null;
    }
    async traceFunctionCalls(content, currentNode, nodes, flows) {
        // Look for database operations
        if (content.includes('.find(') || content.includes('.save(') || content.includes('INSERT')) {
            const dbNode = nodes.find(n => n.type === 'database') || {
                id: 'db-default',
                name: 'Database',
                type: 'database',
                location: 'inferred',
                inputs: [],
                outputs: []
            };
            if (!nodes.find(n => n.id === dbNode.id)) {
                nodes.push(dbNode);
            }
            flows.push({
                id: `flow-${flows.length}`,
                source: currentNode,
                destination: dbNode,
                dataType: 'database-query',
                protocol: 'database',
                description: 'Database operation',
                criticalPath: true
            });
        }
        // Look for HTTP calls
        if (content.includes('fetch(') || content.includes('axios.') || content.includes('http.')) {
            const apiNode = {
                id: 'external-api',
                name: 'External API',
                type: 'external',
                location: 'external',
                inputs: [],
                outputs: []
            };
            if (!nodes.find(n => n.id === apiNode.id)) {
                nodes.push(apiNode);
            }
            flows.push({
                id: `flow-${flows.length}`,
                source: currentNode,
                destination: apiNode,
                dataType: 'http-request',
                protocol: 'http',
                description: 'External API call',
                criticalPath: true
            });
        }
    }
    async generateCallGraph(entryPoint, rootPath) {
        const { nodes, flows } = await this.traceRequestFlow(entryPoint, rootPath);
        let mermaid = 'graph TD\n';
        mermaid += '    %% Request Flow Call Graph\n\n';
        // Add nodes
        nodes.forEach((node, idx) => {
            const label = `${node.name}\n[${node.type}]`;
            mermaid += `    N${idx}["${label}"]\n`;
        });
        mermaid += '\n';
        // Add flows
        flows.forEach(flow => {
            const sourceIdx = nodes.findIndex(n => n.id === flow.source.id);
            const destIdx = nodes.findIndex(n => n.id === flow.destination.id);
            if (sourceIdx >= 0 && destIdx >= 0) {
                const arrow = flow.criticalPath ? '==>' : '-->';
                mermaid += `    N${sourceIdx} ${arrow} N${destIdx}\n`;
            }
        });
        return mermaid;
    }
}
//# sourceMappingURL=flow-tracer.js.map