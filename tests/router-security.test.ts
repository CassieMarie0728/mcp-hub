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

  it("denies webhook listing to unauthenticated callers", async () => {
    await expect(caller.webhooks.listWebhooks()).rejects.toThrow();
  });

  it("denies analytics access to unauthenticated callers", async () => {
    await expect(caller.analytics.getToolStats({})).rejects.toThrow();
  });

  it("denies OAuth authorization initiation to unauthenticated callers", async () => {
    await expect(caller.oauth.getAuthorizationUrl({ serverType: "github", serverId })).rejects.toThrow();
  });

  it("denies OAuth refresh lifecycle access to unauthenticated callers", async () => {
    await expect(caller.oauth.refreshToken({ serverId })).rejects.toThrow();
  });
});
