---
description: Build and run macros (saved tool sequences) — the engine, options, simulated execution, and client-side persistence.
tags:
  - macros
  - automation
  - builder
title: Macros
---
> [!NOTE] Status
> **Experimental** · Last verified 2026-08-06 · Commit `0691562`

| Field | Value |
| --- | --- |
| Purpose | How to build, run, and manage macros — saved tool call sequences. |
| Audience | End users automating repeated calls. |
| Source paths | `lib/engines/MacroExecutionEngine.ts`, `lib/models/Macro.ts`, `app/(tabs)/macro-builder.tsx`, `components/SaveAsMacroModal.tsx` |
| Prerequisites | [Tool execution](./tool-execution.md) |
| Next | [Workflows](./workflows.md) |

## What a macro is

A macro is an ordered list of **steps**, each calling one tool on one server, plus metadata:

| Macro field | Meaning |
| --- | --- |
| `id`, `name`, `description?` | Identity. |
| `steps: MacroStep[]` | The ordered tool calls. |
| `variables?` | Reusable `{{name}}`-style values. |
| `tags?`, `isFavorite`, `usageCount` | Organization and usage. |
| `version`, `createdBy?`, `createdAt`, `updatedAt`, `lastExecutedAt?` | Lifecycle. |

A step (`MacroStep`) is `{id, serverId, serverName, toolName, parameters, resultFormat?, expectedResult?, timeout?, retryOnFailure?, maxRetries?, order}`.

## Building a macro

1. Run a tool (see [Tool execution](./tool-execution.md)).
2. **Save as macro** — the `SaveAsMacroModal` captures the call as a step.
3. Open **Builder** (`macro-builder`), arrange more steps, set variables and retry options.
4. Save; the macro appears in `macro-gallery` and `macro/[id]`.

## Running a macro

`MacroExecutionEngine.executeMacro(macro, options)` runs steps in order. Options:

| Option | Effect |
| --- | --- |
| `variables` | Values substituted into `{{name}}` parameters. |
| `stopOnError` | Abort the run on the first failed step. |
| `retryFailedSteps` + `step.maxRetries` | Retry failed steps. |
| `timeout` | Per-step timeout. |
| `onStepComplete` / `onStepError` / `onProgress` | Live progress callbacks. |

Control at any time: `pause()`, `resume()`, `cancel()`. Status lifecycle is `MacroStatus`: `IDLE → PLAYING → PAUSED → COMPLETED | FAILED` (plus `RECORDING`).

## How execution really works (read this)

Execution is **simulated**, not live: each step calls `simulateToolExecution`, which resolves after ~100 ms with `{tool, parameters, timestamp, success: true}`. Tools are **not actually invoked** during a macro run in the current engine. Use macros to rehearse and structure automation, not yet as production pipelines — the engine is explicitly an MVP stepping stone.

## Persistence

Macros are **client-side**: `isFavorite`, `usageCount`, and the macro list live in the app's local storage, not on the backend. There is no server-side macro store.

## Related screens

`macro-builder`, `macro-editor`, `macro-gallery`, `macro-chaining`, `macro-scheduling`, `macro-sharing`, `macro/[id]`. Disabled macro features (recorder, debugger, marketplace, comments, version history) are cataloged in the [disabled catalog](../project/disabled-catalog.md).

> **Next:** [Workflows](./workflows.md)
