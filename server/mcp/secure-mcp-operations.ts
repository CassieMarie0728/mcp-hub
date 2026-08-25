import type { WorkspaceAccess } from "../security/workspace-access";
import { withAuthorizedMcpRuntime } from "./authorized-mcp-runtime";
import {
  createAuthorizedMcpServer,
  getAuthorizedMcpServer as getAuthorizedMcpServerFromRepository,
  listAuthorizedMcpServers as listAuthorizedMcpServersFromRepository,
  recordAuthorizedMcpExecution,
  removeAuthorizedMcpServer as removeAuthorizedMcpServerFromRepository,
  updateAuthorizedMcpServerStatus,
  type PublicMcpServer,
} from "./mcp-server-repository";
import type { MCPServerConfig, MCPTool, MCPToolResult } from "./mcp-server-manager";

function durationSince(startedAt: number): number {
  return Date.now() - startedAt;
}

export async function registerAuthorizedMcpServer(
  access: WorkspaceAccess,
  config: Omit<MCPServerConfig, "id"> & { id?: string },
): Promise<PublicMcpServer> {
  return createAuthorizedMcpServer(access, config);
}

export async function listAuthorizedMcpServers(access: WorkspaceAccess): Promise<PublicMcpServer[]> {
  return listAuthorizedMcpServersFromRepository(access);
}

export async function getAuthorizedMcpServer(access: WorkspaceAccess, serverId: string): Promise<PublicMcpServer> {
  return getAuthorizedMcpServerFromRepository(access, serverId);
}

export async function removeAuthorizedMcpServer(access: WorkspaceAccess, serverId: string): Promise<void> {
  await removeAuthorizedMcpServerFromRepository(access, serverId);
}

export async function discoverAuthorizedMcpTools(access: WorkspaceAccess, serverId: string): Promise<MCPTool[]> {
  const startedAt = Date.now();
  try {
    const tools = await withAuthorizedMcpRuntime(access, serverId, async (runtime) => runtime.discoverTools(serverId));
    await updateAuthorizedMcpServerStatus(access, serverId, {
      status: "connected",
      lastConnected: new Date(),
      lastError: undefined,
      toolCount: tools.length,
    });
    await recordAuthorizedMcpExecution(access, {
      serverId,
      operation: "discover",
      success: true,
      durationMs: durationSince(startedAt),
    });
    return tools;
  } catch {
    await updateAuthorizedMcpServerStatus(access, serverId, { status: "error", lastError: "MCP tool discovery failed" });
    await recordAuthorizedMcpExecution(access, {
      serverId,
      operation: "discover",
      success: false,
      durationMs: durationSince(startedAt),
      errorMessage: "MCP tool discovery failed",
    });
    throw new Error("MCP tool discovery failed");
  }
}

export async function executeAuthorizedMcpTool(
  access: WorkspaceAccess,
  serverId: string,
  toolName: string,
  input: Record<string, unknown>,
): Promise<MCPToolResult> {
  const startedAt = Date.now();
  try {
    const result = await withAuthorizedMcpRuntime(access, serverId, async (runtime) =>
      runtime.executeTool(serverId, toolName, input),
    );
    await updateAuthorizedMcpServerStatus(access, serverId, result.success
      ? { status: "connected", lastConnected: new Date(), lastError: undefined }
      : { status: "error", lastError: "MCP tool execution failed" });
    await recordAuthorizedMcpExecution(access, {
      serverId,
      operation: "execute",
      toolName,
      success: result.success,
      durationMs: durationSince(startedAt),
      errorMessage: result.success ? undefined : "MCP tool execution failed",
    });
    return result;
  } catch {
    await updateAuthorizedMcpServerStatus(access, serverId, { status: "error", lastError: "MCP tool execution failed" });
    await recordAuthorizedMcpExecution(access, {
      serverId,
      operation: "execute",
      toolName,
      success: false,
      durationMs: durationSince(startedAt),
      errorMessage: "MCP tool execution failed",
    });
    return { success: false, error: "MCP tool execution failed" };
  }
}

export async function testAuthorizedMcpConnection(access: WorkspaceAccess, serverId: string): Promise<boolean> {
  const startedAt = Date.now();
  try {
    const connected = await withAuthorizedMcpRuntime(access, serverId, async (runtime) => runtime.testConnection(serverId));
    await updateAuthorizedMcpServerStatus(access, serverId, connected
      ? { status: "connected", lastConnected: new Date(), lastError: undefined }
      : { status: "error", lastError: "MCP connection test failed" });
    await recordAuthorizedMcpExecution(access, {
      serverId,
      operation: "test",
      success: connected,
      durationMs: durationSince(startedAt),
      errorMessage: connected ? undefined : "MCP connection test failed",
    });
    return connected;
  } catch {
    await updateAuthorizedMcpServerStatus(access, serverId, { status: "error", lastError: "MCP connection test failed" });
    await recordAuthorizedMcpExecution(access, {
      serverId,
      operation: "test",
      success: false,
      durationMs: durationSince(startedAt),
      errorMessage: "MCP connection test failed",
    });
    return false;
  }
}
