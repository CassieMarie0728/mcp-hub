import { describe, expect, it } from "vitest";

const root = process.cwd();

async function readProjectFile(path: string) {
  const { readFile } = await import("node:fs/promises");
  const { resolve } = await import("node:path");
  return readFile(resolve(root, path), "utf8");
}

describe("tenant lifecycle feature gates", () => {
  it("makes OAuth routes protected and removes direct provider implementation", async () => {
    const source = await readProjectFile("server/auth/oauth-router.ts");
    expect(source).toContain("protectedProcedure");
    expect(source).toContain("requireTenantLifecyclePersistence");
    expect(source).not.toContain("publicProcedure");
    expect(source).not.toContain("OAuthManager");
    expect(source).not.toContain("accessToken");
  });

  it("makes standalone credential routes fail closed without their legacy manager", async () => {
    const source = await readProjectFile("server/tokens/token-router.ts");
    expect(source).toContain("requireTenantLifecyclePersistence");
    expect(source).not.toContain("TokenManager");
  });

  it("makes webhook lifecycle routes fail closed without their legacy manager", async () => {
    const source = await readProjectFile("server/webhooks/webhooks-router.ts");
    expect(source).toContain("requireTenantLifecyclePersistence");
    expect(source).not.toContain("WebhookManager");
  });

  it("makes workflows fail closed without in-memory orchestration state", async () => {
    const source = await readProjectFile("server/procedures/workflows.ts");
    expect(source).toContain("requireTenantLifecyclePersistence");
    expect(source).not.toContain("workflowStore");
    expect(source).not.toContain("WorkflowEngine");
  });

  it("keeps the webhook screen honest while the backend lifecycle is unavailable", async () => {
    const source = await readProjectFile("app/(tabs)/webhooks.tsx");
    expect(source).toContain("Webhooks Are Not Live Yet");
    expect(source).toContain("Safely unavailable");
    expect(source).not.toContain("mockWebhooks");
    expect(source).not.toContain("api.mcphub.io");
    expect(source).not.toContain("Webhook created successfully");
  });

  it("keeps workflow templates honest while orchestration remains unavailable", async () => {
    const source = await readProjectFile("app/(tabs)/workflow-templates.tsx");
    expect(source).toContain("Templates Are Parked On Purpose");
    expect(source).toContain("No fake templates. No pretend clones.");
    expect(source).not.toContain("mockTemplates");
    expect(source).not.toContain("cloned successfully");
    expect(source).not.toContain("rating:");
  });

  it("keeps OAuth UI honest while token persistence remains unavailable", async () => {
    const source = await readProjectFile("app/(tabs)/oauth-connect.tsx");
    expect(source).toContain("Service Connections Are Paused");
    expect(source).toContain("No simulated authorizations");
    expect(source).not.toContain("mockAuthUrl");
    expect(source).not.toContain("openAuthSessionAsync");
    expect(source).not.toContain("connected successfully");
    expect(source).not.toContain("Expires in 89 days");
  });

  it("keeps standalone token UI honest while its persistence remains unavailable", async () => {
    const source = await readProjectFile("app/(tabs)/token-management.tsx");
    expect(source).toContain("Standalone Tokens Are Locked");
    expect(source).toContain("No manufactured credentials");
    expect(source).not.toContain("maskedToken");
    expect(source).not.toContain("useStoreToken");
    expect(source).not.toContain("Token revoked");
    expect(source).not.toContain("mock data");
  });
});
