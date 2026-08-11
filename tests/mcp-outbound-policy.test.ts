import { describe, expect, it } from "vitest";

import {
  assertSafeMcpHeaders,
  isBlockedMcpAddress,
  parseSafeMcpEndpoint,
  resolveSafeMcpEndpoint,
} from "../server/security/mcp-outbound-policy";

describe("MCP outbound policy", () => {
  it.each([
    "0.1.2.3",
    "10.0.0.1",
    "100.64.0.1",
    "127.0.0.1",
    "169.254.169.254",
    "172.16.0.1",
    "192.0.0.1",
    "192.0.2.1",
    "192.88.99.1",
    "192.168.1.1",
    "198.18.0.1",
    "198.51.100.1",
    "203.0.113.1",
    "224.0.0.1",
  ])("blocks forbidden IPv4 destination %s", (address) => {
    expect(isBlockedMcpAddress(address)).toBe(true);
  });

  it("blocks unspecified and loopback IPv6 destinations", () => {
    expect(isBlockedMcpAddress("::")).toBe(true);
    expect(isBlockedMcpAddress("::1")).toBe(true);
  });

  it("blocks IPv6 unique-local and multicast destinations", () => {
    expect(isBlockedMcpAddress("fc00::1")).toBe(true);
    expect(isBlockedMcpAddress("ff02::1")).toBe(true);
  });

  it("blocks IPv6 link-local destinations", () => {
    expect(isBlockedMcpAddress("fe80::1")).toBe(true);
  });

  it("blocks IPv6 documentation destinations", () => {
    expect(isBlockedMcpAddress("2001:db8::1")).toBe(true);
  });

  it("allows a publicly routable address", () => {
    expect(isBlockedMcpAddress("8.8.8.8")).toBe(false);
  });

  it("requires HTTPS, no user info, and the standard port", () => {
    expect(parseSafeMcpEndpoint("https://mcp.example.com/").hostname).toBe("mcp.example.com");
    expect(() => parseSafeMcpEndpoint("http://mcp.example.com")).toThrow("HTTPS");
    expect(() => parseSafeMcpEndpoint("https://user:pass@mcp.example.com")).toThrow("user credentials");
    expect(() => parseSafeMcpEndpoint("https://mcp.example.com:8443")).toThrow("standard HTTPS port");
  });

  it("fails DNS validation when any answer is a blocked address", async () => {
    await expect(resolveSafeMcpEndpoint("https://mcp.example.com", async () => [
      { address: "8.8.8.8", family: 4 },
      { address: "127.0.0.1", family: 4 },
    ])).rejects.toThrow("blocked network address");
  });

  it("accepts public DNS answers", async () => {
    await expect(resolveSafeMcpEndpoint("https://mcp.example.com", async () => [
      { address: "8.8.8.8", family: 4 },
    ])).resolves.toMatchObject({ addresses: [{ address: "8.8.8.8" }] });
  });

  it("rejects host controls and CRLF header injection", () => {
    expect(() => assertSafeMcpHeaders({ Host: "attacker.example" })).toThrow("not allowed");
    expect(() => assertSafeMcpHeaders({ "X-Test\r\nInjected": "value" })).toThrow("invalid characters");
    expect(() => assertSafeMcpHeaders({ "X-Forwarded-For": "127.0.0.1" })).toThrow("not allowed");
  });
});
