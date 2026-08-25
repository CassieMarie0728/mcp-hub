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

```html preview
<div style="font-family:system-ui,sans-serif;padding:20px;color:var(--foreground)">
  <div style="font-weight:600;font-size:15px">Execution status mix</div>
  <div style="font-size:13px;color:var(--muted-foreground);margin-bottom:16px">Shape of getToolStats - illustrative values, in-memory store</div>
  <div id="chart" style="display:flex;align-items:flex-end;gap:24px;height:180px;border-bottom:1px solid var(--border)"></div>
  <script>
    const rows = [
      { label: 'successful', value: 118, color: 'var(--chart-2)' },
      { label: 'failed', value: 16, color: 'var(--chart-4)' },
      { label: 'skipped', value: 8, color: 'var(--chart-5)' }
    ];
    const max = Math.max(...rows.map(r => r.value));
    const chart = document.getElementById('chart');
    chart.innerHTML = rows.map(r => {
      const h = Math.round((r.value / max) * 150);
      return `
        <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:6px">
          <div style="font-size:13px;font-weight:600">${r.value}</div>
          <div style="width:56px;height:${h}px;background:${r.color};border-radius:4px 4px 0 0"></div>
          <div style="font-size:12px;color:var(--muted-foreground)">${r.label}</div>
        </div>`;
    }).join('');
  </script>
</div>
```

## Honest gaps (read this)

- **In-memory.** Restart clears all analytics.
- **`getServerStats` is partially unpopulated:** `serverType` is left as `''` and `toolsUsed` is never incremented by the current implementation — the numbers you can trust are the execution counts, durations, and success rates.
- Analytics are only as good as what `recordExecution` is called with; nothing records tool runs on its own.

## UI

`app/(tabs)/analytics-dashboard.tsx` is the live dashboard (note: a second, disabled copy exists under `app/_disabled/`).

> **Next:** [User Guide index](./index.md)
