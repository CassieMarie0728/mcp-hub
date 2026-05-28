/**
 * MCP Server Manager
 * Handles connections to real MCP servers, tool discovery, and execution
 */

import axios, { AxiosInstance } from 'axios';

export interface MCPServerConfig {
  id: string;
  name: string;
  url: string;
  type: 'http' | 'websocket' | 'stdio';
  headers?: Record<string, string>;
  auth?: {
    type: 'bearer' | 'api-key' | 'basic';
    token?: string;
    username?: string;
    password?: string;
  };
  timeout?: number;
  retryAttempts?: number;
}

// Type for internal use with unknown values
type MCPServerConfigWithUnknownHeaders = Omit<MCPServerConfig, 'headers'> & {
  headers?: Record<string, unknown>;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface ServerStatus {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  lastConnected?: Date;
  lastError?: string;
  toolCount?: number;
}

class MCPServerManager {
  private servers: Map<string, MCPServerConfigWithUnknownHeaders> = new Map();
  private clients: Map<string, AxiosInstance> = new Map();
  private toolCache: Map<string, MCPTool[]> = new Map();
  private serverStatus: Map<string, ServerStatus> = new Map();

  /**
   * Register an MCP server
   */
  registerServer(config: MCPServerConfigWithUnknownHeaders): void {
    this.servers.set(config.id, config);

    // Create HTTP client with auth
    const client = axios.create({
      baseURL: config.url,
      timeout: config.timeout || 30000,
      headers: this.buildHeaders(config) as Record<string, string>,
    });

    this.clients.set(config.id, client);

    // Initialize status
    this.serverStatus.set(config.id, {
      id: config.id,
      name: config.name,
      status: 'disconnected',
    });
  }

  /**
   * Build request headers with authentication
   */
  private buildHeaders(config: MCPServerConfigWithUnknownHeaders): Record<string, string> {
    const headers: Record<string, string> = {};
    if (config.headers) {
      Object.entries(config.headers).forEach(([key, value]) => {
        headers[key] = String(value);
      });
    }

    if (config.auth) {
      switch (config.auth.type) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${config.auth.token}`;
          break;
        case 'api-key':
          headers['X-API-Key'] = config.auth.token || '';
          break;
        case 'basic':
          const credentials = btoa(`${config.auth.username}:${config.auth.password}`);
          headers['Authorization'] = `Basic ${credentials}`;
          break;
      }
    }

    return headers;
  }

  /**
   * Discover tools from an MCP server
   */
  async discoverTools(serverId: string): Promise<MCPTool[]> {
    const config = this.servers.get(serverId);
    if (!config) {
      throw new Error(`Server ${serverId} not found`);
    }

    // Check cache first
    if (this.toolCache.has(serverId)) {
      return this.toolCache.get(serverId)!;
    }

    try {
      const client = this.clients.get(serverId);
      if (!client) {
        throw new Error(`No client for server ${serverId}`);
      }

      const response = await client.post('/mcp/tools/list', {});

      const tools = response.data.tools || [];
      this.toolCache.set(serverId, tools);

      // Update status
      const status = this.serverStatus.get(serverId);
      if (status) {
        status.status = 'connected';
        status.lastConnected = new Date();
        status.toolCount = tools.length;
      }

      return tools;
    } catch (error) {
      const status = this.serverStatus.get(serverId);
      if (status) {
        status.status = 'error';
        status.lastError = error instanceof Error ? error.message : 'Unknown error';
      }

      throw error;
    }
  }

  /**
   * Execute a tool on an MCP server
   */
  async executeTool(
    serverId: string,
    toolName: string,
    input: Record<string, any>
  ): Promise<MCPToolResult> {
    const config = this.servers.get(serverId);
    if (!config) {
      throw new Error(`Server ${serverId} not found`);
    }

    try {
      const client = this.clients.get(serverId);
      if (!client) {
        throw new Error(`No client for server ${serverId}`);
      }

      const response = await client.post('/mcp/tools/call', {
        name: toolName,
        arguments: input,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const status = this.serverStatus.get(serverId);
      if (status) {
        status.status = 'error';
        status.lastError = error instanceof Error ? error.message : 'Unknown error';
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get server status
   */
  getServerStatus(serverId: string): ServerStatus | null {
    return this.serverStatus.get(serverId) || null;
  }

  /**
   * Get all server statuses
   */
  getAllServerStatuses(): ServerStatus[] {
    return Array.from(this.serverStatus.values());
  }

  /**
   * Test connection to an MCP server
   */
  async testConnection(serverId: string): Promise<boolean> {
    try {
      const client = this.clients.get(serverId);
      if (!client) {
        return false;
      }

      await client.get('/health', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear tool cache for a server
   */
  clearToolCache(serverId: string): void {
    this.toolCache.delete(serverId);
  }

  /**
   * Clear all tool caches
   */
  clearAllCaches(): void {
    this.toolCache.clear();
  }

  /**
   * Remove a server
   */
  removeServer(serverId: string): void {
    this.servers.delete(serverId);
    this.clients.delete(serverId);
    this.toolCache.delete(serverId);
    this.serverStatus.delete(serverId);
  }

  /**
   * Get all registered servers
   */
  getAllServers(): MCPServerConfigWithUnknownHeaders[] {
    return Array.from(this.servers.values());
  }

  /**
   * Get a specific server config
   */
  getServer(serverId: string): MCPServerConfigWithUnknownHeaders | null {
    return this.servers.get(serverId) || null;
  }
}

export const mcpServerManager = new MCPServerManager();
export default MCPServerManager;
