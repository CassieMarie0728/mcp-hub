/**
 * Extended MCP Router
 * Additional tRPC procedures for real MCP server integration
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { mcpServerManager } from './mcp-server-manager';
import MCPServerRegistry, { ServerType } from './mcp-server-registry';

export const mcpExtendedRouter = router({
  /**
   * Get all available MCP server types
   */
  getAvailableServers: protectedProcedure.query(() => {
    return MCPServerRegistry.getAllServers();
  }),

  /**
   * Get server definition by type
   */
  getServerDefinition: protectedProcedure
    .input(z.object({ type: z.string() }))
    .query(({ input }) => {
      const definition = MCPServerRegistry.getServerDefinition(input.type as ServerType);
      return definition || { error: 'Server type not found' };
    }),

  /**
   * Get available tools for a server type (without connecting)
   */
  getServerTools: protectedProcedure
    .input(z.object({ type: z.string() }))
    .query(({ input }) => {
      const tools = MCPServerRegistry.getServerTools(input.type as ServerType);
      return {
        success: true,
        tools,
        count: tools.length,
      };
    }),

  /**
   * Validate token for a server type
   */
  validateToken: protectedProcedure
    .input(
      z.object({
        type: z.string(),
        token: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const isValid = await MCPServerRegistry.validateToken(
          input.type as ServerType,
          input.token
        );
        return {
          success: true,
          valid: isValid,
        };
      } catch (error) {
        return {
          success: false,
          valid: false,
          error: error instanceof Error ? error.message : 'Validation failed',
        };
      }
    }),

  /**
   * Register a real MCP server (GitHub, Slack, Notion)
   */
  registerRealServer: protectedProcedure
    .input(
      z.object({
        type: z.string(),
        token: z.string(),
        customName: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Validate token first
        const isValid = await MCPServerRegistry.validateToken(
          input.type as ServerType,
          input.token
        );

        if (!isValid) {
          return {
            success: false,
            error: 'Invalid token for this server type',
          };
        }

        // Create server config
        const config = MCPServerRegistry.createServerConfig(
          input.type as ServerType,
          input.token
        );

        if (!config) {
          return {
            success: false,
            error: 'Failed to create server configuration',
          };
        }

        // Override name if provided
        if (input.customName) {
          config.name = input.customName;
        }

        // Register with manager
        mcpServerManager.registerServer(config);

        // Test connection
        const connected = await mcpServerManager.testConnection(config.id);

        return {
          success: true,
          serverId: config.id,
          serverName: config.name,
          connected,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Registration failed',
        };
      }
    }),

  /**
   * Get registered servers with status
   */
  getRegisteredServers: protectedProcedure.query(() => {
    const servers = mcpServerManager.getAllServers();
    const statuses = mcpServerManager.getAllServerStatuses();

    return servers.map((server) => {
      const status = statuses.find((s) => s.id === server.id);
      return {
        id: server.id,
        name: server.name,
        type: server.type,
        status: status?.status || 'unknown',
        toolCount: status?.toolCount || 0,
        lastConnected: status?.lastConnected,
        lastError: status?.lastError,
      };
    });
  }),

  /**
   * Discover and cache tools from a registered server
   */
  discoverServerTools: protectedProcedure
    .input(z.object({ serverId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const tools = await mcpServerManager.discoverTools(input.serverId);
        return {
          success: true,
          tools,
          count: tools.length,
        };
      } catch (error) {
        return {
          success: false,
          tools: [],
          count: 0,
          error: error instanceof Error ? error.message : 'Discovery failed',
        };
      }
    }),

  /**
   * Execute a tool on a registered server
   */
  executeServerTool: protectedProcedure
    .input(
      z.object({
        serverId: z.string(),
        toolName: z.string(),
        parameters: z.record(z.string(), z.any()),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await mcpServerManager.executeTool(
          input.serverId,
          input.toolName,
          input.parameters
        );

        return {
          success: result.success,
          data: result.data,
          error: result.error,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Execution failed',
        };
      }
    }),

  /**
   * Test connection to a registered server
   */
  testServerConnection: protectedProcedure
    .input(z.object({ serverId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const connected = await mcpServerManager.testConnection(input.serverId);
        return {
          success: true,
          connected,
        };
      } catch (error) {
        return {
          success: false,
          connected: false,
          error: error instanceof Error ? error.message : 'Test failed',
        };
      }
    }),

  /**
   * Unregister a server
   */
  unregisterServer: protectedProcedure
    .input(z.object({ serverId: z.string() }))
    .mutation(({ input }) => {
      mcpServerManager.removeServer(input.serverId);
      return { success: true };
    }),
});

export type MCPExtendedRouter = typeof mcpExtendedRouter;
