/**
 * Token Management tRPC Router
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import TokenManager from './token-manager';

export const tokenRouter = router({
  /**
   * Store a new token securely
   */
  storeToken: protectedProcedure
    .input(
      z.object({
        serverId: z.string(),
        serverType: z.string(),
        name: z.string(),
        token: z.string(),
        expiresAt: z.date().optional(),
        scopes: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return TokenManager.storeToken(input);
    }),

  /**
   * Get token metadata
   */
  getTokenMetadata: protectedProcedure
    .input(z.object({ tokenId: z.string() }))
    .query(async ({ input }) => {
      return TokenManager.getTokenMetadata(input.tokenId);
    }),

  /**
   * List all tokens for a server
   */
  listServerTokens: protectedProcedure
    .input(z.object({ serverId: z.string() }))
    .query(async ({ input }) => {
      return TokenManager.listServerTokens(input.serverId);
    }),

  /**
   * Revoke a token
   */
  revokeToken: protectedProcedure
    .input(z.object({ tokenId: z.string() }))
    .mutation(async ({ input }) => {
      return TokenManager.revokeToken(input.tokenId);
    }),

  /**
   * Rotate a token
   */
  rotateToken: protectedProcedure
    .input(z.object({ tokenId: z.string(), newToken: z.string() }))
    .mutation(async ({ input }) => {
      return TokenManager.rotateToken(input.tokenId, input.newToken);
    }),

  /**
   * Get expired tokens
   */
  getExpiredTokens: protectedProcedure.query(async () => {
    return TokenManager.getExpiredTokens();
  }),

  /**
   * Get token statistics
   */
  getTokenStats: protectedProcedure.query(async () => {
    return TokenManager.getTokenStats();
  }),

  /**
   * Validate token scopes
   */
  validateScopes: protectedProcedure
    .input(
      z.object({
        tokenScopes: z.array(z.string()).optional(),
        requiredScopes: z.array(z.string()),
      }),
    )
    .query(({ input }) => {
      return TokenManager.validateScopes(input.tokenScopes, input.requiredScopes);
    }),
});

export default tokenRouter;
