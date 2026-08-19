import { describe, expect, it } from "vitest";

const root = process.cwd();

async function readProjectFile(path: string) {
  const { readFile } = await import("node:fs/promises");
  const { resolve } = await import("node:path");
  return readFile(resolve(root, path), "utf8");
}

describe("tenant lifecycle feature gates", () => {
  it("makes OAuth connection metadata durable and keeps provider callback operations gated", async () => {
    const source = await readProjectFile("server/auth/oauth-router.ts");
    expect(source).toContain("protectedProcedure");
    expect(source).toContain("createOAuthConnectionIntent");
    expect(source).toContain("listOAuthConnections");
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

  it("makes webhook configuration durable while delivery and verification remain gated", async () => {
    const source = await readProjectFile("server/webhooks/webhooks-router.ts");
    expect(source).toContain("createWebhook");
    expect(source).toContain("rotateWebhookSecret");
    expect(source).toContain("requireTenantLifecyclePersistence");
    expect(source).not.toContain("WebhookManager");
  });

  it("makes workflow drafts durable while execution remains gated", async () => {
    const source = await readProjectFile("server/procedures/workflows.ts");
    expect(source).toContain("createWorkflowDraft");
    expect(source).toContain("saveWorkflowDraft");
    expect(source).toContain("requireTenantLifecyclePersistence");
    expect(source).not.toContain("workflowStore");
    expect(source).not.toContain("WorkflowEngine");
  });

  it("renders durable webhook configuration while keeping delivery unavailable", async () => {
    const source = await readProjectFile("app/(tabs)/webhooks.tsx");
    expect(source).toContain("trpc.webhooks.listWebhooks.useQuery");
    expect(source).toContain("trpc.webhooks.createWebhook.useMutation");
    expect(source).toContain("Delivery is intentionally unavailable.");
    expect(source).not.toContain("mockWebhooks");
    expect(source).not.toContain("api.mcphub.io");
    expect(source).not.toContain("Webhook created successfully");
  });

  it("renders durable workflow drafts while orchestration remains unavailable", async () => {
    const source = await readProjectFile("app/(tabs)/workflow-templates.tsx");
    expect(source).toContain("trpc.workflows.list.useQuery");
    expect(source).toContain("trpc.workflows.create.useMutation");
    expect(source).toContain("Execution intentionally unavailable.");
    expect(source).not.toContain("mockTemplates");
    expect(source).not.toContain("cloned successfully");
    expect(source).not.toContain("rating:");
  });

  it("renders durable OAuth records while provider authorization remains unavailable", async () => {
    const source = await readProjectFile("app/(tabs)/oauth-connect.tsx");
    expect(source).toContain("trpc.oauth.listConnections.useQuery");
    expect(source).toContain("trpc.oauth.createConnectionIntent.useMutation");
    expect(source).toContain("Provider authorization is still intentionally unavailable.");
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

  it("keeps the primary workflow builder honest while orchestration remains unavailable", async () => {
    const source = await readProjectFile("app/(tabs)/macro-builder.tsx");
    expect(source).toContain("The Forge Is Cooling On Purpose");
    expect(source).toContain("Workflow building is safely unavailable");
    expect(source).not.toContain("useCreateWorkflow");
    expect(source).not.toContain("useExecuteWorkflow");
    expect(source).not.toContain("Create Workflow");
    expect(source).not.toContain("handleCreateWorkflow");
  });

  it("keeps the primary execution debugger honest while workflow traces remain unavailable", async () => {
    const source = await readProjectFile("app/(tabs)/execution-debugger.tsx");
    expect(source).toContain("There Is No Sample Run To Inspect");
    expect(source).toContain("No fabricated logs");
    expect(source).not.toContain("example-run");
    expect(source).not.toContain("itemsFound");
    expect(source).not.toContain("currentStep");
  });

  it("renders execution history only from the protected tenant-scoped log query", async () => {
    const source = await readProjectFile("app/(tabs)/execution-history.tsx");
    expect(source).toContain("SECURE ACTIVITY LOG");
    expect(source).toContain("trpc.analytics.getExecutionHistory.useQuery");
    expect(source).toContain("Retry protected query");
    expect(source).not.toContain("useExecutionHistory");
    expect(source).not.toContain("deleteExecution");
    expect(source).not.toContain("clearAll");
    expect(source).not.toContain("AsyncStorage");
  });

  it("keeps secondary macro lifecycle screens aligned with the workflow gate", async () => {
    const files = [
      "app/(tabs)/macro-editor.tsx",
      "app/(tabs)/macro-scheduling.tsx",
      "app/(tabs)/macro-sharing.tsx",
      "app/(tabs)/macro-chaining.tsx",
    ];

    for (const file of files) {
      const source = await readProjectFile(file);
      expect(source).toContain("WorkflowGateScreen");
      expect(source).not.toContain("useMacroExecution");
      expect(source).not.toContain("MacroSchedulingEngine");
      expect(source).not.toContain("MacroSharingEngine");
      expect(source).not.toContain("MacroChainingEngine");
    }
  });

  it("keeps local tool results unavailable until secure execution history exists", async () => {
    const source = await readProjectFile("app/(tabs)/results.tsx");
    expect(source).toContain("Local Results Are Retired");
    expect(source).toContain("No local result cache");
    expect(source).not.toContain("useToolExecution");
    expect(source).not.toContain("createFromExecutionHistory");
    expect(source).not.toContain("handleShare");
    expect(source).not.toContain("handleDownload");
  });

  it("renders analytics only from protected tenant-scoped execution-log aggregates", async () => {
    const source = await readProjectFile("app/(tabs)/analytics-dashboard.tsx");
    expect(source).toContain("REAL ACTIVITY ONLY");
    expect(source).toContain("trpc.analytics.getReport.useQuery");
    expect(source).toContain("No verified activity in this window");
    expect(source).not.toContain("totalExecutions: 1247");
    expect(source).not.toContain("successfulExecutions: 1189");
    expect(source).not.toContain("create_issue");
    expect(source).not.toContain("ExecutionAnalytics");
  });

  it("keeps chat-triggered client execution unavailable until it uses the authorized runtime", async () => {
    const source = await readProjectFile("app/(tabs)/chat.tsx");
    expect(source).toContain("Command-Parsing Chat Is Retired");
    expect(source).toContain("No chat-triggered client execution");
    expect(source).not.toContain("useMCPService");
    expect(source).not.toContain("executeTool");
    expect(source).not.toContain("toolCallMatch");
    expect(source).not.toContain("selectedServerId");
  });

  it("keeps device-local non-HTTPS server presets unavailable until presets are tenant-scoped", async () => {
    const source = await readProjectFile("app/(tabs)/server-presets.tsx");
    expect(source).toContain("Local Connection Presets Are Retired");
    expect(source).toContain("HTTPS-only, tenant-authorized server registration contract");
    expect(source).not.toContain("useServerPresets");
    expect(source).not.toContain("TransportType");
    expect(source).not.toContain("localhost");
    expect(source).not.toContain("STDIO");
    expect(source).not.toContain("WEBSOCKET");
  });
});
