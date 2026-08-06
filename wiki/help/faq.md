---
title: FAQ
description: Frequently asked questions about MCP Hub - what it is, persistence, integrations, status labels, and common errors.
tags:
  - wiki
  - help
  - faq
---

> Audience: everyone | Status: living document | Last verified: 2026-08-06

Straight answers to the questions that come up most. For symptom-first debugging use [Troubleshooting](troubleshooting.md); for how things work, the [Architecture](../architecture/index.md) section. Every answer is grounded in the wiki's evidence hierarchy - code beats docs, wiki beats root reports ([Feature status](../project/feature-status.md)).

## What is MCP Hub, really?

An **MCP client and host** for Android, iOS, and web: you connect MCP servers, discover their tools, run those tools from a form UI, and chain the calls into macros and workflows. It is **not** an MCP server, and it is **not** an AI model or provider. See [MCP in plain English](../start-here/mcp-in-plain-english.md) and the [Home](../Home.md) intro.

## Why did everything disappear after a restart?

Because almost all state is **in-memory**: servers, tools, tokens, webhooks, workflows, and analytics live in process memory and reset on exit. The only durable store is the MySQL `users` table. This is expected behavior, not data loss. See [Data model](../architecture/data-model.md).

## Do I need a database?

Only if you want user/auth persistence, and even then it stores **only the `users` table**. Without `DATABASE_URL` you can connect servers and run tools, but restarts lose state and there is no durable user table. See [Database](../install-and-configure/database.md).

## Which MCP servers can I connect to?

Any server speaking the HTTP gateway convention (`GET /mcp/info`, `GET /mcp/tools/list`, `POST /mcp/tools/call`) with bearer, API-key, or basic auth - HTTP is the **stable** path. The built-in presets (GitHub, Slack, Notion) are **Beta**. `websocket` and `stdio` exist in the config schema but are not live paths. See [Server connections](../user-guide/server-connections.md) and [MCP integration](../architecture/mcp-integration.md).

## What do error codes 10001 and 10002 mean?

`Please login (10001)` - no valid session on a protected procedure. `You do not have required permission (10002)` - valid session but the caller is not `admin`. Both come from `shared/const.ts`. See [Auth & Sessions](../architecture/auth-session.md) and [Troubleshooting](troubleshooting.md).

## Why does my OAuth login fail?

The CSRF `state` store is **in-memory with a 10-minute expiry** and is per-process. A server restart - or a second server instance - invalidates pending authorization states. OAuth overall is **Beta**. See [Auth & Sessions](../architecture/auth-session.md) and [Integrations & OAuth](../user-guide/integrations-oauth.md).

## Does `/metrics` or an alert dashboard exist?

No. The monitoring toolkit in `server/_core/monitoring.ts` is defined but **never mounted**, so `/metrics` and admin alert endpoints do not exist. Documents describing them are **aspirational**, not production truth. See [Monitoring & runbooks](../operate/monitoring-runbooks.md).

## What do Stable, Beta, Experimental, and Disabled mean?

They are defined labels with an assignment rule (wire-trace, store check, mount check, routing check). Roughly: **Stable** = wired end to end; **Beta** = works but rougher edges (OAuth); **Experimental** = UI + in-memory engine; **Disabled** = shipped source parked under `app/_disabled`. Live counts are on the [Feature status](../project/feature-status.md) page.

## The README disagrees with the wiki. Who is right?

The **wiki wins** - it is audited against `main` at commit `0691562` file by file. A disagreement is a bug in the other doc; log it in the [contradiction register](../project/feature-status.md#known-contradictions-fixed-here) so it stops being re-argued.

## How do I report a security issue?

Privately, through maintainer channels - do **not** open a public GitHub issue. There is no SLA or bounty yet. See [Vulnerability reporting](../security-governance/vulnerability-reporting.md).

## Why is a feature I see in the code not in the app?

It may be one of the **22 screens** parked under `app/_disabled/` - shipped source that Expo does not route. See the [Disabled feature catalog](../project/disabled-catalog.md).

## How do I run the app on a phone?

- **Android:** JDK 17 + Android SDK (minSdk 24), then `corepack pnpm android`. See [Android](../install-and-configure/android.md).
- **iOS:** macOS + Xcode, then `corepack pnpm ios`. See [iOS & web](../install-and-configure/ios-web.md).
- **Web:** `corepack pnpm dev:server` + `corepack pnpm dev:metro`, open `http://localhost:8081`. See [Local development](../install-and-configure/local-development.md).

## Is the deployment described in the root docs real?

Only if it survives the evidence hierarchy. PostgreSQL, Redis, PM2, Helm, `/metrics`, and alert dashboards appear in `archive/aspirational-deployment/` - they do **not** exist in this codebase. What ships: a `Dockerfile`, `docker-compose.yml`, and Kubernetes manifests. See [Feature status](../project/feature-status.md) and [Deployment overview](../operate/deployment-overview.md).

## Related pages

- [Troubleshooting](troubleshooting.md) - symptom-first failure guide.
- [Diagnostics](diagnostics.md) - the ordered diagnostic checklist.
- [Help index](index.md) - the section hub.
