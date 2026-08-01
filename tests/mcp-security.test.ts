import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "../server/routers";
import { mcpServerManager } from "../server/mcp/mcp-server-manager";
import type { TrpcContext } from "../server/_core/context";

function createAuthenticatedContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user-id",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
      hostname: "localhost",
    } as any,
    res: {} as any,
  };
}

describe("MCP Router Security Redaction", () => {
  const ctx = createAuthenticatedContext();
  const caller = appRouter.createCaller(ctx);

  beforeEach(() => {
    // Clear servers between tests
    mcpServerManager.removeServer("test-secure-server");
  });

  it("redacts sensitive auth fields and headers in getServer", async () => {
    // Register a server with sensitive information
    mcpServerManager.registerServer({
      id: "test-secure-server",
      name: "Secure Server",
      url: "https://api.secure-server.com",
      type: "http",
      headers: {
        "Authorization": "Bearer ssm-super-secret-token",
        "X-API-Key": "secret-api-key-value",
        "Content-Type": "application/json",
      },
      auth: {
        type: "bearer",
        token: "my-super-secret-auth-token",
        password: "super-secret-password-123",
      },
    });

    const server = await caller.mcp.getServer({ serverId: "test-secure-server" });

    expect(server).toBeDefined();
    expect(server.error).toBeUndefined();
    expect(server.id).toBe("test-secure-server");
    expect(server.name).toBe("Secure Server");
    expect(server.url).toBe("https://api.secure-server.com");

    // Check that sensitive auth fields are redacted
    expect(server.auth).toBeDefined();
    expect(server.auth.token).toBe("••••••••");
    expect(server.auth.password).toBe("••••••••");

    // Check that sensitive headers are redacted
    expect(server.headers).toBeDefined();
    expect(server.headers["Authorization"]).toBe("••••••••");
    expect(server.headers["X-API-Key"]).toBe("••••••••");
    // Non-sensitive headers should be preserved
    expect(server.headers["Content-Type"]).toBe("application/json");
  });

  it("redacts sensitive auth fields and headers in getAllServers", async () => {
    mcpServerManager.registerServer({
      id: "test-secure-server",
      name: "Secure Server",
      url: "https://api.secure-server.com",
      type: "http",
      headers: {
        "Authorization": "Bearer ssm-super-secret-token",
        "X-API-Key": "secret-api-key-value",
      },
      auth: {
        type: "basic",
        token: "my-super-secret-auth-token",
        password: "super-secret-password-123",
      },
    });

    const servers = await caller.mcp.getAllServers();
    const server = servers.find((s: any) => s.id === "test-secure-server");

    expect(server).toBeDefined();
    expect(server.auth.token).toBe("••••••••");
    expect(server.auth.password).toBe("••••••••");
    expect(server.headers["Authorization"]).toBe("••••••••");
    expect(server.headers["X-API-Key"]).toBe("••••••••");
  });
});
