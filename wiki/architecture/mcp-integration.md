---
title: MCP Integration
description: "How MCP Hub connects to MCP servers over JSON-RPC 2.0, discovers tools, executes them, and manages presets (GitHub/Slack/Notion)."
tags:
  - architecture
  - mcp
  - json-rpc
---

> Audience: developers & contributors | Status: Connections Stable, presets Beta | Last verified: 2026-08-06

This page is the code-level companion to the plain-English [MCP explainer](../start-here/mcp-in-plain-english.md). It covers how the hub acts as an MCP **client**: connecting, discovering, executing, and the built-in server presets.

## Where the code lives

- `lib/mcp-client.ts` — the MCP client used by app-side code (JSON-RPC 2.0 transport).
- `lib/types.ts` — `MCPTool`, `JSONRPCRequest`, `JSONRPCResponse`, `JSONSchema`, `ServerCapabilities`.
- `server/mcp/mcp-server-manager.ts` — the server-side registry of connections.
- `server/mcp/mcp-router.ts` — tRPC procedures for registering, listing, executing, and removing servers.
- `server/mcp/mcp-router-extended.ts` — protected procedures for server definitions and tool listing.
- `server/mcp/mcp-server-registry.ts` + `server/mcp/servers/{github,slack,notion}-mcp.ts` — the built-in presets.

## Transport & protocol

MCP Hub speaks **JSON-RPC 2.0** to MCP servers. The client (`lib/mcp-client.ts`) supports three connection types, with the current reality in parentheses:

| Connection type | Transport | Status in this codebase |
| --- | --- | --- |
| `http` (HTTP/SSE) | HTTP POST + SSE event stream | **Stable** — primary path |
| `websocket` | WebSocket JSON-RPC | Present in config type; exercised by tests |
| `stdio` | Spawned child process | Config type exists (`command`), not a live path |

On `initialize()`, the client sends an `initialize` request with protocol version `2024-11-25`, advertises client capabilities (`tools`, `resources`, `prompts`), identifies itself as `MCP Hub` `1.0.0`, and stores the server's advertised capabilities. Message IDs increment per request; pending requests resolve through a `Map<number, callback>`.

## Server-side connection manager

`server/mcp/mcp-server-manager.ts` holds the server-side picture in four in-memory maps:

- `servers` — `MCPServerConfig` keyed by server ID
- `clients` — active MCP client instances
- `toolCache` — discovered tools per server
- `serverStatus` — health status per server

`MCPServerConfig` is:

```ts
interface MCPServerConfig {
  id: string;
  name: string;
  url: string;
  type: 'http' | 'websocket' | 'stdio';
  headers?: Record<string, string>;
  auth?: string;          // e.g. a bearer token
  timeout?: number;
  retryAttempts?: number;
}
```

> [!WARNING]
> These maps are **in-memory** — every registered server disappears on restart. There is no database table for MCP connections yet. See [Data model](data-model.md).

## Registration & redaction

`server/mcp/mcp-router.ts` validates incoming configs against `MCPServerConfigSchema` before storing them. Secrets are scrubbed from responses via `redactServerConfig` so headers/auth values never leak back to the client after registration. The router exposes register / list / execute / remove procedures, all documented on [Backend API surface](backend-api-surface.md).

## Tool discovery

Two discovery paths:

1. **`mcpRouter.getAvailableServers` / `getServerTools`** (`mcp-router-extended.ts`) — protected procedures the app calls to populate the [Tool Discovery](../user-guide/tool-discovery.md) screen.
2. **`toolCache`** — the manager caches each server's tool list after discovery so repeated calls don't renegotiate.

## Tool execution

The execution path for a tool call goes: tRPC request → `mcpRouter.execute` → server manager looks up the client → JSON-RPC `tools/call` over the wire → response returned to the app. The [Tool Execution](../user-guide/tool-execution.md) page covers the UI contract; on the client, `lib/services/tool-execution-service.ts` orchestrates validation and result formatting.

## Built-in presets (Beta)

`server/mcp/mcp-server-registry.ts` defines three **preset** server types — `github`, `slack`, `notion` — whose connection details are generated from a base URL rather than typed in by the user. Each defines `authMethod: 'bearer'` plus required OAuth scopes:

| Preset | OAuth scopes | Endpoint |
| --- | --- | --- |
| GitHub | `repo`, `user`, `gist` | `https://api.github.com/mcp` |
| Slack | `chat:write`, `channels:read`, `users:read` | Slack MCP endpoint |
| Notion | — | Notion MCP endpoint |

`server/mcp/servers/github-mcp.ts` is the concrete example: it defines GitHub tools (`list_repositories`, `create_issue`, …) and talks to `https://api.github.com/mcp` with `Accept` + `X-GitHub-Api-Version: 2022-11-28` headers.

Presets are **Beta**: the preset definitions and the GitHub tool set are implemented and the [Server connections](../user-guide/server-connections.md) screens exist, but end-to-end preset + OAuth flows have not yet been verified in a deployed environment.

## Security notes

- Server connections are validated against the config schema before storage.
- Secrets are redacted from all server-config responses.
- `validateToken` (in `mcp-router-extended.ts`) lets the app confirm an auth token is usable before registering.
- The full request-permission model is on [Auth & sessions](auth-session.md).

## Related pages

- [MCP in plain English](../start-here/mcp-in-plain-english.md) — the non-technical intro.
- [Server connections](../user-guide/server-connections.md) — how to use the screens.
- [Overview](overview.md) — where this layer sits in the system.
- [Connections API](../api-reference/connections.md) — the tRPC procedures in detail.
---
title: MCP Integration
description: "How MCP Hub connects to MCP servers over JSON-RPC 2.0, discovers tools, executes them, and manages presets (GitHub/Slack/Notion)."
tags:
  - architecture
  - mcp
  - json-rpc
---


> Audience: developers & contributors | Status: Connections Stable, presets Beta | Last verified: 2026-08-06

This page is the code-level companion to the plain-English [MCP explainer](../start-here/mcp-in-plain-english.md). It covers how the hub acts as an MCP **client**: connecting, discovering, executing, and the built-in server presets.

## Where the code lives

- `lib/mcp-client.ts` — the MCP client used by app-side code (JSON-RPC 2.0 transport).
- `lib/types.ts` — `MCPTool`, `JSONRPCRequest`, `JSONRPCResponse`, `JSONSchema`, `ServerCapabilities`.
- `server/mcp/mcp-server-manager.ts` — the server-side registry of connections.
- `server/mcp/mcp-router.ts` — tRPC procedures for registering, listing, executing, and removing servers.
- `server/mcp/mcp-router-extended.ts` — protected procedures for server definitions and tool listing.
- `server/mcp/mcp-server-registry.ts` + `server/mcp/servers/{github,slack,notion}-mcp.ts` — the built-in presets.

## Transport & protocol

MCP Hub speaks **JSON-RPC 2.0** to MCP servers. The client (`lib/mcp-client.ts`) supports three connection types, with the current reality in parentheses:

| Connection type | Transport | Status in this codebase |
| --- | --- | --- |
| `http` (HTTP/SSE) | HTTP POST + SSE event stream | **Stable** — primary path |
| `websocket` | WebSocket JSON-RPC | Present in config type; exercised by tests |
| `stdio` | Spawned child process | Config type exists (`command`), not a live path |

On `initialize()`, the client sends an `initialize` request with protocol version `2024-11-25`, advertises client capabilities (`tools`, `resources`, `prompts`), identifies itself as `MCP Hub` `1.0.0`, and stores the server's advertised capabilities. Message IDs increment per request; pending requests resolve through a `Map<number, callback>`.

## Server-side connection manager

`server/mcp/mcp-server-manager.ts` holds the server-side picture in four in-memory maps:

- `servers` — `MCPServerConfig` keyed by server ID
- `clients` — active MCP client instances
- `toolCache` — discovered tools per server
- `serverStatus` — health status per server

`MCPServerConfig` is:

```ts
interface MCPServerConfig {
  id: string;
  name: string;
  url: string;
  type: 'http' | 'websocket' | 'stdio';
  headers?: Record<string, string>;
  auth?: string;          // e.g. a bearer token
  timeout?: number;
  retryAttempts?: number;
}
```

> [!WARNING]
> These maps are **in-memory** — every registered server disappears on restart. There is no database table for MCP connections yet. See [Data model](data-model.md).

## Registration & redaction

`server/mcp/mcp-router.ts` validates incoming configs against `MCPServerConfigSchema` before storing them. Secrets are scrubbed from responses via `redactServerConfig` so headers/auth values never leak back to the client after registration. The router exposes register / list / execute / remove procedures, all documented on [Backend API surface](backend-api-surface.md).

## Tool discovery

Two discovery paths:

1. **`mcpRouter.getAvailableServers` / `getServerTools`** (`mcp-router-extended.ts`) — protected procedures the app calls to populate the [Tool Discovery](../user-guide/tool-discovery.md) screen.
2. **`toolCache`** — the manager caches each server's tool list after discovery so repeated calls don't renegotiate.

## Tool execution

The execution path for a tool call goes: tRPC request → `mcpRouter.execute` → server manager looks up the client → JSON-RPC `tools/call` over the wire → response returned to the app. The [Tool Execution](../user-guide/tool-execution.md) page covers the UI contract; on the client, `lib/services/tool-execution-service.ts` orchestrates validation and result formatting.

## Built-in presets (Beta)

`server/mcp/mcp-server-registry.ts` defines three **preset** server types — `github`, `slack`, `notion` — whose connection details are generated from a base URL rather than typed in by the user. Each defines `authMethod: 'bearer'` plus required OAuth scopes:

| Preset | OAuth scopes | Endpoint |
| --- | --- | --- |
| GitHub | `repo`, `user`, `gist` | `https://api.github.com/mcp` |
| Slack | `chat:write`, `channels:read`, `users:read` | Slack MCP endpoint |
| Notion | — | Notion MCP endpoint |

`server/mcp/servers/github-mcp.ts` is the concrete example: it defines GitHub tools (`list_repositories`, `create_issue`, …) and talks to `https://api.github.com/mcp` with `Accept` + `X-GitHub-Api-Version: 2022-11-28` headers.

Presets are **Beta**: the preset definitions and the GitHub tool set are implemented and the [Server connections](../user-guide/server-connections.md) screens exist, but end-to-end preset + OAuth flows have not yet been verified in a deployed environment.

## Security notes

- Server connections are validated against the config schema before storage.
- Secrets are redacted from all server-config responses.
- `validateToken` (in `mcp-router-extended.ts`) lets the app confirm an auth token is usable before registering.
- The full request-permission model is on [Auth & sessions](auth-session.md).

## Related pages

- [MCP in plain English](../start-here/mcp-in-plain-english.md) — the non-technical intro.
- [Server connections](../user-guide/server-connections.md) — how to use the screens.
- [Overview](overview.md) — where this layer sits in the system.
- [Connections API](../api-reference/connections.md) — the tRPC procedures in detail.
> Audience: developers & contributors | Status: Connections Stable, presets Beta | Last verified: 2026-08-06

This page is the code-level companion to the plain-English [MCP explainer](../start-here/mcp-in-plain-english.md). It covers how the hub acts as an MCP **client**: connecting, discovering, executing, and the built-in server presets.

## Where the code lives

- `lib/mcp-client.ts` — the MCP client used by app-side code (JSON-RPC 2.0 transport).
- `lib/types.ts` — `MCPTool`, `JSONRPCRequest`, `JSONRPCResponse`, `JSONSchema`, `ServerCapabilities`.
- `server/mcp/mcp-server-manager.ts` — the server-side registry of connections.
- `server/mcp/mcp-router.ts` — tRPC procedures for registering, listing, executing, and removing servers.
- `server/mcp/mcp-router-extended.ts` — protected procedures for server definitions and tool listing.
- `server/mcp/mcp-server-registry.ts` + `server/mcp/servers/{github,slack,notion}-mcp.ts` — the built-in presets.

## Transport & protocol

MCP Hub speaks **JSON-RPC 2.0** to MCP servers. The client (`lib/mcp-client.ts`) supports three connection types, with the current reality in parentheses:

| Connection type | Transport | Status in this codebase |
| --- | --- | --- |
| `http` (HTTP/SSE) | HTTP POST + SSE event stream | **Stable** — primary path |
| `websocket` | WebSocket JSON-RPC | Present in config type; exercised by tests |
| `stdio` | Spawned child process | Config type exists (`command`), not a live path |

On `initialize()`, the client sends an `initialize` request with protocol version `2024-11-25`, advertises client capabilities (`tools`, `resources`, `prompts`), identifies itself as `MCP Hub` `1.0.0`, and stores the server's advertised capabilities. Message IDs increment per request; pending requests resolve through a `Map<number, callback>`.

## Server-side connection manager

`server/mcp/mcp-server-manager.ts` holds the server-side picture in four in-memory maps:

- `servers` — `MCPServerConfig` keyed by server ID
- `clients` — active MCP client instances
- `toolCache` — discovered tools per server
- `serverStatus` — health status per server

`MCPServerConfig` is:

```ts
interface MCPServerConfig {
  id: string;
  name: string;
  url: string;
  type: 'http' | 'websocket' | 'stdio';
  headers?: Record<string, string>;
  auth?: string;          // e.g. a bearer token
  timeout?: number;
  retryAttempts?: number;
}
```

> [!WARNING]
> These maps are **in-memory** — every registered server disappears on restart. There is no database table for MCP connections yet. See [Data model](data-model.md).

## Registration & redaction

`server/mcp/mcp-router.ts` validates incoming configs against `MCPServerConfigSchema` before storing them. Secrets are scrubbed from responses via `redactServerConfig` so headers/auth values never leak back to the client after registration. The router exposes register / list / execute / remove procedures, all documented on [Backend API surface](backend-api-surface.md).

## Tool discovery

Two discovery paths:

1. **`mcpRouter.getAvailableServers` / `getServerTools`** (`mcp-router-extended.ts`) — protected procedures the app calls to populate the [Tool Discovery](../user-guide/tool-discovery.md) screen.
2. **`toolCache`** — the manager caches each server's tool list after discovery so repeated calls don't renegotiate.

## Tool execution

The execution path for a tool call goes: tRPC request → `mcpRouter.execute` → server manager looks up the client → JSON-RPC `tools/call` over the wire → response returned to the app. The [Tool Execution](../user-guide/tool-execution.md) page covers the UI contract; on the client, `lib/services/tool-execution-service.ts` orchestrates validation and result formatting.

## Built-in presets (Beta)

`server/mcp/mcp-server-registry.ts` defines three **preset** server types — `github`, `slack`, `notion` — whose connection details are generated from a base URL rather than typed in by the user. Each defines `authMethod: 'bearer'` plus required OAuth scopes:

| Preset | OAuth scopes | Endpoint |
| --- | --- | --- |
| GitHub | `repo`, `user`, `gist` | `https://api.github.com/mcp` |
| Slack | `chat:write`, `channels:read`, `users:read` | Slack MCP endpoint |
| Notion | — | Notion MCP endpoint |

`server/mcp/servers/github-mcp.ts` is the concrete example: it defines GitHub tools (`list_repositories`, `create_issue`, …) and talks to `https://api.github.com/mcp` with `Accept` + `X-GitHub-Api-Version: 2022-11-28` headers.

Presets are **Beta**: the preset definitions and the GitHub tool set are implemented and the [Server connections](../user-guide/server-connections.md) screens exist, but end-to-end preset + OAuth flows have not yet been verified in a deployed environment.

## Security notes

- Server connections are validated against the config schema before storage.
- Secrets are redacted from all server-config responses.
- `validateToken` (in `mcp-router-extended.ts`) lets the app confirm an auth token is usable before registering.
- The full request-permission model is on [Auth & sessions](auth-session.md).

## Related pages

- [MCP in plain English](../start-here/mcp-in-plain-english.md) — the non-technical intro.
- [Server connections](../user-guide/server-connections.md) — how to use the screens.
- [Overview](overview.md) — where this layer sits in the system.
- [Connections API](../api-reference/connections.md) — the tRPC procedures in detail.

