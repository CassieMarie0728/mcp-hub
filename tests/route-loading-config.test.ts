import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const appConfig = readFileSync(resolve(projectRoot, "app.config.ts"), "utf8");
const rootLayout = readFileSync(resolve(projectRoot, "app/_layout.tsx"), "utf8");
const tabLayout = readFileSync(resolve(projectRoot, "app/(tabs)/_layout.tsx"), "utf8");
const chatScreen = readFileSync(resolve(projectRoot, "app/(tabs)/chat.tsx"), "utf8");
const connectionScreen = readFileSync(resolve(projectRoot, "app/(tabs)/server-connection.tsx"), "utf8");
const packageJson = JSON.parse(
  readFileSync(resolve(projectRoot, "package.json"), "utf8"),
) as {
  dependencies: Record<string, string>;
};

describe("route-loading configuration", () => {
  it("enables Expo Router async routes for web and development", () => {
    expect(appConfig).toContain("asyncRoutes");
    expect(appConfig).toMatch(/default:\s*'development'/);
    expect(appConfig).toMatch(/web:\s*true/);
  });

  it("uses a single compatible React Navigation version family", () => {
    expect(packageJson.dependencies["@react-navigation/native"]).toMatch(/^\^?7\.2\.2$/);
    expect(packageJson.dependencies["@react-navigation/elements"]).toMatch(/^\^?2\.9\.15$/);
    expect(packageJson.dependencies["@react-navigation/bottom-tabs"]).toMatch(/^\^?7\.15\.11$/);
    expect(packageJson.dependencies["@react-navigation/native-stack"]).toMatch(/^\^?7\.14\.12$/);
  });

  it("does not register routes that were intentionally moved outside the active tree", () => {
    const disabledRoutes = [
      "notification-settings",
      "audit-log",
      "governance",
      "service-control",
      "perception-test",
      "macro-management",
    ];

    for (const route of disabledRoutes) {
      expect(rootLayout).not.toContain(`<Stack.Screen name="${route}"`);
    }
  });

  it("keeps secondary screens out of the primary tab bar", () => {
    const hiddenTabRoutes = [
      "add-server",
      "chat",
      "execution-history",
      "macro-editor",
      "oauth-connect",
      "server-connection",
      "settings",
      "tool-execution",
      "webhooks",
    ];

    for (const route of hiddenTabRoutes) {
      expect(tabLayout).toContain(`<Tabs.Screen name="${route}" options={{ href: null }} />`);
    }
  });

  it("keeps the hidden chat route as a secure execution gate", () => {
    expect(chatScreen).toContain("Command-Parsing Chat Is Retired");
    expect(chatScreen).toContain("No chat-triggered client execution");
    expect(chatScreen).not.toContain("useMCPService");
    expect(chatScreen).not.toContain("executeTool");
  });

  it("keeps a single backend-backed server connection workflow", () => {
    expect(connectionScreen).toContain("trpc.mcp.registerServer.useMutation()");
    expect(connectionScreen).toContain("trpc.mcp.testConnection.useMutation()");
    expect(connectionScreen).toContain("trpc.mcp.removeServer.useMutation()");
    expect(connectionScreen).toContain("trpc.mcp.getAllServers.useQuery()");
    expect(connectionScreen).not.toContain("useMCPBridge");
    expect(connectionScreen).not.toContain("useMCPServerConnection");
    expect(tabLayout).not.toContain("server-connection-updated");
    expect(existsSync(resolve(projectRoot, "archive/disabled-screens/server-connection-updated.tsx"))).toBe(true);
  });
});
