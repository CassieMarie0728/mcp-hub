/**
 * Hook for managing MCP server connections and tool discovery
 */

import { useCallback, useRef } from 'react';
import { MCPClient, mcpClientManager } from '@/lib/mcp-client';
import { MCPServer, MCPTool } from '@/lib/types';
import { useApp } from '@/lib/app-context';

export function useMCPService() {
  const { updateServer, setTools } = useApp();
  const clientsRef = useRef<Map<string, MCPClient>>(new Map());

  /**
   * Connect to an MCP server
   */
  const connectServer = useCallback(
    async (server: MCPServer, timeoutOverride?: number) => {
      try {
        // Update status to connecting
        await updateServer({ ...server, status: 'connecting', error: undefined });

        // Create MCP client
      const { settings } = useApp();
      const timeout = timeoutOverride ?? (settings.executionTimeoutEnabled ? settings.executionTimeout : undefined);

      const client = mcpClientManager.createClient({
        serverId: server.id,
        connectionType: server.connectionType,
        command: server.connectionDetails.command,
        url: server.connectionDetails.url,
        headers: server.connectionDetails.headers,
        timeout,
      });

        // Initialize connection
        await client.initialize();

        // Store client reference
        clientsRef.current.set(server.id, client);

        // Update server status
        await updateServer({ ...server, status: 'connected', error: undefined });

        // Discover tools
        await discoverTools(server.id);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Connection failed';
        await updateServer({
          ...server,
          status: 'error',
          error: errorMessage,
        });
        throw error;
      }
    },
    [updateServer]
  );

  /**
   * Discover tools from a connected server
   */
  const discoverTools = useCallback(
    async (serverId: string, cursor?: string) => {
      const client = clientsRef.current.get(serverId);
      if (!client) {
        throw new Error('Client not connected');
      }

      try {
        const { tools, nextCursor } = await client.discoverTools(cursor);

        // Store tools
        await setTools(serverId, tools);

        // If there are more pages, fetch them
        if (nextCursor) {
          await discoverTools(serverId, nextCursor);
        }

        return tools;
      } catch (error) {
        console.error('Failed to discover tools:', error);
        throw error;
      }
    },
    [setTools]
  );

  /**
   * Execute a tool on a server
   */
  const executeTool = useCallback(
    async (serverId: string, toolName: string, parameters: Record<string, any>) => {
      const client = clientsRef.current.get(serverId);
      if (!client) {
        throw new Error('Client not connected');
      }

      try {
        const startTime = Date.now();
        const result = await client.executeTool(toolName, parameters);
        const duration = Date.now() - startTime;

        return {
          serverId,
          toolName,
          content: result.content,
          isError: result.isError,
          executedAt: Date.now(),
          duration,
        };
      } catch (error) {
        const duration = Date.now() - Date.now();
        return {
          serverId,
          toolName,
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ] as any[],
          isError: true,
          executedAt: Date.now(),
          duration,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    []
  );

  /**
   * Disconnect from a server
   */
  const disconnectServer = useCallback(
    async (serverId: string) => {
      const client = clientsRef.current.get(serverId);
      if (client) {
        await client.close();
        clientsRef.current.delete(serverId);
      }
      await mcpClientManager.removeClient(serverId);
    },
    []
  );

  /**
   * Disconnect all servers
   */
  const disconnectAll = useCallback(async () => {
    for (const [serverId] of clientsRef.current) {
      await disconnectServer(serverId);
    }
  }, [disconnectServer]);

  return {
    connectServer,
    discoverTools,
    executeTool,
    disconnectServer,
    disconnectAll,
  };
}
