import { describe, expect, it, beforeEach } from "vitest";

import TokenManager from "../server/tokens/token-manager";
import { tokensProcedures } from "../server/procedures/tokens";

describe("TokenManager Security Tests", () => {
  beforeEach(async () => {
    await TokenManager.clearAllTokens();
  });

  it("retrieves an active non-expired token", async () => {
    const created = await TokenManager.storeToken({
      serverId: "srv-1",
      serverType: "github",
      name: "GitHub Key",
      token: "secret-token-12345",
    });

    const retrieved = await TokenManager.getToken(created.id);
    expect(retrieved).toBe("secret-token-12345");
  });

  it("returns null when attempting to retrieve a revoked token", async () => {
    const created = await TokenManager.storeToken({
      serverId: "srv-1",
      serverType: "github",
      name: "GitHub Key",
      token: "secret-token-12345",
    });

    await TokenManager.revokeToken(created.id);
    const retrieved = await TokenManager.getToken(created.id);
    expect(retrieved).toBeNull();
  });

  it("returns null when attempting to retrieve an expired token", async () => {
    const created = await TokenManager.storeToken({
      serverId: "srv-1",
      serverType: "github",
      name: "GitHub Key",
      token: "secret-token-12345",
      expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
    });

    const retrieved = await TokenManager.getToken(created.id);
    expect(retrieved).toBeNull();
  });
});

describe("tokensProcedures Security Tests", () => {
  const unauthenticatedContext = {
    user: null,
    req: { protocol: "https", headers: {}, hostname: "localhost" } as any,
    res: {} as any,
  };

  const caller = tokensProcedures.createCaller(unauthenticatedContext);

  it("denies unauthenticated access to list tokens", async () => {
    await expect(caller.list()).rejects.toThrow();
  });

  it("denies unauthenticated access to store tokens", async () => {
    await expect(
      caller.store({
        serverId: "srv-1",
        serverType: "github",
        name: "Test Token",
        token: "secret-value",
      }),
    ).rejects.toThrow();
  });

  it("denies unauthenticated access to revoke tokens", async () => {
    await expect(caller.revoke("tok-1")).rejects.toThrow();
  });
});
