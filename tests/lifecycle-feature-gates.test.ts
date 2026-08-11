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
});
