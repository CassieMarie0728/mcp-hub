---
description: "User-guide index: server connections, tools, macros, workflows, templates, webhooks, OAuth, tokens, analytics — with a recommended reading order."
tags:
  - user-guide
  - index
  - mcp
title: User Guide
---
> [!NOTE] Status
> **Stable** (section hub) · Last verified 2026-08-06 · Commit `0691562`

| Field | Value |
| --- | --- |
| Purpose | Index the user-guide section and give a recommended reading order. |
| Audience | End users of MCP Hub. |
| Source paths | `app/(tabs)/`, `lib/services/`, `server/routers.ts` |
| Prerequisites | [Quickstart](../start-here/quickstart.md) |
| Next | [Server connections](./server-connections.md) |

This section is the daily-operations manual: how to connect servers, find and run tools, and use macros, workflows, templates, webhooks, and tokens. Each page carries one status label that tells you how much to trust it.

| Page | What it covers | Status |
| --- | --- | --- |
| [Server connections](./server-connections.md) | Add, edit, and remove MCP servers; connection methods. | Stable |
| [Tool discovery](./tool-discovery.md) | Browse and search the tools a server exposes. | Stable |
| [Tool execution](./tool-execution.md) | Call a tool, pass arguments, read the result. | Stable |
| [Results & history](./results-history.md) | Where results land; execution history. | Experimental |
| [Macros](./macros.md) | Save tool call sequences and re-run them. | Experimental |
| [Workflows](./workflows.md) | Multi-step automations over tools. | Experimental |
| [Templates](./templates.md) | Starting shapes for workflows and macros. | Experimental |
| [Webhooks](./webhooks.md) | Outbound HTTP callbacks on events. | Experimental |
| [Integrations & OAuth](./integrations-oauth.md) | GitHub / Slack / Notion presets and OAuth. | Beta |
| [Token management](./token-management.md) | Store, list, rotate, and revoke server tokens. | Experimental |
| [Analytics](./analytics.md) | Execution stats and usage dashboards. | Experimental |

## Reading order

For the essential path, follow the arrows:

```text
Server connections → Tool discovery → Tool execution → Results & history
→ Macros → Workflows → Templates
```

Then, depending on your need: **Integrations & OAuth** (presets), **Token management** (credentials), **Webhooks** (automation triggers), **Analytics** (visibility).

## Status legend

- **Stable** — shipped, wired end to end, tested.
- **Beta** — shipped but rougher edges (OAuth flows).
- **Experimental** — implemented on in-memory stores; resets on server restart.
- **Disabled** — not user-facing; see the [disabled catalog](../project/disabled-catalog.md).

> **Next:** [Server connections](./server-connections.md)