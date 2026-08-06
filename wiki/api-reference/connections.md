---
title: Connections API
description: "The mcp and mcpServers tRPC routers, procedure by procedure — register MCP servers, discover tools, execute them, and manage the GitHub/Slack/Notion presets."
tags:
  - wiki
  - api
  - trpc
  - mcp
---

> Audience: developers & contributors | Status: living document | Last verified: 2026-08-06

This page documents the **Connections API**: the `mcp` and `mcpServers` routers that back the [server connections](../user-guide/server-connections.md), [tool discovery](../user-guide/tool-discovery.md), and [tool execution](../user-guide/tool-execution.md) flows. All procedures are **protected** (session required). How the underlying manager talks to MCP servers is covered in [MCP integration](../architecture/mcp-integration.md).

## Router `mcp` (`server/mcp/mcp-router.ts`)

Generic MCP server lifecycle and tool operations. Servers are identified by a user-supplied `id` string.

### `registerServer` — mutation

Register a new MCP server config in the in-memory manager.

Input (`MCPServerConfigSchema`):

<details>
<summary>MCPServerConfigSchema fields</summary>

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string (min 1) | Unique server id, supplied by the caller. |
| `name` | string (min 1) | Display name. |
| `url` | string (URL) | Base URL of the MCP server. |
| `type` | `'http'` \| `'websocket'` \| `'stdio'` | Transport type. |
| `headers` | record<string, string> | Optional HTTP headers. |
| `auth` | object | Optional; `{ type: 'bearer'\|'api-key'\|'basic', token?, username?, password? }`. |
| `timeout` | number | Optional. |
| `retryAttempts` | number | Optional. |

</details>

Returns `{ success: true, serverId }`.

### `discoverTools` — query

Query the registered server for its tools. Returns `{ success, tools, count }`; on failure `{ success: false, tools: [], count: 0, error }` (no throw).

### `executeTool` — mutation

Input `{ serverId, toolName, input: record<string, any> }`. Executes the tool and returns `{ success, data, error }` — the `error` field is present on the failed shape (no throw).

### `getServerStatus` — query

Input `{ serverId }`. Returns the manager's status object for the server, or `{ error: 'Server not found' }`.

### `getAllServerStatuses` — query

No input. Returns an array of status objects for every registered server.

### `testConnection` — mutation

Input `{ serverId }`. Returns `{ success, connected }`; on failure `{ success: false, connected: false, error }` (no throw).

### `clearToolCache` — mutation

Input `{ serverId }`. Clears the cached tool list for one server. Returns `{ success: true }`.

### `clearAllCaches` — mutation

No input. Clears every cached tool list. Returns `{ success: true }`.

### `removeServer` — mutation

Input `{ serverId }`. Removes the server from the manager. Returns `{ success: true }`.

### `getAllServers` — query

No input. Returns every registered server config, **secrets redacted** — see `redactServerConfig` below.

### `getServer` — query

Input `{ serverId }`. Returns one redacted config, or `{ error: 'Server not found' }`.

> [!IMPORTANT]
> **Secrets are redacted.** `redactServerConfig` masks `auth.token` and `auth.password` as `••••••••`, and any header whose lowercased key is `authorization`, `x-api-key`, or contains `secret`, `token`, or `password`. These redactions apply to `getServer`, `getAllServers`, and any other path that returns a stored config.

## Router `mcpServers` (`server/mcp/mcp-router-extended.ts`)

The extended router for **real server presets** (GitHub, Slack, Notion): registry lookups, token validation, and full registration/execution lifecycle. It reuses the same `mcpServerManager` as `mcp`.

### `getAvailableServers` — query

No input. Returns the list of server types the built-in registry (`MCPServerRegistry`) knows about.

### `getServerDefinition` — query

Input `{ type }`. Returns the registry definition for that server type, or `{ error: 'Server type not found' }`.

### `getServerTools` — query

Input `{ type }`. Returns `{ success: true, tools, count }` from the registry (no connection needed).

### `validateToken` — mutation

Input `{ type, token }`. Asks the registry to validate the token for that server type. Returns `{ success, valid }`; on error `{ success: false, valid: false, error }` (no throw).

### `registerRealServer` — mutation

Input `{ type, token, customName? }`. Validates the token, builds a server config via `MCPServerRegistry.createServerConfig`, registers it, then tests the connection. Returns `{ success, serverId, serverName, connected }`; on failure `{ success: false, error }` (no throw).

### `getRegisteredServers` — query

No input. Returns the registered servers joined with their status: `{ id, name, type, status, toolCount, lastConnected, lastError }` each.

### `discoverServerTools` — mutation

Input `{ serverId }`. Discovers and caches tools for a registered server. Returns `{ success, tools, count }`; on failure `{ success: false, tools: [], count: 0, error }` (no throw).

### `executeServerTool` — mutation

Input `{ serverId, toolName, parameters: record<string, any> }`. Executes a tool on a registered server. Returns `{ success, data, error }` (no throw).

### `testServerConnection` — mutation

Input `{ serverId }`. Returns `{ success, connected }`; on failure `{ success: false, connected: false, error }` (no throw).

### `unregisterServer` — mutation

Input `{ serverId }`. Removes the server. Returns `{ success: true }`.

## Which router to use

- The `mcpServers` router is the **preset flow**: pick a type from the registry, validate a token, register — used by [Integrations & OAuth](../user-guide/integrations-oauth.md).
- The `mcp` router is the **generic flow**: register an arbitrary server config (any URL/transport/auth) — used by the [server connections](../user-guide/server-connections.md) screen.
- Both execute through the same `mcpServerManager`, so a server registered through either router is visible to the other's read procedures.

## Related pages

- [MCP integration](../architecture/mcp-integration.md) — what happens under the hood on `discover` and `execute`.
- [Auth & OAuth](auth.md) — the `oauth` router used by preset registration.
- [Tokens](tokens.md) — persisted token storage beside the in-memory server configs.
- [System](system.md) — shared rate limits that apply to these procedures.
