import { describe, expect, it } from "vitest";

import { MCPServerManager } from "../server/mcp/mcp-server-manager";

describe("MCP server manager security", () => {
  it("rejects insecure HTTP endpoints at registration", () => {
    expect(() => new MCPServerManager().registerServer({
      id: "server-1",
      name: "Insecure",
      url: "http://mcp.example.com",
      type: "http",
    })).toThrow("HTTPS");
  });

  it("rejects loopback endpoints at registration", () => {
    expect(() => new MCPServerManager().registerServer({
      id: "server-2",
      name: "Loopback",
      url: "https://127.0.0.1",
      type: "http",
    })).toThrow("blocked network address");
  });

  it("rejects routing headers at registration", () => {
    expect(() => new MCPServerManager().registerServer({
      id: "server-3",
      name: "Header override",
      url: "https://mcp.example.com",
      type: "http",
      headers: { Host: "attacker.example" },
    })).toThrow("not allowed");
  });
});
