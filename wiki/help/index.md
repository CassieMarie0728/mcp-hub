---
title: Help & Troubleshooting
description: "Section hub: troubleshooting home, diagnostic checklist, and symptom-oriented failure guides across the MCP Hub stack."
tags:
  - wiki
  - section
  - help
---

> Audience: everyone | Status: living document | Last verified: 2026-08-06

This section is the first place to go when MCP Hub is not behaving. It is symptom-oriented: you start from what you observe (the server will not start, connections drop, a request returns 429) and work toward a likely cause, a diagnostic, and a fix. The [user guide](../user-guide/index.md) explains what the app does, the [architecture](../architecture/index.md) section explains how it is built, and the [operate](../operate/index.md) section covers production running. This section covers what to do when it stops working.

## Ground truth that shapes every diagnosis

Most apparent "failures" in MCP Hub trace back to a small set of structural facts. Read these before you start digging, because they make many symptoms expected behavior rather than bugs:

1. **Almost all state is in-memory.** Servers, tools, tokens, webhooks, workflows, and analytics live in memory and are lost on restart. The only durable state is the MySQL `users` table ([Data model](../architecture/data-model.md)). If your symptom is "everything disappeared after a restart", that is expected behavior, not data loss.
2. **The HTTP surface is small.** The live server mounts only `/api/health`, `/api/trpc`, and the OAuth/AI routes. The monitoring toolkit in `server/_core/monitoring.ts` is defined but not wired, so `/metrics` and admin alert endpoints do not exist (see [Monitoring & runbooks](../operate/monitoring-runbooks.md)).
3. **Auth errors carry numeric codes.** `Please login (10001)` and `You do not have required permission (10002)` come from `shared/const.ts` and map to specific conditions (see [Troubleshooting](troubleshooting.md)).
4. **The archived deployment docs are aspirational.** `DEPLOYMENT.md`, `PRODUCTION_DEPLOYMENT.md`, and `PRODUCTION_TESTING.md` (moved to `archive/aspirational-deployment/`) describe PostgreSQL, Redis, PM2, and metrics endpoints that do not exist in this codebase. Do not use them to diagnose this app.

## Pages in this section

| Page | What it answers |
| --- | --- |
| [Troubleshooting](troubleshooting.md) | Symptom-first failure guide: for each symptom, the likely cause, how to confirm it, and the fix. |
| [Diagnostics](diagnostics.md) | The ordered diagnostic checklist to run top to bottom when you need a methodical pass. |
| [FAQ](faq.md) | Straight answers to the most-asked questions (state, persistence, errors, status labels). |

## Suggested reading order

Want quick answers before you dig? Start at [FAQ](faq.md). If you have a specific symptom, go straight to [Troubleshooting](troubleshooting.md). If you are not sure what is wrong, or troubleshooting did not cover your case, run the [Diagnostics](diagnostics.md) checklist top to bottom. Keep the [operate](../operate/index.md) section open for production-specific concerns.

## Related sections

- [Operate](../operate/index.md) — deployment, production checklist, monitoring runbooks, reverse proxy.
- [Install & configure](../install-and-configure/index.md) — the environment contract that most startup failures come down to.
- [User guide](../user-guide/index.md) — expected behavior when things are working.
