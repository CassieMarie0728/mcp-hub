---
title: Installation Overview
description: "Prerequisites, runtime modes, and the parts of MCP Hub you install — API server, Expo client, landing page, and optional MySQL."
tags:
  - install
  - prerequisites
---
> [!NOTE] Status
> **Stable** (tooling verified on Node 24 + pnpm 9.12.0) · Last verified 2026-08-06 · Commit `0691562`

| Field | Value |
| --- | --- |
| Purpose | What you need before installing, and which pieces MCP Hub ships. |
| Audience | Developers, operators, self-hosters. |
| Source paths | `package.json`, `app.config.ts`, `server/_core/index.ts`, `Dockerfile`, `docker-compose.yml`, `kubernetes/*.yaml` |
| Prerequisites | Node 20+, pnpm via corepack, (optional) MySQL 8 |
| Next | [Local development](local-development.md) or [Docker & Kubernetes](docker.md) |

## What MCP Hub ships

A single pnpm workspace whose pieces all live in this repository:

| Piece | Path | Runs as |
| --- | --- | --- |
| Backend API | `server/` | Express + tRPC process (port `3000` by default). |
| Mobile/web client | `app/` + `lib/` | Expo (React Native) app for Android, iOS, and web. |
| Landing page | `landing/` | Static HTML/CSS served by the Express server at `/`. |
| Database | `drizzle/` schema + MySQL | Optional at boot; backs user persistence only today. |

There is no separate MCP server to install — MCP Hub **connects to** MCP servers over HTTP (see [MCP in plain English](../start-here/mcp-in-plain-english.md) and [Server connections](../user-guide/server-connections.md)).

## Runtime modes

| Mode | You run | Database | Notes |
| --- | --- | --- | --- |
| Local development | `pnpm dev:server` + `pnpm dev:metro` | Optional | Fastest way to explore; Metro serves the web client on port `8081`. |
| Self-hosted (container) | Docker / Kubernetes | Optional | Node 20-alpine image; env via `.env` file or a k8s secret. |
| Mobile builds | `pnpm android` / `pnpm ios` | Optional | Needs native toolchains (see [Android](android.md), [iOS & web](ios-web.md)). |

> [!WARNING]
> The backend keeps server configs, tokens, and webhooks **in memory**. Without MySQL you can connect servers and run tools, but restarts lose state. The database is required only if you want user/auth persistence — and it currently stores **only the `users` table** ([Database](database.md)).

## Prerequisites

| Requirement | Version | Verified |
| --- | --- | --- |
| Node.js | 20+ (CI), 24.x (local verify) | Yes |
| pnpm | 9.12.0 (via `corepack`) | Yes |
| MySQL | 8.x (only if you set `DATABASE_URL`) | Optional |
| Android toolchain | JDK 17 + Android SDK, minSdk 24 | Optional |
| Xcode | macOS only, for iOS builds | Optional |
| Docker | For container builds | Optional |

The exact package versions come from `package.json`: Expo ~54, React Native 0.81.5, React 19.1.0, Express 4.22, tRPC 11.17, Drizzle ORM 0.45, Vitest 4.1.

## Ports and endpoints

| Port | Used by | Purpose |
| --- | --- | --- |
| `3000` | Express API | Landing page, `/api/health`, `/api/trpc`, OAuth routes. Auto-falls back to the next free port up to 3019 if busy. |
| `8081` | Expo/Metro | Dev web client (`EXPO_PORT`). |

## Next steps

1. [Local development](local-development.md) — get a clean checkout running.
2. [Environment variables](environment-variables.md) — every config knob.
3. [Database](database.md) — enable user persistence.
4. [Docker & Kubernetes](../../install-and-configure/docker.md) — containerized self-hosting.
