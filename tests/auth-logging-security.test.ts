import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const authHook = readFileSync(resolve(process.cwd(), "hooks/use-auth.ts"), "utf8");
const oauthCallback = readFileSync(resolve(process.cwd(), "app/oauth/callback.tsx"), "utf8");

describe("authentication logging security", () => {
  it("does not emit session fragments, cached users, or API user records to client diagnostics", () => {
    expect(authHook).not.toContain("console.");
    expect(authHook).not.toContain("substring(0, 20)");
    expect(authHook).not.toContain("Session token:");
    expect(authHook).not.toContain("Cached user:");
    expect(authHook).not.toContain("API user response:");
  });

  it("does not emit OAuth callback secrets, user data, callback URLs, or raw provider failures", () => {
    expect(oauthCallback).not.toContain("console.");
    expect(oauthCallback).not.toContain("substring(0, 20)");
    expect(oauthCallback).not.toContain("Params received:");
    expect(oauthCallback).not.toContain("Constructed URL from params:");
    expect(oauthCallback).not.toContain("User info stored:");
    expect(oauthCallback).not.toContain("User data received:");
    expect(oauthCallback).not.toContain("error instanceof Error ? error.message");
  });
});
