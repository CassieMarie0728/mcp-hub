---
title: Repository Map
description: "Top-level map of the mcp-hub monorepo: server, app, lib, drizzle, tests, landing, and the wiki."
tags:
  - architecture
  - repository
---

> Audience: developers & contributors | Last verified: 2026-08-06

This page maps every top-level directory and names the files you will reach for most. It complements [Overview](overview.md) (how the pieces fit) and [Backend API surface](backend-api-surface.md) (what the server exposes).

## Top-level layout

```text
mcp-hub/
├── server/        # Backend: Express + tRPC, all business logic
├── app/           # Expo Router app screens (React Native)
├── lib/           # Shared client libraries, hooks, engines, services
├── drizzle/       # Drizzle ORM schema + migrations
├── tests/         # End-to-end / security test suites (vitest)
├── __tests__/     # Root test suites (older feature suites)
├── lib/__tests__/ # Unit tests for client libraries
├── scripts/       # Build/dev helper scripts
├── landing/       # Marketing/demo landing pages (static HTML)
├── wiki/          # This documentation (OpenKnowledge)
└── public/        # Static assets served by the app
```

## Server (`server/`)

| Path | What it is | Wired into `appRouter`? |
| --- | --- | --- |
| `routers.ts` | Composes `appRouter` from the 10 feature routers | Yes |
| `_core/` | Express bootstrap, tRPC core, context, session SDK, env, rate limiters, system router | Yes |
| `auth/` | Login + OAuth routers, OAuth state manager | Yes (`auth`, `oauth`) |
| `mcp/` | MCP server manager, router, extended router, registry, GitHub/Slack/Notion presets | Yes (`mcp`, `mcpServers`) |
| `tokens/` | Token manager + router (encrypted API tokens) | Yes (`tokens`) |
| `webhooks/` | Webhook manager + router (HMAC-signed) | Yes (`webhooks`) |
| `analytics/` | Analytics router (execution stats) | Yes (`analytics`) |
| `procedures/` | Workflows router + template search | Yes (`workflows`, `templates`) |
| `templates/` | Template listing/clone procedures | Yes (`templates`) |
| `macros/` | Macro + workflow engines (advanced logic) | **No** — standalone engines |
| `db.ts` | Lazy MySQL connection, `upsertUser` with admin promotion | Yes (via auth) |
| `storage.ts` | (present) | — |
| `experimental/`, `feature-modules/`, `plugins/` (if present) | Planned/disabled modules | **No** |

> [!NOTE]
> Several server folders implement logic that is **not** exposed through `appRouter` (e.g. the macro engines). They are exercised by unit tests today; there is no `macros` tRPC router. When a feature claims a router, the router table above is the source of truth.

## Core server files you will edit most

- `server/_core/index.ts` — port, CORS, rate limiters, middleware mount.
- `server/_core/trpc.ts` — the three procedures and error codes.
- `server/_core/context.ts` + `sdk.ts` — session resolution.
- `server/routers.ts` — add a router here to expose it.

## App (`app/`)

Expo Router screen files. High-traffic screens:

- `index` — landing/home tab
- `mcp-servers`, `servers`, `add-server` — server management
- `tool-discovery`, `tool-execution` — tool workflow
- `macro-*`, `workflow-templates` — automation
- `token-management`, `webhooks`, `analytics-dashboard`, `admin-dashboard` — ops screens
- `_layout.tsx` — root navigator

> [!WARNING]
> `app/_disabled/` contains **22 screens** for planned features (governance, macro-debugger, notifications-center, performance-profiler, and more). They are intentionally not wired into navigation. Do not assume a feature exists just because a screen file is present — check the [feature tour](../start-here/feature-tour.md) page.

## Client libraries (`lib/`)

- `trpc.ts` — tRPC client factory (`httpBatchLink` to `/api/trpc`, superjson, bearer token).
- `http-client.ts` — native fetch wrapper (axios-compatible surface).
- `mcp-client.ts` — the JSON-RPC 2.0 MCP client.
- `types.ts`, `models/` — shared types and data models.
- `hooks/` — `useMCPServerConnection`, `useToolDiscovery`, `useToolExecution`, `useExecutionHistory`.
- `engines/` — `MacroChainingEngine`, `MacroExecutionEngine`, `MacroSchedulingEngine`, `MacroSharingEngine`.
- `services/` — `server-connection-service`, `tool-execution-service`.
- `_core/auth.ts` — `SecureStore` session-token helpers.

## Data layer (`drizzle/`, `server/db.ts`)

- `drizzle/schema.ts` — the single `users` table (see [Data model](data-model.md)).
- `server/db.ts` — lazy `getDb()`, `upsertUser` (auto-admin via `OWNER_OPEN_ID`).

## Tests

- `tests/` — security & integration suites (`router-security`, `mcp-security`, `auth.logout`, `ai-security`, `extended-router-security`).
- `__tests__/` — 26 feature suites (macros, workflows, OAuth flow, load testing, presets, versioning, …).
- `lib/__tests__/` — unit tests for `http-client`, `mcp-client`, services, and app features.

See [Testing](testing.md) for what the suites actually verify and how to run them.

## Static & marketing

- `landing/` — static HTML demo pages (`index.html`, `demo-features.html`, `demo-execution-simulator.html`, `demo-workflow-builder.html`).
- `scripts/` — helpers such as the env loader used by `app.config.ts`.

## Related pages

- [Overview](overview.md) — the system anatomy.
- [Data model](data-model.md) — persistence reality.
- [Testing](testing.md) — suite layout and commands.
- [Frontend interface](frontend-interface.md) — how `app/` + `lib/` talk to the server.
