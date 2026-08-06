---
description: "Ten-minute path: clone, configure, run backend + app, sign in, connect a server, run a tool."
tags:
  - quickstart
  - setup
  - mcp
title: Quickstart
---
> [!NOTE] Status
> **Stable** (verified 2026-08-06 on commit `0691562`; `pnpm check` passes)

| Field | Value |
| --- | --- |
| Purpose | Get MCP Hub running locally and connect your first MCP server in about ten minutes. |
| Audience | First-time users and evaluators. |
| Source paths | `package.json`, `.env.example`, `server/_core/index.ts` |
| Prerequisites | [Requirements](./requirements.md) — Node 20+, pnpm 9.12.0 via Corepack |
| Next | [Connect a server](../user-guide/server-connections.md) → [Discover tools](../user-guide/tool-discovery.md) |

Each step links to the page that goes deeper. For the details, follow the links; for the fast path, run the commands.

## 1. Get the code and dependencies

```bash
git clone https://github.com/CassieMarie0728/mcp-hub.git
cd mcp-hub
corepack enable
corepack pnpm install
```

On Windows PowerShell the `cd` line is the same; everything after it is pnpm, so it works cross-platform.

## 2. Configure the environment

```bash
cp .env.example .env
```

Then edit `.env` and set at least:

| Variable | Purpose |
| --- | --- |
| `JWT_SECRET` | Signs the session JWT (cookie `app_session_id`). |
| `OAUTH_SERVER_URL` | The identity provider used for sign-in (Manus WebDev). |
| `OWNER_OPEN_ID` | The OpenID that is auto-promoted to the `admin` role. |
| `DATABASE_URL` | Optional locally — `mysql://user:password@localhost:3306/mcp_hub`. Without it, auth still works but users are not persisted. |

See [Environment variables](../install-and-configure/environment-variables.md) for the complete reference.

## 3. Start the backend

```bash
pnpm dev:server
```

Listens on `http://localhost:3000` (override with `PORT`). Health check:

```bash
curl http://localhost:3000/api/health
```

## 4. Start the app

In a second terminal:

```bash
pnpm dev:metro
```

Opens Expo web at `http://localhost:8081` (override with `EXPO_PORT`). For a physical device, run `pnpm qr` and scan the code with Expo Go.

## 5. Sign in

Follow the in-app sign-in to the identity provider. Success sets the `app_session_id` cookie; the **Hub** tab shows who you are.

## 6. Connect a server

Go to **Servers** → **Add server**. Either pick a preset (GitHub / Slack / Notion — see [Integrations & OAuth](../user-guide/integrations-oauth.md)) or enter a custom HTTP MCP server URL. The hub handshakes over JSON-RPC and lists the server as connected.

## 7. Discover and run a tool

Open **Tools** (`tool-discovery` → `tool-detail`) and pick a tool like `create_issue`. Fill the argument form and run it from `tool-execution`; the outcome lands in **Results**.

## 8. Verify the install

```bash
corepack pnpm check   # tsc --noEmit — passes on 0691562
corepack pnpm lint
corepack pnpm test    # vitest run
```

See [Testing strategy](../contribute/testing-strategy.md) for what the suite covers and how it is configured.

> **Next:** [Connect a server](../user-guide/server-connections.md)