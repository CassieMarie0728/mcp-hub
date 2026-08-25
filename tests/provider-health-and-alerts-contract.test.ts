import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const schema = read("drizzle/schema.ts");
const migration = read("drizzle/0006_outstanding_punisher.sql");
const repository = read("server/assistant/assistant-repository.ts");
const healthClient = read("server/assistant/provider-health-client.ts");
const router = read("server/assistant/assistant-router.ts");
const alerts = read("lib/provider-reset-alerts.ts");
const panel = read("app/(tabs)/assistant-providers.tsx");
const appConfig = read("app.config.ts");

describe("provider health and reset alert contract", () => {
  it("persists safe workspace-scoped health and opt-in alert metadata without a raw key column", () => {
    expect(schema).toContain('"hub_assistant_provider_health"');
    expect(schema).toContain('"hub_assistant_provider_alert_preferences"');
    expect(schema).toContain('assistant_provider_health_workspace_provider_unique');
    expect(schema).toContain('assistant_provider_alert_preferences_workspace_provider_unique');
    expect(migration).toContain('assistant_provider_health_workspace_fk');
    expect(migration).toContain('assistant_provider_alert_prefs_workspace_fk');
    expect(schema).not.toContain('apiKey: varchar("apiKey"');
  });

  it("uses tenant-scoped repository operations for safe health and explicit opt-in preferences", () => {
    expect(repository).toContain("saveAssistantProviderHealth");
    expect(repository).toContain("listAssistantProviderHealth");
    expect(repository).toContain("setProviderAlertPreference");
    expect(repository).toContain("eq(assistantProviderHealth.workspaceId, access.workspaceId)");
    expect(repository).toContain("eq(assistantProviderAlertPreferences.workspaceId, access.workspaceId)");
  });

  it("tests keys against fixed metadata endpoints and returns only normalized quota metadata", () => {
    expect(healthClient).toContain('const OPENROUTER_KEY_URL = "https://openrouter.ai/api/v1/key"');
    expect(healthClient).toContain('const GROQ_MODELS_URL = "https://api.groq.com/openai/v1/models"');
    expect(healthClient).toContain('const GEMINI_MODELS_URL = "https://generativelanguage.googleapis.com/v1beta/models"');
    expect(healthClient).toContain('const MISTRAL_MODELS_URL = "https://api.mistral.ai/v1/models"');
    expect(healthClient).toContain('"x-goog-api-key": provider.apiKey');
    expect(healthClient).toContain('x-ratelimit-remaining-requests');
    expect(healthClient).toContain("free-tier goblin hit the snack limit");
    expect(healthClient).not.toContain("return response.json()");
    expect(healthClient).not.toContain("baseUrl");
  });

  it("requires authentication and a saved provider configuration before testing or enabling an alert", () => {
    expect(router).toContain("testProviderKey: protectedProcedure");
    expect(router).toContain("setProviderResetAlert: protectedProcedure");
    expect(router).toContain("getAuthorizedAssistantProvider(access, input.provider)");
    expect(router).toContain("saveAssistantProviderHealth(access");
    expect(router).toContain("canScheduleResetAlert: Boolean(result.resetAt)");
  });

  it("schedules a mobile reset alert only after opt-in and a real rate-limit reset time", () => {
    expect(appConfig).toContain("'expo-notifications'");
    expect(alerts).toContain("requestPermissionsAsync");
    expect(alerts).toContain("scheduleNotificationAsync");
    expect(alerts).toContain("cancelProviderResetAlert");
    expect(panel).toContain("Test Key & Refresh Limits");
    expect(panel).toContain("Notify me when it resets");
    expect(panel).toContain('result.health.status === "rate_limited" && result.health.resetAt');
    expect(panel).toContain("No fictional quota meter");
    expect(panel).not.toContain("configuration.apiKey");
  });
});
