---
description: "Server credential store: procedures, AES-256-GCM encryption, the TOKEN_ENCRYPTION_KEY caveat, and rotation/revocation."
tags:
  - tokens
  - credentials
  - security
title: Token Management
---
> [!NOTE] Status
> **Experimental** · Last verified 2026-08-06 · Commit `0691562`

| Field | Value |
| --- | --- |
| Purpose | Storing, listing, rotating, and revoking server credentials. |
| Audience | Users managing API tokens for connected servers. |
| Source paths | `server/tokens/token-router.ts`, `server/tokens/token-manager.ts`, `app/(tabs)/token-management.tsx` |
| Prerequisites | [Integrations & OAuth](./integrations-oauth.md) |
| Next | [Analytics](./analytics.md) |

## What a token is here

A stored credential bound to a server: `TokenMetadata {id, serverId, serverType, name, maskedToken, createdAt, lastUsedAt?, expiresAt?, isActive, scopes?}`. The stored value is **encrypted at rest** with `aes-256-gcm`; only the masked form (`••••` + last 4 chars) is ever returned.

## Procedures (all protected)

| Procedure | Input | Returns |
| --- | --- | --- |
| `tokens.storeToken` | `serverId, serverType, name, token, expiresAt?, scopes?` | `TokenMetadata` |
| `tokens.getTokenMetadata` | `tokenId` | `TokenMetadata \| null` |
| `tokens.listServerTokens` | `serverId` | Active tokens for the server. |
| `tokens.revokeToken` | `tokenId` | `boolean` (sets `isActive: false`) |
| `tokens.rotateToken` | `tokenId, newToken` | New metadata (old one revoked; name becomes `'… (rotated)'`) |
| `tokens.getExpiredTokens` | — | Expired tokens. |
| `tokens.getTokenStats` | — | `{total, active, expired, byServer}` |
| `tokens.validateScopes` | `tokenScopes?, requiredScopes` | `boolean` |

## Encryption key caveat (read this)

The encryption key is `TOKEN_ENCRYPTION_KEY` **or a random 32-byte value generated at boot** when that env var is unset. With the random fallback, restarting the backend invalidates all stored tokens (they can no longer be decrypted). For anything durable, set `TOKEN_ENCRYPTION_KEY`.

## Honest limits

- **In-memory store.** Tokens live in a `Map`; restart clears them.
- The store is explicitly commented as a placeholder to be replaced by a database.
- `lastUsedAt` updates when a token is decrypted for use; token-scope enforcement (`validateScopes`) is advisory and separate from server call validation.

> **Next:** [Analytics](./analytics.md)