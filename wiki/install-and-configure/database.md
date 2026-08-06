---
title: Database
description: "MySQL + Drizzle setup for MCP Hub — lazy connection, the users table, and migration commands."
tags:
  - install
  - database
  - mysql
---
> [!NOTE] Status
> **Stable** (connection layer) · schema is **minimal** — one table · Last verified 2026-08-06 · Commit `0691562`

| Field | Value |
| --- | --- |
| Purpose | Persist users for the auth flow; the only DB-backed state today. |
| Audience | Developers, self-hosters. |
| Source paths | `server/db.ts`, `drizzle/schema.ts`, `drizzle.config.ts`, `package.json` (`db:push`) |
| Prerequisites | MySQL 8 running, `DATABASE_URL` set |
| Next | [Environment variables](environment-variables.md), [Docker & Kubernetes](docker.md) |

## Is the database required?

**No — the server boots without one.** `server/db.ts` lazily creates the Drizzle instance only when `DATABASE_URL` is set, and logs a warning otherwise. Everything MCP-related (server connections, tool discovery/execution, tokens, webhooks, analytics) lives **in memory** and works without MySQL. The database only matters for:

- persisting the `users` row behind OAuth login, and
- auto-promoting `OWNER_OPEN_ID` to `admin`.

> [!WARNING]
> Because nearly all state is in-memory, **restarting the backend drops your registered servers, tokens, and webhooks** — with or without a database. See [Known limitations](../user-guide/server-connections.md#known-limitations) and [Feature status](../project/feature-status.md) for what that means.

## Setup

```sql
CREATE DATABASE mcp_hub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then set in `.env`:

```bash
DATABASE_URL=mysql://user:password@localhost:3306/mcp_hub
```

The driver is `mysql2` (Drizzle ORM 0.45, dialect `mysql`).

## Schema

`drizzle/schema.ts` defines exactly one table, `users`:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `int` autoincrement PK | Surrogate key. |
| `openId` | `varchar(64)` unique not null | Manus/OAuth identifier from the callback. |
| `name` | `text` | Nullable. |
| `email` | `varchar(320)` | Nullable. |
| `loginMethod` | `varchar(64)` | Nullable. |
| `role` | `enum('user','admin')` default `user` | `OWNER_OPEN_ID` auto-set to `admin` on upsert. |
| `createdAt` / `updatedAt` / `lastSignedIn` | `timestamp` | Defaults on insert/update. |

`server/db.ts` exposes `getDb()` (lazy), `upsertUser()`, and `getUserByOpenId()`. The file notes future feature queries as the schema grows — other tables are **not** implemented.

## Migrations

```bash
corepack pnpm db:push
```

Runs `drizzle-kit generate` then `drizzle-kit migrate` (`package.json`). `drizzle.config.ts` requires `DATABASE_URL` to be set or the command fails loudly — it reads the env var, not `.env` values you may have only set for the server, so export it in the shell or keep `.env` loaded.

> [!NOTE]
> `drizzle-kit generate` writes migration SQL to `drizzle/`. Generated files must be reviewed and committed as part of a schema change (see [Development workflow](../contribute/development-workflow.md)).

## Next steps

- [Environment variables](environment-variables.md) — full config surface.
- [Docker & Kubernetes](docker.md) — note the compose file does **not** ship a MySQL service; bring your own.
