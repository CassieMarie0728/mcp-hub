---
title: Analytics API
description: "The analytics tRPC router, procedure by procedure — record tool executions and read stats, trends, history, and reports."
tags:
  - wiki
  - api
  - trpc
  - analytics
---

> Audience: developers & contributors | Status: living document | Last verified: 2026-08-06

The `analytics` router (`server/analytics/analytics-router.ts`) records and aggregates tool-execution metrics. All procedures are **protected**. Backed by `ExecutionAnalytics` (in-memory); see [Data model](../architecture/data-model.md) for persistence caveats.

## Procedures

### `recordExecution` — mutation

Input `{ toolName, serverId, executionTime: number, status: 'success'|'failed'|'skipped', errorMessage?, parameters?: record<string, any>, result?: any }`. Records one execution with a server-side `timestamp`. Returns `{ success: true }`.

### `getToolStats` — query

Input `{ toolName?: string }`. Returns aggregate statistics for one tool (or all tools when omitted).

### `getServerStats` — query

Input `{ serverId?: string }`. Returns aggregate statistics for one server (or all servers when omitted).

### `getExecutionHistory` — query

Input `{ toolName?, serverId?, status?, startDate?: Date, endDate?: Date, limit?: number }`. Returns matching execution records, newest first, capped by `limit`.

### `getErrorTrends` — query

Input `{ startDate, endDate }`. Returns error counts bucketed across the date range.

### `getPerformanceTrends` — query

Input `{ startDate, endDate }`. Returns execution-time trends (e.g. averages per bucket) across the date range.

### `generateReport` — query

Input `{ startDate, endDate }`. Returns a combined report over the range.

> [!IMPORTANT]
> `recordExecution` is the only **write**; everything else is a read over the in-memory aggregate. Because the store is in memory, stats are lost on restart and `getExecutionHistory` only sees executions recorded since boot.

## Related pages

- [Analytics (user guide)](../user-guide/analytics.md) — what the screens surface.
- [Results & history (user guide)](../user-guide/results-history.md) — the result shape recorded here.
- [Data model](../architecture/data-model.md) — where the aggregate store lives.
- [System](system.md) — shared rate limits.
