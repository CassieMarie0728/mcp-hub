---
title: MCP in Plain English
description: What the Model Context Protocol is, what an MCP server and tool are, and how MCP Hub fits — without the jargon.
tags:
  - mcp
  - concepts
  - beginners
---
> [!NOTE] Status
> **Stable** (conceptual reference — not a feature) · Last verified 2026-08-06 · Commit `0691562`

| Field | Value |
| --- | --- |
| Purpose | Explain the Model Context Protocol and MCP Hub's role in it, without jargon. |
| Audience | Beginners; no MCP knowledge assumed. |
| Source paths | `lib/mcp-client.ts`, `server/mcp/mcp-server-manager.ts` |
| Prerequisites | [What is MCP Hub?](./what-is-mcp-hub.md) |
| Next | [Requirements](./requirements.md) → [Quickstart](./quickstart.md) |

## The one-sentence version

**MCP (Model Context Protocol) is a standard way for apps to talk to "tool servers"** — programs that expose capabilities (like "read a repo", "post a Slack message", "create a page") so any MCP-compatible app can call them without knowing their internals.

## The parts

| Term | What it means | In this project |
| --- | --- | --- |
| MCP | Model Context Protocol — the specification for how clients and servers exchange tool info and calls. | Implemented in `lib/mcp-client.ts` (protocol version `2024-11-25`). |
| MCP server | A program that exposes tools. E.g. GitHub, Slack, Notion. | Presets in `server/mcp/servers/`; also any remote HTTP server you add. |
| MCP client | The part that connects to a server and calls its tools. | The backend's server manager (`server/mcp/mcp-server-manager.ts`). |
| Tool | A named, typed capability a server exposes. | Surfaced to the UI via `mcp.tools.list` / `mcp.tools.call`. |
| Transport | How client and server connect. MCP defines stdio, SSE, WebSocket, and HTTP. | HTTP is implemented and wired; stdio/SSE/WebSocket exist as code but are not fully wired. |
| JSON-RPC | The message format MCP uses — a lightweight remote procedure call protocol. | All tool calls are JSON-RPC 2.0 request/response. |

## A concrete example

The GitHub preset works like this:

1. You add the GitHub server (via OAuth or a bearer token) — `server/mcp/servers/github-mcp.ts`.
2. The hub asks it "what tools do you have?" → it returns e.g. `create_issue`, `get_repo`, `list_commits`.
3. You pick one (say `create_issue`) in the **Tools** screen, fill in the arguments, and hit run.
4. The hub forwards your call to GitHub's server over JSON-RPC, gets a result, and shows it in **Results**.
5. You can then save that call sequence as a **macro** and run it again later — one tap instead of many.

## Why the hub exists

MCP gives you the plumbing but not the user experience. MCP Hub is the comfortable front door: you add servers once, browse their tools visually, run them with a form, and chain them into macros — instead of hand-crafting JSON-RPC payloads.

## Where MCP ends and MCP Hub begins

- **MCP decides** the protocol: JSON-RPC messages, tool discovery, tool call shapes, and protocol version `2024-11-25`.
- **MCP Hub decides** everything around it: your server list, credentials, tool forms, results history, macros, workflows, and the mobile UI.

> **Next:** [Requirements](./requirements.md)

Terms are collected in the [glossary](./glossary.md).
