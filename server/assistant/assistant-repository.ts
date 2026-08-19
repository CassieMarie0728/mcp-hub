import { and, desc, eq, gt } from "drizzle-orm";

import { assistantProviderAlertPreferences, assistantProviderConfigs, assistantProviderHealth, assistantToolProposals } from "../../drizzle/schema";
import { getDb } from "../db";
import { decryptMcpCredentials, encryptMcpCredentials } from "../security/mcp-credential-vault";
import type { WorkspaceAccess } from "../security/workspace-access";

export const ASSISTANT_PROVIDERS = ["openrouter", "gemini", "groq", "mistral"] as const;
export type AssistantProviderId = (typeof ASSISTANT_PROVIDERS)[number];

export const PROVIDER_MODEL_OPTIONS: Record<AssistantProviderId, readonly string[]> = {
  openrouter: ["meta-llama/llama-3.3-70b-instruct:free"],
  gemini: ["gemini-3.7-flash", "gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.5-flash-lite"],
  groq: ["openai/gpt-oss-20b", "openai/gpt-oss-120b", "qwen/qwen3.6-27b"],
  mistral: ["mistral-small-latest", "mistral-nemo"],
};

const FREE_MODEL_PATTERN = /^[a-z0-9][a-z0-9._/-]{0,150}:free$/i;
type StoredProviderPayload = { apiKey: string };

export type PublicAssistantProviderConfig = {
  provider: AssistantProviderId;
  model: string;
  keyConfigured: true;
  configuredAt: Date;
};

export type AuthorizedAssistantProvider = PublicAssistantProviderConfig & { apiKey: string };
export type PublicToolProposal = { id: string; serverId: string; toolName: string; input: Record<string, unknown>; expiresAt: Date };
export type ProviderHealthStatus = "valid" | "invalid" | "rate_limited" | "unavailable";
export type ProviderHealthSource = "openrouter_key" | "response_headers" | "none";
export type PublicAssistantProviderHealth = {
  provider: AssistantProviderId;
  status: ProviderHealthStatus;
  remainingRequests: number | null;
  remainingTokens: number | null;
  remainingCredit: string | null;
  resetAt: Date | null;
  source: ProviderHealthSource;
  checkedAt: Date;
};
export type PublicProviderAlertPreference = { provider: AssistantProviderId; resetAlertEnabled: boolean; updatedAt: Date };

function requireDb<T>(db: T | null): T { if (!db) throw new Error("Durable assistant storage is not available"); return db; }
function asProvider(value: string): AssistantProviderId {
  if ((ASSISTANT_PROVIDERS as readonly string[]).includes(value)) return value as AssistantProviderId;
  throw new Error("Select a supported assistant provider");
}

export function validateAssistantProviderModel(providerValue: string, modelValue: string): string {
  const provider = asProvider(providerValue);
  const model = modelValue.trim();
  if (provider === "openrouter") {
    if (!FREE_MODEL_PATTERN.test(model)) throw new Error("Select an explicitly free OpenRouter model ending in :free");
    return model;
  }
  if (!PROVIDER_MODEL_OPTIONS[provider].includes(model)) {
    const freeTier = provider === "gemini" ? "a listed Gemini free-tier model" : "a supported provider model";
    throw new Error(`Select ${freeTier}; MCP Hub will not guess or route to a paid fallback`);
  }
  return model;
}

function asStoredPayload(payload: Record<string, unknown>): StoredProviderPayload {
  if (typeof payload.apiKey !== "string" || payload.apiKey.trim().length < 8 || payload.apiKey.length > 4096) throw new Error("Stored assistant provider credentials are invalid");
  return { apiKey: payload.apiKey };
}
function toPublicConfig(row: typeof assistantProviderConfigs.$inferSelect): PublicAssistantProviderConfig {
  return { provider: asProvider(row.provider), model: row.model, keyConfigured: true, configuredAt: row.updatedAt };
}
function parseProposalInput(inputJson: string): Record<string, unknown> {
  try { const input: unknown = JSON.parse(inputJson); if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("invalid"); return input as Record<string, unknown>; }
  catch { throw new Error("Stored assistant tool proposal is invalid"); }
}

export async function listPublicAssistantProviderConfigs(access: WorkspaceAccess): Promise<PublicAssistantProviderConfig[]> {
  const db = requireDb(await getDb());
  const rows = await db.select().from(assistantProviderConfigs).where(eq(assistantProviderConfigs.workspaceId, access.workspaceId)).orderBy(desc(assistantProviderConfigs.updatedAt));
  return rows.map(toPublicConfig);
}
export async function getPublicAssistantProviderConfig(access: WorkspaceAccess, provider?: AssistantProviderId): Promise<PublicAssistantProviderConfig | null> {
  const configs = await listPublicAssistantProviderConfigs(access);
  return provider ? configs.find((config) => config.provider === provider) ?? null : configs[0] ?? null;
}
export async function saveAssistantProviderConfig(access: WorkspaceAccess, input: { provider: AssistantProviderId; model: string; apiKey: string }): Promise<PublicAssistantProviderConfig> {
  const db = requireDb(await getDb());
  const provider = asProvider(input.provider);
  const model = validateAssistantProviderModel(provider, input.model);
  const apiKey = input.apiKey.trim();
  if (apiKey.length < 8 || apiKey.length > 4096) throw new Error("Assistant provider key must be between 8 and 4096 characters");
  const existing = await db.select({ id: assistantProviderConfigs.id }).from(assistantProviderConfigs).where(and(eq(assistantProviderConfigs.workspaceId, access.workspaceId), eq(assistantProviderConfigs.provider, provider))).limit(1);
  const encryptedPayload = encryptMcpCredentials({ apiKey });
  if (existing[0]) await db.update(assistantProviderConfigs).set({ model, encryptedPayload, keyVersion: "v1" }).where(and(eq(assistantProviderConfigs.id, existing[0].id), eq(assistantProviderConfigs.workspaceId, access.workspaceId), eq(assistantProviderConfigs.provider, provider)));
  else await db.insert(assistantProviderConfigs).values({ id: crypto.randomUUID(), workspaceId: access.workspaceId, provider, model, encryptedPayload, keyVersion: "v1" });
  const config = await getPublicAssistantProviderConfig(access, provider);
  if (!config) throw new Error("Assistant provider configuration was not saved");
  return config;
}
export async function removeAssistantProviderConfig(access: WorkspaceAccess, provider?: AssistantProviderId): Promise<void> {
  const db = requireDb(await getDb());
  const scope = provider ? and(eq(assistantProviderConfigs.workspaceId, access.workspaceId), eq(assistantProviderConfigs.provider, asProvider(provider))) : eq(assistantProviderConfigs.workspaceId, access.workspaceId);
  await db.delete(assistantProviderConfigs).where(scope);
}
export async function getAuthorizedAssistantProvider(access: WorkspaceAccess, provider: AssistantProviderId): Promise<AuthorizedAssistantProvider | null> {
  const db = requireDb(await getDb());
  const rows = await db.select().from(assistantProviderConfigs).where(and(eq(assistantProviderConfigs.workspaceId, access.workspaceId), eq(assistantProviderConfigs.provider, provider))).limit(1);
  const row = rows[0]; if (!row) return null;
  return { ...toPublicConfig(row), apiKey: asStoredPayload(decryptMcpCredentials(row.encryptedPayload)).apiKey };
}

function toPublicHealth(row: typeof assistantProviderHealth.$inferSelect): PublicAssistantProviderHealth {
  return {
    provider: asProvider(row.provider), status: row.status, remainingRequests: row.remainingRequests,
    remainingTokens: row.remainingTokens, remainingCredit: row.remainingCredit, resetAt: row.resetAt,
    source: row.source, checkedAt: row.checkedAt,
  };
}

export async function listAssistantProviderHealth(access: WorkspaceAccess): Promise<PublicAssistantProviderHealth[]> {
  const db = requireDb(await getDb());
  const rows = await db.select().from(assistantProviderHealth).where(eq(assistantProviderHealth.workspaceId, access.workspaceId));
  return rows.map(toPublicHealth);
}

export async function saveAssistantProviderHealth(access: WorkspaceAccess, input: Omit<PublicAssistantProviderHealth, "checkedAt">): Promise<PublicAssistantProviderHealth> {
  const db = requireDb(await getDb());
  const provider = asProvider(input.provider);
  const existing = await db.select({ id: assistantProviderHealth.id }).from(assistantProviderHealth).where(and(eq(assistantProviderHealth.workspaceId, access.workspaceId), eq(assistantProviderHealth.provider, provider))).limit(1);
  const values = {
    status: input.status, remainingRequests: input.remainingRequests, remainingTokens: input.remainingTokens,
    remainingCredit: input.remainingCredit, resetAt: input.resetAt, source: input.source, checkedAt: new Date(),
  };
  if (existing[0]) await db.update(assistantProviderHealth).set(values).where(and(eq(assistantProviderHealth.id, existing[0].id), eq(assistantProviderHealth.workspaceId, access.workspaceId), eq(assistantProviderHealth.provider, provider)));
  else await db.insert(assistantProviderHealth).values({ id: crypto.randomUUID(), workspaceId: access.workspaceId, provider, ...values });
  const saved = (await listAssistantProviderHealth(access)).find((health) => health.provider === provider);
  if (!saved) throw new Error("Provider health could not be saved");
  return saved;
}

export async function listProviderAlertPreferences(access: WorkspaceAccess): Promise<PublicProviderAlertPreference[]> {
  const db = requireDb(await getDb());
  const rows = await db.select().from(assistantProviderAlertPreferences).where(eq(assistantProviderAlertPreferences.workspaceId, access.workspaceId));
  return rows.map((row) => ({ provider: asProvider(row.provider), resetAlertEnabled: row.resetAlertEnabled, updatedAt: row.updatedAt }));
}

export async function setProviderAlertPreference(access: WorkspaceAccess, providerValue: AssistantProviderId, resetAlertEnabled: boolean): Promise<PublicProviderAlertPreference> {
  const db = requireDb(await getDb());
  const provider = asProvider(providerValue);
  const existing = await db.select({ id: assistantProviderAlertPreferences.id }).from(assistantProviderAlertPreferences).where(and(eq(assistantProviderAlertPreferences.workspaceId, access.workspaceId), eq(assistantProviderAlertPreferences.provider, provider))).limit(1);
  if (existing[0]) await db.update(assistantProviderAlertPreferences).set({ resetAlertEnabled }).where(and(eq(assistantProviderAlertPreferences.id, existing[0].id), eq(assistantProviderAlertPreferences.workspaceId, access.workspaceId), eq(assistantProviderAlertPreferences.provider, provider)));
  else await db.insert(assistantProviderAlertPreferences).values({ id: crypto.randomUUID(), workspaceId: access.workspaceId, provider, resetAlertEnabled });
  const saved = (await listProviderAlertPreferences(access)).find((preference) => preference.provider === provider);
  if (!saved) throw new Error("Provider alert preference could not be saved");
  return saved;
}

export async function createAssistantToolProposal(access: WorkspaceAccess, input: { serverId: string; toolName: string; toolInput: Record<string, unknown> }): Promise<PublicToolProposal> {
  const db = requireDb(await getDb()); const id = crypto.randomUUID(); const expiresAt = new Date(Date.now() + 5 * 60 * 1000); const inputJson = JSON.stringify(input.toolInput);
  if (inputJson.length > 32_000) throw new Error("Assistant tool proposal input is too large");
  await db.insert(assistantToolProposals).values({ id, workspaceId: access.workspaceId, serverId: input.serverId, toolName: input.toolName, inputJson, status: "pending", expiresAt });
  return { id, serverId: input.serverId, toolName: input.toolName, input: input.toolInput, expiresAt };
}
export async function consumeAssistantToolProposal(access: WorkspaceAccess, proposalId: string): Promise<PublicToolProposal> {
  const db = requireDb(await getDb()); const now = new Date();
  const rows = await db.select().from(assistantToolProposals).where(and(eq(assistantToolProposals.id, proposalId), eq(assistantToolProposals.workspaceId, access.workspaceId), eq(assistantToolProposals.status, "pending"), gt(assistantToolProposals.expiresAt, now))).limit(1);
  const proposal = rows[0]; if (!proposal) throw new Error("This tool approval is unavailable or expired");
  const update = await db.update(assistantToolProposals).set({ status: "consumed", consumedAt: now }).where(and(eq(assistantToolProposals.id, proposal.id), eq(assistantToolProposals.workspaceId, access.workspaceId), eq(assistantToolProposals.status, "pending")));
  if (update[0].affectedRows !== 1) throw new Error("This tool approval has already been used");
  return { id: proposal.id, serverId: proposal.serverId, toolName: proposal.toolName, input: parseProposalInput(proposal.inputJson), expiresAt: proposal.expiresAt };
}
export async function rejectAssistantToolProposal(access: WorkspaceAccess, proposalId: string): Promise<void> {
  const db = requireDb(await getDb());
  await db.update(assistantToolProposals).set({ status: "rejected", consumedAt: new Date() }).where(and(eq(assistantToolProposals.id, proposalId), eq(assistantToolProposals.workspaceId, access.workspaceId), eq(assistantToolProposals.status, "pending")));
}
