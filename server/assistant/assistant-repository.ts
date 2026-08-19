import { and, eq, gt } from "drizzle-orm";

import {
  assistantProviderConfigs,
  assistantToolProposals,
} from "../../drizzle/schema";
import { getDb } from "../db";
import {
  decryptMcpCredentials,
  encryptMcpCredentials,
} from "../security/mcp-credential-vault";
import type { WorkspaceAccess } from "../security/workspace-access";

const PROVIDER = "openrouter" as const;
const FREE_MODEL_PATTERN = /^[a-z0-9][a-z0-9._/-]{0,150}:free$/i;

type StoredProviderPayload = { apiKey: string };

export type PublicAssistantProviderConfig = {
  provider: typeof PROVIDER;
  model: string;
  keyConfigured: true;
  configuredAt: Date;
};

export type AuthorizedAssistantProvider = PublicAssistantProviderConfig & {
  apiKey: string;
};

export type PublicToolProposal = {
  id: string;
  serverId: string;
  toolName: string;
  input: Record<string, unknown>;
  expiresAt: Date;
};

function requireDb<T>(db: T | null): T {
  if (!db) throw new Error("Durable assistant storage is not available");
  return db;
}

function validateFreeModel(model: string): string {
  const normalized = model.trim();
  if (!FREE_MODEL_PATTERN.test(normalized)) {
    throw new Error("Select an explicitly free OpenRouter model ending in :free");
  }
  return normalized;
}

function asStoredPayload(payload: Record<string, unknown>): StoredProviderPayload {
  if (typeof payload.apiKey !== "string" || payload.apiKey.trim().length < 8 || payload.apiKey.length > 4096) {
    throw new Error("Stored assistant provider credentials are invalid");
  }
  return { apiKey: payload.apiKey };
}

function toPublicConfig(row: typeof assistantProviderConfigs.$inferSelect): PublicAssistantProviderConfig {
  return {
    provider: PROVIDER,
    model: row.model,
    keyConfigured: true,
    configuredAt: row.updatedAt,
  };
}

function parseProposalInput(inputJson: string): Record<string, unknown> {
  try {
    const input: unknown = JSON.parse(inputJson);
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("invalid");
    return input as Record<string, unknown>;
  } catch {
    throw new Error("Stored assistant tool proposal is invalid");
  }
}

export async function getPublicAssistantProviderConfig(
  access: WorkspaceAccess,
): Promise<PublicAssistantProviderConfig | null> {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(assistantProviderConfigs)
    .where(eq(assistantProviderConfigs.workspaceId, access.workspaceId))
    .limit(1);
  return rows[0] ? toPublicConfig(rows[0]) : null;
}

export async function saveAssistantProviderConfig(
  access: WorkspaceAccess,
  input: { model: string; apiKey: string },
): Promise<PublicAssistantProviderConfig> {
  const db = requireDb(await getDb());
  const model = validateFreeModel(input.model);
  const apiKey = input.apiKey.trim();
  if (apiKey.length < 8 || apiKey.length > 4096) {
    throw new Error("Assistant provider key must be between 8 and 4096 characters");
  }

  const existing = await db
    .select({ id: assistantProviderConfigs.id })
    .from(assistantProviderConfigs)
    .where(eq(assistantProviderConfigs.workspaceId, access.workspaceId))
    .limit(1);
  const encryptedPayload = encryptMcpCredentials({ apiKey });

  if (existing[0]) {
    await db
      .update(assistantProviderConfigs)
      .set({ model, encryptedPayload, keyVersion: "v1" })
      .where(and(
        eq(assistantProviderConfigs.id, existing[0].id),
        eq(assistantProviderConfigs.workspaceId, access.workspaceId),
      ));
  } else {
    await db.insert(assistantProviderConfigs).values({
      id: crypto.randomUUID(),
      workspaceId: access.workspaceId,
      provider: PROVIDER,
      model,
      encryptedPayload,
      keyVersion: "v1",
    });
  }

  const config = await getPublicAssistantProviderConfig(access);
  if (!config) throw new Error("Assistant provider configuration was not saved");
  return config;
}

export async function removeAssistantProviderConfig(access: WorkspaceAccess): Promise<void> {
  const db = requireDb(await getDb());
  await db
    .delete(assistantProviderConfigs)
    .where(eq(assistantProviderConfigs.workspaceId, access.workspaceId));
}

export async function getAuthorizedAssistantProvider(
  access: WorkspaceAccess,
): Promise<AuthorizedAssistantProvider | null> {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(assistantProviderConfigs)
    .where(eq(assistantProviderConfigs.workspaceId, access.workspaceId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const payload = asStoredPayload(decryptMcpCredentials(row.encryptedPayload));
  return { ...toPublicConfig(row), apiKey: payload.apiKey };
}

export async function createAssistantToolProposal(
  access: WorkspaceAccess,
  input: { serverId: string; toolName: string; toolInput: Record<string, unknown> },
): Promise<PublicToolProposal> {
  const db = requireDb(await getDb());
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  const inputJson = JSON.stringify(input.toolInput);
  if (inputJson.length > 32_000) throw new Error("Assistant tool proposal input is too large");

  await db.insert(assistantToolProposals).values({
    id,
    workspaceId: access.workspaceId,
    serverId: input.serverId,
    toolName: input.toolName,
    inputJson,
    status: "pending",
    expiresAt,
  });

  return { id, serverId: input.serverId, toolName: input.toolName, input: input.toolInput, expiresAt };
}

export async function consumeAssistantToolProposal(
  access: WorkspaceAccess,
  proposalId: string,
): Promise<PublicToolProposal> {
  const db = requireDb(await getDb());
  const now = new Date();
  const rows = await db
    .select()
    .from(assistantToolProposals)
    .where(and(
      eq(assistantToolProposals.id, proposalId),
      eq(assistantToolProposals.workspaceId, access.workspaceId),
      eq(assistantToolProposals.status, "pending"),
      gt(assistantToolProposals.expiresAt, now),
    ))
    .limit(1);
  const proposal = rows[0];
  if (!proposal) throw new Error("This tool approval is unavailable or expired");

  const update = await db
    .update(assistantToolProposals)
    .set({ status: "consumed", consumedAt: now })
    .where(and(
      eq(assistantToolProposals.id, proposal.id),
      eq(assistantToolProposals.workspaceId, access.workspaceId),
      eq(assistantToolProposals.status, "pending"),
    ));
  if (update[0].affectedRows !== 1) throw new Error("This tool approval has already been used");

  return {
    id: proposal.id,
    serverId: proposal.serverId,
    toolName: proposal.toolName,
    input: parseProposalInput(proposal.inputJson),
    expiresAt: proposal.expiresAt,
  };
}

export async function rejectAssistantToolProposal(
  access: WorkspaceAccess,
  proposalId: string,
): Promise<void> {
  const db = requireDb(await getDb());
  await db
    .update(assistantToolProposals)
    .set({ status: "rejected", consumedAt: new Date() })
    .where(and(
      eq(assistantToolProposals.id, proposalId),
      eq(assistantToolProposals.workspaceId, access.workspaceId),
      eq(assistantToolProposals.status, "pending"),
    ));
}
