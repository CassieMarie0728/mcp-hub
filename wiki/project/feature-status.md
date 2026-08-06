---
title: Feature Status
description: "The wiki's status labels (Stable / Beta / Experimental / Disabled), how they are assigned, and the register of known contradictions between repo docs and reality."
tags:
  - wiki
  - project
  - status
---

> Audience: everyone | Status: living document | Last verified: 2026-08-06

Every wiki page states a **feature status** for the capability it documents. This page defines those labels, explains how they are assigned, and keeps the register of contradictions between root-level reports and what the code actually does.

## The status labels

| Label | Meaning | Example |
| --- | --- | --- |
| **Stable** | Wired end to end: frontend, backend, and (where applicable) persistence all work as documented. Changes are possible but the behavior is real today. | Server connections, tool discovery, HTTP tool execution, auth/sessions. |
| **Beta** | Works end to end but carries known rough edges, narrow testing, or an in-memory store that will bite you. | Integrations & OAuth (in-memory OAuth state store); providers. |
| **Experimental** | UI + in-memory engine exist and are heavily tested, but the engine does not do the real thing (e.g. macro execution simulates tool steps) or is not wired to real tools. | Macros, workflows, webhooks, tokens, analytics, team workspaces — unless a page says otherwise. |
| **Disabled** | Source ships but is parked under `app/_disabled` and not routed by Expo. See [Disabled feature catalog](disabled-catalog.md). | Macro recorder, marketplace, governance, audit log. |
| **Aspirational** | Described in a doc but **does not exist** in the codebase. Never cite as production truth. | PostgreSQL, Redis, PM2, Helm, `/metrics`, alert dashboards (in `archive/aspirational-deployment/DEPLOYMENT.md` / `PRODUCTION_DEPLOYMENT.md` / `PRODUCTION_TESTING.md`). |

### Current label counts

Live counts from the [User guide](../user-guide/index.md) feature table and the [Disabled catalog](disabled-catalog.md):

```html preview
<div style="font-family:system-ui,sans-serif;padding:20px">
  <div id="cards" style="display:flex;gap:14px;flex-wrap:wrap"></div>
  <script>
    var stats = [
      ['Stable', '3', 'wired end to end', 'var(--chart-2)'],
      ['Beta', '1', 'OAuth + presets', 'var(--chart-3)'],
      ['Experimental', '7', 'in-memory engines', 'var(--chart-1)'],
      ['Disabled', '22', 'screens under app/_disabled', 'var(--chart-5)']
    ];
    document.getElementById('cards').innerHTML = stats.map(function (s) {
      return '<div style="flex:1;min-width:150px;padding:16px;background:var(--card);' +
        'color:var(--card-foreground);border:1px solid var(--border);' +
        'border-radius:var(--radius)">' +
        '<div style="font-size:13px;color:var(--muted-foreground)">' + s[0] + '</div>' +
        '<div style="font-size:26px;font-weight:700;margin-top:4px">' + s[1] + '</div>' +
        '<div style="font-size:12px;font-weight:600;margin-top:4px;color:' + s[3] + '">' +
        s[2] + '</div>' +
        '</div>';
    }).join('');
  </script>
</div>
```

## How a label is assigned

A wiki page cites the **source file(s)** it was verified against. The assignment rule, in order of precedence:

1. **Wire-trace it.** Does the frontend call a real tRPC procedure? Does that procedure do the work, or simulate it? `Stable` requires a full wire trace.
2. **Check the store.** If the feature relies on an in-memory `Map` or in-memory token/state store, it cannot be `Stable` — restarts lose it. Downgrade to `Beta` (with the caveat stated) or `Experimental`.
3. **Check the mount.** If the backend code is defined but never imported from `server/_core/index.ts` (e.g. `monitoring.ts`), it is not live. That is `Aspirational`, not `Stable`.
4. **Check routing.** If the screen lives under `app/_disabled`, it is `Disabled` regardless of how complete it looks.

## How the wiki wins

When a root-level report or generated doc disagrees with a wiki page, the **wiki wins**: this wiki is audited against `main` at commit `0691562` (2026-08-06), file by file. A disagreement is a bug in the other doc — log it in the register below so it stops being re-argued.

## Known contradictions fixed here

Each row is a doc claim that this wiki verified against code and found false. The register is the evidence trail so the same argument does not have to be re-litigated. As of 2026-08-06 the four aspirational docs (`DEPLOYMENT.md`, `PRODUCTION_DEPLOYMENT.md`, `PRODUCTION_TESTING.md`, `DEPLOYMENT_REPORT.md` — moved to `archive/aspirational-deployment/`) each carry a banner at the top marking them **ASPIRATIONAL - NOT production truth** and linking back here and to the [Operate section](../operate/index.md).

| Doc | Claim | Reality | Where the wiki documents it |
| --- | --- | --- | --- |
| `PRODUCTION_TESTING.md` | `/health` returns `{ "status": "healthy", "checks": {...} }` | `/api/health` returns `{ ok: true, timestamp, version: '1.0.0' }` — a liveness check with no dependency checks | [Monitoring & runbooks](../operate/monitoring-runbooks.md) |
| `PRODUCTION_TESTING.md`, `DEPLOYMENT.md` | PostgreSQL + Redis + `/metrics` + alert rules are production surfaces | MySQL is the only database; the monitoring toolkit in `server/_core/monitoring.ts` is defined but **never mounted**; `/metrics` and admin alert endpoints do not exist | [Monitoring & runbooks](../operate/monitoring-runbooks.md), [Data model](../architecture/data-model.md) |
| `PRODUCTION_DEPLOYMENT.md` | PM2, Helm, Socket.io, ELK, Jaeger are the deployment/reliability stack | None of these are configured in the repository; the shipped assets are a `Dockerfile`, `docker-compose.yml`, k8s manifests, and `scripts/deploy.sh` | [Deployment overview](../operate/deployment-overview.md) |
| `PRODUCTION_TESTING.md` | Workflows/tool execution endpoints like `POST /api/workflows` exist | No such HTTP routes exist; the surface is `/api/health`, `/api/trpc`, and OAuth/AI routes | [Backend API surface](../architecture/backend-api-surface.md) |
| Root `README` (historically) | MCP Hub is an MCP **server** | MCP Hub is an MCP **client/host**; it does not serve MCP | [MCP in plain English](../start-here/mcp-in-plain-english.md) |
| This wiki, earlier revisions | 23 screens parked under `app/_disabled` | The directory contains **22** screens (verified by listing `app/_disabled/`) | [Disabled feature catalog](disabled-catalog.md) |

If you find a new contradiction, add it here and cite the file(s) you verified it against.

## Where statuses come from, page by page

- [User guide](../user-guide/index.md) — per-feature statuses, updated as features move.
- [Feature tour](../start-here/feature-tour.md) — the product-level walkthrough with statuses inline.
- [Architecture](../architecture/index.md) — the code the labels are assigned against.
