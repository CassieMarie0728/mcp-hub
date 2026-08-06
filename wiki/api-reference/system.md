---
title: System API
description: "The system tRPC router plus the shared REST layer — health, owner notifications, rate limits, CORS, and the AI routes."
tags:
  - wiki
  - api
  - trpc
  - system
  - rest
---

> Audience: developers & contributors | Status: living document | Last verified: 2026-08-06

This page covers the `system` tRPC router and the shared HTTP layer every other router sits behind: the REST routes, rate limits, and CORS policy from `server/_core/index.ts`.

## Router `system` (`server/_core/systemRouter.ts`)

### `health` — query, **public**

Input `{ timestamp: number >= 0 }`. Liveness probe. Returns `{ ok: true }`. There is also a separate REST health endpoint — see below.

### `notifyOwner` — mutation, **admin**

Input `{ title: string (min 1), content: string (min 1) }`. Sends a notification to the project owner through the Manus Notification Service (`server/_core/notification.ts`).

- Title max 1200 chars, content max 20000 chars (otherwise `BAD_REQUEST`).
- Requires `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY` env vars; without them it throws `INTERNAL_SERVER_ERROR`.
- Returns `{ success: delivered }` — `true` when the upstream accepted the notification, `false` when the upstream couldn't be reached.

## REST routes (`server/_core/index.ts`)

All non-tRPC HTTP surface:

| Route | Method | Auth | Purpose |
| --- | --- | --- | --- |
| `/` | GET | none | Serves the landing page (`landing/index.html`). |
| `/api/health` | GET | none | `{ ok: true, timestamp, version: '1.0.0' }`; **skipped by the rate limiter**. |
| `/api/trpc` | POST | per-procedure | The tRPC endpoint hosting all ten routers. |
| `/api/oauth/callback` | GET | none | Web OAuth callback (see [Auth & OAuth](auth.md)). |
| `/api/oauth/mobile` | GET | none | Native OAuth exchange (see [Auth & OAuth](auth.md)). |
| `/api/auth/logout` | POST | none | Clears the session cookie (see [Auth & OAuth](auth.md)). |
| `/api/auth/me` | GET | cookie or Bearer | Returns the current user (see [Auth & OAuth](auth.md)). |
| `/api/auth/session` | POST | Bearer | Establishes a session cookie from a Bearer token (see [Auth & OAuth](auth.md)). |
| `/api/ai/chat` | POST | Bearer/cookie | Non-streaming AI assistant reply (`server/_core/ai-routes.ts`). |
| `/api/ai/stream` | POST | Bearer/cookie | SSE-streamed AI assistant reply. |

### AI routes

`setupAIRoutes(app)` mounts `POST /api/ai/chat` and `POST /api/ai/stream`. Both require a session (`sdk.authenticateRequest`) — 401 without one. Input is `{ messages: array, context? }`; a missing/non-array `messages` returns 400. Chat returns `{ response }`; stream replies as `text/event-stream`.

## Rate limits

`server/_core/rate-limiter.ts` defines five limiters, but only **two are mounted** in `index.ts`:

| Limiter | Limit | Mounted? |
| --- | --- | --- |
| `globalLimiter` | 1000 req / 15 min | Yes — all requests (`app.use`), skips `/api/health`. |
| `apiLimiter` | 100 req / 1 min | Yes — the `/api/trpc` mount. |
| `authLimiter` | 5 req / 15 min (successes not counted) | **No** — defined, not wired. |
| `workflowLimiter` | 20 req / 1 min | **No** — defined, not wired. |
| `uploadLimiter` | 10 req / 1 min | **No** — defined, not wired. |

`createCustomLimiter(windowMs, max, message)` is the factory for one-off limiters; none are currently wired. `jsonErrorHandler` formats 429 responses as JSON.

> [!IMPORTANT]
> Only `globalLimiter` and `apiLimiter` are in effect. The auth, workflow, and upload limiters are exported but never mounted, so their limits do **not** currently protect anything.

## CORS and security headers

- **CORS allowlist:** `http://localhost:8081`, `http://localhost:3000`, plus `EXPO_WEB_PREVIEW_URL` and `EXPO_PACKAGER_PROXY_URL` (when set). Only listed origins get `Access-Control-Allow-Origin`; credentials are allowed.
- **Security headers:** `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection`, and (in production) `Strict-Transport-Security`.
- JSON bodies up to 50 MB.
- Landing page and assets served from `landing/`.

## Related pages

- [Backend API surface](../architecture/backend-api-surface.md) — the code-level companion.
- [Auth & OAuth](auth.md) — the REST session routes in detail.
- [Connections](connections.md) — the first router to call through this shared layer.
