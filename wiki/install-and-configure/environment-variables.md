---
title: Environment Variables
description: "Every environment variable MCP Hub reads — core runtime, database, auth, OAuth providers, tokens, webhooks — and the .env.example contract."
tags:
  - install
  - configuration
  - env
---
> [!NOTE] Status
> **Stable** (documented from code reads, not just `.env.example`) · Last verified 2026-08-06 · Commit `0691562`

| Field | Value |
| --- | --- |
| Purpose | The full configuration surface for the API server and client. |
| Audience | Developers, operators, self-hosters. |
| Source paths | `.env.example`, `server/_core/env.ts`, `server/_core/sdk.ts`, `server/_core/llm.ts`, `server/auth/oauth-manager.ts`, `server/tokens/token-manager.ts`, `server/webhooks/webhook-manager.ts`, `constants/oauth.ts` |
| Prerequisites | [Local development](local-development.md) |
| Next | [Database](database.md), [Docker & Kubernetes](docker.md) |

## How config is loaded

- The API server loads `.env` via `dotenv/config` at `server/_core/index.ts`; values are read at process start, so **restart the server after changing `.env`**.
- The Expo config loads `.env` through `scripts/load-env.js` before reading `EXPO_PUBLIC_*` values.
- `server/_core/env.ts` is the typed hub for the backend reads (`ENV` object).

## Core runtime

| Variable | Default | Read in | Notes |
| --- | --- | --- | --- |
| `NODE_ENV` | `development` | `server/_core/index.ts`, `server/_core/env.ts` | `production` enables HSTS headers and the `start` script. |
| `PORT` | `3000` | `server/_core/index.ts` | Falls back to the next free port up to `3019` if busy. |
| `EXPO_PORT` | `8081` | `package.json` (`dev:metro`) | Web/dev client port. |
| `DATABASE_URL` | *(empty)* | `server/db.ts`, `drizzle.config.ts` | MySQL URL, e.g. `mysql://user:password@localhost:3306/mcp_hub`. Unset → server runs with no DB. |
| `JWT_SECRET` | `change-me` | `server/_core/env.ts` → `ENV.cookieSecret` | Signs/verifies session JWTs (jose). **Change it in production.** |
| `VITE_APP_ID` | *(empty)* | `server/_core/env.ts` → `ENV.appId` | Read into `ENV.appId`; no consumer found in this audit. |
| `OAUTH_SERVER_URL` | *(empty)* | `server/_core/env.ts`, `server/_core/sdk.ts` | OAuth server base; SDK logs an error if unset when used. |
| `OWNER_OPEN_ID` | *(empty)* | `server/_core/env.ts` → `ENV.ownerOpenId` | A user with this `openId` is auto-promoted to `admin` on upsert (`server/db.ts`). |
| `BUILT_IN_FORGE_API_URL` | *(empty)* | `server/_core/env.ts` → `ENV.forgeApiUrl` | Built-in Forge preset base URL. |
| `BUILT_IN_FORGE_API_KEY` | *(empty)* | `server/_core/env.ts` → `ENV.forgeApiKey` | Built-in Forge preset key. |
| `OPENAI_API_KEY` | *(empty)* | `server/_core/llm.ts` | AI-assisted features throw if this is unset when called. |
| `WEBHOOK_BASE_URL` | `https://api.mcphub.io` | `server/webhooks/webhook-manager.ts` | Prefix for public webhook URLs (`…/webhooks/{id}`). |
| `TOKEN_ENCRYPTION_KEY` | *(random per boot)* | `server/tokens/token-manager.ts` | AES-256-GCM key for stored tokens. **Set a stable 64-hex value**, else every restart makes stored tokens unreadable. |

> [!WARNING]
> Two variables in `.env.example` are **declared but never read by code**: `COOKIE_SECRET` and `MCP_SERVER_URL`. The real cookie/session secret is `JWT_SECRET`. They are kept for compatibility with earlier docs; setting them changes nothing today.

## OAuth providers

All three live in `server/auth/oauth-manager.ts`; defaults point at the local API.

<details>
<summary>OAuth provider variables</summary>

| Variable | Default redirect | Used for |
| --- | --- | --- |
| `GITHUB_OAUTH_CLIENT_ID` / `GITHUB_OAUTH_CLIENT_SECRET` | `http://localhost:3000/oauth/github/callback` | GitHub preset + OAuth |
| `SLACK_OAUTH_CLIENT_ID` / `SLACK_OAUTH_CLIENT_SECRET` | `http://localhost:3000/oauth/slack/callback` | Slack preset + OAuth |
| `NOTION_OAUTH_CLIENT_ID` / `NOTION_OAUTH_CLIENT_SECRET` | `http://localhost:3000/oauth/notion/callback` | Notion preset + OAuth |

</details>

Redirect URI overrides: `GITHUB_OAUTH_REDIRECT_URI`, `SLACK_OAUTH_REDIRECT_URI`, `NOTION_OAUTH_REDIRECT_URI`. See [Integrations & OAuth](../user-guide/integrations-oauth.md) for the flows.

## Client (`EXPO_PUBLIC_*`) and CORS

<details>
<summary>Client (EXPO_PUBLIC_*) and CORS variables</summary>

| Variable | Read in | Notes |
| --- | --- | --- |
| `EXPO_PUBLIC_OAUTH_SERVER_URL` | `constants/oauth.ts` | Client-side OAuth server URL. |
| `EXPO_PUBLIC_OWNER_OPEN_ID` | `constants/oauth.ts` | Client-side owner id. |
| `EXPO_WEB_PREVIEW_URL` | `server/_core/index.ts` | Added to the CORS allowlist when set. |
| `EXPO_PACKAGER_PROXY_URL` | `server/_core/index.ts` | Added to the CORS allowlist when set. |

</details>

The server always allowlists `http://localhost:8081` and `http://localhost:3000`.

## Secrets checklist

- Set a strong `JWT_SECRET` and a stable `TOKEN_ENCRYPTION_KEY` before production.
- Keep OAuth client secrets, `JWT_SECRET`, and `DATABASE_URL` out of git (`.env` is ignored).
- In Kubernetes, feed env via the `mcp-hub-env` secret ([Docker & Kubernetes](docker.md)).

> **Next:** [Database](database.md) · [Docker & Kubernetes](docker.md)
