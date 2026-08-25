import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const project = process.cwd();
const schema = readFileSync(resolve(project, "drizzle/schema.ts"), "utf8");
const repository = readFileSync(resolve(project, "server/assistant/assistant-repository.ts"), "utf8");
const provider = readFileSync(resolve(project, "server/assistant/assistant-provider-client.ts"), "utf8");
const router = readFileSync(resolve(project, "server/assistant/assistant-router.ts"), "utf8");
const modal = readFileSync(resolve(project, "components/ai-chat-modal.tsx"), "utf8");

describe("authorized user-supplied assistant contract", () => {
  it("uses an additive UUID tenant namespace for assistant configuration and one-time approvals", () => {
    expect(schema).toContain('"hub_workspaces"');
    expect(schema).toContain('"hub_assistant_provider_configs"');
    expect(schema).toContain('"hub_assistant_tool_proposals"');
    expect(schema).toContain('"hub_mcp_servers"');
  });

  it("encrypts provider keys, returns public configuration only, and denies unselected models", () => {
    expect(repository).toContain("encryptMcpCredentials({ apiKey })");
    expect(repository).toContain("decryptMcpCredentials(row.encryptedPayload)");
    expect(repository).toContain("FREE_MODEL_PATTERN");
    expect(repository).toContain("Select an explicitly free OpenRouter model ending in :free");
    expect(repository).not.toContain("apiKey: row");
  });

  it("keeps provider endpoints fixed and tool execution behind a one-time approval", () => {
    expect(provider).toContain('const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"');
    expect(provider).toContain('const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"');
    expect(provider).toContain('const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions"');
    expect(provider).not.toContain("baseUrl");
    expect(router).toContain("createAssistantToolProposal");
    expect(router).toContain("consumeAssistantToolProposal");
    expect(router).toContain("executeAuthorizedMcpTool");
    expect(router).toContain("approved: z.boolean()");
  });

  it("keeps the mobile assistant on authenticated tRPC and requires an explicit approval tap", () => {
    expect(modal).toContain("trpc.assistant.saveProviderConfiguration");
    expect(modal).toContain("trpc.assistant.converse");
    expect(modal).toContain("trpc.assistant.decideToolProposal");
    expect(modal).toContain("secureTextEntry");
    expect(modal).toContain("Approve");
    expect(modal).not.toContain("localhost:3000");
    expect(modal).not.toContain("OPENROUTER_API_KEY");
  });
});
