---
title: Workflows API
description: "The workflows tRPC router, procedure by procedure — create, save, and execute multi-step workflows with dry-run support."
tags:
  - wiki
  - api
  - trpc
  - workflows
---

> Audience: developers & contributors | Status: living document | Last verified: 2026-08-06

The `workflows` router (`server/procedures/workflows.ts`) manages **multi-step workflows** and runs them through the `WorkflowEngine` (`server/macros/workflow-engine.ts`). All procedures are **protected**. Workflows live in an in-memory `workflowStore`; see [Data model](../architecture/data-model.md).

## The workflow shape

Procedures return (and `save` accepts) a workflow object:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Generated as `workflow-<timestamp>` on create. |
| `name` | string | |
| `description` | string | Empty string when unset. |
| `steps` | array | Opaque step list (`WorkflowStep[]`); see [workflow-engine.ts](https://github.com/anomalyco/mcp-hub/blob/main/server/macros/workflow-engine.ts). |
| `createdAt` | Date | |
| `lastModified` | Date | |
| `lastExecuted` | Date \| null | |
| `executionCount` | number | |

## Procedures

### `list` — query

No input. Returns all workflows.

### `getById` — query

Input: string (the workflow id). Returns the workflow, or **throws** `'Workflow not found'` (surfaces as `INTERNAL_SERVER_ERROR`).

### `create` — mutation

Input `{ name, description? }`. Creates a workflow with an empty step list. Returns the workflow object.

### `save` — mutation

Input `{ id, name, description?, steps: any[] }`. Replaces the workflow's name/description/steps and bumps `lastModified`. Throws `'Workflow not found'` for an unknown id.

### `execute` — mutation

Input `{ id, dryRun?: boolean }`. Runs the workflow through `WorkflowEngine`:

- Registers every step, executes from the first step's id.
- Non-`dryRun` runs bump `lastExecuted` and `executionCount`; dry runs do not.

Returns `{ success: true, dryRun, steps: ExecutionRecord[], duration: number, errors: WorkflowError[] }` — `steps` is the per-step execution history and `duration` the summed step durations.

> [!WARNING]
> Tool steps in the engine are **simulated**: `WorkflowEngine.executeTool` logs the step and returns `{ success: true, toolName }` without calling a real MCP tool. See [Workflows (user guide)](../user-guide/workflows.md) for the honest status.

### `delete` — mutation

Input: string (the workflow id). Removes the workflow. Returns `{ success: true, workflowId }`. Throws `'Workflow not found'` for an unknown id.

## Related pages

- [Workflows (user guide)](../user-guide/workflows.md) — how the screens use these procedures.
- [Macros (user guide)](../user-guide/macros.md) — the related single-sequence automation.
- [Data model](../architecture/data-model.md) — where the workflow store lives.
- [System](system.md) — shared rate limits.
