import { describe, expect, it, beforeEach } from "vitest";

import TokenManager from "../server/tokens/token-manager";
import { tokensProcedures } from "../server/procedures/tokens";
import type { TrpcContext } from "../server/_core/context";

function createUnauthenticatedContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {}, hostname: "localhost" } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("TokenProcedures Auth Protection Tests", () => {
  const caller = tokensProcedures.createCaller(createUnauthenticatedContext());

  it("denies token listing to unauthenticated callers", async () => {
    await expect(caller.list()).rejects.toThrow();
  });

  it("denies getting server tokens to unauthenticated callers", async () => {
    await expect(caller.getByServer("srv-1")).rejects.toThrow();
  });

  it("denies storing tokens to unauthenticated callers", async () => {
    await expect(
      caller.store({
        serverId: "srv-1",
        serverType: "github",
        name: "test",
        token: "secret",
      })
    ).rejects.toThrow();
  });

  it("denies revoking tokens to unauthenticated callers", async () => {
    await expect(caller.revoke("tok-1")).rejects.toThrow();
  });

  it("denies rotating tokens to unauthenticated callers", async () => {
    await expect(
      caller.rotate({ tokenId: "tok-1", newToken: "new-secret" })
    ).rejects.toThrow();
  });

  it("denies verifying tokens to unauthenticated callers", async () => {
    await expect(caller.verify("tok-1")).rejects.toThrow();
  });
});

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
