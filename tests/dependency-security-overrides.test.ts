import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workspaceConfig = readFileSync(resolve(process.cwd(), "pnpm-workspace.yaml"), "utf8");

describe("dependency security override contract", () => {
  it("pins only audited, compatible patched versions for the current framework family", () => {
    expect(workspaceConfig).toContain("overrides:");
    expect(workspaceConfig).toContain("body-parser: 1.20.6");
    expect(workspaceConfig).toContain("shell-quote: 1.9.0");
    expect(workspaceConfig).not.toContain("tar:");
  });
});
