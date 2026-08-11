import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const authHook = readFileSync(resolve(process.cwd(), "hooks/use-auth.ts"), "utf8");

describe("authentication logging security", () => {
  it("does not emit session fragments, cached users, or API user records to client diagnostics", () => {
    expect(authHook).not.toContain("console.");
    expect(authHook).not.toContain("substring(0, 20)");
    expect(authHook).not.toContain("Session token:");
    expect(authHook).not.toContain("Cached user:");
    expect(authHook).not.toContain("API user response:");
  });
});
