import { describe, expect, it } from "vitest";

const root = process.cwd();

async function readProjectFile(path: string) {
  const { readFile } = await import("node:fs/promises");
  const { resolve } = await import("node:path");
  return readFile(resolve(root, path), "utf8");
}

describe("legacy connection route security", () => {
  it("retires the legacy add-server route in favor of the secure backend workflow", async () => {
    const source = await readProjectFile("app/(tabs)/add-server.tsx");

    expect(source).toContain("Use the Secure Connection Flow");
    expect(source).toContain("/(tabs)/server-connection");
    expect(source).toContain("HTTPS endpoints only");
    expect(source).not.toContain("useMCPService");
    expect(source).not.toContain("connectionType");
    expect(source).not.toContain("DocumentPicker");
    expect(source).not.toContain("stdio");
    expect(source).not.toContain("websocket");
  });
});
