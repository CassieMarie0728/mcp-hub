---
title: Production Checklist
description: The go-live verification list for MCP Hub — what the repo ships, what it does not, and every gap you must close before real traffic.
tags:
  - operate
  - checklist
  - production
---

> Audience: operators & self-hosters | Status: living document | Last verified: 2026-08-06

This is the verify-before-considering-it-live list, grounded in what the repository actually ships. Each item is either **shipped** (the repo provides it — verify it is configured) or a **gap** (the repo does not provide it — you must build or supply it). Read [Deployment overview](deployment-overview.md) first for the artifacts this list refers to.

## Go-live checklist

### Shipped — verify configuration

- [ ] **Pinned port.** Set `PORT` explicitly. The server otherwise scans up to `3019` if 3000 is busy, which breaks any proxy config you hardcode ([System API](../api-reference/system.md)).
- [ ] **Environment contract.** Supply every variable from [Environment variables](../install-and-configure/environment-variables.md). Minimum viable production set: `NODE_ENV=production`, `PORT`, `COOKIE_SECRET`, `JWT_SECRET`, `DATABASE_URL` (if using MySQL). `server/_core/env.ts` also reads `VITE_APP_ID`, `OAUTH_SERVER_URL`, `OWNER_OPEN_ID`, `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`.
- [ ] **Secrets management.** In Docker use `--env-file` or `env_file: .env`; in Kubernetes create the `mcp-hub-env` Secret the Deployment's `envFrom` references. Never commit `.env`.
- [ ] **Health check wired.** `GET /api/health` returns `{ ok: true, timestamp, version: '1.0.0' }`, is unrate-limited, and is the liveness endpoint for your orchestrator/reverse proxy.
- [ ] **CORS for your domain.** The allowlist is `localhost:8081`, `localhost:3000`, plus `EXPO_WEB_PREVIEW_URL` / `EXPO_PACKAGER_PROXY_URL` when set. Serving the web client from a real domain requires the matching `EXPO_*` vars ([Environment variables](../install-and-configure/environment-variables.md)).
- [ ] **Rate limits understood.** Only `globalLimiter` (1000 req/15min) and `apiLimiter` (100 req/1min) are mounted. `authLimiter`, `workflowLimiter`, `uploadLimiter` are exported but **not wired** — they do not protect anything ([System API](../api-reference/system.md#rate-limits)).
- [ ] **MySQL running (if used).** Create the database and set `DATABASE_URL`. Only the `users` table persists; everything else is in-memory ([Database](../install-and-configure/database.md)).
- [ ] **Reverse proxy.** Terminate TLS and forward to the app with WebSocket upgrade headers — see [Reverse proxy](reverse-proxy.md). The shipped `nginx.conf` does **not** include TLS.

### Gaps — you must supply these

- [ ] **State-loss plan.** A restart drops all servers, tools, tokens, webhooks, workflows, and analytics. There is no persistence, replication, or backup for this state. Design for it (re-register on boot, or accept the loss).
- [ ] **Monitoring.** No metrics endpoint, no alerting, no structured log shipping is wired. `server/_core/monitoring.ts` contains a Prometheus/health/alert toolkit but is not mounted — see [Monitoring & runbooks](monitoring-runbooks.md).
- [ ] **Log aggregation.** The runtime logs to stdout only. Set up container log collection (e.g. Docker `json-file` with rotation, or a platform log sink) yourself.
- [ ] **Kubernetes hardening.** The manifests have no resource requests/limits, no readiness/liveness probes, no autoscaling, no TLS annotations, and no MySQL ([Docker & Kubernetes](../install-and-configure/docker.md)). Add these before real traffic.
- [ ] **Database backups.** No backup tooling is shipped. If you persist users, back up the MySQL database (the durable subset) on your own schedule.
- [ ] **Upgrade/rollback runbook.** No release automation beyond `scripts/deploy.sh` (Docker build + `kubectl apply`). See [Build & release](build-release.md) and write a rollback step into your deploy.

## Smoke test after deploy

```bash
curl -s http://localhost:3000/api/health          # { ok: true, timestamp, version }
curl -sI https://your-domain/api/health           # 200 over TLS, via the reverse proxy
curl -s -o /dev/null -w "%{http_code}" https://your-domain/   # landing page served
```

Then log in through the OAuth flow and confirm the session cookie is issued (see [Auth & OAuth](../api-reference/auth.md)).

## The honest summary

A production deployment of MCP Hub today is: one containerized instance behind TLS, with a pinned port, the environment contract filled in, MySQL for user persistence, console logs collected somewhere, and an accepted plan for in-memory state loss. Everything the repo does not ship is listed under *gaps* above.

## Next steps

- [Monitoring & runbooks](monitoring-runbooks.md) — what to watch and how to respond.
- [Reverse proxy](reverse-proxy.md) — TLS and WebSocket termination.
- [Build & release](build-release.md) — shipping updates safely.
