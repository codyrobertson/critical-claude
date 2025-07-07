/**
 * Common MCP server utilities for Critical Claude services
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
export interface MCPServerConfig {
    name: string;
    version: string;
    description?: string;
    capabilities?: {
        resources?: {};
        tools?: {};
    };
}
/**
 * Create a standardized MCP server with common configuration
 */
export declare function createStandardMCPServer(config: MCPServerConfig): Server;
/**
 * Start an MCP server with standard transport
 */
export declare function startMCPServer(server: Server): Promise<void>;
/**
 * Gracefully shutdown MCP server
 */
export declare function setupGracefulShutdown(server: Server): void;
//# sourceMappingURL=mcp-helpers.d.ts.map