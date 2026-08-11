/**
 * OAuth lifecycle routes are deliberately unavailable until callback state,
 * grants, refresh metadata, and revocation history have tenant-scoped storage.
 */

import { z } from "zod";

import { protectedProcedure, router } from "../_core/trpc";
import { requireTenantLifecyclePersistence } from "../security/feature-availability";

const serverType = z.enum(["github", "slack", "notion"]);
const unavailable = (feature: string) => requireTenantLifecyclePersistence(feature);

export const oauthRouter = router({
  getAuthorizationUrl: protectedProcedure.input(z.object({ serverType, serverId: z.string().uuid() })).query(() => unavailable("OAuth authorization")),
  exchangeCode: protectedProcedure.input(z.object({ serverType, code: z.string(), state: z.string() })).mutation(() => unavailable("OAuth code exchange")),
  refreshToken: protectedProcedure.input(z.object({ serverId: z.string().uuid() })).mutation(() => unavailable("OAuth refresh")),
  revokeToken: protectedProcedure.input(z.object({ serverId: z.string().uuid() })).mutation(() => unavailable("OAuth revocation")),
  checkTokenStatus: protectedProcedure.input(z.object({ serverId: z.string().uuid() })).query(() => unavailable("OAuth status")),
});
