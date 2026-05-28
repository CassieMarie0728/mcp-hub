import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MCPClient, MCPClientManager } from '../mcp-client';
import { MCPServer } from '../types';

describe('MCPClient', () => {
  let client: MCPClient;

  beforeEach(() => {
    client = new MCPClient({
      serverId: 'test-server',
      connectionType: 'sse',
      url: 'http://localhost:3000/mcp',
      timeout: 5000,
    });
  });

  it('should create a client with correct config', () => {
    expect(client).toBeDefined();
    expect(client.getIsConnected()).toBe(false);
  });

  it('should initialize connection', async () => {
    // Mock fetch for initialization
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            jsonrpc: '2.0',
            id: 1,
            result: {
              capabilities: {
                tools: { listChanged: false },
              },
            },
          }),
      }),
    ) as any;

    await client.initialize();
    expect(client.getIsConnected()).toBe(true);
  });

  it('should handle initialization error', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            jsonrpc: '2.0',
            id: 1,
            error: { code: -32600, message: 'Invalid Request' },
          }),
      }),
    ) as any;

    await expect(client.initialize()).rejects.toThrow('Initialization failed');
    expect(client.getIsConnected()).toBe(false);
  });

  it('should close connection', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            jsonrpc: '2.0',
            id: 1,
            result: { capabilities: { tools: {} } },
          }),
      }),
    ) as any;

    await client.initialize();
    expect(client.getIsConnected()).toBe(true);

    await client.close();
    expect(client.getIsConnected()).toBe(false);
  });
});

describe('MCPClientManager', () => {
  let manager: MCPClientManager;

  beforeEach(() => {
    manager = new MCPClientManager();
  });

  it('should create and retrieve clients', () => {
    const config = {
      serverId: 'server-1',
      connectionType: 'sse' as const,
      url: 'http://localhost:3000/mcp',
    };

    const client = manager.createClient(config);
    expect(client).toBeDefined();

    const retrieved = manager.getClient('server-1');
    expect(retrieved).toBe(client);
  });

  it('should remove client', async () => {
    const config = {
      serverId: 'server-1',
      connectionType: 'sse' as const,
      url: 'http://localhost:3000/mcp',
    };

    manager.createClient(config);
    expect(manager.getClient('server-1')).toBeDefined();

    await manager.removeClient('server-1');
    expect(manager.getClient('server-1')).toBeUndefined();
  });

  it('should close all clients', async () => {
    const config1 = {
      serverId: 'server-1',
      connectionType: 'sse' as const,
      url: 'http://localhost:3000/mcp',
    };

    const config2 = {
      serverId: 'server-2',
      connectionType: 'sse' as const,
      url: 'http://localhost:3000/mcp',
    };

    manager.createClient(config1);
    manager.createClient(config2);

    await manager.closeAll();

    expect(manager.getClient('server-1')).toBeUndefined();
    expect(manager.getClient('server-2')).toBeUndefined();
  });
});
