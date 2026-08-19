import { and, desc, eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";

import { oauthConnections, webhookSubscriptions, workflowDrafts } from "../../drizzle/schema";
import { getDb } from "../db";
import { decryptMcpCredentials, encryptMcpCredentials } from "../security/mcp-credential-vault";
import type { WorkspaceAccess } from "../security/workspace-access";

type OAuthProvider = "github" | "slack" | "notion";
type RetryPolicy = { maxRetries: number; backoffMs: number };

export type PublicOAuthConnection = {
  id: string;
  serverId: string;
  provider: OAuthProvider;
  status: "configured" | "revoked" | "error";
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicWebhookSubscription = {
  id: string;
  name: string;
  events: string[];
  status: "inactive" | "active" | "error";
  retryPolicy: RetryPolicy;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicWorkflowDraft = {
  id: string;
  name: string;
  description?: string;
  definition: Record<string, unknown>;
  status: "draft" | "archived";
  createdAt: Date;
  updatedAt: Date;
};

function requireDb<T>(db: T | null): T {
  if (!db) throw new Error("Durable lifecycle storage is not available");
  return db;
}

function parseArray(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.some((entry) => typeof entry !== "string")) throw new Error("invalid");
    return parsed;
  } catch {
    throw new Error("Stored webhook events are invalid");
  }
}

function parseRecord(value: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
    return parsed as Record<string, unknown>;
  } catch {
    throw new Error("Stored lifecycle definition is invalid");
  }
}

function parseRetryPolicy(value: string): RetryPolicy {
  const parsed = parseRecord(value);
  if (typeof parsed.maxRetries !== "number" || typeof parsed.backoffMs !== "number") {
    throw new Error("Stored webhook retry policy is invalid");
  }
  return { maxRetries: parsed.maxRetries, backoffMs: parsed.backoffMs };
}

function toPublicOAuth(row: typeof oauthConnections.$inferSelect): PublicOAuthConnection {
  return {
    id: row.id,
    serverId: row.serverId,
    provider: row.provider,
    status: row.status,
    expiresAt: row.expiresAt ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toPublicWebhook(row: typeof webhookSubscriptions.$inferSelect): PublicWebhookSubscription {
  return {
    id: row.id,
    name: row.name,
    events: parseArray(row.eventsJson),
    status: row.status,
    retryPolicy: parseRetryPolicy(row.retryJson),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toPublicWorkflow(row: typeof workflowDrafts.$inferSelect): PublicWorkflowDraft {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    definition: parseRecord(row.definitionJson),
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listOAuthConnections(access: WorkspaceAccess): Promise<PublicOAuthConnection[]> {
  const db = requireDb(await getDb());
  const rows = await db.select().from(oauthConnections).where(eq(oauthConnections.workspaceId, access.workspaceId)).orderBy(desc(oauthConnections.updatedAt));
  return rows.map(toPublicOAuth);
}

export async function createOAuthConnectionIntent(access: WorkspaceAccess, input: { serverId: string; provider: OAuthProvider }): Promise<PublicOAuthConnection> {
  const db = requireDb(await getDb());
  const id = crypto.randomUUID();
  await db.insert(oauthConnections).values({ id, workspaceId: access.workspaceId, serverId: input.serverId, provider: input.provider, status: "configured" });
  const rows = await db.select().from(oauthConnections).where(and(eq(oauthConnections.id, id), eq(oauthConnections.workspaceId, access.workspaceId))).limit(1);
  if (!rows[0]) throw new Error("OAuth connection could not be created");
  return toPublicOAuth(rows[0]);
}

export async function revokeOAuthConnection(access: WorkspaceAccess, connectionId: string): Promise<void> {
  const db = requireDb(await getDb());
  await db.update(oauthConnections).set({ status: "revoked", encryptedPayload: null, expiresAt: null }).where(and(eq(oauthConnections.id, connectionId), eq(oauthConnections.workspaceId, access.workspaceId)));
}

export async function getOAuthConnection(access: WorkspaceAccess, connectionId: string): Promise<PublicOAuthConnection | null> {
  const db = requireDb(await getDb());
  const rows = await db.select().from(oauthConnections).where(and(eq(oauthConnections.id, connectionId), eq(oauthConnections.workspaceId, access.workspaceId))).limit(1);
  return rows[0] ? toPublicOAuth(rows[0]) : null;
}

export async function listWebhooks(access: WorkspaceAccess): Promise<PublicWebhookSubscription[]> {
  const db = requireDb(await getDb());
  const rows = await db.select().from(webhookSubscriptions).where(eq(webhookSubscriptions.workspaceId, access.workspaceId)).orderBy(desc(webhookSubscriptions.createdAt));
  return rows.map(toPublicWebhook);
}

export async function createWebhook(access: WorkspaceAccess, input: { name: string; events: string[]; retryPolicy: RetryPolicy }): Promise<PublicWebhookSubscription & { signingSecret: string }> {
  const db = requireDb(await getDb());
  const signingSecret = randomBytes(32).toString("base64url");
  const id = crypto.randomUUID();
  await db.insert(webhookSubscriptions).values({
    id,
    workspaceId: access.workspaceId,
    name: input.name,
    eventsJson: JSON.stringify(input.events),
    encryptedSecret: encryptMcpCredentials({ signingSecret }),
    retryJson: JSON.stringify(input.retryPolicy),
    status: "inactive",
  });
  const rows = await db.select().from(webhookSubscriptions).where(and(eq(webhookSubscriptions.id, id), eq(webhookSubscriptions.workspaceId, access.workspaceId))).limit(1);
  if (!rows[0]) throw new Error("Webhook subscription could not be created");
  return { ...toPublicWebhook(rows[0]), signingSecret };
}

export async function updateWebhook(access: WorkspaceAccess, webhookId: string, input: Partial<{ name: string; events: string[]; retryPolicy: RetryPolicy }>): Promise<PublicWebhookSubscription | null> {
  const db = requireDb(await getDb());
  const update: Partial<typeof webhookSubscriptions.$inferInsert> = {};
  if (input.name !== undefined) update.name = input.name;
  if (input.events !== undefined) update.eventsJson = JSON.stringify(input.events);
  if (input.retryPolicy !== undefined) update.retryJson = JSON.stringify(input.retryPolicy);
  if (Object.keys(update).length > 0) await db.update(webhookSubscriptions).set(update).where(and(eq(webhookSubscriptions.id, webhookId), eq(webhookSubscriptions.workspaceId, access.workspaceId)));
  const rows = await db.select().from(webhookSubscriptions).where(and(eq(webhookSubscriptions.id, webhookId), eq(webhookSubscriptions.workspaceId, access.workspaceId))).limit(1);
  return rows[0] ? toPublicWebhook(rows[0]) : null;
}

export async function deleteWebhook(access: WorkspaceAccess, webhookId: string): Promise<void> {
  const db = requireDb(await getDb());
  await db.delete(webhookSubscriptions).where(and(eq(webhookSubscriptions.id, webhookId), eq(webhookSubscriptions.workspaceId, access.workspaceId)));
}

export async function rotateWebhookSecret(access: WorkspaceAccess, webhookId: string): Promise<string> {
  const db = requireDb(await getDb());
  const signingSecret = randomBytes(32).toString("base64url");
  const result = await db.update(webhookSubscriptions).set({ encryptedSecret: encryptMcpCredentials({ signingSecret }) }).where(and(eq(webhookSubscriptions.id, webhookId), eq(webhookSubscriptions.workspaceId, access.workspaceId)));
  if (result[0].affectedRows !== 1) throw new Error("Webhook subscription was not found");
  return signingSecret;
}

export async function listWorkflowDrafts(access: WorkspaceAccess): Promise<PublicWorkflowDraft[]> {
  const db = requireDb(await getDb());
  const rows = await db.select().from(workflowDrafts).where(eq(workflowDrafts.workspaceId, access.workspaceId)).orderBy(desc(workflowDrafts.updatedAt));
  return rows.map(toPublicWorkflow);
}

export async function createWorkflowDraft(access: WorkspaceAccess, input: { name: string; description?: string; definition: Record<string, unknown> }): Promise<PublicWorkflowDraft> {
  const db = requireDb(await getDb());
  const id = crypto.randomUUID();
  await db.insert(workflowDrafts).values({ id, workspaceId: access.workspaceId, name: input.name, description: input.description, definitionJson: JSON.stringify(input.definition), status: "draft" });
  const rows = await db.select().from(workflowDrafts).where(and(eq(workflowDrafts.id, id), eq(workflowDrafts.workspaceId, access.workspaceId))).limit(1);
  if (!rows[0]) throw new Error("Workflow draft could not be created");
  return toPublicWorkflow(rows[0]);
}

export async function getWorkflowDraft(access: WorkspaceAccess, workflowId: string): Promise<PublicWorkflowDraft | null> {
  const db = requireDb(await getDb());
  const rows = await db.select().from(workflowDrafts).where(and(eq(workflowDrafts.id, workflowId), eq(workflowDrafts.workspaceId, access.workspaceId))).limit(1);
  return rows[0] ? toPublicWorkflow(rows[0]) : null;
}

export async function saveWorkflowDraft(access: WorkspaceAccess, workflowId: string, input: Partial<{ name: string; description: string; definition: Record<string, unknown>; status: "draft" | "archived" }>): Promise<PublicWorkflowDraft | null> {
  const db = requireDb(await getDb());
  const update: Partial<typeof workflowDrafts.$inferInsert> = {};
  if (input.name !== undefined) update.name = input.name;
  if (input.description !== undefined) update.description = input.description;
  if (input.definition !== undefined) update.definitionJson = JSON.stringify(input.definition);
  if (input.status !== undefined) update.status = input.status;
  if (Object.keys(update).length > 0) await db.update(workflowDrafts).set(update).where(and(eq(workflowDrafts.id, workflowId), eq(workflowDrafts.workspaceId, access.workspaceId)));
  return getWorkflowDraft(access, workflowId);
}

export async function deleteWorkflowDraft(access: WorkspaceAccess, workflowId: string): Promise<void> {
  const db = requireDb(await getDb());
  await db.delete(workflowDrafts).where(and(eq(workflowDrafts.id, workflowId), eq(workflowDrafts.workspaceId, access.workspaceId)));
}

/** Keeps vault decryption reachable only inside the server module, never in public records. */
export function assertWebhookSecretEnvelope(encryptedSecret: string): void {
  decryptMcpCredentials(encryptedSecret);
}
