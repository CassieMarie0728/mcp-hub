import { describe, expect, it } from "vitest";

const root = process.cwd();

async function readProjectFile(path: string) {
  const { readFile } = await import("node:fs/promises");
  const { resolve } = await import("node:path");
  return readFile(resolve(root, path), "utf8");
}

describe("legacy connection route security", () => {
  it("retires the legacy add-server route in favor of the secure backend workflow", async () => {
    const source = await readProjectFile("app/(tabs)/add-server.tsx");

    expect(source).toContain("Use the Secure Connection Flow");
    expect(source).toContain("/(tabs)/server-connection");
    expect(source).toContain("HTTPS endpoints only");
    expect(source).not.toContain("useMCPService");
    expect(source).not.toContain("connectionType");
    expect(source).not.toContain("DocumentPicker");
    expect(source).not.toContain("stdio");
    expect(source).not.toContain("websocket");
  });

  it("retires native bridge control in favor of the secure backend workflow", async () => {
    const source = await readProjectFile("app/(tabs)/mcp-control.tsx");

    expect(source).toContain("Local MCP Control Is Retired");
    expect(source).toContain("/(tabs)/server-connection");
    expect(source).not.toContain("useMCPBridge");
    expect(source).not.toContain("startServer");
    expect(source).not.toContain("executeFilesTool");
    expect(source).not.toContain("/sdcard/Download");
  });

  it("retires native bridge tool discovery and execution routes", async () => {
    const discovery = await readProjectFile("app/(tabs)/tool-discovery.tsx");
    const execution = await readProjectFile("app/(tabs)/tool-execution.tsx");

    expect(discovery).toContain("Use Server-Side Discovery");
    expect(discovery).toContain("/(tabs)/mcp-servers");
    expect(discovery).not.toContain("useMCPBridge");
    expect(discovery).not.toContain("discoverTools");

    expect(execution).toContain("Bridge-Side Execution Is Retired");
    expect(execution).toContain("/(tabs)/mcp-servers");
    expect(execution).not.toContain("useMCPBridge");
    expect(execution).not.toContain("executeTool");
  });

  it("retires local tool detail execution in favor of secure server management", async () => {
    const source = await readProjectFile("app/(tabs)/tool-detail.tsx");

    expect(source).toContain("Local Tool Details Are Retired");
    expect(source).toContain("/(tabs)/mcp-servers");
    expect(source).not.toContain("useMCPService");
    expect(source).not.toContain("addExecutionResult");
    expect(source).not.toContain("handleExecute");
    expect(source).not.toContain("useLocalSearchParams");
  });

  it("retires local server editing in favor of secure server management", async () => {
    const source = await readProjectFile("app/(tabs)/edit-server.tsx");

    expect(source).toContain("Legacy Server Editing Is Retired");
    expect(source).toContain("/(tabs)/mcp-servers");
    expect(source).not.toContain("useMCPService");
    expect(source).not.toContain("DocumentPicker");
    expect(source).not.toContain("expo-sharing");
    expect(source).not.toContain("connectionType");
    expect(source).not.toContain("stdio");
  });

  it("retires fictional provider MCP registration and static tool browsing", async () => {
    const servers = await readProjectFile("app/(tabs)/mcp-servers.tsx");
    const toolBrowser = await readProjectFile("app/(tabs)/tool-browser.tsx");
    const extendedRouter = await readProjectFile("server/mcp/mcp-router-extended.ts");

    expect(servers).toContain('Redirect href="/server-connection"');
    expect(servers).not.toContain("registerRealServer");
    expect(servers).not.toContain("validateToken");
    expect(toolBrowser).toContain('Redirect href="/server-connection"');
    expect(toolBrowser).not.toContain("executeServerTool");
    expect(toolBrowser).not.toContain("simplified version");
    expect(extendedRouter).toContain("requireTenantLifecyclePersistence");
    expect(extendedRouter).not.toContain("MCPServerRegistry");
    expect(extendedRouter).not.toContain("createServerConfig");
  });

  it("retires the secondary device-local Servers list in favor of canonical registration", async () => {
    const source = await readProjectFile("app/(tabs)/servers.tsx");

    expect(source).toContain('Redirect href="/server-connection"');
    expect(source).not.toContain("useApp");
    expect(source).not.toContain("deleteServer");
    expect(source).not.toContain("connectionType");
    expect(source).not.toContain("edit-server");
  });
});
