/**
 * MCP Server Manager
 * Holds ephemeral MCP runtime state only. Every network request is routed through
 * the SSRF-safe outbound policy; durable configuration is handled by the tenant
 * repository and hydrated briefly by the authorized runtime.
 */

import {
  assertSafeMcpHeaders,
  parseSafeMcpEndpoint,
  safeMcpRequest,
} from "../security/mcp-outbound-policy";

export interface MCPServerConfig {
  id: string;
  name: string;
  url: string;
  type: "http" | "websocket" | "stdio";
  headers?: Record<string, string>;
  auth?: {
    type: "bearer" | "api-key" | "basic";
    token?: string;
    username?: string;
    password?: string;
  };
  timeout?: number;
  retryAttempts?: number;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface MCPToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface ServerStatus {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "error";
  lastConnected?: Date;
  lastError?: string;
  toolCount?: number;
}

export class MCPServerManager {
  private servers = new Map<string, MCPServerConfig>();
  private toolCache = new Map<string, MCPTool[]>();
  private serverStatus = new Map<string, ServerStatus>();

  registerServer(config: MCPServerConfig): void {
    parseSafeMcpEndpoint(config.url);
    assertSafeMcpHeaders(config.headers);
    this.servers.set(config.id, config);
    this.serverStatus.set(config.id, {
      id: config.id,
      name: config.name,
      status: "disconnected",
    });
  }

  private buildHeaders(config: MCPServerConfig): Record<string, string> {
    const headers: Record<string, string> = { ...(config.headers ?? {}) };
    if (!config.auth) return headers;

    switch (config.auth.type) {
      case "bearer":
        if (config.auth.token) headers.Authorization = `Bearer ${config.auth.token}`;
        break;
      case "api-key":
        if (config.auth.token) headers["X-API-Key"] = config.auth.token;
        break;
      case "basic":
        headers.Authorization = `Basic ${Buffer.from(`${config.auth.username ?? ""}:${config.auth.password ?? ""}`).toString("base64")}`;
        break;
    }
    assertSafeMcpHeaders(headers);
    return headers;
  }

  async discoverTools(serverId: string): Promise<MCPTool[]> {
    const config = this.servers.get(serverId);
    if (!config) throw new Error("MCP server not found");
    const cached = this.toolCache.get(serverId);
    if (cached) return cached;

    try {
      const response = await safeMcpRequest(config.url, "/mcp/tools/list", {
        method: "POST",
        headers: this.buildHeaders(config),
        body: {},
        timeoutMs: config.timeout,
      });
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw new Error("Unsuccessful tool discovery response");
      }
      const tools = response.body && typeof response.body === "object" && "tools" in response.body
        ? (response.body as { tools?: MCPTool[] }).tools ?? []
        : [];

      this.toolCache.set(serverId, tools);
      this.serverStatus.set(serverId, {
        id: serverId,
        name: config.name,
        status: "connected",
        lastConnected: new Date(),
        toolCount: tools.length,
      });
      return tools;
    } catch {
      this.serverStatus.set(serverId, {
        id: serverId,
        name: config.name,
        status: "error",
        lastError: "MCP tool discovery failed",
      });
      throw new Error("MCP tool discovery failed");
    }
  }

  async executeTool(
    serverId: string,
    toolName: string,
    input: Record<string, unknown>,
  ): Promise<MCPToolResult> {
    const config = this.servers.get(serverId);
    if (!config) throw new Error("MCP server not found");

    try {
      const response = await safeMcpRequest(config.url, "/mcp/tools/call", {
        method: "POST",
        headers: this.buildHeaders(config),
        body: { name: toolName, arguments: input },
        timeoutMs: config.timeout,
      });
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw new Error("Unsuccessful tool execution response");
      }
      const data = response.body && typeof response.body === "object" && "result" in response.body
        ? (response.body as { result: unknown }).result
        : response.body;
      return { success: true, data };
    } catch {
      this.serverStatus.set(serverId, {
        id: serverId,
        name: config.name,
        status: "error",
        lastError: "MCP tool execution failed",
      });
      return { success: false, error: "MCP tool execution failed" };
    }
  }

  getServerStatus(serverId: string): ServerStatus | null {
    return this.serverStatus.get(serverId) ?? null;
  }

  getAllServerStatuses(): ServerStatus[] {
    return [...this.serverStatus.values()];
  }

  async testConnection(serverId: string): Promise<boolean> {
    const config = this.servers.get(serverId);
    if (!config) return false;
    try {
      const response = await safeMcpRequest(config.url, "/health", {
        method: "GET",
        headers: this.buildHeaders(config),
        timeoutMs: Math.min(config.timeout ?? 5_000, 5_000),
      });
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch {
      return false;
    }
  }

  clearToolCache(serverId: string): void {
    this.toolCache.delete(serverId);
  }

  clearAllCaches(): void {
    this.toolCache.clear();
  }

  removeServer(serverId: string): void {
    this.servers.delete(serverId);
    this.toolCache.delete(serverId);
    this.serverStatus.delete(serverId);
  }

  getAllServers(): MCPServerConfig[] {
    return [...this.servers.values()];
  }

  getServer(serverId: string): MCPServerConfig | null {
    return this.servers.get(serverId) ?? null;
  }
}

export const mcpServerManager = new MCPServerManager();
export default MCPServerManager;
