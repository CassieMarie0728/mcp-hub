---
title: Auth & OAuth API
description: "The auth and oauth tRPC routers plus the REST OAuth/session routes — who you are, session lifecycle, and the GitHub/Slack/Notion OAuth flow."
tags:
  - wiki
  - api
  - trpc
  - auth
  - oauth
---

> Audience: developers & contributors | Status: living document | Last verified: 2026-08-06

This page documents everything authentication-related the server exposes: the `auth` router (inline in `server/routers.ts`), the `oauth` router (`server/auth/oauth-router.ts`), and the REST OAuth/session routes (`server/_core/oauth.ts`). The concept behind the guards and tokens lives in [Auth & sessions](../architecture/auth-session.md).

## Router `auth` (inline in `server/routers.ts`)

The `auth` router is composed inline — there is no separate `auth-router.ts`. It holds two procedures, both **public** (the session is already resolved by the time the procedure body runs, via `createContext`).

### `me` — query

No input. Returns `ctx.user` — the resolved user object — or `null` when there is no session.

### `logout` — mutation

No input. Clears the session cookie (`COOKIE_NAME`) with the domain-aware options from `getSessionCookieOptions(ctx.req)`. Returns `{ success: true }`.

> The tRPC `logout` clears the cookie on the same origin that called it. The REST `POST /api/auth/logout` (below) behaves the same way.

## Router `oauth` (`server/auth/oauth-router.ts`)

OAuth flow for the built-in server presets. `ServerTypeEnum = z.enum(['github', 'slack', 'notion'])` — every input takes one of these three.

### `getAuthorizationUrl` — query, **public**

Input `{ serverType: ServerTypeEnum, serverId: string }`. Generates the provider authorization URL via `OAuthManager.generateAuthorizationUrl` and returns `{ url, state, serverType }`. The `state` is the CSRF token the client must echo back in `exchangeCode`.

### `exchangeCode` — mutation, **public**

Input `{ serverType, code, state }`. Verifies the `state` (`OAuthManager.verifyState` — throws `'Invalid or expired state token'` if invalid), exchanges the code for tokens, and returns `{ success: true, token: { accessToken, tokenType, expiresAt }, serverId }`.

### `refreshToken` — mutation, **protected**

Input `{ serverType, refreshToken }`. Exchanges the refresh token for a fresh access token. Returns `{ success: true, token: { accessToken, tokenType, expiresAt } }`.

### `revokeToken` — mutation, **protected**

Input `{ serverType, token }`. Revokes the token at the provider. Returns `{ success }`.

### `checkTokenStatus` — query, **public**

Input `{ expiresAt?: Date }`. Pure helper (no provider call): returns `{ needsRefresh, isExpired, expiresIn }` — `needsRefresh` is true when the token expires within the next 5 minutes (300000 ms). With no `expiresAt`, returns `{ needsRefresh: false, isExpired: false }`.

> [!WARNING]
> The `oauth` procedures wrap failures in `throw new Error(...)` (surfacing as `INTERNAL_SERVER_ERROR`) rather than returning `success: false` objects — unlike `mcp`/`mcpServers`. Treat a non-2xx response from these as a hard failure.

## REST routes (`server/_core/oauth.ts`)

Registered via `registerOAuthRoutes(app)` in `server/_core/index.ts`. These are the browser/native entry points for the OAuth dance; the tRPC `oauth` procedures are for programmatic use.

### `GET /api/oauth/callback`

Web OAuth callback. Requires query params `code` and `state` (400 otherwise). Exchanges the code, looks up the user, upserts them, creates a session token (expires in 1 year), sets the `COOKIE_NAME` cookie, and **redirects (302)** to the frontend URL — `EXPO_WEB_PREVIEW_URL` → `EXPO_PACKAGER_PROXY_URL` → `http://localhost:8081`. On failure, returns 500 `{ error: 'OAuth callback failed' }`.

### `GET /api/oauth/mobile`

Native OAuth exchange. Same input and user sync, but returns JSON instead of a redirect: `{ app_session_id, user }` and sets the cookie as well. On failure, 500 `{ error: 'OAuth mobile exchange failed' }`.

### `POST /api/auth/logout`

Clears the session cookie. Returns `{ success: true }`.

### `GET /api/auth/me`

Works with **both** cookie (web) and `Authorization: Bearer` (mobile) auth via `sdk.authenticateRequest`. Returns `{ user }` (user built by `buildUserResponse`), or 401 `{ error: 'Not authenticated', user: null }`.

### `POST /api/auth/session`

Establishes a session cookie **from a Bearer token**. Authenticates via the `Authorization: Bearer` header, then sets the same token as the session cookie. Returns `{ success: true, user }`, or 400 when the header is missing/malformed and 401 when the token is invalid. This is what the iframe preview uses to convert a postMessage-delivered token into a cookie.

## Related pages

- [Auth & sessions](../architecture/auth-session.md) — the cookie/token model and how `getSessionCookieOptions` derives the domain.
- [Connections](connections.md) — `mcpServers.validateToken` / `registerRealServer`, the preset flow this OAuth pair serves.
- [Tokens](tokens.md) — storage for tokens obtained outside OAuth.
- [System](system.md) — the REST layer and rate limits these routes share.
