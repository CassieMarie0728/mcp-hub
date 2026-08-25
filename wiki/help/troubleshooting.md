---
title: Troubleshooting
description: "Symptom-first failure guide: for each symptom, the likely cause, how to confirm it, and the fix."
tags:
  - wiki
  - help
  - troubleshooting
---

> Audience: everyone | Status: living document | Last verified: 2026-08-06

Work from the symptom you observe to the most likely cause, then the diagnostic that confirms it, then the fix. Before anything else, read the [ground truth in this section's index](index.md): several of these symptoms are expected behavior for this app, not bugs.

If your symptom is not here, run the [Diagnostics](diagnostics.md) checklist top to bottom.

## The server will not start

| | |
| --- | --- |
| **Likely cause** | Missing or invalid environment variables, or the port is already in use. |
| **Diagnose** | Read the startup log from `pnpm dev:server` (development) or `pnpm start` (production build). Look for the first error, not the last line. |
| **Fix** | Match the environment contract in [Environment variables](../install-and-configure/environment-variables.md). Free the port (default 3000) or set `PORT`/`API_PORT` if the app honors it. |

## `/api/health` returns 404

| | |
| --- | --- |
| **Likely cause** | Nothing is listening on the port you are hitting, or a reverse proxy is rewriting the path. |
| **Diagnose** | `curl http://localhost:3000/api/health` directly on the host. If that works but the public URL does not, the problem is in front of the app. |
| **Fix** | Start the server (see above). Fix the proxy path so `/api/health` is passed through unchanged ([Reverse proxy](../operate/reverse-proxy.md)). |

## Health returns `{"ok":true}` but the app seems broken

| | |
| --- | --- |
| **Likely cause** | `/api/health` is a liveness check only. It always reports `ok: true` while the process is up and skips the rate limiter; it does not verify the database, MCP connections, or feature state. |
| **Diagnose** | Check the real operation that fails, not the health endpoint. If MCP servers or tools are missing, see the next row. |
| **Fix** | Re-register the servers you expect to be present. In-memory state is not restored automatically after a restart. |

## Everything disappeared after a restart

| | |
| --- | --- |
| **Likely cause** | **Expected behavior.** Servers, tools, tokens, webhooks, workflows, and analytics live in memory ([In-memory registry](../user-guide/server-connections.md)). Only the MySQL `users` table is durable. |
| **Diagnose** | Confirm the process actually restarted (new `timestamp` in the health response, uptime reset in logs). |
| **Fix** | Re-register what you need. If restart survival matters, design a registration step into your startup ([Monitoring & runbooks](../operate/monitoring-runbooks.md)). This is not data loss; nothing was persisted to lose. |

## An MCP server connection fails

| | |
| --- | --- |
| **Likely cause** | Only HTTP transport is implemented. The config schema also accepts `websocket` and `stdio`, but those are not wired end to end. Protocol versions can also mismatch: the client negotiates `2024-11-25` while a fallback reports `'1.0'`. |
| **Diagnose** | Check the transport field on the failing server config, then the negotiated protocol version in the server response. |
| **Fix** | Use HTTP transport. If you need WebSocket or stdio, that is an unimplemented feature, not a configuration error. |

## Auth errors: `Please login (10001)` or `You do not have required permission (10002)`

| | |
| --- | --- |
| **Likely cause** | `10001` means no valid session (missing or expired `app_session_id` cookie); `10002` means a valid session but the user is not an admin. |
| **Diagnose** | `10001`: check the request has the session cookie. `10002`: confirm the authenticated user has admin rights. |
| **Fix** | `10001`: sign in again to get a fresh session. `10002`: sign in as an admin, or grant admin rights if the app supports it. |

## Requests return 429 (rate limited)

| | |
| --- | --- |
| **Likely cause** | You are hitting an API route faster than the rate limiter allows. Note `/api/health` is exempt; the limiter applies to the rest of the API surface. |
| **Diagnose** | Check for rate-limit headers on the response, then look at the route's limiter config in `server/_core/index.ts`. |
| **Fix** | Slow down or retry with backoff. If the limit is too low for your use, that is a code change, not a setting. |

## CORS errors in the web client

| | |
| --- | --- |
| **Likely cause** | The browser origin is not in the CORS allowlist. The shipped list covers `http://localhost:8081` and `http://localhost:3000` plus the `EXPO_WEB_PREVIEW_URL` and `EXPO_PACKAGER_PROXY_URL` environment values. |
| **Diagnose** | Read the browser console CORS error to see the offending origin, then check it against the allowlist in `server/_core/index.ts`. |
| **Fix** | Add the origin to the allowlist, or set the `EXPO_WEB_PREVIEW_URL`/`EXPO_PACKAGER_PROXY_URL` environment variables for the dev preview. |

## Secrets appear in an MCP server listing

| | |
| --- | --- |
| **Likely cause** | Almost certainly not the case. `getServer`/`getAllServers` redact bearer tokens, passwords, and any header whose name contains `secret`, `token`, or `password` (or is `authorization`/`x-api-key`) before responding. |
| **Diagnose** | Check whether the field you are worried about is actually exposed or is the redacted placeholder. |
| **Fix** | If a secret is genuinely exposed, it is a bug: report it. Otherwise treat the redaction as the intended behavior. |

## A documented endpoint returns 404 (e.g. `/metrics`, admin alerts)

| | |
| --- | --- |
| **Likely cause** | **Expected behavior.** The monitoring toolkit is shipped in `server/_core/monitoring.ts` but never mounted. `/metrics` and the admin alert routes do not exist on the live server. |
| **Diagnose** | Check the mounted routes in `server/_core/index.ts`. The live surface is `/api/health`, `/api/trpc`, and the OAuth/AI routes. |
| **Fix** | Treat this as a missing feature, not a config error. See [Monitoring & runbooks](../operate/monitoring-runbooks.md) for the gap and how to respond to incidents without it. |

## Still stuck

Run the [Diagnostics](diagnostics.md) checklist top to bottom. If the process is healthy, the ports are right, and the symptom is an unimplemented feature or expected in-memory behavior, the answer is a design decision, not a fix. File it as a feature request rather than burning time on a misconfiguration.
