---
title: Secrets Handling
description: How MCP Hub stores, encrypts, redacts, and injects secrets - the .env contract, redaction rules, token encryption, and the operator checklist.
tags:
  - wiki
  - security
  - secrets
---

> Audience: developers, operators | Status: living document | Last verified: 2026-08-06

This page is the deep dive on secrets in MCP Hub: which secrets exist, where they are read from, how they are kept out of API responses, how long-lived tokens are encrypted, and how containers get them. The one-paragraph model lives on [Security & Governance](index.md); [Auth & Sessions](../architecture/auth-session.md) covers session JWTs; [Token management](../user-guide/token-management.md) covers the user-facing token screens.

## The environment contract

All secrets enter through environment variables. `.env.example` ships placeholders only; a real `.env` is git-ignored. The variables with real security weight:

| Variable | What it protects | Set by default? |
| --- | --- | --- |
| `JWT_SECRET` | Session JWT signing (HS256) | Required in production |
| `COOKIE_SECRET` | Session cookie signing | Optional at boot |
| `DATABASE_URL` | MySQL connection | Optional; only `users` uses the DB |
| `OAUTH_SERVER_URL` | OAuth server the SDK talks to | Required for OAuth login |
| `OWNER_OPEN_ID` | Bootstrap-admin promotion | Optional; matching `openId` becomes admin |
| `TOKEN_ENCRYPTION_KEY` | AES-256-GCM key for long-lived tokens | Optional; fresh random key per boot if unset |
| `MCP_SERVER_URL` | Default MCP endpoint | Optional |
| `OPENAI_API_KEY` | Optional AI-assisted features | Optional |

Full list with defaults and validation: [Environment variables](../install-and-configure/environment-variables.md).

## Rules that hold everywhere

1. **Never commit real credentials.** `.env` is git-ignored; `.env.example` ships placeholders only.
2. **Secrets stay out of MCP responses.** `redactServerConfig` masks bearer tokens, passwords, and any header whose name contains `secret`, `token`, or `password` (or is `authorization`/`x-api-key`) before a server config reaches the client ([MCP integration](../architecture/mcp-integration.md)).
3. **Token encryption keys are ephemeral unless pinned.** See below.
4. **Containers get secrets from a `Secret`** (`envFrom.secretRef` in `kubernetes/deployment.yaml`); `docker-compose.yml` reads `.env`. Review both before deploying ([Deployment overview](../operate/deployment-overview.md)).

## Redaction: how server configs are scrubbed

`server/mcp/mcp-router.ts` validates configs against `MCPServerConfigSchema` before storing them. On every read, `redactServerConfig` walks the config and masks credential fields before the value returns to the client - the UI never receives the stored `headers`/`auth` values, and registration responses are scrubbed the same way.

Config shape and the full registration flow: [MCP integration](../architecture/mcp-integration.md).

## Token encryption: AES-256-GCM

Long-lived API tokens (created through the token router) are encrypted with AES-256-GCM. The key comes from `TOKEN_ENCRYPTION_KEY` if set; otherwise a fresh random 32-byte key is generated at startup and lives only in memory. Consequences:

- Set `TOKEN_ENCRYPTION_KEY` before deploying, or tokens created before a restart become undecryptable garbage on reboot.
- The token store itself is in-memory - a restart loses the tokens regardless ([Data model](../architecture/data-model.md)).

User-facing flows: [Token management](../user-guide/token-management.md).

## Session JWTs

Sessions are HS256 JWTs signed with `JWT_SECRET` (jose). They are issued after the OAuth code exchange and stored client-side in `SecureStore` under `SESSION_TOKEN_KEY`; the tRPC client attaches them as bearer tokens on every request. `JWT_SECRET` is required in production.

The OAuth flow, CSRF `state`, and guards: [Auth & Sessions](../architecture/auth-session.md).

## Containers and the edge

- The shipped `kubernetes/deployment.yaml` injects env from a `Secret` (`envFrom.secretRef`); `docker-compose.yml` reads `.env` at the project root.
- The app and `nginx.conf` do **not** terminate TLS - HTTPS must come from the ingress/platform edge ([Reverse proxy](../operate/reverse-proxy.md)).

## Operator checklist

- Set `JWT_SECRET` and `TOKEN_ENCRYPTION_KEY` in production.
- Keep `OWNER_OPEN_ID` set to a value only you control - it auto-promotes that user to admin on login.
- Terminate TLS at the edge; the app does not do it for you.
- Rotate secrets through the platform (env or K8s `Secret`), never by editing `.env.example`.
- Only connect MCP servers you trust - redaction limits leakage but cannot stop a hostile server.

## Related pages

- [Security & Governance](index.md) - the section hub and threat model.
- [Environment variables](../install-and-configure/environment-variables.md) - every variable, defaults, validation.
- [Auth & Sessions](../architecture/auth-session.md) - session JWT + OAuth state.
- [Data model](../architecture/data-model.md) - why the token store is in-memory.
- [Token management](../user-guide/token-management.md) - user-facing token flows.
- [Vulnerability reporting](vulnerability-reporting.md) - where to report a flaw in this model.
