---
title: Deploy & Operate
description: "Section hub: running MCP Hub in production — deployment overview, production checklist, build/release, reverse proxy, Docker, Kubernetes, monitoring, and runbooks."
tags:
  - wiki
  - section
  - operate
---

> Audience: operators & self-hosters | Status: living document | Last verified: 2026-08-06

This section is the operational companion to the rest of the wiki. The [user guide](../user-guide/index.md) tells you *what* MCP Hub does, the [architecture](../architecture/index.md) section tells you *how* it is built, the [install & configure](../install-and-configure/index.md) section gets a single instance running — and this section covers what it takes to run MCP Hub **reliably in production** and to respond when something goes wrong.

Everything here is grounded in the repository as it actually exists on `main`: the `Dockerfile`, `docker-compose.yml`, `kubernetes/` manifests, `nginx.conf`, `scripts/`, `server/_core/index.ts`, and `server/_core/monitoring.ts`. Where the repo ships scaffolding rather than a finished answer, this section says so explicitly and links to the gap.

## Ground truth about this release

Before reading further, three facts shape every operational decision:

1. **Almost all state is in-memory.** Servers, tools, tokens, webhooks, workflows, and analytics live in memory and are lost on restart. The only durable state is the MySQL `users` table ([Data model](../architecture/data-model.md)). Production restarts are therefore **destructive** unless you design around it.
2. **The monitoring subsystem is defined but not wired.** `server/_core/monitoring.ts` ships a full Prometheus/winston/health/alert toolkit, but none of it is mounted in `server/_core/index.ts`. The live HTTP surface is only `/api/health`, `/api/trpc`, and the OAuth/AI routes (see [Monitoring & runbooks](monitoring-runbooks.md)).
3. **The deployment docs at the repo root are aspirational.** `DEPLOYMENT.md` and `PRODUCTION_DEPLOYMENT.md` describe PostgreSQL, Redis, PM2, Helm, Socket.io, ELK, and Jaeger — none of which exist in this codebase. Treat this wiki section and the code as truth, not those files.

## Pages in this section

| Page | What it answers |
| --- | --- |
| [Deployment overview](deployment-overview.md) | The deployment modes, the artifacts you actually have, and what production means for this app. |
| [Production checklist](production-checklist.md) | The verify-before-considering-it-live list, grounded in what the repo does and does not ship. |
| [Build & release](build-release.md) | `pnpm build`, the Docker image, `scripts/deploy.sh`, and the landing-page deploys. |
| [Reverse proxy](reverse-proxy.md) | The shipped `nginx.conf`, what it covers, and the TLS/WebSocket gaps. |
| [Monitoring & runbooks](monitoring-runbooks.md) | The live health endpoints, the unmounted monitoring toolkit, and how to respond to common incidents. |

## Suggested reading order

Start with [Deployment overview](deployment-overview.md) to see the modes and artifacts, then [Production checklist](production-checklist.md) before going live. Read [Build & release](build-release.md) when shipping an update, [Reverse proxy](reverse-proxy.md) when exposing the service, and keep [Monitoring & runbooks](monitoring-runbooks.md) open for incident response.

## Related sections

- [Install & configure](../install-and-configure/index.md) — get one instance running first; this section assumes you have.
- [Architecture](../architecture/index.md) — the code behind every operational decision.
