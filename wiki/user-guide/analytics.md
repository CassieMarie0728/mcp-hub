---
description: Execution stats, trends, and reports — procedures, stat shapes, and the honest gaps in the in-memory analytics store.
tags:
  - analytics
  - stats
  - reports
title: Analytics
---
> [!NOTE] Status
> **Experimental** · Last verified 2026-08-06 · Commit `0691562`

| Field | Value |
| --- | --- |
| Purpose | Execution statistics, trends, and reports. |
| Audience | Users and admins reviewing usage. |
| Source paths | `server/analytics/analytics-router.ts`, `server/analytics/execution-analytics.ts`, `app/(tabs)/analytics-dashboard.tsx` |
| Prerequisites | [Token management](./token-management.md) |
| Next | [User Guide index](./index.md) |

## Recording

`analytics.recordExecution` (`protected`) ingests `{toolName, serverId, executionTime, status: 'success' \| 'failed' \| 'skipped', errorMessage?, parameters?, result?}`. Backing store is in-memory (`ExecutionAnalytics`).

## Reading stats

| Procedure | Returns |
| --- | --- |
| `analytics.getToolStats` | `ToolStats[]` — per tool: `totalExecutions`, `successful/failed/skippedExecutions`, `averageExecutionTime`, `min/maxExecutionTime`, `successRate`, `errorRate`, `lastExecutedAt?` |
| `analytics.getServerStats` | `ServerStats[]` — per server: totals, `averageExecutionTime`, `successRate`, `toolsUsed`, `lastActivityAt?` |
| `analytics.getExecutionHistory` | `ExecutionMetrics[]` — filterable by `toolName?`, `serverId?`, `status?`, `startDate?`, `endDate?`, `limit?` |
| `analytics.getErrorTrends` | Daily `errorCount`, `errorRate`, `topErrors[{message, count}]`. |
| `analytics.getPerformanceTrends` | Daily `averageExecutionTime`, `p50/p95/p99`. |
| `analytics.generateReport` | A composite `AnalyticsReport` over a date range. |

## Honest gaps (read this)

- **In-memory.** Restart clears all analytics.
- **`getServerStats` is partially unpopulated:** `serverType` is left as `''` and `toolsUsed` is never incremented by the current implementation — the numbers you can trust are the execution counts, durations, and success rates.
- Analytics are only as good as what `recordExecution` is called with; nothing records tool runs on its own.

## UI

`app/(tabs)/analytics-dashboard.tsx` is the live dashboard (note: a second, disabled copy exists under `app/_disabled/`).

> **Next:** [User Guide index](./index.md)