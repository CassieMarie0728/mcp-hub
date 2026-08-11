/** Additional tenant-scoped MCP procedures for registry-backed server presets. */

import { z } from "zod";

import { protectedProcedure, router } from "../_core/trpc";
import { getOrCreatePersonalWorkspaceAccess } from "../security/workspace-access";
import MCPServerRegistry, { ServerType } from "./mcp-server-registry";
import {
  discoverAuthorizedMcpTools,
  executeAuthorizedMcpTool,
  listAuthorizedMcpServers,
  registerAuthorizedMcpServer,
  removeAuthorizedMcpServer,
  testAuthorizedMcpConnection,
} from "./secure-mcp-operations";

async function workspaceFor(ctx: { user: { id: number } | null }) {
  if (!ctx.user) throw new Error("Authentication is required");
  return getOrCreatePersonalWorkspaceAccess(ctx.user);
}

export const mcpExtendedRouter = router({
  getAvailableServers: protectedProcedure.query(() => MCPServerRegistry.getAllServers()),

  getServerDefinition: protectedProcedure.input(z.object({ type: z.string() })).query(({ input }) =>
    MCPServerRegistry.getServerDefinition(input.type as ServerType) ?? { error: "Server type not found" },
  ),

  getServerTools: protectedProcedure.input(z.object({ type: z.string() })).query(({ input }) => {
    const tools = MCPServerRegistry.getServerTools(input.type as ServerType);
    return { success: true, tools, count: tools.length };
  }),

  validateToken: protectedProcedure.input(z.object({ type: z.string(), token: z.string().min(1) })).mutation(async ({ input }) => ({
    success: true,
    valid: await MCPServerRegistry.validateToken(input.type as ServerType, input.token),
  })),

  registerRealServer: protectedProcedure.input(z.object({
    type: z.string(),
    token: z.string().min(1),
    customName: z.string().trim().min(1).max(255).optional(),
  })).mutation(async ({ ctx, input }) => {
    const isValid = await MCPServerRegistry.validateToken(input.type as ServerType, input.token);
    if (!isValid) return { success: false, error: "Invalid token for this server type" };
    const config = MCPServerRegistry.createServerConfig(input.type as ServerType, input.token);
    if (!config) return { success: false, error: "Server type is not available" };
    const server = await registerAuthorizedMcpServer(await workspaceFor(ctx), {
      ...config,
      name: input.customName ?? config.name,
      type: "http",
    });
    const connected = await testAuthorizedMcpConnection(await workspaceFor(ctx), server.id);
    return { success: true, serverId: server.id, serverName: server.name, connected };
  }),

  getRegisteredServers: protectedProcedure.query(async ({ ctx }) =>
    listAuthorizedMcpServers(await workspaceFor(ctx)),
  ),

  discoverServerTools: protectedProcedure.input(z.object({ serverId: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const tools = await discoverAuthorizedMcpTools(await workspaceFor(ctx), input.serverId);
    return { success: true, tools, count: tools.length };
  }),

  executeServerTool: protectedProcedure.input(z.object({
    serverId: z.string().uuid(),
    toolName: z.string().trim().min(1).max(255),
    parameters: z.record(z.string(), z.unknown()),
  })).mutation(async ({ ctx, input }) => {
    const result = await executeAuthorizedMcpTool(await workspaceFor(ctx), input.serverId, input.toolName, input.parameters);
    return { success: result.success, data: result.data, error: result.error };
  }),

  testServerConnection: protectedProcedure.input(z.object({ serverId: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const connected = await testAuthorizedMcpConnection(await workspaceFor(ctx), input.serverId);
    return { success: connected, connected };
  }),

  unregisterServer: protectedProcedure.input(z.object({ serverId: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    await removeAuthorizedMcpServer(await workspaceFor(ctx), input.serverId);
    return { success: true };
  }),
});

export type MCPExtendedRouter = typeof mcpExtendedRouter;
