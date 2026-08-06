---
title: Local Development
description: "Run the MCP Hub API and Expo client from a clean checkout — install, .env, scripts, and verification commands."
tags:
  - install
  - development
---
> [!NOTE] Status
> **Stable** (verified on Node 24.19.0 + corepack pnpm 9.12.0; install + `pnpm check` green) · Last verified 2026-08-06 · Commit `0691562`

| Field | Value |
| --- | --- |
| Purpose | Get the backend API and the Expo client running locally. |
| Audience | Developers. |
| Source paths | `package.json`, `server/_core/index.ts`, `.env.example`, `scripts/load-env.js` |
| Prerequisites | Node 20+, pnpm via corepack; see [Installation overview](./installation-overview.md) |
| Next | [Environment variables](./environment-variables.md), [Database](./database.md) |

## 1. Clone and install

```bash
git clone <your-fork-or-remote> mcp-hub
cd mcp-hub
corepack enable                       # activates the pinned pnpm from packageManager
corepack pnpm install                 # installs all dependencies
```

> [!TIP]
> This project is **pnpm-only**. It declares `packageManager: pnpm@9.12.0` and installs with a frozen lockfile in CI/Docker. The root `README.md` still mentions Yarn/npm and older versions — treat the code and `package.json` as truth, not the README. `pnpm` is not on PATH by default on Windows; always run it via `corepack pnpm …`.

## 2. Configure environment

```bash
cp .env.example .env
```

A bare copy works for local exploration — the server boots fine without a database. See [Environment variables](./environment-variables.md) for every knob, and [Database](./database.md) if you want user persistence.

## 3. Run the API server

```bash
corepack pnpm dev:server
```

This runs `node --loader tsx server/_core/index.ts`. You should see:

```text
[api] server listening on port 3000
[landing] available at http://localhost:3000
[rate-limiting] Global: 1000 req/15min | API: 100 req/1min
```

If port `3000` is busy the server scans up to `3019` and picks the next free port. Verify: `http://localhost:3000/api/health` returns `{ ok: true, … }`.

## 4. Run the Expo client (web)

```bash
corepack pnpm dev:metro
```

This runs `expo start --web` on port `EXPO_PORT` (default `8081`). The web client talks to the API on `localhost:3000`; the server CORS-allowlists `http://localhost:8081`.

## Scripts reference

| Script | Command (as declared) | Purpose |
| --- | --- | --- |
| `dev` | `pnpm dev:metro` | Alias for the Metro/web dev client. |
| `dev:server` | `NODE_ENV=development node --loader tsx server/_core/index.ts` | API server (tsx loader, no build step). |
| `dev:metro` | `EXPO_USE_METRO_WORKSPACE_ROOT=1 npx expo start --web --port ${EXPO_PORT:-8081}` | Expo web dev server. |
| `check` | `tsc --noEmit` | Type-check the whole workspace. |
| `lint` | `expo lint` | ESLint via Expo. |
| `test` | `vitest run` | Run the Vitest suite. |
| `format` | `prettier --write .` | Format everything. |
| `build` | `esbuild server/_core/index.ts … --outdir=dist` | Production bundle of the API. |
| `start` | `NODE_ENV=production node dist/index.js` | Run the built bundle. |
| `db:push` | `drizzle-kit generate && drizzle-kit migrate` | Generate + apply DB migrations ([Database](./database.md)). |
| `android` / `ios` | `expo run:android` / `expo run:ios` | Native builds ([Android](./android.md), [iOS & web](./ios-web.md)). |
| `qr` | `node scripts/generate_qr.mjs` | Generate a QR for the client. |
| `setup:github-pages` | `node scripts/setup-github-pages.js` (or `.sh`) | Static web hosting setup. |

## Verification

```bash
corepack pnpm check    # TypeScript, zero errors (verified green)
corepack pnpm lint     # ESLint
corepack pnpm test     # Vitest
```

> [!NOTE]
> `pnpm test` runs `lib/__tests__/**` and `tests/**`. The large root `__tests__/` tree is **excluded** by `vitest.config.ts`, so a green suite does not cover everything that lives there — see [Testing strategy](../contribute/testing-strategy.md) for the details.

## Next steps

- [Environment variables](./environment-variables.md) — configure OAuth, tokens, and integrations.
- [Database](./database.md) — turn on user persistence.
- [Docker & Kubernetes](./docker.md) — containerize what you just ran.
