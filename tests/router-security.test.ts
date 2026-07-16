import { describe, expect, it } from 'vitest';
import { appRouter } from '../server/routers';
import { TRPCError } from '@trpc/server';
import type { TrpcContext } from '../server/_core/context';

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: 'https',
      headers: {},
      hostname: 'localhost',
    } as any,
    res: {} as any,
  };
}

describe('Router Security', () => {
  const ctx = createPublicContext();
  const caller = appRouter.createCaller(ctx);

  describe('Tokens Router', () => {
    it('denies access to listServerTokens for unauthenticated users', async () => {
      await expect(caller.tokens.listServerTokens({ serverId: 'test' })).rejects.toThrow();
    });

    it('denies access to getTokenStats for unauthenticated users', async () => {
      await expect(caller.tokens.getTokenStats()).rejects.toThrow();
    });
  });

  describe('Webhooks Router', () => {
    it('denies access to listWebhooks for unauthenticated users', async () => {
      await expect(caller.webhooks.listWebhooks()).rejects.toThrow();
    });
  });

  describe('Analytics Router', () => {
    it('denies access to getToolStats for unauthenticated users', async () => {
      await expect(caller.analytics.getToolStats({})).rejects.toThrow();
    });
  });

  describe('OAuth Router', () => {
    it('allows access to getAuthorizationUrl (public)', async () => {
      // This should fail with "OAuth not configured" rather than "UNAUTHORIZED"
      // because it's still a publicProcedure but the env vars aren't set in test
      try {
        await caller.oauth.getAuthorizationUrl({
          serverType: 'github',
          serverId: 'test',
        });
      } catch (error: any) {
        expect(error.message).not.toContain('not authenticated');
      }
    });

    it('denies access to refreshToken for unauthenticated users', async () => {
      await expect(
        caller.oauth.refreshToken({
          serverType: 'github',
          refreshToken: 'test',
        }),
      ).rejects.toThrow();
    });
  });
});
