import { describe, expect, it, beforeEach } from 'vitest';
import { mcpRouter } from '../server/mcp/mcp-router';
import { mcpServerManager } from '../server/mcp/mcp-server-manager';
import type { TrpcContext } from '../server/_core/context';

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: 'admin-user',
      email: 'admin@example.com',
      name: 'Admin User',
      loginMethod: 'manus',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as any,
    res: {} as any,
  };
}

describe('MCP Router Security Leak', () => {
  beforeEach(() => {
    // Clear any registered servers
    const servers = mcpServerManager.getAllServers();
    servers.forEach((s) => mcpServerManager.removeServer(s.id));
  });

  it('redacts sensitive auth data in getServer', async () => {
    const ctx = createAdminContext();
    const caller = mcpRouter.createCaller(ctx);

    const sensitiveConfig = {
      id: 'test-server',
      name: 'Test Server',
      url: 'http://example.com',
      type: 'http' as const,
      auth: {
        type: 'bearer' as const,
        token: 'SUPER_SECRET_TOKEN',
      },
      headers: {
        Authorization: 'Bearer SECRET_HEADER',
        'X-API-KEY': 'SECRET_KEY',
      },
    };

    mcpServerManager.registerServer(sensitiveConfig);

    const result = (await caller.getServer({ serverId: 'test-server' })) as any;

    expect(result.auth?.token).toBe('[REDACTED]');
    expect(result.headers?.['Authorization']).toBe('[REDACTED]');
    expect(result.headers?.['X-API-KEY']).toBe('[REDACTED]');
  });

  it('redacts sensitive auth data in getAllServers', async () => {
    const ctx = createAdminContext();
    const caller = mcpRouter.createCaller(ctx);

    const sensitiveConfig = {
      id: 'test-server-2',
      name: 'Test Server 2',
      url: 'http://example.com',
      type: 'http' as const,
      auth: {
        type: 'basic' as const,
        username: 'admin',
        password: 'SUPER_SECRET_PASSWORD',
      },
    };

    mcpServerManager.registerServer(sensitiveConfig);

    const results = (await caller.getAllServers()) as any[];
    const server = results.find((s) => s.id === 'test-server-2');

    expect(server).toBeDefined();
    expect(server.auth?.password).toBe('[REDACTED]');
  });
});
