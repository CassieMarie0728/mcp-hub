import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const project = process.cwd();
const read = (path: string) => readFileSync(resolve(project, path), "utf8");
const schema = read("drizzle/schema.ts");
const migration = read("drizzle/0005_lucky_joystick.sql");
const repository = read("server/assistant/assistant-repository.ts");
const client = read("server/assistant/assistant-provider-client.ts");
const router = read("server/assistant/assistant-router.ts");
const modal = read("components/ai-chat-modal.tsx");
const panel = read("app/(tabs)/assistant-providers.tsx");

describe("multi-provider BYOK assistant contract", () => {
  it("expands the durable tenant schema per provider without removing workspace ownership", () => {
    expect(schema).toContain('mysqlEnum("provider", ["openrouter", "gemini", "groq", "mistral"])');
    expect(schema).toContain('assistant_provider_configs_workspace_provider_unique');
    expect(migration).toContain("enum('openrouter','gemini','groq','mistral')");
    expect(migration).toContain("UNIQUE(`workspaceId`,`provider`)");
    expect(migration).toContain("FOREIGN KEY (`workspaceId`) REFERENCES `hub_workspaces`(`id`)");
  });

  it("validates known provider models and preserves encrypted tenant-scoped keys", () => {
    expect(repository).toContain('ASSISTANT_PROVIDERS = ["openrouter", "gemini", "groq", "mistral"]');
    expect(repository).toContain("PROVIDER_MODEL_OPTIONS");
    expect(repository).toContain("FREE_MODEL_PATTERN");
    expect(repository).toContain("encryptMcpCredentials({ apiKey })");
    expect(repository).toContain("decryptMcpCredentials(row.encryptedPayload)");
    expect(repository).toContain("eq(assistantProviderConfigs.provider, provider)");
    expect(repository).not.toContain("apiKey: row");
  });

  it("uses fixed provider endpoints and turns 429 responses into a clear no-fallback rate-limit notice", () => {
    expect(client).toContain('const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"');
    expect(client).toContain('const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"');
    expect(client).toContain('const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions"');
    expect(client).toContain('const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models"');
    expect(client).toContain("AssistantProviderLimitError");
    expect(client).toContain("free-tier goblin hit the snack limit");
    expect(client).toContain("No paid fallback was used");
    expect(client).not.toContain("baseUrl");
  });

  it("requires selected-provider configuration and keeps tool execution behind one-time approval", () => {
    expect(router).toContain("listProviderConfigurations");
    expect(router).toContain("provider: z.enum(ASSISTANT_PROVIDERS)");
    expect(router).toContain("getAuthorizedAssistantProvider(access, input.provider)");
    expect(router).toContain("createAssistantToolProposal");
    expect(router).toContain("consumeAssistantToolProposal");
    expect(router).toContain("executeAuthorizedMcpTool");
  });

  it("offers provider selection and a settings key panel without rendering stored secrets", () => {
    expect(modal).toContain("trpc.assistant.listProviderConfigurations");
    expect(modal).toContain("provider: selectedProvider");
    expect(modal).toContain("setError(errorMessage(reason");
    expect(panel).toContain('variant="password"');
    expect(panel).toContain("trpc.assistant.listProviderConfigurations");
    expect(panel).toContain("Save encrypted key");
    expect(panel).toContain("Remove this provider key");
    expect(panel).not.toContain("configuration.apiKey");
    expect(panel).not.toContain("OPENROUTER_API_KEY");
  });
});
