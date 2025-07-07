/**
 * Common MCP server utilities for Critical Claude services
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { logger } from '../logger/logger.js';
/**
 * Create a standardized MCP server with common configuration
 */
export function createStandardMCPServer(config) {
    const server = new Server({
        name: config.name,
        version: config.version,
        description: config.description,
    }, {
        capabilities: {
            resources: {},
            tools: {},
            ...config.capabilities,
        },
    });
    // Add standard error handling
    server.onerror = (error) => {
        logger.error('MCP Server error', error);
    };
    return server;
}
/**
 * Start an MCP server with standard transport
 */
export async function startMCPServer(server) {
    try {
        const transport = new StdioServerTransport();
        await server.connect(transport);
        logger.info('MCP server started successfully');
    }
    catch (error) {
        logger.error('Failed to start MCP server', error);
        process.exit(1);
    }
}
/**
 * Gracefully shutdown MCP server
 */
export function setupGracefulShutdown(server) {
    const shutdown = () => {
        logger.info('Shutting down MCP server...');
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught exception', error);
        process.exit(1);
    });
    process.on('unhandledRejection', (reason) => {
        logger.error('Unhandled rejection', reason);
        process.exit(1);
    });
}
//# sourceMappingURL=mcp-helpers.js.map