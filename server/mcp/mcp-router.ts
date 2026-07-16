/**
 * MCP Router
 * tRPC procedures for MCP server management and tool operations
 */

import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { mcpServerManager, MCPServerConfig } from './mcp-server-manager';

// Validation schemas
const MCPServerConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  url: z.string().url(),
  type: z.enum(['http', 'websocket', 'stdio']),
  headers: z.record(z.string(), z.string()).optional(),
  auth: z
    .object({
      type: z.enum(['bearer', 'api-key', 'basic']),
      token: z.string().optional(),
      username: z.string().optional(),
      password: z.string().optional(),
    })
    .optional(),
  timeout: z.number().optional(),
  retryAttempts: z.number().optional(),
});

/**
 * Redact sensitive authentication information from server configuration
 */
function redactServerConfig(config: any) {
  if (!config || typeof config !== 'object' || 'error' in config) {
    return config;
  }

  const redacted = { ...config };
  if (redacted.auth) {
    redacted.auth = { ...redacted.auth };
    delete redacted.auth.token;
    delete redacted.auth.password;
  }
  return redacted;
}

export const mcpRouter = router({
  /**
   * Register a new MCP server
   */
  registerServer: protectedProcedure.input(MCPServerConfigSchema).mutation(({ input }) => {
    mcpServerManager.registerServer(input);
    return {
      success: true,
      serverId: input.id,
    };
  }),

  /**
   * Discover tools from an MCP server
   */
  discoverTools: protectedProcedure
    .input(z.object({ serverId: z.string() }))
    .query(async ({ input, ctx }) => {
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
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

  /**
   * Execute a tool on an MCP server
   */
  executeTool: protectedProcedure
    .input(
      z.object({
        serverId: z.string(),
        toolName: z.string(),
        input: z.record(z.string(), z.any()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await mcpServerManager.executeTool(
          input.serverId,
          input.toolName,
          input.input,
        );

        return {
          success: result.success,
          data: result.data,
          error: result.error,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

  /**
   * Get server status
   */
  getServerStatus: protectedProcedure
    .input(z.object({ serverId: z.string() }))
    .query(({ input }) => {
      const status = mcpServerManager.getServerStatus(input.serverId);
      return status || { error: 'Server not found' };
    }),

  /**
   * Get all server statuses
   */
  getAllServerStatuses: protectedProcedure.query(() => {
    return mcpServerManager.getAllServerStatuses();
  }),

  /**
   * Test connection to an MCP server
   */
  testConnection: protectedProcedure
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
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

  /**
   * Clear tool cache for a server
   */
  clearToolCache: protectedProcedure
    .input(z.object({ serverId: z.string() }))
    .mutation(({ input }) => {
      mcpServerManager.clearToolCache(input.serverId);
      return { success: true };
    }),

  /**
   * Clear all tool caches
   */
  clearAllCaches: protectedProcedure.mutation(() => {
    mcpServerManager.clearAllCaches();
    return { success: true };
  }),

  /**
   * Remove a server
   */
  removeServer: protectedProcedure
    .input(z.object({ serverId: z.string() }))
    .mutation(({ input }) => {
      mcpServerManager.removeServer(input.serverId);
      return { success: true };
    }),

  /**
   * Get all registered servers
   */
  getAllServers: protectedProcedure.query(() => {
    const servers = mcpServerManager.getAllServers();
    return servers.map(redactServerConfig);
  }),

  /**
   * Get a specific server config
   */
  getServer: protectedProcedure.input(z.object({ serverId: z.string() })).query(({ input }) => {
    const server = mcpServerManager.getServer(input.serverId);
    if (!server) {
      return { error: 'Server not found' };
    }
    return redactServerConfig(server);
  }),
});

export type MCPRouter = typeof mcpRouter;
