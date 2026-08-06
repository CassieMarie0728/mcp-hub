---
description: Add, configure, test, and remove MCP server connections — config fields, auth methods, HTTP conventions, and limitations.
tags:
  - servers
  - connections
  - mcp
title: Server Connections
---
> [!NOTE] Status
> **Stable** · Last verified 2026-08-06 · Commit `0691562`

| Field | Value |
| --- | --- |
| Purpose | How to add, configure, test, and remove MCP server connections. |
| Audience | End users connecting servers. |
| Source paths | `server/mcp/mcp-router.ts`, `server/mcp/mcp-server-manager.ts`, `lib/services/server-connection-service.ts` |
| Prerequisites | [Quickstart](../start-here/quickstart.md) |
| Next | [Tool discovery](./tool-discovery.md) |

## What a connection is

A connection is a **named, URL-addressed MCP server** registered with the backend, plus an optional auth method. The UI keeps a fuller client-side record (`ServerConfig`) while the backend keeps the runtime config it actually uses (`MCPServerConfig`).

| Field | Client record (`ServerConfig`) | Backend record (`MCPServerConfig`) |
| --- | --- | --- |
| Identity | `id` (uuid), `name`, `url`, `isActive` | `id`, `name`, `url`, `type` |
| Auth | `credentials: {type, username, password, token, apiKey, apiKeyHeader, oauthToken}` | `auth: {type, token, username, password}` + `headers` |
| Extra | `description`, `tags`, `createdAt`, `lastConnected` | `timeout` (default 30000 ms), `retryAttempts` |
| Transport type | — | `type`: `'http' | 'websocket' | 'stdio'` |

## Adding a server

1. Open **Servers** → **Add server**.
2. Either pick a **preset** (GitHub / Slack / Notion — see [Integrations & OAuth](./integrations-oauth.md)) or enter a **custom HTTP MCP server URL**.
3. Choose an auth method and supply credentials.
4. Save. The hub registers the server and runs a connection test.

Auth methods supported by the connection service (`AuthType`):

| Type | Meaning |
| --- | --- |
| `none` | No auth. |
| `bearer` | Sends `Authorization: Bearer <token>`. |
| `basic` | Sends `Authorization: Basic base64(user:password)`. |
| `api_key` | Sends `<apiKeyHeader>` (or a default header) with the key value. |
| `oauth` | Uses an OAuth token from the preset flow. |

## Endpoint conventions the hub talks to

The hub assumes the MCP server exposes these paths over HTTP:

| Endpoint | Method | Used for |
| --- | --- | --- |
| `{url}/mcp/info` | GET | Capability/health probe (client-side connect & test). |
| `{url}/mcp/tools/list` | POST | Tool discovery (`MCPServerManager.discoverTools`). |
| `{url}/mcp/tools/call` | POST | Tool execution (`MCPServerManager.executeTool`). |
| `{url}/health` | GET | Connection test (`MCPServerManager.testConnection`, 5 s timeout). |

The client-side service (`ServerConnectionService`) uses GET `{url}/mcp/info` with a 10 s timeout and reports latency; `connect` retries up to 3 times with exponential backoff.

## Testing and status

- `testConnection` runs a live probe and returns `{success, connected}`.
- `getServerStatus` / `getAllServerStatuses` report per-server health from the `serverStatus` map.
- **Important:** if a server's `/mcp/info` returns nothing, the client-side service substitutes a hardcoded `{name: 'MCP Server', version: '1.0.0', protocolVersion: '1.0'}` — treat that as a fallback, not the real server identity.

## Known limitations

- **In-memory registry.** The backend keeps servers in a `Map` (`server/mcp/mcp-server-manager.ts`) — restarting the backend drops all connections.
- **HTTP only, really.** The config schema accepts `websocket` and `stdio`, but only HTTP transport is implemented end to end.
- **Protocol versions differ.** The MCP client negotiates protocol version `2024-11-25`; the client-side connect fallback reports `'1.0'`.
- **Secrets are redacted** from `getServer`/`getAllServers` responses (`redactServerConfig` masks bearer tokens, passwords, and any header whose name includes `secret`, `token`, `password`, or is `authorization`/`x-api-key`).

> **Next:** [Tool discovery](./tool-discovery.md)