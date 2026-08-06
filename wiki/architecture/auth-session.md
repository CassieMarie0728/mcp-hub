---
title: Auth & Sessions
description: "How MCP Hub authenticates users: OAuth login, session JWTs, bearer tokens, roles (user/admin), and the tRPC procedure guards."
tags:
  - architecture
  - auth
  - sessions
  - security
---

> Audience: developers & contributors | Status: Beta | Last verified: 2026-08-06

This page documents the authentication and authorization pipeline end to end: OAuth login, session creation, the tRPC guards, and the two roles.

## The players

| Piece | File | Job |
| --- | --- | --- |
| Session SDK | `server/_core/sdk.ts` | Signs/verifies session JWTs (jose) and calls the OAuth server. |
| Context factory | `server/_core/context.ts` | Builds `TrpcContext { req, res, user }` for every request. |
| Procedure guards | `server/_core/trpc.ts` | `publicProcedure`, `protectedProcedure`, `adminProcedure`. |
| Auth router | `server/auth/auth-router.ts` | Login, session, user info procedures. |
| OAuth router | `server/auth/oauth-router.ts` | OAuth authorization URL, code exchange, status, disconnect. |
| OAuth manager | `server/auth/oauth-manager.ts` | CSRF `state` generation + in-memory store. |
| Client token storage | `lib/_core/auth.ts` | `SecureStore` for the session token. |

## Login flow (OAuth, Beta)

1. The client calls `oauth.getAuthorizationUrl`, which returns a `{ url, state }` pair. The `state` is a `crypto.randomBytes(32).toString('hex')` CSRF token stored in an in-memory `oauthStateStore` with a **10-minute expiry** (`Date.now() + 600000`).
2. The user completes the provider flow in a browser/WebView and is redirected back to the hub's callback with the authorization `code`.
3. The client calls `oauth.exchangeCode`, passing the code **and** the stored state. The router verifies the state matches (`verifyState`) before exchanging the code for tokens with the OAuth server.
4. `sdk.authenticateRequest` resolves the session on subsequent requests.

> [!IMPORTANT]
> The OAuth state store is **in-memory**: it dies with the process and cannot be shared across multiple server instances. The comment in `oauth-manager.ts` notes it "would be replaced with database." See [Data model](data-model.md).

## Session token

The exchange produces a session JWT (signed with `JWT_SECRET` via jose) that the client stores in `SecureStore` under `SESSION_TOKEN_KEY` (`lib/_core/auth.ts`). Every authenticated tRPC request attaches it as a bearer token; the tRPC client reads it through the bearer-token link described on [Frontend interface](frontend-interface.md).

The OAuth server paths the SDK talks to are under `webdev.v1.WebDevAuthPublicService/`: `ExchangeToken`, `GetUserInfo`, `GetUserInfoWithJwt`.

## Procedure guards

Defined in `server/_core/trpc.ts`:

| Procedure | Requires | Error on failure |
| --- | --- | --- |
| `publicProcedure` | nothing | — |
| `protectedProcedure` | valid session (`user`) | `UNAUTHORIZED` / `10001` |
| `adminProcedure` | `user.role === 'admin'` | `FORBIDDEN` / `10002` |

Example wiring: `server/_core/systemRouter.ts` exposes `health` on `publicProcedure` (input: timestamp) and `notifyOwner` on `adminProcedure`.

## Roles

The `users` table carries a `role` enum of `'user' | 'admin'` (default `user`). `server/db.ts` `upsertUser` **auto-promotes** any user whose `openId` equals `OWNER_OPEN_ID` to admin on login. That env var is effectively the bootstrap-admin mechanism — see [Environment variables](../install-and-configure/environment-variables.md).

## Other authenticated surfaces

- **Tokens** (`server/tokens/`): long-lived API bearer tokens created through the token router, stored (encrypted, AES-256-GCM) in memory. See [Token management](../user-guide/token-management.md).
- **Extended MCP router** (`server/mcp/mcp-router-extended.ts`): all procedures are `protectedProcedure`.
- **Webhooks** (`server/webhooks/`): webhook creation is authenticated; the *outgoing* webhook payloads are signed with HMAC, not tied to a user session. See [Webhooks](../user-guide/webhooks.md).

## Security notes

- Session JWT: `JWT_SECRET` env var (required in production); jose HS256 signing.
- CSRF protection on OAuth: 32-byte random state, 10-minute expiry.
- Secrets redaction on MCP server configs (`redactServerConfig`).
- Token encryption: AES-256-GCM, key from `TOKEN_ENCRYPTION_KEY` or a fresh random 32-byte key (which means tokens are undecryptable after restart — in-memory store, ephemeral key).
- Rate limiters (auth-specific) guard brute force; see [Backend API surface](backend-api-surface.md).

## Related pages

- [Integrations & OAuth](../user-guide/integrations-oauth.md) — the user-facing login/setup guide.
- [Environment variables](../install-and-configure/environment-variables.md) — `JWT_SECRET`, `OWNER_OPEN_ID`, `OAUTH_SERVER_URL`, `TOKEN_ENCRYPTION_KEY`.
- [Data model](data-model.md) — the `users` table and the role column.
- [Backend API surface](backend-api-surface.md) — the full `auth` and `oauth` router procedures.
