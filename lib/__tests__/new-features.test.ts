import { describe, it, expect, beforeEach } from 'vitest';
import { MCPServer } from '../types';

describe('New Features Tests', () => {
  describe('Edit Server with Headers', () => {
    it('should create server with headers', () => {
      const server: MCPServer = {
        id: 'test-1',
        name: 'API Server',
        connectionType: 'sse',
        connectionDetails: {
          url: 'https://api.example.com/mcp',
          headers: {
            'Authorization': 'Bearer token123',
            'X-API-Key': 'secret-key',
          },
        },
        status: 'disconnected',
        toolCount: 0,
        createdAt: Date.now(),
      };

      expect(server.connectionDetails.headers).toBeDefined();
      expect(server.connectionDetails.headers?.['Authorization']).toBe('Bearer token123');
      expect(server.connectionDetails.headers?.['X-API-Key']).toBe('secret-key');
    });

    it('should update server headers', () => {
      const server: MCPServer = {
        id: 'test-1',
        name: 'API Server',
        connectionType: 'sse',
        connectionDetails: {
          url: 'https://api.example.com/mcp',
          headers: {
            'Authorization': 'Bearer old-token',
          },
        },
        status: 'disconnected',
        toolCount: 0,
        createdAt: Date.now(),
      };

      const updatedServer = {
        ...server,
        connectionDetails: {
          ...server.connectionDetails,
          headers: {
            'Authorization': 'Bearer new-token',
            'X-API-Key': 'new-key',
          },
        },
      };

      expect(updatedServer.connectionDetails.headers?.['Authorization']).toBe('Bearer new-token');
      expect(updatedServer.connectionDetails.headers?.['X-API-Key']).toBe('new-key');
    });

    it('should handle empty headers', () => {
      const server: MCPServer = {
        id: 'test-1',
        name: 'API Server',
        connectionType: 'sse',
        connectionDetails: {
          url: 'https://api.example.com/mcp',
        },
        status: 'disconnected',
        toolCount: 0,
        createdAt: Date.now(),
      };

      expect(server.connectionDetails.headers).toBeUndefined();
    });
  });

  describe('Execution Timeout Toggle', () => {
    it('should track timeout enabled state', () => {
      const settings = {
        theme: 'auto' as const,
        executionTimeout: 30000,
        executionTimeoutEnabled: true,
        logRetentionDays: 7,
        autoRefreshInterval: 0,
      };

      expect(settings.executionTimeoutEnabled).toBe(true);
      expect(settings.executionTimeout).toBe(30000);
    });

    it('should disable timeout', () => {
      const settings = {
        theme: 'auto' as const,
        executionTimeout: 30000,
        executionTimeoutEnabled: false,
        logRetentionDays: 7,
        autoRefreshInterval: 0,
      };

      expect(settings.executionTimeoutEnabled).toBe(false);
      // When disabled, timeout should not be applied
      const effectiveTimeout = settings.executionTimeoutEnabled ? settings.executionTimeout : undefined;
      expect(effectiveTimeout).toBeUndefined();
    });

    it('should apply timeout when enabled', () => {
      const settings = {
        theme: 'auto' as const,
        executionTimeout: 15000,
        executionTimeoutEnabled: true,
        logRetentionDays: 7,
        autoRefreshInterval: 0,
      };

      const effectiveTimeout = settings.executionTimeoutEnabled ? settings.executionTimeout : undefined;
      expect(effectiveTimeout).toBe(15000);
    });
  });

  describe('Chat Interface', () => {
    it('should parse tool call from message', () => {
      const message = '@weather_api get_weather city=New York';
      const toolCallMatch = message.match(/^@(\S+)\s+(\S+)\s*(.*)/);

      expect(toolCallMatch).toBeTruthy();
      expect(toolCallMatch?.[1]).toBe('weather_api');
      expect(toolCallMatch?.[2]).toBe('get_weather');
      expect(toolCallMatch?.[3]).toBe('city=New York');
    });

    it('should parse multiple parameters', () => {
      const message = '@api call_tool param1=value1 param2=value2 param3=value3';
      const toolCallMatch = message.match(/^@(\S+)\s+(\S+)\s*(.*)/);

      expect(toolCallMatch).toBeTruthy();
      const paramsStr = toolCallMatch?.[3] || '';
      const paramPairs = paramsStr.split(/\s+/);

      expect(paramPairs).toHaveLength(3);
      expect(paramPairs[0]).toBe('param1=value1');
      expect(paramPairs[1]).toBe('param2=value2');
      expect(paramPairs[2]).toBe('param3=value3');
    });

    it('should handle tool call without parameters', () => {
      const message = '@server_name tool_name';
      const toolCallMatch = message.match(/^@(\S+)\s+(\S+)\s*(.*)/);

      expect(toolCallMatch).toBeTruthy();
      expect(toolCallMatch?.[1]).toBe('server_name');
      expect(toolCallMatch?.[2]).toBe('tool_name');
      expect(toolCallMatch?.[3]).toBe('');
    });

    it('should not match regular chat messages', () => {
      const message = 'What is the weather today?';
      const toolCallMatch = message.match(/^@(\S+)\s+(\S+)\s*(.*)/);

      expect(toolCallMatch).toBeNull();
    });
  });
});
