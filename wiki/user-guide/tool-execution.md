---
description: "Calling a tool end to end: the three layers, argument validation rules, result and error shapes, and timeouts."
tags:
  - tools
  - execution
  - mcp
title: Tool Execution
---
> [!NOTE] Status
> **Stable** · Last verified 2026-08-06 · Commit `0691562`

| Field | Value |
| --- | --- |
| Purpose | Call a tool, validate and pass arguments, and read the result. |
| Audience | End users running tools. |
| Source paths | `server/mcp/mcp-router.ts`, `server/mcp/mcp-server-manager.ts`, `lib/services/tool-execution-service.ts`, `lib/mcp-client.ts`, `app/(tabs)/tool-execution.tsx` |
| Prerequisites | [Tool discovery](./tool-discovery.md) |
| Next | [Results & history](./results-history.md) |

## The call flow

All layers use JSON-RPC-style calls against the server's `tools/call` path:

| Layer | Request | Response handling |
| --- | --- | --- |
| Backend manager | `POST {url}/mcp/tools/call` with `{name, arguments}` | Returns `response.data.result` (falls back to `response.data`). |
| Client service | `POST {serverUrl}/mcp/tools/call` with `{tool: toolId, arguments}` | Returns a normalized `ToolExecutionResult`; default timeout 30 000 ms. |
| MCP client | `tools/call` with `{name, arguments}` | Returns `{content: any[], isError}`; tool errors surface as `content: [{type: 'text', text: 'Error: …'}], isError: true`. |

## Argument validation

Before calling, the UI validates parameters via `validateParameters(tool, parameters) → {valid, errors}`. Rules come from the tool's `ToolParameter` descriptors: `required`, `type` (`string` / `number` / `boolean` / `array` / `object`), `enum`, `pattern`, `minLength`/`maxLength`, `minimum`/`maximum`, and `default`.

## Result shape

`ToolExecutionResult {success, data?, error?, duration, timestamp, executionId}`:

| Situation | `success` | `data` / `error` |
| --- | --- | --- |
| Valid call, tool returned | true | `data` = tool payload |
| HTTP failure, timeout, or validation | false | `error` = message |
| Tool reported an error | false (or `isError` true) | error text in content |

## What the user sees

1. **Tool detail** shows the argument form built from the schema.
2. **Run** calls `executeTool`; a spinner reflects the (default 30 s) window.
3. The outcome lands in **Results** with duration and an `executionId` — see [Results & history](./results-history.md).

`formatResult(result)` turns the payload into a readable string for display.

> **Next:** [Results & history](./results-history.md)
