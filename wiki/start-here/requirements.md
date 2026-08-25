---
title: Requirements
description: Runtime, toolchain, and environment requirements for running and developing MCP Hub.
tags:
  - setup
  - requirements
  - environment
---
> [!NOTE] Status
> **Stable** (verified 2026-08-06 against commit `0691562`) · Node v24.19.0, pnpm 9.12.0, corepack 0.35.0

| Field | Value |
| --- | --- |
| Purpose | What you need to run MCP Hub locally and to build it for devices. |
| Audience | Anyone installing or developing the project. |
| Source paths | `package.json`, `.env.example`, `server/_core/env.ts`, `Dockerfile`, `.github/workflows/ci.yml` |
| Prerequisites | [What is MCP Hub?](./what-is-mcp-hub.md) |
| Next | [Quickstart](./quickstart.md) |

## Runtime requirements

| Requirement | Version / value | Notes |
| --- | --- | --- |
| Node.js | 20+ (CI uses Node 20) | Verified locally on Node v24.19.0. |
| Package manager | pnpm 9.12.0 | Pinned in `packageManager` and enabled via Corepack (`corepack enable`). |
| MySQL | 8.x (optional for local dev) | Used to persist `users`. The DB layer is **lazy**: the server boots fine without `DATABASE_URL` and logs a warning instead of failing (`server/db.ts`). |
| Ports | 3000 (backend) · 8081 (Metro/Expo web) | `PORT` and `EXPO_PORT` env vars override them. |

## Verified local environment (2026-08-06)

- `corepack pnpm install` completes: 1,121 packages, ~3 minutes, exit 0.
- `corepack pnpm check` (`tsc --noEmit`) passes with zero errors.
- Tool versions seen: Node v24.19.0, Corepack 0.35.0, pnpm 9.12.0.

## Toolchain by task

| Task | Command |
| --- | --- |
| Backend dev server | `pnpm dev:server` (`node --loader tsx server/_core/index.ts`) |
| App / Metro | `pnpm dev:metro` (`npx expo start --web --port ${EXPO_PORT:-8081}`) |
| Type check | `pnpm check` |
| Lint | `pnpm lint` (`expo lint`) |
| Tests | `pnpm test` (`vitest run`) |
| Build server | `pnpm build` (esbuild → `dist/index.js`) |
| Run production build | `pnpm start` |
| DB migrate | `pnpm db:push` (`drizzle-kit generate && drizzle-kit migrate`) |
| Android / iOS native | `pnpm android` / `pnpm ios` |
| QR code for device pairing | `pnpm qr` |
| GitHub Pages setup | `pnpm setup:github-pages` |

## Environment variables

Copy `.env.example` to `.env`. Full reference (both what the example lists and what the code actually reads) is in [Environment variables](../install-and-configure/environment-variables.md). Minimum for a working login: `JWT_SECRET`, `OAUTH_SERVER_URL`, `OWNER_OPEN_ID`. The server also reads `DATABASE_URL`, `NODE_ENV`, `VITE_APP_ID`, `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`. `PORT` / `EXPO_PORT` control the two dev servers.

## Mobile build tools

- **Quickstart / web:** none — run `pnpm dev:metro` and open `http://localhost:8081` (or Expo Go on a phone via the QR code from `pnpm qr`).
- **Native Android:** Android Studio + SDK (needed for `pnpm android`).
- **Native iOS:** Xcode + CocoaPods (macOS only; `pnpm ios`).
- The app identifier is `space.manus.mcp.hub.t20260329022456` (`app.config.ts`).

## Deploying (not required for local dev)

Docker (`Dockerfile`, node:20-alpine) and Kubernetes manifests exist; see [Deployment overview](../operate/deployment-overview.md).

> **Next:** [Quickstart](./quickstart.md)
