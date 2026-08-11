import type { WorkspaceAccess } from "../security/workspace-access";
import { getAuthorizedMcpServerConfig } from "./mcp-server-repository";
import { MCPServerManager, type MCPServerConfig } from "./mcp-server-manager";

/**
 * Hydrates a single server's encrypted credentials into a request-local manager.
 * The manager and its decrypted configuration go out of scope immediately after
 * the operation; no tenant credentials enter the global in-memory registry.
 */
export async function withAuthorizedMcpRuntime<T>(
  access: WorkspaceAccess,
  serverId: string,
  operation: (runtime: MCPServerManager, config: MCPServerConfig) => Promise<T>,
): Promise<T> {
  const config = await getAuthorizedMcpServerConfig(access, serverId);
  const runtime = new MCPServerManager();
  runtime.registerServer(config);
  try {
    return await operation(runtime, config);
  } finally {
    runtime.removeServer(serverId);
  }
}
