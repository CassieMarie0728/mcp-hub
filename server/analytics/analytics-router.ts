/** Protected activity-reporting procedures backed by durable authorized MCP logs. */

import { z } from "zod";

import { protectedProcedure, router } from "../_core/trpc";
import {
  getAuthorizedMcpActivityReport,
  listAuthorizedMcpExecutions,
  type McpExecutionOperation,
} from "../mcp/mcp-server-repository";
import { getOrCreatePersonalWorkspaceAccess } from "../security/workspace-access";

const executionOperationSchema = z.enum(["discover", "execute", "test"]);

async function workspaceFor(ctx: { user: { id: number } | null }) {
  if (!ctx.user) throw new Error("Authentication is required");
  return getOrCreatePersonalWorkspaceAccess(ctx.user);
}

export const analyticsRouter = router({
  getExecutionHistory: protectedProcedure
    .input(z.object({
      serverId: z.string().uuid().optional(),
      operation: executionOperationSchema.optional(),
      success: z.boolean().optional(),
      limit: z.number().int().min(1).max(100).default(25),
      offset: z.number().int().min(0).max(10_000).default(0),
    }))
    .query(async ({ ctx, input }) =>
      listAuthorizedMcpExecutions(await workspaceFor(ctx), {
        ...input,
        operation: input.operation as McpExecutionOperation | undefined,
      }),
    ),

  getReport: protectedProcedure
    .input(z.object({
      serverId: z.string().uuid().optional(),
      range: z.enum(["7d", "30d"]).default("7d"),
    }))
    .query(async ({ ctx, input }) => {
      const endAt = new Date();
      const startAt = new Date(endAt.getTime() - (input.range === "30d" ? 30 : 7) * 24 * 60 * 60 * 1000);
      return getAuthorizedMcpActivityReport(await workspaceFor(ctx), {
        serverId: input.serverId,
        startAt,
        endAt,
      });
    }),
});

export default analyticsRouter;
