---
description: Where tool-call results land, the result shape, and the limits of the in-memory execution history.
tags:
  - results
  - history
  - execution
title: Results & History
---
> [!NOTE] Status
> **Experimental** · Last verified 2026-08-06 · Commit `0691562`

| Field | Value |
| --- | --- |
| Purpose | Where tool-call results land, and how far back history reaches. |
| Audience | End users checking outcomes. |
| Source paths | `lib/services/tool-execution-service.ts`, `server/analytics/analytics-router.ts`, `app/(tabs)/results.tsx`, `app/(tabs)/execution-history.tsx` |
| Prerequisites | [Tool execution](./tool-execution.md) |
| Next | [Macros](./macros.md) |

## Result shape

Every tool call returns a `ToolExecutionResult`:

| Field | Meaning |
| --- | --- |
| `success` | Whether the call completed without an HTTP/validation error. |
| `data` | The tool's payload (when successful). |
| `error` | The failure message (when not). |
| `duration` | Elapsed milliseconds. |
| `timestamp` | When the call ran. |
| `executionId` | A per-call identifier. |

## Where results appear

- **Results** screen (`app/(tabs)/results`) — the last call's outcome.
- **Execution history** screen (`app/(tabs)/execution-history`) — a list view of recent executions.
- **Macros** — each macro execution keeps its own per-step `results` array (see [Macros](./macros.md)).

## How much history exists

Be honest about this layer, because it is thin:

- `ToolExecutionService` declares an `executionHistory` list, but **it is never written** — history through that service is empty by design.
- The server-side `analytics.getExecutionHistory` is the real record, backed by an **in-memory** `ExecutionAnalytics` store (`server/analytics/analytics-router.ts`).
- History is **not persisted**: restarting the backend clears analytics history, and nothing on the client survives a reload except whatever the UI keeps locally.

## Filtering history

`getExecutionHistory` accepts `toolName?`, `serverId?`, `status?`, `startDate?`, `endDate?`, and `limit?`. Entries are `ExecutionMetrics`: `{toolName, serverId, executionTime, status, timestamp, errorMessage?, parameters?, result?}`.

> **Next:** [Macros](./macros.md)
