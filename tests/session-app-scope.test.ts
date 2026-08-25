import { describe, expect, it } from "vitest";

import { ENV } from "../server/_core/env";
import { sdk } from "../server/_core/sdk";

describe("session application scope", () => {
  it("accepts a session that was signed for this application", async () => {
    const token = await sdk.signSession({
      openId: "audit-user",
      appId: ENV.appId,
      name: "Audit User",
    });

    await expect(sdk.verifySession(token)).resolves.toMatchObject({
      openId: "audit-user",
      appId: ENV.appId,
    });
  });

  it("rejects a validly signed session issued for another application", async () => {
    const token = await sdk.signSession({
      openId: "audit-user",
      appId: `${ENV.appId}-other-app`,
      name: "Audit User",
    });

    await expect(sdk.verifySession(token)).resolves.toBeNull();
  });
});
