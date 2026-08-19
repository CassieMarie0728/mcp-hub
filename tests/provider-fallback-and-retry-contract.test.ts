import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const schema = read("drizzle/schema.ts");
const migration = read("drizzle/0007_sad_living_mummy.sql");
const repository = read("server/assistant/assistant-repository.ts");
const router = read("server/assistant/assistant-router.ts");
const providerClient = read("server/assistant/assistant-provider-client.ts");
const panel = read("app/(tabs)/assistant-providers.tsx");
const alerts = read("lib/provider-reset-alerts.ts");
const overlay = read("components/assistant-overlay.tsx");
const modal = read("components/ai-chat-modal.tsx");

describe("opt-in provider fallback and notification retry contract", () => {
  it("stores fallback controls and retry context within the owning workspace without a raw-message column", () => {
    expect(schema).toContain('fallbackEnabled: boolean("fallbackEnabled")');
    expect(schema).toContain('fallbackPriority: int("fallbackPriority")');
    expect(schema).toContain('"hub_assistant_retry_requests"');
    expect(schema).toContain('encryptedPayload: text("encryptedPayload")');
    expect(schema).not.toContain('messages: text("messages")');
    expect(migration).toContain('`fallbackEnabled` boolean DEFAULT false NOT NULL');
    expect(migration).toContain('assistant_retry_requests_workspace_status_idx');
  });

  it("limits automatic fallback to explicitly enabled workspace-owned providers after an actual rate limit", () => {
    expect(repository).toContain('eq(assistantProviderConfigs.fallbackEnabled, true)');
    expect(repository).toContain('orderBy(asc(assistantProviderConfigs.fallbackPriority))');
    expect(repository).toContain('AUTO_FALLBACK_PROVIDERS = ["openrouter", "gemini", "groq"]');
    expect(repository).toContain('(AUTO_FALLBACK_PROVIDERS as readonly string[]).includes(row.provider)');
    expect(repository).toContain('Mistral remains available for manual selection');
    expect(router).toContain('if (!(error instanceof AssistantProviderLimitError)) throw error');
    expect(router).toContain('for (const fallback of await listAuthorizedFallbackProviders(access, primary.provider))');
    expect(router).toContain('No paid provider was touched');
    expect(providerClient).toContain('No paid fallback was used.');
  });

  it("makes retry requests encrypted, expiring, one-time, and tenant-scoped", () => {
    expect(repository).toContain('const expiresAt = new Date(Date.now() + 30 * 60 * 1_000)');
    expect(repository).toContain('encryptMcpCredentials(payload)');
    expect(repository).toContain('eq(assistantRetryRequests.workspaceId, access.workspaceId)');
    expect(repository).toContain('eq(assistantRetryRequests.status, "pending")');
    expect(repository).toContain('status: "consumed", consumedAt: now');
    expect(router).toContain('retryConversation: protectedProcedure');
    expect(router).toContain('consumeAssistantRetryRequest(access, input.retryRequestId)');
  });

  it("offers transparent fallback controls and a notification-tap retry without bypassing tool approval", () => {
    expect(panel).toContain('Use as automatic fallback');
    expect(panel).toContain('Fallback order (1 = first)');
    expect(panel).toContain('never routes to a paid surprise');
    expect(alerts).toContain('retryRequestId?: string');
    expect(alerts).toContain('Tap once to retry your saved assistant request');
    expect(overlay).toContain('addNotificationResponseReceivedListener');
    expect(overlay).toContain('openAssistantWithRetry(retryId)');
    expect(modal).toContain('retryConversation.mutateAsync({ retryRequestId })');
    expect(modal).toContain('No tool action was started.');
    expect(router).toContain('decideToolProposal: protectedProcedure');
  });
});
