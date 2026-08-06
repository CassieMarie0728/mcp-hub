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
- **`models/`** — shared data models (e.g. `Macro`).

## How a screen talks to the server

1. A screen calls a hook (e.g. `useToolExecution`) or the tRPC client directly.
2. `trpc.ts` serializes the request with superjson, batches it via `httpBatchLink`, and appends the bearer token.
3. The request hits `{API_BASE_URL}/api/trpc` on the server; Express routes it to the tRPC middleware (see [Backend API surface](backend-api-surface.md)).

## API base URL resolution

The app must know where the server lives. Resolution is environment-driven, so the same bundle works in dev and in the field:

- The API base URL is resolved at runtime from the environment/config (Expo `extra`), with platform-aware defaults.
- When no server is reachable, screens degrade to offline modes (e.g. local-only server lists) rather than crashing.

> [!NOTE]
> The exact precedence order (Expo `extra` → platform default) is set in the app config and the API helper module. If you change where the server is hosted, update the deployment env vars described in [Installation overview](../install-and-configure/installation-overview.md), not the app source.

## Auth on the client

- The session JWT from OAuth login lives in `SecureStore` (keys from `lib/constants/oauth.ts`).
- `lib/_core/auth.ts` is the single choke point for reading/writing it; `trpc.ts` reads it on every request.
- The logout flow clears the token; see [Integrations & OAuth](../user-guide/integrations-oauth.md) and [Auth & sessions](auth-session.md).

## Related pages

- [Overview](overview.md) — where the client fits in the system.
- [Backend API surface](backend-api-surface.md) — the endpoints the client calls.
- [Repository map](repository-map.md) — full `app/` and `lib/` file listing.
- [Feature tour](../start-here/feature-tour.md) — what the screens do for users.
