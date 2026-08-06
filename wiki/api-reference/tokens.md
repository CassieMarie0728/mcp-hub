---
title: Tokens API
description: "The tokens tRPC router, procedure by procedure — store, inspect, revoke, and rotate provider tokens with scopes and expiry."
tags:
  - wiki
  - api
  - trpc
  - tokens
---

> Audience: developers & contributors | Status: living document | Last verified: 2026-08-06

The `tokens` router (`server/tokens/token-router.ts`) manages **stored provider tokens** — distinct from the OAuth session handled by the `oauth` router (see [Auth & OAuth](auth.md)). All procedures are **protected**. Backed by `TokenManager` (in-memory store, AES-256-GCM encryption); see [Data model](../architecture/data-model.md) for persistence caveats.

## Procedures

### `storeToken` — mutation

Input `{ serverId, serverType, name, token, expiresAt?: Date, scopes?: string[] }`. Stores a token and returns the stored record (typically including a masked view).

### `getTokenMetadata` — query

Input `{ tokenId }`. Returns the token's metadata (no raw secret) or `null`.

### `listServerTokens` — query

Input `{ serverId }`. Returns all tokens recorded for that server.

### `revokeToken` — mutation

Input `{ tokenId }`. Revokes the token.

### `rotateToken` — mutation

Input `{ tokenId, newToken }`. Replaces the stored value with the new token.

### `getExpiredTokens` — query

No input. Returns the tokens whose `expiresAt` has passed.

### `getTokenStats` — query

No input. Returns aggregate statistics over the token store.

### `validateScopes` — query

Input `{ tokenScopes?: string[], requiredScopes: string[] }`. Returns whether the token's scopes cover the required set.

## Related pages

- [Auth & OAuth](auth.md) — the OAuth route to obtaining tokens in the first place.
- [Connections](connections.md) — where provider tokens get used during registration and execution.
- [Data model](../architecture/data-model.md) — why the token store lives in memory.
- [System](system.md) — shared rate limits.
