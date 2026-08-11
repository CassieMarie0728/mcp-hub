import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const landingPath = resolve(projectRoot, "landing/index.html");
const landing = readFileSync(landingPath, "utf8");

describe("landing-page truthfulness", () => {
  it("provides a clear early-access title, description, canonical URL, and social metadata", () => {
    expect(landing).toContain("Early Access for Secure MCP Server Management");
    expect(landing).toContain('rel="canonical" href="https://mcphub-cah4bw3p.manus.space/"');
    expect(landing).toContain('property="og:title"');
    expect(landing).toContain('name="twitter:card"');
  });

  it("keeps primary calls to action on owned access paths rather than an unowned app domain", () => {
    expect(landing).toContain('href="#access"');
    expect(landing).toContain('href="mailto:early-access@mcphub.io');
    expect(landing).not.toContain("app.mcphub.io");
  });

  it("does not claim unavailable production automation, pricing, reliability, or enterprise operations", () => {
    for (const unsupportedClaim of [
      "production-grade automation platform",
      "Prometheus monitoring",
      "Horizontal scaling",
      "Disaster recovery",
      "SLA guarantee",
      "30-day money-back guarantee",
      "PostgreSQL 14+",
      "Redis",
    ]) {
      expect(landing).not.toContain(unsupportedClaim);
    }
  });

  it("keeps every local product-preview link on a file that exists in the landing bundle", () => {
    const localLinks = [...landing.matchAll(/href="\.\/([^"#?]+\.html)"/g)].map((match) => match[1]);
    expect(localLinks.length).toBeGreaterThan(0);
    for (const link of localLinks) {
      expect(existsSync(resolve(projectRoot, "landing", link))).toBe(true);
    }
  });
});
