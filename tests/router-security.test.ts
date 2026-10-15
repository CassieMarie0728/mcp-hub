import { describe, expect, it } from "vitest";

import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {}, hostname: "localhost" } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const serverId = "00000000-0000-4000-8000-000000000001";

describe("Router Security", () => {
  const caller = appRouter.createCaller(createPublicContext());

  it("denies token listing to unauthenticated callers", async () => {
    await expect(caller.tokens.listServerTokens({ serverId })).rejects.toThrow();
  });

  it("denies tokensProcedures operations to unauthenticated callers", async () => {
    const { tokensProcedures } = await import("../server/procedures/tokens");
    const proceduresCaller = tokensProcedures.createCaller(createPublicContext());
    await expect(proceduresCaller.list()).rejects.toThrow();
    await expect(proceduresCaller.getByServer(serverId)).rejects.toThrow();
    await expect(proceduresCaller.store({ serverId, serverType: "github", name: "test", token: "secret" })).rejects.toThrow();
    await expect(proceduresCaller.revoke("token-1")).rejects.toThrow();
    await expect(proceduresCaller.rotate({ tokenId: "token-1", newToken: "new-secret" })).rejects.toThrow();
    await expect(proceduresCaller.verify("token-1")).rejects.toThrow();
  });

  it("denies webhook listing to unauthenticated callers", async () => {
    await expect(caller.webhooks.listWebhooks()).rejects.toThrow();
  });

  it("denies analytics access to unauthenticated callers", async () => {
    await expect(caller.analytics.getReport({ range: "7d" })).rejects.toThrow();
  });

  it("denies OAuth authorization initiation to unauthenticated callers", async () => {
    await expect(caller.oauth.getAuthorizationUrl({ serverType: "github", serverId })).rejects.toThrow();
  });

  it("denies OAuth refresh lifecycle access to unauthenticated callers", async () => {
    await expect(caller.oauth.refreshToken({ serverId })).rejects.toThrow();
  });
});
