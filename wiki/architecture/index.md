---
title: Architecture
description: "Section hub: how MCP Hub actually works — system overview, MCP integration, auth/session, repository map, frontend interface, backend API surface, data model, and testing."
tags:
  - wiki
  - section
  - architecture
---

> Audience: developers & contributors | Status: living document | Last verified: 2026-08-06

This section explains how MCP Hub is built, file by file. It is the map you want when the user-guide tells you *what* a feature does and you need to know *where* and *how* it is implemented.

```html preview
<div style="font-family:system-ui,sans-serif;padding:16px;display:flex;gap:12px;flex-wrap:wrap">
  <div style="flex:1;min-width:140px;background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px">
    <div style="font-size:24px;font-weight:700;color:var(--chart-2)">8</div>
    <div style="font-size:13px;font-weight:600">Pages in this section</div>
    <div style="font-size:12px;color:var(--muted-foreground)">map + file-by-file, one page per layer</div>
  </div>
  <div style="flex:1;min-width:140px;background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px">
    <div style="font-size:24px;font-weight:700;color:var(--chart-3)">6</div>
    <div style="font-size:13px;font-weight:600">Mermaid diagrams</div>
    <div style="font-size:12px;color:var(--muted-foreground)">trees, flows, a sequence, and a schema</div>
  </div>
  <div style="flex:1;min-width:140px;background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px">
    <div style="font-size:24px;font-weight:700;color:var(--chart-4)">1</div>
    <div style="font-size:13px;font-weight:600">Durable store</div>
    <div style="font-size:12px;color:var(--muted-foreground)">the users table; everything else is in memory</div>
  </div>
</div>
```

## Pages in this section

| Page | What it answers |
| --- | --- |
| [Overview](overview.md) | High-level system anatomy: two processes, one JSON-RPC hub, in-memory state. |
| [MCP integration](mcp-integration.md) | How the hub connects to MCP servers, discovers tools, and executes them. |
| [Auth & sessions](auth-session.md) | OAuth login, JWT session cookies, bearer tokens, roles. |
| [Repository map](repository-map.md) | Every top-level folder and where the important files live. |
| [Frontend interface](frontend-interface.md) | The Expo client, tRPC wiring, and API-base-URL resolution. |
| [Backend API surface](backend-api-surface.md) | Express bootstrap, tRPC routers, rate limits, and REST routes. |
| [Data model](data-model.md) | The MySQL `users` table and all the in-memory stores. |
| [Testing](testing.md) | What the suites cover, what they exclude, and the `pnpm check` contract. |

## Suggested reading order

Start at [Overview](overview.md), then branch: frontend-first readers go to [Frontend interface](frontend-interface.md); server-first readers go to [Backend API surface](backend-api-surface.md). Both end at [Data model](data-model.md), which is the shortest page and the reality check on persistence.

> [!IMPORTANT]
> Almost all functional state in MCP Hub — servers, tools, tokens, webhooks, workflows, analytics — lives **in memory** and is lost on restart. The only durable state is the `users` table. This one fact explains most design decisions in this section; it is documented in detail on [Data model](data-model.md) and called out in the [user guide](../user-guide/index.md).
