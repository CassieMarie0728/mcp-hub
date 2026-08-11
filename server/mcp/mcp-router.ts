/** Tenant-scoped tRPC procedures for MCP server management and execution. */

import { z } from "zod";

import { protectedProcedure, router } from "../_core/trpc";
import { getOrCreatePersonalWorkspaceAccess } from "../security/workspace-access";
import {
  discoverAuthorizedMcpTools,
  executeAuthorizedMcpTool,
  getAuthorizedMcpServer,
  listAuthorizedMcpServers,
  registerAuthorizedMcpServer,
  removeAuthorizedMcpServer,
  testAuthorizedMcpConnection,
} from "./secure-mcp-operations";

const serverIdSchema = z.object({ serverId: z.string().uuid() });
const serverConfigSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(255),
  url: z.string().url().max(2048),
  type: z.literal("http").default("http"),
  headers: z.record(z.string(), z.string()).optional(),
  auth: z.object({
    type: z.enum(["bearer", "api-key", "basic"]),
    token: z.string().max(4096).optional(),
    username: z.string().max(1024).optional(),
    password: z.string().max(4096).optional(),
  }).optional(),
  timeout: z.number().int().positive().max(8_000).optional(),
  retryAttempts: z.number().int().min(0).max(1).optional(),
});

async function workspaceFor(ctx: { user: { id: number } | null }) {
  if (!ctx.user) throw new Error("Authentication is required");
  return getOrCreatePersonalWorkspaceAccess(ctx.user);
}

export const mcpRouter = router({
  registerServer: protectedProcedure.input(serverConfigSchema).mutation(async ({ ctx, input }) => {
    const access = await workspaceFor(ctx);
    const server = await registerAuthorizedMcpServer(access, input);
    return { success: true, serverId: server.id, server };
  }),

  discoverTools: protectedProcedure.input(serverIdSchema).query(async ({ ctx, input }) => {
    const tools = await discoverAuthorizedMcpTools(await workspaceFor(ctx), input.serverId);
    return { success: true, tools, count: tools.length };
  }),

  executeTool: protectedProcedure.input(z.object({
    serverId: z.string().uuid(),
    toolName: z.string().trim().min(1).max(255),
    input: z.record(z.string(), z.unknown()),
  })).mutation(async ({ ctx, input }) => {
    const result = await executeAuthorizedMcpTool(await workspaceFor(ctx), input.serverId, input.toolName, input.input);
    return { success: result.success, data: result.data, error: result.error };
  }),

  getServerStatus: protectedProcedure.input(serverIdSchema).query(async ({ ctx, input }) =>
    getAuthorizedMcpServer(await workspaceFor(ctx), input.serverId),
  ),

  getAllServerStatuses: protectedProcedure.query(async ({ ctx }) =>
    listAuthorizedMcpServers(await workspaceFor(ctx)),
  ),

  testConnection: protectedProcedure.input(serverIdSchema).mutation(async ({ ctx, input }) => {
    const connected = await testAuthorizedMcpConnection(await workspaceFor(ctx), input.serverId);
    return { success: connected, connected };
  }),

  // Runtime state is request-local by design, so cache invalidation is a no-op.
  clearToolCache: protectedProcedure.input(serverIdSchema).mutation(() => ({ success: true })),
  clearAllCaches: protectedProcedure.mutation(() => ({ success: true })),

  removeServer: protectedProcedure.input(serverIdSchema).mutation(async ({ ctx, input }) => {
    await removeAuthorizedMcpServer(await workspaceFor(ctx), input.serverId);
    return { success: true };
  }),

  getAllServers: protectedProcedure.query(async ({ ctx }) =>
    listAuthorizedMcpServers(await workspaceFor(ctx)),
  ),

  getServer: protectedProcedure.input(serverIdSchema).query(async ({ ctx, input }) =>
    getAuthorizedMcpServer(await workspaceFor(ctx), input.serverId),
  ),
});

export type MCPRouter = typeof mcpRouter;
