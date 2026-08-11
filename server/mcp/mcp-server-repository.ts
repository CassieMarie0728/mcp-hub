import { and, desc, eq, gte, lte } from "drizzle-orm";

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

export type McpExecutionOperation = "discover" | "execute" | "test";

export type PublicMcpExecution = {
  id: string;
  serverId: string;
  serverName: string;
  operation: McpExecutionOperation;
  toolName?: string;
  success: boolean;
  durationMs: number;
  errorMessage?: string;
  createdAt: Date;
};

export type PublicMcpActivityReport = {
  generatedAt: Date;
  period: {
    startAt: Date;
    endAt: Date;
  };
  totals: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    successRate: number;
    averageDurationMs: number;
  };
  byOperation: Array<{
    operation: McpExecutionOperation;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageDurationMs: number;
  }>;
  topTools: Array<{
    toolName: string;
    totalExecutions: number;
    successfulExecutions: number;
    successRate: number;
  }>;
  activeServers: Array<{
    serverId: string;
    serverName: string;
    totalExecutions: number;
    successfulExecutions: number;
    successRate: number;
    averageDurationMs: number;
  }>;
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

function asMcpExecutionOperation(operation: string): McpExecutionOperation {
  if (operation === "discover" || operation === "execute" || operation === "test") {
    return operation;
  }
  throw new Error("Stored MCP execution operation is invalid");
}

function toPublicExecution(row: {
  log: typeof mcpExecutionLogs.$inferSelect;
  serverName: string;
}): PublicMcpExecution {
  return {
    id: row.log.id,
    serverId: row.log.serverId,
    serverName: row.serverName,
    operation: asMcpExecutionOperation(row.log.operation),
    toolName: row.log.toolName ?? undefined,
    success: row.log.success === "true",
    durationMs: Math.max(0, row.log.durationMs ?? 0),
    errorMessage: row.log.errorMessage ?? undefined,
    createdAt: row.log.createdAt,
  };
}

function roundedRate(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : Math.round((numerator / denominator) * 10_000) / 100;
}

function roundedAverage(total: number, count: number): number {
  return count === 0 ? 0 : Math.round(total / count);
}

type ExecutionAggregate = {
  totalExecutions: number;
  successfulExecutions: number;
  totalDurationMs: number;
};

function aggregateExecutions<T>(
  executions: PublicMcpExecution[],
  keyFor: (execution: PublicMcpExecution) => T | undefined,
): Map<T, ExecutionAggregate> {
  const aggregate = new Map<T, ExecutionAggregate>();

  for (const execution of executions) {
    const key = keyFor(execution);
    if (key === undefined) continue;
    const current = aggregate.get(key) ?? { totalExecutions: 0, successfulExecutions: 0, totalDurationMs: 0 };
    current.totalExecutions += 1;
    current.successfulExecutions += execution.success ? 1 : 0;
    current.totalDurationMs += execution.durationMs;
    aggregate.set(key, current);
  }

  return aggregate;
}

/**
 * Builds a report from already-authorized, public activity records. The source data
 * intentionally contains no endpoints, credentials, request payloads, or tool results.
 */
export function summarizeAuthorizedMcpExecutions(
  executions: PublicMcpExecution[],
  period: { startAt: Date; endAt: Date },
): PublicMcpActivityReport {
  const totalExecutions = executions.length;
  const successfulExecutions = executions.filter((execution) => execution.success).length;
  const totalDurationMs = executions.reduce((total, execution) => total + execution.durationMs, 0);
  const byOperation = aggregateExecutions(executions, (execution) => execution.operation);
  const byTool = aggregateExecutions(executions, (execution) => execution.toolName);
  const byServer = aggregateExecutions(executions, (execution) => `${execution.serverId}\u0000${execution.serverName}`);

  return {
    generatedAt: new Date(),
    period,
    totals: {
      totalExecutions,
      successfulExecutions,
      failedExecutions: totalExecutions - successfulExecutions,
      successRate: roundedRate(successfulExecutions, totalExecutions),
      averageDurationMs: roundedAverage(totalDurationMs, totalExecutions),
    },
    byOperation: Array.from(byOperation.entries())
      .map(([operation, aggregate]) => ({
        operation,
        totalExecutions: aggregate.totalExecutions,
        successfulExecutions: aggregate.successfulExecutions,
        failedExecutions: aggregate.totalExecutions - aggregate.successfulExecutions,
        averageDurationMs: roundedAverage(aggregate.totalDurationMs, aggregate.totalExecutions),
      }))
      .sort((left, right) => right.totalExecutions - left.totalExecutions || left.operation.localeCompare(right.operation)),
    topTools: Array.from(byTool.entries())
      .map(([toolName, aggregate]) => ({
        toolName,
        totalExecutions: aggregate.totalExecutions,
        successfulExecutions: aggregate.successfulExecutions,
        successRate: roundedRate(aggregate.successfulExecutions, aggregate.totalExecutions),
      }))
      .sort((left, right) => right.totalExecutions - left.totalExecutions || left.toolName.localeCompare(right.toolName))
      .slice(0, 5),
    activeServers: Array.from(byServer.entries())
      .map(([serverKey, aggregate]) => {
        const [serverId, serverName] = serverKey.split("\u0000");
        return {
          serverId,
          serverName,
          totalExecutions: aggregate.totalExecutions,
          successfulExecutions: aggregate.successfulExecutions,
          successRate: roundedRate(aggregate.successfulExecutions, aggregate.totalExecutions),
          averageDurationMs: roundedAverage(aggregate.totalDurationMs, aggregate.totalExecutions),
        };
      })
      .sort((left, right) => right.totalExecutions - left.totalExecutions || left.serverName.localeCompare(right.serverName))
      .slice(0, 5),
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

export async function listAuthorizedMcpExecutions(
  access: WorkspaceAccess,
  input: {
    serverId?: string;
    operation?: McpExecutionOperation;
    success?: boolean;
    limit: number;
    offset: number;
  },
): Promise<{ items: PublicMcpExecution[]; hasMore: boolean }> {
  const db = await getDb();
  if (!db) unavailable();

  const filters = [
    eq(mcpExecutionLogs.workspaceId, access.workspaceId),
    eq(mcpServers.workspaceId, access.workspaceId),
    input.serverId ? eq(mcpExecutionLogs.serverId, input.serverId) : undefined,
    input.operation ? eq(mcpExecutionLogs.operation, input.operation) : undefined,
    input.success === undefined ? undefined : eq(mcpExecutionLogs.success, input.success ? "true" : "false"),
  ];

  const rows = await db
    .select({ log: mcpExecutionLogs, serverName: mcpServers.name })
    .from(mcpExecutionLogs)
    .innerJoin(mcpServers, eq(mcpExecutionLogs.serverId, mcpServers.id))
    .where(and(...filters))
    .orderBy(desc(mcpExecutionLogs.createdAt), desc(mcpExecutionLogs.id))
    .limit(input.limit + 1)
    .offset(input.offset);

  return {
    items: rows.slice(0, input.limit).map(toPublicExecution),
    hasMore: rows.length > input.limit,
  };
}

export async function getAuthorizedMcpActivityReport(
  access: WorkspaceAccess,
  input: { serverId?: string; startAt: Date; endAt: Date },
): Promise<PublicMcpActivityReport> {
  const db = await getDb();
  if (!db) unavailable();

  const filters = [
    eq(mcpExecutionLogs.workspaceId, access.workspaceId),
    eq(mcpServers.workspaceId, access.workspaceId),
    gte(mcpExecutionLogs.createdAt, input.startAt),
    lte(mcpExecutionLogs.createdAt, input.endAt),
    input.serverId ? eq(mcpExecutionLogs.serverId, input.serverId) : undefined,
  ];

  const rows = await db
    .select({ log: mcpExecutionLogs, serverName: mcpServers.name })
    .from(mcpExecutionLogs)
    .innerJoin(mcpServers, eq(mcpExecutionLogs.serverId, mcpServers.id))
    .where(and(...filters));

  return summarizeAuthorizedMcpExecutions(rows.map(toPublicExecution), {
    startAt: input.startAt,
    endAt: input.endAt,
  });
}
