import { and, eq } from "drizzle-orm";

import { mcpCredentials, mcpExecutionLogs, mcpServers } from "../../drizzle/schema";
import { getDb } from "../db";
import {
  decryptMcpCredentials,
  encryptMcpCredentials,
  type McpCredentialPayload,
} from "../security/mcp-credential-vault";
import { assertSafeMcpHeaders, parseSafeMcpEndpoint } from "../security/mcp-outbound-policy";
import type { WorkspaceAccess } from "../security/workspace-access";
import type { MCPServerConfig, ServerStatus } from "./mcp-server-manager";

type StoredCredentials = {
  headers?: Record<string, string>;
  auth?: MCPServerConfig["auth"];
};

export type PublicMcpServer = {
  id: string;
  name: string;
  url: string;
  type: "http";
  status: "connected" | "disconnected" | "error";
  lastConnected?: Date;
  lastError?: string;
  toolCount: number;
};

function unavailable(): never {
  throw new Error("Durable MCP storage is not available");
}

function toPublicServer(server: typeof mcpServers.$inferSelect): PublicMcpServer {
  return {
    id: server.id,
    name: server.name,
    url: server.endpoint,
    type: "http",
    status: server.status,
    lastConnected: server.lastConnectedAt ?? undefined,
    lastError: server.lastError ?? undefined,
    toolCount: server.toolCount,
  };
}

function asStoredCredentials(payload: McpCredentialPayload): StoredCredentials {
  const headers = payload.headers;
  const auth = payload.auth;
  if (headers !== undefined && (!headers || typeof headers !== "object" || Array.isArray(headers))) {
    throw new Error("Stored MCP credentials are invalid");
  }
  if (auth !== undefined && (!auth || typeof auth !== "object" || Array.isArray(auth))) {
    throw new Error("Stored MCP credentials are invalid");
  }
  return {
    headers: headers as Record<string, string> | undefined,
    auth: auth as MCPServerConfig["auth"],
  };
}

export async function createAuthorizedMcpServer(
  access: WorkspaceAccess,
  input: Omit<MCPServerConfig, "id"> & { id?: string },
): Promise<PublicMcpServer> {
  const db = await getDb();
  if (!db) unavailable();
  const endpoint = parseSafeMcpEndpoint(input.url).toString();
  assertSafeMcpHeaders(input.headers);
  const id = input.id ?? crypto.randomUUID();
  const credentialPayload: StoredCredentials = {
    headers: input.headers,
    auth: input.auth,
  };

  await db.transaction(async (tx) => {
    await tx.insert(mcpServers).values({
      id,
      workspaceId: access.workspaceId,
      name: input.name,
      endpoint,
      transport: "http",
      headersJson: null,
      status: "disconnected",
    });
    await tx.insert(mcpCredentials).values({
      id: crypto.randomUUID(),
      serverId: id,
      encryptedPayload: encryptMcpCredentials(credentialPayload),
      keyVersion: "v1",
    });
  });

  return {
    id,
    name: input.name,
    url: endpoint,
    type: "http",
    status: "disconnected",
    toolCount: 0,
  };
}

export async function listAuthorizedMcpServers(access: WorkspaceAccess): Promise<PublicMcpServer[]> {
  const db = await getDb();
  if (!db) unavailable();
  const servers = await db.select().from(mcpServers).where(eq(mcpServers.workspaceId, access.workspaceId));
  return servers.map(toPublicServer);
}

export async function getAuthorizedMcpServerConfig(
  access: WorkspaceAccess,
  serverId: string,
): Promise<MCPServerConfig> {
  const db = await getDb();
  if (!db) unavailable();
  const servers = await db
    .select()
    .from(mcpServers)
    .where(and(eq(mcpServers.id, serverId), eq(mcpServers.workspaceId, access.workspaceId)))
    .limit(1);
  const server = servers[0];
  if (!server) throw new Error("MCP server not found");

  const credentialRows = await db
    .select({ encryptedPayload: mcpCredentials.encryptedPayload })
    .from(mcpCredentials)
    .where(eq(mcpCredentials.serverId, server.id))
    .limit(1);
  const credential = credentialRows[0];
  if (!credential) throw new Error("MCP server credentials are unavailable");
  const credentials = asStoredCredentials(decryptMcpCredentials(credential.encryptedPayload));

  return {
    id: server.id,
    name: server.name,
    url: server.endpoint,
    type: "http",
    headers: credentials.headers,
    auth: credentials.auth,
  };
}

export async function getAuthorizedMcpServer(
  access: WorkspaceAccess,
  serverId: string,
): Promise<PublicMcpServer> {
  const db = await getDb();
  if (!db) unavailable();
  const servers = await db
    .select()
    .from(mcpServers)
    .where(and(eq(mcpServers.id, serverId), eq(mcpServers.workspaceId, access.workspaceId)))
    .limit(1);
  if (!servers[0]) throw new Error("MCP server not found");
  return toPublicServer(servers[0]);
}

export async function updateAuthorizedMcpServerStatus(
  access: WorkspaceAccess,
  serverId: string,
  status: Pick<ServerStatus, "status" | "lastConnected" | "lastError" | "toolCount">,
): Promise<void> {
  const db = await getDb();
  if (!db) unavailable();
  await db
    .update(mcpServers)
    .set({
      status: status.status,
      lastConnectedAt: status.lastConnected ?? null,
      lastError: status.lastError ?? null,
      toolCount: status.toolCount,
    })
    .where(and(eq(mcpServers.id, serverId), eq(mcpServers.workspaceId, access.workspaceId)));
}

export async function removeAuthorizedMcpServer(access: WorkspaceAccess, serverId: string): Promise<void> {
  const db = await getDb();
  if (!db) unavailable();
  await db
    .delete(mcpServers)
    .where(and(eq(mcpServers.id, serverId), eq(mcpServers.workspaceId, access.workspaceId)));
}

export async function recordAuthorizedMcpExecution(
  access: WorkspaceAccess,
  input: {
    serverId: string;
    operation: "discover" | "execute" | "test";
    toolName?: string;
    success: boolean;
    durationMs: number;
    errorMessage?: string;
  },
): Promise<void> {
  const db = await getDb();
  if (!db) unavailable();
  await db.insert(mcpExecutionLogs).values({
    id: crypto.randomUUID(),
    workspaceId: access.workspaceId,
    serverId: input.serverId,
    operation: input.operation,
    toolName: input.toolName,
    success: input.success ? "true" : "false",
    durationMs: Math.max(0, Math.round(input.durationMs)),
    errorMessage: input.errorMessage?.slice(0, 512),
  });
}
