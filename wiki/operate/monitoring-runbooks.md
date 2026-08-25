---
title: Monitoring & Runbooks
description: What is actually observable in a running MCP Hub, the monitoring toolkit that ships but is not wired, and runbooks for common incidents.
tags:
  - operate
  - monitoring
  - runbooks
  - health
---

> Audience: operators & self-hosters | Status: living document | Last verified: 2026-08-06

This page has two halves. The first documents **what is actually observable** in a running MCP Hub today (verified against `server/_core/index.ts`). The second covers the monitoring subsystem that **ships in the repo but is not wired into the runtime**, so you know exactly what exists and what is not in effect.

## What is live today

### Health endpoint

`GET /api/health` is the one operational endpoint you can rely on:

```json
{ "ok": true, "timestamp": 1754475000000, "version": "1.0.0" }
```

- Public, **skipped by the rate limiter**, returns HTTP 200.
- This is a **static** liveness check — it does not probe the database, MCP servers, or internal services. A healthy response means the Express process is up, nothing more.
- Use it for orchestrator liveness, reverse-proxy health, and uptime checks ([System API](../api-reference/system.md)).

### tRPC health

The `system.health` procedure (public, input `{ timestamp }`) returns `{ ok: true }` — a second liveness path through the tRPC endpoint for callers already using the API.

### Logs

The server logs to **stdout** via `console.log` (startup banner, port selection, per-request `[api]`/`[landing]` lines). There is no file logging, log rotation, or structured shipping wired in. Collect container stdout (e.g. Docker `json-file` rotation or a platform log sink).

### What is NOT observable

- No `/metrics` endpoint — Prometheus scraping is not served.
- No winston output — the logger exists in `server/_core/monitoring.ts` but is never created by the runtime.
- No alerts, no dashboards, no tracing.

## The shipped-but-unwired monitoring toolkit

`server/_core/monitoring.ts` (438 lines) implements a complete observability layer that is **defined but never mounted**. `server/_core/index.ts` does not import it; nothing in the runtime calls `startMetricsServer`, `metricsMiddleware`, `healthChecker.check`, `alertManager`, or the logger. It is reached only from `server/admin/alerts.ts` and `server/admin/admin-metrics.ts`, which are themselves **not mounted** in `server/routers.ts`.

| Piece | What it would do | Wired? |
| --- | --- | --- |
| `collectDefaultMetrics` + custom metrics | Prometheus registry (`mcp_hub_*`): workflow, tool, error, token, DB, WebSocket, API, webhook | No |
| `startMetricsServer(9090)` | HTTP server exposing `/metrics` and `/health` | No |
| `metricsMiddleware()` | Express middleware recording `api_request_*` per request | No |
| `HealthChecker` / `healthChecker` | Extensible health checks with 5s timeout, healthy/degraded/unhealthy status | No |
| `AlertManager` / `alertManager` + `setupSlackAlerts` / `setupEmailAlerts` | Alert lifecycle with Slack webhook handler; email handler is a TODO stub | No |
| `exportMetrics('prometheus' \| 'json')` | Programmatic metrics export (prometheus or json) | No |
| winston `logger` | Structured console logger with commented-out daily-rotate-file transports | No |

`server/notifications/token-expiration-monitor.ts` likewise defines a `TokenExpirationMonitor` class that nothing instantiates.

> [!WARNING]
> Do not assume these metrics are collected in a running deployment. If you need Prometheus metrics, you must wire `server/_core/monitoring.ts` into `server/_core/index.ts` yourself (a code change), then scrape the resulting endpoint.

## Runbooks

### Server won't start

1. Check the startup logs for the port-selection message — the server scans `PORT` up to `PORT+19` if busy. If your proxy expects a fixed port, pin `PORT`.
2. Confirm `GET /api/health` eventually answers with `{ ok: true }`. If not, the process exited — check stderr (e.g. `docker logs` / `journalctl`).
3. Common causes: missing `.env` variables (`JWT_SECRET`, `COOKIE_SECRET`), a bad `DATABASE_URL` only if a startup path reads it, or a port collision.

### API down but container up

1. `curl http://localhost:3000/api/health` locally — distinguishes app failure from proxy failure.
2. If healthy locally but not through the proxy, check [Reverse proxy](reverse-proxy.md): TLS termination, upstream `mcp-hub:3000`, WebSocket upgrade headers.
3. Rate-limit exhaustion: the global limiter (1000/15min per IP) and API limiter (100/1min) will 429 clients. Check for a misbehaving caller rather than restarting the app ([System API](../api-reference/system.md#rate-limits)).

### State lost after restart

This is **expected behavior**, not an incident. Servers, tokens, webhooks, workflows, and analytics are in-memory; only the `users` table persists. Re-register MCP servers and re-issue tokens after any restart. If this is unacceptable, the fix is a design change, not a config change ([Data model](../architecture/data-model.md)).

### Slow or failing tool execution

1. The runtime has no execution metrics wired — you cannot see per-tool latency from the app. Capture what you can from stdout logs.
2. Check connectivity from the app host to the MCP server URL (`MCP_SERVER_URL` and per-server endpoints, [Connections](../api-reference/connections.md)).
3. Consider wiring `toolExecutionDuration`/`toolExecutionCounter` from `server/_core/monitoring.ts` if you need sustained visibility.

## Next steps

- [Production checklist](production-checklist.md) — every gap, including monitoring, itemized.
- [Reverse proxy](reverse-proxy.md) — TLS and health routing.
- [Build & release](build-release.md) — shipping fixes that resolve incidents.
