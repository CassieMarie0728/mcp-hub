import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const schema = readFileSync(resolve(root, "drizzle/schema.ts"), "utf8");
const repository = readFileSync(resolve(root, "server/lifecycle/lifecycle-repository.ts"), "utf8");
const oauth = readFileSync(resolve(root, "server/auth/oauth-router.ts"), "utf8");
const webhooks = readFileSync(resolve(root, "server/webhooks/webhooks-router.ts"), "utf8");
const workflows = readFileSync(resolve(root, "server/procedures/workflows.ts"), "utf8");

describe("durable lifecycle foundation contract", () => {
  it("uses workspace-scoped Hub tables for every supported lifecycle resource", () => {
    expect(schema).toContain('"hub_oauth_connections"');
    expect(schema).toContain('"hub_webhook_subscriptions"');
    expect(schema).toContain('"hub_workflow_drafts"');
    expect(repository).toContain("eq(oauthConnections.workspaceId, access.workspaceId)");
    expect(repository).toContain("eq(webhookSubscriptions.workspaceId, access.workspaceId)");
    expect(repository).toContain("eq(workflowDrafts.workspaceId, access.workspaceId)");
  });

  it("keeps OAuth tokens and webhook secrets encrypted and absent from public records", () => {
    expect(repository).toContain("encryptMcpCredentials({ signingSecret })");
    expect(repository).toContain("encryptedPayload: null");
    expect(repository).not.toContain("accessToken");
    expect(repository).not.toContain("refreshToken");
  });

  it("persists only safe lifecycle phases and explicitly gates external side effects", () => {
    expect(oauth).toContain("OAuth authorization callback");
    expect(oauth).toContain("OAuth code exchange");
    expect(webhooks).toContain("Webhook test delivery");
    expect(webhooks).toContain("Webhook signature verification");
    expect(workflows).toContain("Workflow execution");
    expect(webhooks).not.toContain("WebhookManager");
    expect(workflows).not.toContain("WorkflowEngine");
  });
});
