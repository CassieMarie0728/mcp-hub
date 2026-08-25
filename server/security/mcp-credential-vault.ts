import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const VERSION = "v1";

export type McpCredentialPayload = Record<string, unknown>;

/**
 * Accept a 32-byte base64 secret or a 64-character hexadecimal secret. The
 * explicit check prevents a silently weak or malformed deployment key.
 */
export function parseMcpCredentialEncryptionKey(value = process.env.MCP_CREDENTIAL_ENCRYPTION_KEY): Buffer {
  if (!value) {
    throw new Error("MCP credential encryption is not configured");
  }

  const trimmed = value.trim();
  const key = /^[0-9a-f]{64}$/i.test(trimmed)
    ? Buffer.from(trimmed, "hex")
    : Buffer.from(trimmed, "base64");

  if (key.length !== 32) {
    throw new Error("MCP credential encryption key must be exactly 32 bytes");
  }

  return key;
}

export function encryptMcpCredentials(
  payload: McpCredentialPayload,
  keyValue?: string,
): string {
  const key = parseMcpCredentialEncryptionKey(keyValue);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_BYTES });
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [VERSION, iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptMcpCredentials(
  envelope: string,
  keyValue?: string,
): McpCredentialPayload {
  const [version, ivEncoded, tagEncoded, ciphertextEncoded, ...rest] = envelope.split(".");
  if (version !== VERSION || !ivEncoded || !tagEncoded || !ciphertextEncoded || rest.length > 0) {
    throw new Error("Stored MCP credential payload is invalid");
  }

  const key = parseMcpCredentialEncryptionKey(keyValue);
  const iv = Buffer.from(ivEncoded, "base64url");
  const tag = Buffer.from(tagEncoded, "base64url");
  const ciphertext = Buffer.from(ciphertextEncoded, "base64url");
  if (iv.length !== IV_BYTES || tag.length !== AUTH_TAG_BYTES || ciphertext.length === 0) {
    throw new Error("Stored MCP credential payload is invalid");
  }

  try {
    const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_BYTES });
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    const payload: unknown = JSON.parse(plaintext.toString("utf8"));
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new Error("payload must be an object");
    }
    return payload as McpCredentialPayload;
  } catch {
    throw new Error("Stored MCP credential payload cannot be decrypted");
  }
}
