import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ciWorkflow = readFileSync(resolve(process.cwd(), ".github/workflows/ci.yml"), "utf8");

describe("CI release contract", () => {
  it("installs the reviewed lockfile exactly and validates backend and web release artifacts", () => {
    expect(ciWorkflow).toContain("pnpm install --frozen-lockfile");
    expect(ciWorkflow).not.toContain("pnpm install --no-frozen-lockfile");
    expect(ciWorkflow).toContain("pnpm build");
    expect(ciWorkflow).toContain("npx expo export --platform web");
  });
});
