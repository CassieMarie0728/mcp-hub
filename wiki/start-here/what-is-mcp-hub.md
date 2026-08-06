---
title: What is MCP Hub?
description: A mobile-first hub for connecting to MCP servers, discovering and running their tools, and automating them with macros and workflows.
tags:
  - overview
  - mcp
  - intro
---
> [!NOTE] Status
> **Stable** (core identity) · Last verified 2026-08-06 · Commit `0691562` on `main`

| Field | Value |
| --- | --- |
| Purpose | Explain what MCP Hub is, what it does today, and where its boundaries are. |
| Audience | Anyone new to the project. |
| Source paths | `package.json`, `app.config.ts`, `server/routers.ts`, `app/(tabs)/` |
| Prerequisites | None — start here. |
| Next | [MCP in plain English](./mcp-in-plain-english.md) → [Quickstart](./quickstart.md) |

**MCP Hub** is a mobile-first application (Expo + React Native) with a Node.js backend that acts as a **hub for MCP servers**: it connects to Model Context Protocol (MCP) servers, discovers the tools they expose, and lets you run those tools — then automate them with macros and workflows.

## What it does today

| Capability | Status | Where it lives |
| --- | --- | --- |
| Connect to MCP servers over HTTP | Stable | `app/(tabs)/servers`, `app/(tabs)/mcp-servers` |
| Discover and browse server tools | Stable | `app/(tabs)/tool-discovery`, `app/(tabs)/tool-browser` |
| Execute tools and view results | Stable | `app/(tabs)/tool-execution`, `app/(tabs)/results` |
| Preset GitHub / Slack / Notion servers + OAuth | Beta | `server/mcp/servers/*`, `server/auth/` |
| Macros (saved tool sequences) | Experimental | `app/(tabs)/macro-builder`, `lib/engines/MacroExecutionEngine.ts` |
| Workflows and templates | Experimental | `app/(tabs)/workflow-templates`, `server/procedures/workflows.ts` |
| Webhooks, tokens, analytics | Experimental | `server/webhooks/`, `server/tokens/`, `server/analytics/` |

## What it is not

- **Not a managed MCP cloud.** Server connections are stored in memory (`server/mcp/mcp-server-manager.ts`) — restarting the backend drops them.
- **Not multi-tenant yet.** Sign-in is through one identity provider (Manus WebDev OAuth); roles are `user` / `admin` on the `users` table, and `OWNER_OPEN_ID` auto-promotes the owner to admin.
- **Not fully persistent.** Macros, workflows, webhooks, and analytics live in in-memory stores; only `users` is a real table (`drizzle/schema.ts`).
- **Not a shipping room of every screen.** More than 20 screens in `app/_disabled/` (governance, notifications, macro marketplace, …) are **disabled**, not broken — see the [feature tour](./feature-tour.md).

## How the pieces fit

```text
Expo app (React Native) ──tRPC──▶ server/routers.ts ──▶ MCP server manager ──▶ remote MCP servers
        │                     (10 routers)               (JSON-RPC 2.0 / HTTP)
        └──REST──▶ /api/health · /api/oauth/* · /api/auth/* · /api/ai/*
```

- The client talks to the backend over **tRPC** (`server/routers.ts`, 10 routers).
- The backend talks to remote MCP servers over **JSON-RPC 2.0 (HTTP)** using protocol version `2024-11-25` (`lib/mcp-client.ts`).
- Auth is a session cookie (`app_session_id`) backed by a JWT issued through the Manus WebDev SDK (`server/_core/sdk.ts`).

## Project identity

- Product name **MCP Hub** (`app.config.ts`); the npm package is still named `app-template` at version `1.0.0`.
- Repository `github.com/CassieMarie0728/mcp-hub`; this wiki documents commit `0691562` on `main`.
- Stack: Expo ~54, React Native 0.81.5, tRPC 11, Express 4, Drizzle ORM 0.45 + MySQL, Socket.IO 4, Zod 4, Vitest 4. Full versions in [Requirements](./requirements.md).

> **Next:** [MCP in plain English](./mcp-in-plain-english.md)