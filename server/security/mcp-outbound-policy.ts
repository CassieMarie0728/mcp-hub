import { lookup as nodeLookup } from "node:dns/promises";
import { isIP } from "node:net";
import https from "node:https";

const MAX_RESPONSE_BYTES = 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 8_000;

export type SafeMcpAddress = { address: string; family: number };
export type McpDnsLookup = (hostname: string) => Promise<SafeMcpAddress[]>;

export type SafeMcpRequestOptions = {
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
};

export type SafeMcpResponse = {
  statusCode: number;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
};

const FORBIDDEN_HEADERS = new Set([
  "connection",
  "content-length",
  "forwarded",
  "host",
  "keep-alive",
  "proxy-connection",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "via",
]);

function ipv4Octets(address: string): number[] | null {
  if (isIP(address) !== 4) return null;
  const octets = address.split(".").map(Number);
  return octets.length === 4 && octets.every((octet) => Number.isInteger(octet) && octet >= 0 && octet <= 255)
    ? octets
    : null;
}

function ipv6ToBigInt(address: string): bigint | null {
  const normalized = address.toLowerCase().split("%")[0];
  if (isIP(normalized) !== 6) return null;

  let input = normalized;
  if (input.includes(".")) {
    const lastColon = input.lastIndexOf(":");
    const embedded = ipv4Octets(input.slice(lastColon + 1));
    if (!embedded) return null;
    input = `${input.slice(0, lastColon)}:${((embedded[0] << 8) | embedded[1]).toString(16)}:${((embedded[2] << 8) | embedded[3]).toString(16)}`;
  }

  const [left = "", right = ""] = input.split("::");
  const leftParts = left ? left.split(":") : [];
  const rightParts = right ? right.split(":") : [];
  const zeroParts = 8 - leftParts.length - rightParts.length;
  const parts = input.includes("::")
    ? [...leftParts, ...Array(Math.max(0, zeroParts)).fill("0"), ...rightParts]
    : leftParts;
  if (parts.length !== 8 || parts.some((part) => !/^[0-9a-f]{1,4}$/i.test(part))) return null;
  return parts.reduce((value, part) => (value << 16n) + BigInt(`0x${part}`), 0n);
}

function ipv6InCidr(address: string, network: bigint, prefix: number): boolean {
  const value = ipv6ToBigInt(address);
  if (value === null) return false;
  const mask = prefix === 0 ? 0n : ((1n << BigInt(prefix)) - 1n) << BigInt(128 - prefix);
  return (value & mask) === (network & mask);
}

function ipv6Network(value: string): bigint {
  const parsed = ipv6ToBigInt(value);
  if (parsed === null) throw new Error("Invalid IPv6 policy network");
  return parsed;
}

/** Returns true for network destinations that an MCP integration must never reach. */
export function isBlockedMcpAddress(address: string): boolean {
  const ipv4 = ipv4Octets(address);
  if (ipv4) {
    const [a, b, c] = ipv4;
    if (a === 0 || a === 10 || a === 127 || a >= 224) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && (b === 0 || b === 168 || (b === 2) || (b === 88 && c === 99))) return true;
    if (a === 198 && (b === 18 || b === 19 || b === 51)) return true;
    if (a === 203 && b === 0 && c === 113) return true;
    return false;
  }

  const normalized = address.toLowerCase();
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isBlockedMcpAddress(mapped[1]);

  return (
    ipv6InCidr(normalized, 0n, 128) ||
    ipv6InCidr(normalized, ipv6Network("::1"), 128) ||
    ipv6InCidr(normalized, ipv6Network("fc00::"), 7) ||
    ipv6InCidr(normalized, ipv6Network("fe80::"), 10) ||
    ipv6InCidr(normalized, ipv6Network("ff00::"), 8) ||
    ipv6InCidr(normalized, ipv6Network("2001:db8::"), 32)
  );
}

/** Validate the URL before any DNS or network request is attempted. */
export function parseSafeMcpEndpoint(endpoint: string): URL {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error("MCP endpoint must be a valid HTTPS URL");
  }

  if (url.protocol !== "https:") throw new Error("MCP endpoints must use HTTPS");
  if (url.username || url.password) throw new Error("MCP endpoint must not include user credentials");
  if (url.port && url.port !== "443") throw new Error("MCP endpoint must use the standard HTTPS port");
  if (!url.hostname) throw new Error("MCP endpoint host is required");
  if (isIP(url.hostname) && isBlockedMcpAddress(url.hostname)) {
    throw new Error("MCP endpoint resolves to a blocked network address");
  }
  return url;
}

const defaultLookup: McpDnsLookup = async (hostname) => {
  const records = await nodeLookup(hostname, { all: true, verbatim: true });
  return records.map((record) => ({ address: record.address, family: record.family }));
};

/** Resolve every DNS answer and reject the endpoint if any address is forbidden. */
export async function resolveSafeMcpEndpoint(
  endpoint: string,
  lookup: McpDnsLookup = defaultLookup,
): Promise<{ url: URL; addresses: SafeMcpAddress[] }> {
  const url = parseSafeMcpEndpoint(endpoint);
  const addresses = isIP(url.hostname)
    ? [{ address: url.hostname, family: isIP(url.hostname) }]
    : await lookup(url.hostname);

  if (addresses.length === 0) throw new Error("MCP endpoint DNS resolution returned no addresses");
  if (addresses.some(({ address }) => isBlockedMcpAddress(address))) {
    throw new Error("MCP endpoint resolves to a blocked network address");
  }
  return { url, addresses };
}

/** Disallow header controls that can rewrite routing, proxies, or message framing. */
export function assertSafeMcpHeaders(headers: Record<string, string> = {}): void {
  for (const [name, value] of Object.entries(headers)) {
    const normalized = name.toLowerCase();
    if (!name || /[\r\n]/.test(name) || /[\r\n]/.test(value)) {
      throw new Error("MCP request headers contain invalid characters");
    }
    if (FORBIDDEN_HEADERS.has(normalized) || normalized.startsWith("x-forwarded-") || normalized.startsWith(":")) {
      throw new Error(`MCP request header is not allowed: ${name}`);
    }
  }
}

/**
 * Issue a deliberately constrained HTTPS request. DNS is pinned to the already
 * validated addresses, redirect responses are rejected, and response buffering
 * is bounded to prevent endpoint-controlled resource exhaustion.
 */
export async function safeMcpRequest(
  endpoint: string,
  path: string,
  options: SafeMcpRequestOptions = {},
): Promise<SafeMcpResponse> {
  const { url, addresses } = await resolveSafeMcpEndpoint(endpoint);
  if (!path.startsWith("/") || path.includes("://")) {
    throw new Error("MCP request path must be relative to the registered endpoint");
  }
  assertSafeMcpHeaders(options.headers);

  const requestUrl = new URL(path, url);
  if (requestUrl.origin !== url.origin) throw new Error("MCP request path must remain on the registered endpoint");
  const payload = options.body === undefined ? undefined : JSON.stringify(options.body);
  const requestHeaders: Record<string, string> = { ...(options.headers ?? {}) };
  if (payload !== undefined) {
    requestHeaders["Content-Type"] ??= "application/json";
    requestHeaders["Content-Length"] = String(Buffer.byteLength(payload));
  }

  return await new Promise<SafeMcpResponse>((resolve, reject) => {
    const request = https.request(
      requestUrl.toString(),
      {
        method: options.method ?? "GET",
        headers: requestHeaders,
        timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        lookup: (_hostname, _lookupOptions, callback) => {
          const selected = addresses[0];
          callback(null, selected.address, selected.family);
        },
      },
      (response) => {
        const statusCode = response.statusCode ?? 0;
        if (statusCode >= 300 && statusCode < 400) {
          response.resume();
          reject(new Error("MCP endpoint redirects are not permitted"));
          return;
        }

        const chunks: Buffer[] = [];
        let size = 0;
        response.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_RESPONSE_BYTES) {
            request.destroy(new Error("MCP endpoint response exceeds the allowed size"));
            return;
          }
          chunks.push(chunk);
        });
        response.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          let body: unknown = raw;
          try {
            body = raw ? JSON.parse(raw) : {};
          } catch {
            // MCP servers may return text; callers receive it as an opaque string.
          }
          resolve({ statusCode, headers: response.headers, body });
        });
      },
    );

    request.once("timeout", () => request.destroy(new Error("MCP endpoint request timed out")));
    request.once("error", () => reject(new Error("MCP endpoint request failed")));
    if (payload !== undefined) request.write(payload);
    request.end();
  });
}
