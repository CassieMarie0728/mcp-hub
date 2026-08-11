/** Credential-lifecycle routes remain fail-closed until tenant storage is complete. */

import { z } from "zod";

import { protectedProcedure, router } from "../_core/trpc";
import { requireTenantLifecyclePersistence } from "../security/feature-availability";

const unavailable = (feature: string) => requireTenantLifecyclePersistence(feature);

export const tokenRouter = router({
  storeToken: protectedProcedure.input(z.object({ serverId: z.string().uuid(), serverType: z.string(), name: z.string(), token: z.string(), expiresAt: z.date().optional(), scopes: z.array(z.string()).optional() })).mutation(() => unavailable("Credential storage")),
  getTokenMetadata: protectedProcedure.input(z.object({ tokenId: z.string().uuid() })).query(() => unavailable("Credential metadata")),
  listServerTokens: protectedProcedure.input(z.object({ serverId: z.string().uuid() })).query(() => unavailable("Credential listing")),
  revokeToken: protectedProcedure.input(z.object({ tokenId: z.string().uuid() })).mutation(() => unavailable("Credential revocation")),
  rotateToken: protectedProcedure.input(z.object({ tokenId: z.string().uuid(), newToken: z.string() })).mutation(() => unavailable("Credential rotation")),
  getExpiredTokens: protectedProcedure.query(() => unavailable("Credential expiry inspection")),
  getTokenStats: protectedProcedure.query(() => unavailable("Credential statistics")),
  validateScopes: protectedProcedure.input(z.object({ tokenScopes: z.array(z.string()).optional(), requiredScopes: z.array(z.string()) })).query(() => unavailable("Credential scope validation")),
});

export default tokenRouter;
