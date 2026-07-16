import { describe, expect, it, beforeEach } from 'vitest';
import { appRouter } from '../server/routers';
import { mcpServerManager } from '../server/mcp/mcp-server-manager';

describe('MCP Router Security - Sensitive Data Exposure', () => {
  const ctx = {
    user: { id: 'test-user' },
    req: {} as any,
    res: {} as any,
  };
  const caller = appRouter.createCaller(ctx as any);

  beforeEach(() => {
    // Clear servers before each test if possible,
    // but since it's a singleton we might just need to be careful
  });

  it('redacts sensitive auth information in getServer', async () => {
    const serverConfig: any = {
      id: 'secure-server',
      name: 'Secure Server',
      url: 'https://api.example.com',
      type: 'http' as const,
      auth: {
        type: 'basic' as const,
        username: 'admin',
        password: 'secret-password',
      },
    };

    mcpServerManager.registerServer(serverConfig);

    const result: any = await caller.mcp.getServer({ serverId: 'secure-server' });

    expect(result.id).toBe('secure-server');
    expect(result.auth).toBeDefined();
    expect(result.auth.username).toBe('admin');
    // This is what we want to fail currently (it should be redacted)
    expect(result.auth.password).toBeUndefined();
  });

  it('redacts sensitive auth information in getAllServers', async () => {
    const serverConfig: any = {
      id: 'secure-server-2',
      name: 'Secure Server 2',
      url: 'https://api.example.com',
      type: 'http' as const,
      auth: {
        type: 'bearer' as const,
        token: 'secret-token',
      },
    };

    mcpServerManager.registerServer(serverConfig);

    const servers: any[] = await caller.mcp.getAllServers();
    const server = servers.find((s) => s.id === 'secure-server-2');

    expect(server).toBeDefined();
    expect(server.auth).toBeDefined();
    // This is what we want to fail currently
    expect(server.auth.token).toBeUndefined();
  });
});
