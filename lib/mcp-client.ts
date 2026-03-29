/**
 * MCP Client implementation for connecting to MCP servers
 * Handles JSON-RPC 2.0 communication, tool discovery, and execution
 */

import {
  JSONRPCRequest,
  JSONRPCResponse,
  MCPTool,
  JSONSchema,
  ServerCapabilities,
} from './types';

export interface MCPClientConfig {
  serverId: string;
  connectionType: 'stdio' | 'sse' | 'websocket';
  command?: string; // For stdio
  url?: string; // For HTTP/SSE
  headers?: Record<string, string>;
  timeout?: number;
}

export class MCPClient {
  private config: MCPClientConfig;
  private messageId = 0;
  private pendingRequests = new Map<number, (response: JSONRPCResponse) => void>();
  private capabilities: ServerCapabilities | null = null;
  private isConnected = false;

  constructor(config: MCPClientConfig) {
    this.config = config;
  }

  /**
   * Initialize connection to MCP server
   */
  async initialize(): Promise<void> {
    try {
      // Send initialization request
      const response = await this.sendRequest('initialize', {
        protocolVersion: '2024-11-25',
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
        clientInfo: {
          name: 'MCP Hub',
          version: '1.0.0',
        },
      });

      if (response.error) {
        throw new Error(`Initialization failed: ${response.error.message}`);
      }

      // Store server capabilities
      this.capabilities = response.result?.capabilities || {};
      this.isConnected = true;
    } catch (error) {
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Discover available tools from server
   */
  async discoverTools(cursor?: string): Promise<{ tools: MCPTool[]; nextCursor?: string }> {
    if (!this.isConnected) {
      throw new Error('Not connected to server');
    }

    try {
      const response = await this.sendRequest('tools/list', {
        cursor,
      });

      if (response.error) {
        throw new Error(`Tool discovery failed: ${response.error.message}`);
      }

      const tools = response.result?.tools || [];
      return {
        tools: tools.map((tool: any) => ({
          serverId: this.config.serverId,
          name: tool.name,
          title: tool.title,
          description: tool.description,
          inputSchema: tool.inputSchema || {},
          outputSchema: tool.outputSchema,
          annotations: tool.annotations,
        })),
        nextCursor: response.result?.nextCursor,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Execute a tool on the server
   */
  async executeTool(
    toolName: string,
    arguments_: Record<string, any>
  ): Promise<{ content: Array<any>; isError: boolean }> {
    if (!this.isConnected) {
      throw new Error('Not connected to server');
    }

    try {
      const response = await this.sendRequest('tools/call', {
        name: toolName,
        arguments: arguments_,
      });

      if (response.error) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${response.error.message}` }] as any[],
          isError: true,
        };
      }

      return {
        content: (response.result?.content || []) as any[],
        isError: response.result?.isError || false,
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }] as any[],
        isError: true,
      };
    }
  }

  /**
   * Send a JSON-RPC request to the server
   */
  private async sendRequest(method: string, params?: any): Promise<JSONRPCResponse> {
    const id = ++this.messageId;
    const request: JSONRPCRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    try {
      if (this.config.connectionType === 'stdio') {
        return await this.sendViaStdio(request);
      } else if (this.config.connectionType === 'sse' || this.config.connectionType === 'websocket') {
        return await this.sendViaHttp(request);
      } else {
        throw new Error(`Unsupported connection type: ${this.config.connectionType}`);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send request via stdio (local process)
   * Note: This is a placeholder - actual implementation would need native module
   */
  private async sendViaStdio(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    // TODO: Implement stdio communication via native module
    // For now, return mock response
    console.warn('Stdio transport not yet implemented - returning mock response');
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        capabilities: {
          tools: { listChanged: false },
        },
      },
    };
  }

  /**
   * Send request via HTTP (SSE or WebSocket)
   */
  private async sendViaHttp(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    if (!this.config.url) {
      throw new Error('URL required for HTTP connection');
    }

    try {
      const response = await fetch(this.config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    this.isConnected = false;
    this.pendingRequests.clear();
  }

  /**
   * Check if client is connected
   */
  getIsConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get server capabilities
   */
  getCapabilities(): ServerCapabilities | null {
    return this.capabilities;
  }
}

/**
 * Create and manage multiple MCP client connections
 */
export class MCPClientManager {
  private clients = new Map<string, MCPClient>();

  /**
   * Create a new client for a server
   */
  createClient(config: MCPClientConfig): MCPClient {
    const client = new MCPClient(config);
    this.clients.set(config.serverId, client);
    return client;
  }

  /**
   * Get existing client
   */
  getClient(serverId: string): MCPClient | undefined {
    return this.clients.get(serverId);
  }

  /**
   * Remove client
   */
  async removeClient(serverId: string): Promise<void> {
    const client = this.clients.get(serverId);
    if (client) {
      await client.close();
      this.clients.delete(serverId);
    }
  }

  /**
   * Close all clients
   */
  async closeAll(): Promise<void> {
    for (const client of this.clients.values()) {
      await client.close();
    }
    this.clients.clear();
  }
}

// Global client manager instance
export const mcpClientManager = new MCPClientManager();
