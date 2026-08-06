---
description: Workflow procedures, the step engine, dryRun semantics, and the current limitations (stubbed tool steps, in-memory store).
tags:
  - workflows
  - automation
  - engine
title: Workflows
---
> [!NOTE] Status
> **Experimental** · Last verified 2026-08-06 · Commit `0691562`

| Field | Value |
| --- | --- |
| Purpose | Multi-step workflows over tools: document shape, engine, and honest current limits. |
| Audience | End users building automations. |
| Source paths | `server/procedures/workflows.ts`, `server/macros/workflow-engine.ts`, `app/(tabs)/workflow-templates.tsx` |
| Prerequisites | [Macros](./macros.md) |
| Next | [Templates](./templates.md) |

## What a workflow is

A workflow is a server-side automation script made of **steps** with branching and loops, stored in an in-memory `Map` (`workflowStore`).

| Procedure | Input | Returns |
| --- | --- | --- |
| `workflows.list` | — | `{id, name, description?, steps, createdAt, lastModified, lastExecuted?, executionCount}[]` |
| `workflows.getById` | workflowId | The same document. |
| `workflows.create` | `{name, description?}` | A new empty workflow, id `workflow-<timestamp>`. |
| `workflows.save` | `{id, name, description?, steps}` | The updated document. |
| `workflows.execute` | `{id, dryRun?}` | `{success, dryRun?, steps, duration, errors}` |
| `workflows.delete` | workflowId | `{success, workflowId}` |

## Step types

The engine (`WorkflowEngine`) understands five step types: `tool`, `condition`, `loop`, `parallel`, `delay`. It also supports `registerCondition`, `registerLoop`, `setVariable`/`getVariable`, `pauseWorkflow`/`resumeWorkflow`/`stopWorkflow`, and records per-step `ExecutionRecord`s (`pending → running → success | failed | skipped`) plus a `WorkflowContext` of shared variables and errors.

## dryRun semantics

`dryRun` does **not** change how the workflow runs — execution is identical either way. The only difference: when `dryRun` is false, the workflow's `lastExecuted` is set and `executionCount` incremented. `dryRun` is echoed back in the response.

## Honest limits (read this)

- **Tool steps are stubs.** `WorkflowEngine.executeTool` logs and returns `{success: true, toolName: step.name}` — it does **not** call the real MCP tool. Tool automation is not yet wired end to end.
- **In-memory.** Workflows vanish on server restart.
- **No triggers.** The document has no `triggers` field; there is no scheduling in this router (the scheduler is a separate, disabled module).
- The **schedule-workflow** screen exists but depends on scheduling capabilities that are not wired into the router — treat it as a preview.

## UI

`app/(tabs)/workflow-templates.tsx` is the main workflow surface; template-driven creation is covered in [Templates](./templates.md).

> **Next:** [Templates](./templates.md)