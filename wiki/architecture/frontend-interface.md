---
title: Frontend Interface
description: "How the Expo client is organized and how it talks to the backend: Expo Router, tRPC client wiring, API base URL resolution, and the shared lib layer."
tags:
  - architecture
  - frontend
  - expo
  - trpc
---

> Audience: developers & contributors | Last verified: 2026-08-06

The client is an Expo (React Native) app built on **Expo Router** (file-based navigation). This page covers how it is organized and exactly how it reaches the backend.

## Screens (`app/`)

Routes are files under `app/`:

| Route | Purpose |
| --- | --- |
| `index` | Landing/home tab |
| `mcp-servers`, `servers`, `add-server` | Server management and registration |
| `tool-discovery`, `tool-execution` | Discover and run MCP tools |
| `macro-*`, `workflow-templates` | Automation authoring |
| `token-management`, `webhooks` | Long-lived tokens and webhook subscriptions |
| `analytics-dashboard`, `admin-dashboard` | Ops dashboards |
| `team-workspace` | Collaboration (disabled modules) |
| `_layout.tsx` | Root navigator |

> [!WARNING]
> `app/_disabled/` holds **22 screens** that are not wired into navigation (governance, macro-debugger, notifications-center, performance-profiler, …). Their presence does not mean the feature is shipped — see [Feature tour](../start-here/feature-tour.md).

## The shared library layer (`lib/`)

The `lib/` folder is where all non-screen client logic lives:

- **`trpc.ts`** — the tRPC client. It uses `httpBatchLink` pointing at `/api/trpc` with superjson configured inside the batch link, and attaches the bearer token from `lib/_core/auth.ts`.
- **`http-client.ts`** — a native-fetch HTTP client with an axios-compatible interface, used for non-tRPC HTTP calls.
- **`mcp-client.ts`** — the JSON-RPC 2.0 MCP client for direct tool interactions (see [MCP integration](mcp-integration.md)).
- **`hooks/`** — React hooks wrapping tRPC procedures: `useMCPServerConnection`, `useToolDiscovery`, `useToolExecution`, `useExecutionHistory`.
- **`engines/`** — macro and workflow engines: `MacroChainingEngine`, `MacroExecutionEngine`, `MacroSchedulingEngine`, `MacroSharingEngine`.
- **`services/`** — orchestration services: `server-connection-service`, `tool-execution-service`.
- **`_core/auth.ts`** — `SecureStore` helpers for the session token (`getSessionToken` / `setSessionToken` / `clearSessionToken`), reading keys from `constants/oauth.ts`.
- **`constants/oauth.ts`** — the OAuth environment block and API base URL resolution (see below).
- **`models/`** — shared data models (e.g. `Macro`).

## How a screen talks to the server

1. A screen calls a hook (e.g. `useToolExecution`) or the tRPC client directly.
2. `trpc.ts` serializes the request with superjson, batches it via `httpBatchLink`, and appends the bearer token.
3. The request hits `{API_BASE_URL}/api/trpc` on the server; Express routes it to the tRPC middleware (see [Backend API surface](backend-api-surface.md)).

## API base URL resolution

`getApiBaseUrl()` in `constants/oauth.ts` decides where the client sends requests, in this exact order:

1. **`EXPO_PUBLIC_API_BASE_URL`** (exported as `API_BASE_URL`) — if set, used verbatim with a trailing slash stripped.
2. **Web hostname derivation** — on web, the current hostname is rewritten from the Metro sandbox pattern `8081-…` to the API pattern `3000-…` (`https://3000-sandboxid.region.domain`).
3. **Relative fallback** — empty string, meaning the caller uses a relative URL (same origin).

So the same bundle works in dev (Metro on 8081 rewrites to 3000) and in the field (via `EXPO_PUBLIC_API_BASE_URL`). Native builds must set `EXPO_PUBLIC_API_BASE_URL`; there is no localhost derivation for them.

> [!NOTE]
> If you change where the server is hosted, set the appropriate env var — see [Environment variables](../install-and-configure/environment-variables.md) for `EXPO_PUBLIC_API_BASE_URL` and the OAuth-related `EXPO_PUBLIC_*` values.

## Auth on the client

- The session JWT from OAuth login lives in `SecureStore` (keys from `lib/constants/oauth.ts`).
- `lib/_core/auth.ts` is the single choke point for reading/writing it; `trpc.ts` reads it on every request.
- The logout flow clears the token; see [Integrations & OAuth](../user-guide/integrations-oauth.md) and [Auth & sessions](auth-session.md).

## Related pages

- [Overview](overview.md) — where the client fits in the system.
- [Backend API surface](backend-api-surface.md) — the endpoints the client calls.
- [Repository map](repository-map.md) — full `app/` and `lib/` file listing.
- [Feature tour](../start-here/feature-tour.md) — what the screens do for users.
