---
description: How tools are discovered, listed, cached, searched, and filtered — endpoints, tool shapes, and the UI surfaces.
tags:
  - tools
  - discovery
  - mcp
title: Tool Discovery
---
> [!NOTE] Status
> **Stable** · Last verified 2026-08-06 · Commit `0691562`

| Field | Value |
| --- | --- |
| Purpose | How MCP Hub discovers, lists, searches, and caches the tools a server exposes. |
| Audience | End users browsing tools. |
| Source paths | `server/mcp/mcp-router.ts`, `server/mcp/mcp-router-extended.ts`, `lib/services/tool-execution-service.ts`, `lib/mcp-client.ts` |
| Prerequisites | [Server connections](./server-connections.md) |
| Next | [Tool execution](./tool-execution.md) |

## Where the tool list comes from

| Source | Path |
| --- | --- |
| Live discovery (backend) | `POST {url}/mcp/tools/list` with `{}` → `response.data.tools`. |
| Live discovery (client service) | `GET {serverUrl}/mcp/tools/list`; tool `id` is generated as `` `${serverId}-tool-${index}` ``. |
| MCP client (`tools/list`) | Paginated via a `cursor`; response includes `nextCursor`. |
| Preset servers | Static tool lists built into `server/mcp/servers/{github,slack,notion}-mcp.ts`. |
| Cache | Backend `toolCache: Map<serverId, MCPTool[]>`; cleared per-server or wholesale. |

## The discovery flow

1. You open a server's tool list (`discoverServerTools` / `discoverTools`).
2. The backend calls the server's `tools/list` endpoint and caches the result.
3. The UI shows the cached list, and can refresh with `clearToolCache` + rediscover.
4. For presets, `getServerTools(type)` returns the server's static tool definitions without any network call.

## Tool shapes

Two shapes appear, depending on the layer:

| Field | MCP client (`MCPTool`) | UI service (`Tool`) |
| --- | --- | --- |
| Identity | `serverId`, `name`, `title?` | `id`, `name`, `serverId` |
| Description | `description` | `description` |
| Schema | `inputSchema`, `outputSchema?`, `annotations?` | `inputSchema`, plus flattened `parameters` |
| Organization | — | `category?`, `tags?`, `createdAt` |

`Tool.parameters` is derived from the JSON schema (`ToolParameter`: `name`, `type`, `required`, `default`, `enum`, `pattern`, `minLength/maxLength`, `minimum/maximum`).

## Search and filter

The client service exposes helpers used by the **Tools** screens:

- `searchTools(tools, query)` — text search.
- `filterToolsByCategory(tools, category)` — narrow by category.
- `getCategories(tools)` — the distinct categories present.
- `getTool(tools, toolId)` — fetch one tool by id.

## UI surfaces

- `tool-browser` — the full list of a server's tools.
- `tool-discovery` — guided discovery flow.
- `tool-detail` — one tool's schema and description.
- `server-detail` → tools entry point.

> **Next:** [Tool execution](./tool-execution.md)