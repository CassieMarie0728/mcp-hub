---
title: API Reference
description: "Section hub: the tRPC surface of MCP Hub, procedure by procedure — every router, guard, input schema, and return value, verified against server source."
tags:
  - wiki
  - section
  - api
  - trpc
---

> Audience: developers & contributors | Status: living document | Last verified: 2026-08-06

This section documents everything the MCP Hub backend exposes through its tRPC endpoint at `/api/trpc`, procedure by procedure. It is the caller-facing companion to the code-level walkthrough in [Backend API surface](../architecture/backend-api-surface.md). Every procedure name, guard, input schema, and return shape below was verified directly against the server source on `main` (commit `0691562`).

## Transport and calling conventions

- The API is served by Express on **port 3000** (falling back to `3001`–`3019` if busy) at `POST /api/trpc` — the tRPC `httpBatchLink` target. See [Backend API surface](../architecture/backend-api-surface.md#bootstrap-server_coreindexts).
- All requests go through the **global rate limiter** (1000 req / 15 min per IP, health checks skipped) and the **API limiter** (100 req / 1 min) on the tRPC mount. See [Rate limits](system.md#rate-limits).
- Responses are serialized with **superjson**, so `Date` values survive as real dates, not ISO strings.
- Every procedure is documented under one of three **guards**:

| Guard | Requires | Failure |
| --- | --- | --- |
| `public` | Nothing — unauthenticated calls allowed | — |
| `protected` | A session (`ctx.user` resolved from cookie or Bearer token) | `UNAUTHORIZED` |
| `admin` | A session **and** `user.role === 'admin'` | `FORBIDDEN` |

The session is resolved in `server/_core/context.ts` via `sdk.authenticateRequest(req)`. See [Auth & sessions](../architecture/auth-session.md) for the full picture.

## The ten routers

The `appRouter` in `server/routers.ts` composes exactly ten routers:

| Router | Source | Procedures | Guard mix | Page |
| --- | --- | --- | --- | --- |
| `system` | `server/_core/systemRouter.ts` | `health`, `notifyOwner` | public, admin | [System](system.md) |
| `auth` | inline in `server/routers.ts` | `me`, `logout` | public | [Auth & OAuth](auth.md) |
| `oauth` | `server/auth/oauth-router.ts` | `getAuthorizationUrl`, `exchangeCode`, `refreshToken`, `revokeToken`, `checkTokenStatus` | public, protected | [Auth & OAuth](auth.md) |
| `mcp` | `server/mcp/mcp-router.ts` | `registerServer`, `discoverTools`, `executeTool`, `getServerStatus`, `getAllServerStatuses`, `testConnection`, `clearToolCache`, `clearAllCaches`, `removeServer`, `getAllServers`, `getServer` | protected | [Connections](connections.md) |
| `mcpServers` | `server/mcp/mcp-router-extended.ts` | `getAvailableServers`, `getServerDefinition`, `getServerTools`, `validateToken`, `registerRealServer`, `getRegisteredServers`, `discoverServerTools`, `executeServerTool`, `testServerConnection`, `unregisterServer` | protected | [Connections](connections.md) |
| `tokens` | `server/tokens/token-router.ts` | `storeToken`, `getTokenMetadata`, `listServerTokens`, `revokeToken`, `rotateToken`, `getExpiredTokens`, `getTokenStats`, `validateScopes` | protected | [Tokens](tokens.md) |
| `webhooks` | `server/webhooks/webhooks-router.ts` | `createWebhook`, `getWebhook`, `listWebhooks`, `updateWebhook`, `deleteWebhook`, `getWebhookEvents`, `getWebhookStats`, `testWebhook`, `rotateSecret`, `verifySignature` | protected | [Webhooks](webhooks.md) |
| `analytics` | `server/analytics/analytics-router.ts` | `recordExecution`, `getToolStats`, `getServerStats`, `getExecutionHistory`, `getErrorTrends`, `getPerformanceTrends`, `generateReport` | protected | [Analytics](analytics.md) |
| `workflows` | `server/procedures/workflows.ts` | `list`, `getById`, `create`, `save`, `execute`, `delete` | protected | [Workflows](workflows.md) |
| `templates` | `server/templates/templates-router.ts` | `getAllTemplates`, `getTemplate`, `cloneTemplate`, `searchTemplates`, `getTemplatesByCategory`, `getFeaturedTemplates` | public, protected | [Templates](templates.md) |

## Error model

- Guards throw **TRPC errors** with standard codes: `UNAUTHORIZED` when the session is missing, `FORBIDDEN` when a non-admin calls an admin procedure.
- Several procedures also throw plain `Error(...)` inside their bodies (e.g. "Server not found", "Template … not found"). tRPC surfaces these as `INTERNAL_SERVER_ERROR` on the wire — the error message is preserved in the response.
- `mcp`, `mcpServers`, and `oauth` procedures often return a `success: false` **object** with an `error` field instead of throwing — check each page's return shape rather than relying on exceptions alone.

## Page map

| Page | What it covers |
| --- | --- |
| [Connections](connections.md) | `mcp` + `mcpServers`: register servers, discover/execute tools, presets, tokens validation. |
| [Auth & OAuth](auth.md) | `auth` (`me`, `logout`) + `oauth` procedures and the REST OAuth/session routes. |
| [Tokens](tokens.md) | `tokens`: store, list, revoke, rotate, expire, scopes. |
| [Webhooks](webhooks.md) | `webhooks`: create, update, test, verify signatures. |
| [Analytics](analytics.md) | `analytics`: record executions, stats, trends, reports. |
| [Workflows](workflows.md) | `workflows`: CRUD + execute (with `dryRun`). |
| [Templates](templates.md) | `templates`: browse, search, clone workflow templates. |
| [System](system.md) | `system` (`health`, `notifyOwner`) + REST routes + rate limits. |

## Suggested reading order

Start at [Connections](connections.md) — it is the surface the [user guide](../user-guide/index.md) and [MCP integration](../architecture/mcp-integration.md) build on. Then read [System](system.md) once for the shared REST layer and rate limits. The remaining pages (auth, tokens, webhooks, analytics, workflows, templates) are independent; read them as you need the feature.
