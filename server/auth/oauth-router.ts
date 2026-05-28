/**
 * OAuth tRPC Router
 * Handles OAuth flows for GitHub, Slack, and Notion
 */

import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import { OAuthManager } from './oauth-manager';

const ServerTypeEnum = z.enum(['github', 'slack', 'notion']);

export const oauthRouter = router({
  /**
   * Get OAuth authorization URL
   */
  getAuthorizationUrl: publicProcedure
    .input(
      z.object({
        serverType: ServerTypeEnum,
        serverId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const { url, state } = OAuthManager.generateAuthorizationUrl(
          input.serverType,
          input.serverId,
        );

        return {
          url,
          state,
          serverType: input.serverType,
        };
      } catch (error: any) {
        throw new Error(`Failed to generate authorization URL: ${error.message}`);
      }
    }),

  /**
   * Exchange authorization code for access token
   */
  exchangeCode: publicProcedure
    .input(
      z.object({
        serverType: ServerTypeEnum,
        code: z.string(),
        state: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        // Verify state
        const stateData = OAuthManager.verifyState(input.state);
        if (!stateData) {
          throw new Error('Invalid or expired state token');
        }

        // Exchange code for token
        const token = await OAuthManager.exchangeCodeForToken(input.serverType, input.code);

        return {
          success: true,
          token: {
            accessToken: token.accessToken,
            tokenType: token.tokenType,
            expiresAt: token.expiresAt,
          },
          serverId: stateData.serverId,
        };
      } catch (error: any) {
        throw new Error(`Failed to exchange code: ${error.message}`);
      }
    }),

  /**
   * Refresh access token
   */
  refreshToken: publicProcedure
    .input(
      z.object({
        serverType: ServerTypeEnum,
        refreshToken: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const token = await OAuthManager.refreshAccessToken(input.serverType, input.refreshToken);

        return {
          success: true,
          token: {
            accessToken: token.accessToken,
            tokenType: token.tokenType,
            expiresAt: token.expiresAt,
          },
        };
      } catch (error: any) {
        throw new Error(`Failed to refresh token: ${error.message}`);
      }
    }),

  /**
   * Revoke access token
   */
  revokeToken: publicProcedure
    .input(
      z.object({
        serverType: ServerTypeEnum,
        token: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const success = await OAuthManager.revokeToken(input.serverType, input.token);

        return { success };
      } catch (error: any) {
        throw new Error(`Failed to revoke token: ${error.message}`);
      }
    }),

  /**
   * Check if token needs refresh
   */
  checkTokenStatus: publicProcedure
    .input(
      z.object({
        expiresAt: z.date().optional(),
      }),
    )
    .query(async ({ input }) => {
      if (!input.expiresAt) {
        return { needsRefresh: false, isExpired: false };
      }

      const isExpired = new Date() > input.expiresAt;
      const needsRefresh = !isExpired && new Date(Date.now() + 300000) > input.expiresAt;

      return {
        needsRefresh,
        isExpired,
        expiresIn: Math.max(0, input.expiresAt.getTime() - Date.now()),
      };
    }),
});
