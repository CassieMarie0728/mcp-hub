import { describe, expect, it, beforeEach } from "vitest";

import TokenManager from "../server/tokens/token-manager";

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
