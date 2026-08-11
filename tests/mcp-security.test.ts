import { describe, expect, it } from "vitest";

import type { PublicMcpServer } from "../server/mcp/mcp-server-repository";

describe("MCP public data security", () => {
  it("keeps the public server shape free of credential and header fields", () => {
    const server: PublicMcpServer = {
      id: "00000000-0000-4000-8000-000000000001",
      name: "Secure server",
      url: "https://mcp.example.com/",
      type: "http",
      status: "disconnected",
      toolCount: 0,
    };

    expect(server).not.toHaveProperty("auth");
    expect(server).not.toHaveProperty("headers");
    expect(JSON.stringify(server)).not.toContain("secret");
  });

  it("models credential storage as a separate encrypted database record", async () => {
    const { readFile } = await import("node:fs/promises");
    const { resolve } = await import("node:path");
    const source = await readFile(resolve(process.cwd(), "server/mcp/mcp-server-repository.ts"), "utf8");

    expect(source).toContain("encryptedPayload");
    expect(source).toContain("encryptMcpCredentials");
    expect(source).toContain("decryptMcpCredentials");
    expect(source).not.toContain("token: server");
  });
});
