/**
 * Real tRPC Token Management Procedures
 * Database-backed token operations with encryption and lifecycle management
 */

import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import { TokenManager } from '../tokens/token-manager';

// TokenManager uses static methods, no instantiation needed

// Input validation schemas
const StoreTokenInput = z.object({
  serverId: z.string(),
  serverType: z.string(),
  name: z.string(),
  token: z.string(),
});

const RevokeTokenInput = z.string();

const RotateTokenInput = z.object({
  tokenId: z.string(),
  newToken: z.string(),
});

const GetServerTokensInput = z.string();

// Token response schema
const TokenResponse = z.object({
  id: z.string(),
  serverId: z.string(),
  serverType: z.string(),
  name: z.string(),
  maskedToken: z.string(),
  createdAt: z.date(),
  lastUsedAt: z.date().nullable(),
  expiresAt: z.date().nullable(),
  isActive: z.boolean(),
});

export const tokensProcedures = router({
  /**
   * List all tokens for the current user
   * Returns masked tokens (last 4 chars only)
   */
  list: publicProcedure.query(async () => {
    try {
      const tokens: any[] = [];
      // TODO: Fetch from database
      return tokens.map((token) => ({
        id: token.id,
        serverId: token.serverId,
        serverType: token.serverType,
        name: token.name,
        maskedToken: token.maskedToken,
        createdAt: token.createdAt,
        lastUsedAt: token.lastUsedAt || null,
        expiresAt: token.expiresAt || null,
        isActive: token.isActive,
      }));
    } catch (error: any) {
      throw new Error(`Failed to list tokens: ${error.message}`);
    }
  }),

  /**
   * Get tokens for a specific server
   */
  getByServer: publicProcedure
    .input(GetServerTokensInput)
    .query(async ({ input: serverId }: { input: string }) => {
      try {
        const tokens = await TokenManager.listServerTokens(serverId);
        return tokens.map((token) => ({
          id: token.id,
          serverId: token.serverId,
          serverType: token.serverType,
          name: token.name,
          maskedToken: token.maskedToken,
          createdAt: token.createdAt,
          lastUsedAt: token.lastUsedAt || null,
          expiresAt: token.expiresAt || null,
          isActive: token.isActive,
        }));
      } catch (error: any) {
        throw new Error(`Failed to get server tokens: ${error.message}`);
      }
    }),

  /**
   * Store a new token with encryption
   */
  store: publicProcedure
    .input(StoreTokenInput)
    .mutation(async ({ input }: { input: z.infer<typeof StoreTokenInput> }) => {
      try {
        const token = await TokenManager.storeToken({
          serverId: input.serverId,
          serverType: input.serverType,
          name: input.name,
          token: input.token,
        });

        return {
          id: token.id,
          serverId: token.serverId,
          serverType: token.serverType,
          name: token.name,
          maskedToken: token.maskedToken,
          createdAt: token.createdAt,
          isActive: token.isActive,
        };
      } catch (error: any) {
        throw new Error(`Failed to store token: ${error.message}`);
      }
    }),

  /**
   * Revoke a token (soft delete)
   */
  revoke: publicProcedure
    .input(RevokeTokenInput)
    .mutation(async ({ input: tokenId }: { input: string }) => {
      try {
        await TokenManager.revokeToken(tokenId);
        return { success: true, tokenId };
      } catch (error: any) {
        throw new Error(`Failed to revoke token: ${error.message}`);
      }
    }),

  /**
   * Rotate a token with new value
   */
  rotate: publicProcedure
    .input(RotateTokenInput)
    .mutation(async ({ input }: { input: z.infer<typeof RotateTokenInput> }) => {
      try {
        const token = await TokenManager.rotateToken(input.tokenId, input.newToken);

        if (!token) {
          throw new Error('Token not found');
        }

        return {
          id: token.id,
          serverId: token.serverId,
          serverType: token.serverType,
          name: token.name,
          maskedToken: token.maskedToken,
          createdAt: token.createdAt,
          isActive: token.isActive,
        };
      } catch (error: any) {
        throw new Error(`Failed to rotate token: ${error.message}`);
      }
    }),

  /**
   * Get token details (for verification)
   */
  verify: publicProcedure.input(z.string()).query(async ({ input: tokenId }: { input: string }) => {
    try {
      const metadata = await TokenManager.getTokenMetadata(tokenId);
      const isValid = metadata !== null && metadata.isActive;
      return { tokenId, isValid };
    } catch (error: any) {
      throw new Error(`Failed to verify token: ${error.message}`);
    }
  }),
});
