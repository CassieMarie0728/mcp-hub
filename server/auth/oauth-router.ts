import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../_core/trpc";
import { getAuthorizedMcpServer } from "../mcp/secure-mcp-operations";
import { getOrCreatePersonalWorkspaceAccess } from "../security/workspace-access";
import { createOAuthConnectionIntent, getOAuthConnection, listOAuthConnections, revokeOAuthConnection } from "../lifecycle/lifecycle-repository";
import { requireTenantLifecyclePersistence } from "../security/feature-availability";

const provider = z.enum(["github", "slack", "notion"]);
const unavailable = (feature: string) => requireTenantLifecyclePersistence(feature);

async function workspaceFor(ctx: { user: { id: number } | null }) {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication is required" });
  return getOrCreatePersonalWorkspaceAccess(ctx.user);
}

export const oauthRouter = router({
  listConnections: protectedProcedure.query(async ({ ctx }) => listOAuthConnections(await workspaceFor(ctx))),
  createConnectionIntent: protectedProcedure.input(z.object({ serverId: z.string().uuid(), provider })).mutation(async ({ ctx, input }) => {
    const access = await workspaceFor(ctx);
    await getAuthorizedMcpServer(access, input.serverId);
    return createOAuthConnectionIntent(access, input);
  }),
  getConnection: protectedProcedure.input(z.object({ connectionId: z.string().uuid() })).query(async ({ ctx, input }) => getOAuthConnection(await workspaceFor(ctx), input.connectionId)),
  revokeConnection: protectedProcedure.input(z.object({ connectionId: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    await revokeOAuthConnection(await workspaceFor(ctx), input.connectionId);
    return { success: true };
  }),
  getAuthorizationUrl: protectedProcedure.input(z.object({ serverType: provider, serverId: z.string().uuid() })).query(() => unavailable("OAuth authorization callback")),
  exchangeCode: protectedProcedure.input(z.object({ serverType: provider, code: z.string(), state: z.string() })).mutation(() => unavailable("OAuth code exchange")),
  refreshToken: protectedProcedure.input(z.object({ serverId: z.string().uuid() })).mutation(() => unavailable("OAuth refresh")),
  checkTokenStatus: protectedProcedure.input(z.object({ serverId: z.string().uuid() })).query(() => unavailable("OAuth token status")),
});
