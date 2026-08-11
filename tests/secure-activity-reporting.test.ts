import { describe, expect, it } from "vitest";

import {
  summarizeAuthorizedMcpExecutions,
  type PublicMcpExecution,
} from "../server/mcp/mcp-server-repository";

const period = {
  startAt: new Date("2026-08-01T00:00:00.000Z"),
  endAt: new Date("2026-08-08T00:00:00.000Z"),
};

const records: PublicMcpExecution[] = [
  {
    id: "execution-1",
    serverId: "server-a",
    serverName: "Research MCP",
    operation: "execute",
    toolName: "search_docs",
    success: true,
    durationMs: 120,
    createdAt: new Date("2026-08-02T09:00:00.000Z"),
  },
  {
    id: "execution-2",
    serverId: "server-a",
    serverName: "Research MCP",
    operation: "execute",
    toolName: "search_docs",
    success: false,
    durationMs: 180,
    errorMessage: "MCP tool execution failed",
    createdAt: new Date("2026-08-02T09:02:00.000Z"),
  },
  {
    id: "execution-3",
    serverId: "server-b",
    serverName: "Planner MCP",
    operation: "discover",
    success: true,
    durationMs: 60,
    createdAt: new Date("2026-08-03T12:00:00.000Z"),
  },
];

describe("secure activity reporting", () => {
  it("aggregates only public authorized execution records into truthful metrics", () => {
    const report = summarizeAuthorizedMcpExecutions(records, period);

    expect(report.period).toEqual(period);
    expect(report.totals).toEqual({
      totalExecutions: 3,
      successfulExecutions: 2,
      failedExecutions: 1,
      successRate: 66.67,
      averageDurationMs: 120,
    });
    expect(report.topTools).toEqual([
      {
        toolName: "search_docs",
        totalExecutions: 2,
        successfulExecutions: 1,
        successRate: 50,
      },
    ]);
    expect(report.activeServers[0]).toMatchObject({
      serverId: "server-a",
      serverName: "Research MCP",
      totalExecutions: 2,
      successRate: 50,
      averageDurationMs: 150,
    });
  });

  it("reports a real empty workspace as zero activity instead of manufactured metrics", () => {
    const report = summarizeAuthorizedMcpExecutions([], period);

    expect(report.totals).toEqual({
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      successRate: 0,
      averageDurationMs: 0,
    });
    expect(report.byOperation).toEqual([]);
    expect(report.topTools).toEqual([]);
    expect(report.activeServers).toEqual([]);
  });

  it("keeps report inputs and public records free of endpoints, credentials, payloads, and results", () => {
    const serialized = JSON.stringify(summarizeAuthorizedMcpExecutions(records, period));

    expect(serialized).not.toContain("https://");
    expect(serialized).not.toContain("authorization");
    expect(serialized).not.toContain("headers");
    expect(serialized).not.toContain("input");
    expect(serialized).not.toContain("result");
  });

  it("removes the legacy process-local analytics store from the live router", async () => {
    const { readFile } = await import("node:fs/promises");
    const { resolve } = await import("node:path");
    const source = await readFile(resolve(process.cwd(), "server/analytics/analytics-router.ts"), "utf8");

    expect(source).toContain("getAuthorizedMcpActivityReport");
    expect(source).toContain("listAuthorizedMcpExecutions");
    expect(source).not.toContain("ExecutionAnalytics");
    expect(source).not.toContain("recordExecution");
  });
});
