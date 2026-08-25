---
title: Diagnostics
description: "The ordered diagnostic checklist to run top to bottom when you need a methodical pass over MCP Hub."
tags:
  - wiki
  - help
  - diagnostics
---

> Audience: everyone | Status: living document | Last verified: 2026-08-06

Run these in order. Each step either narrows the problem or rules out a whole class of causes. Stop early only when a step identifies the root cause and a fix from [Troubleshooting](troubleshooting.md) applies.

## Step 1: Is the process up?

Confirm something is actually listening on the expected port (default 3000) and that it is the code you think it is.

- Development: `pnpm dev:server`
- Production build: `pnpm build` then `pnpm start`
- Containerized: `docker ps` and `docker logs` on the container ([Docker](../install-and-configure/docker.md))

A crash at startup is almost always the environment contract (Step 3), not the code.

## Step 2: Does the health endpoint answer?

```sh
curl http://localhost:3000/api/health
```

A healthy response looks like `{ "ok": true, "timestamp": "...", "version": "1.0.0" }`. Important: this endpoint always reports `ok: true` while the process is up and skips the rate limiter. It is a liveness check, not a dependency check. `404` from the host means nothing is listening; `404` from a public URL means a proxy path problem ([Reverse proxy](../operate/reverse-proxy.md)).

## Step 3: Are the environment variables right?

The app fails fast when the env contract is not met. Check the variables in [Environment variables](../install-and-configure/environment-variables.md) (`NODE_ENV`, `DATABASE_URL`, and the `EXPO_WEB_PREVIEW_URL`/`EXPO_PACKAGER_PROXY_URL` CORS values) against what the process actually loaded. The startup log names the first unmet variable.

## Step 4: Which route is failing?

The live HTTP surface is only `/api/health`, `/api/trpc`, and the OAuth/AI routes. Everything else in the docs that sounds like an endpoint (metrics, admin alerts) does not exist yet. If the failing request targets an unmounted route, that is expected behavior, not a misconfiguration.

## Step 5: Is it auth?

If the response is `Please login (10001)`, the `app_session_id` cookie is missing or expired: sign in again. If it is `You do not have required permission (10002)`, the session is valid but the user is not an admin. Codes come from `shared/const.ts`.

## Step 6: Is it the rate limiter?

`429` means the request hit the API rate limiter (`/api/health` is exempt). Retry with backoff. Rate limits are configured in `server/_core/index.ts`; changing them is a code change.

## Step 7: Is it CORS?

The browser allowlist in `server/_core/index.ts` covers `http://localhost:8081`, `http://localhost:3000`, and the `EXPO_WEB_PREVIEW_URL`/`EXPO_PACKAGER_PROXY_URL` values. A CORS error means the requesting origin is not among them. Add the origin or set the matching env variable.

## Step 8: Is the failure really about a restart?

If state (servers, tools, tokens, webhooks, workflows, analytics) is missing, remember it is all in-memory and lost on restart; only the MySQL `users` table is durable ([Server connections](../user-guide/server-connections.md)). Re-register what you need. This is expected behavior.

## Step 9: Escalate with the right evidence

If none of the above resolves it, gather the evidence an operator or maintainer needs: the full startup log, the failing request and its exact response body/status, the health payload's `timestamp`, and which step above you reached. Then check [Monitoring & runbooks](../operate/monitoring-runbooks.md) for what monitoring exists and [Contributing](../contribute/index.md) if you intend to report or fix it.

## Related

- [Troubleshooting](troubleshooting.md) — symptom-first table when you already know what is wrong.
- [Monitoring & runbooks](../operate/monitoring-runbooks.md) — the live health surface and the unmounted monitoring toolkit.
- [Reverse proxy](../operate/reverse-proxy.md) — when the failure is between the client and the app.
