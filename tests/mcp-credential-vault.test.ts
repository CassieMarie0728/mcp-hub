import { describe, expect, it } from "vitest";

import {
  decryptMcpCredentials,
  encryptMcpCredentials,
  parseMcpCredentialEncryptionKey,
} from "../server/security/mcp-credential-vault";

const key = Buffer.alloc(32, 7).toString("base64");

describe("MCP credential vault", () => {
  it("round-trips credential payloads with AES-256-GCM without retaining plaintext in the envelope", () => {
    const payload = { headers: { Authorization: "Bearer secret-value" }, auth: { type: "bearer", token: "secret-value" } };
    const envelope = encryptMcpCredentials(payload, key);

    expect(envelope).not.toContain("secret-value");
    expect(decryptMcpCredentials(envelope, key)).toEqual(payload);
  });

  it("rejects malformed keys and tampered envelopes", () => {
    expect(() => parseMcpCredentialEncryptionKey("not-a-32-byte-key")).toThrow("exactly 32 bytes");
    const encrypted = encryptMcpCredentials({ token: "secret" }, key);
    const tampered = `${encrypted.slice(0, -1)}${encrypted.endsWith("A") ? "B" : "A"}`;
    expect(() => decryptMcpCredentials(tampered, key)).toThrow("cannot be decrypted");
  });
});
