import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as {
  dependencies: Record<string, string>;
};

describe("release dependency contract", () => {
  it("does not retain Socket.IO without an implemented runtime transport", () => {
    expect(packageJson.dependencies).not.toHaveProperty("socket.io");
    expect(packageJson.dependencies).not.toHaveProperty("socket.io-client");
  });
});
