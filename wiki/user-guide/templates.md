---
description: Workflow/macro templates — categories, procedures, built-ins, and the current in-memory limitations.
tags:
  - templates
  - workflows
  - catalog
title: Templates
---
> [!NOTE] Status
> **Experimental** · Last verified 2026-08-06 · Commit `0691562`

| Field | Value |
| --- | --- |
| Purpose | Reusable starting shapes for workflows and macros. |
| Audience | End users and contributors. |
| Source paths | `server/templates/templates-router.ts`, `server/templates/workflow-templates.ts`, `app/template/[id].tsx` |
| Prerequisites | [Workflows](./workflows.md) |
| Next | [Webhooks](./webhooks.md) |

## What a template is

A `WorkflowTemplate` is a parameterized workflow scaffold: `{id, name, description, category, steps, variables, tags, author, version, createdAt, updatedAt, isPublic, cloneCount, rating, documentation}`.

| Sub-shape | Fields |
| --- | --- |
| `TemplateStep` | `id, name, description, serverId, serverType, toolName, parameters, condition?, retryPolicy?, timeout?` |
| `TemplateVariable` | `id, name, type (string \| number \| boolean \| array \| object), description, defaultValue?, required, options?` |

Categories: `github`, `slack`, `notion`, `multi-server`, `custom`.

## Procedures

| Procedure | Access | Input | Returns |
| --- | --- | --- | --- |
| `templates.getAllTemplates` | public | — | All templates. |
| `templates.getTemplate` | public | `templateId` | One template. |
| `templates.cloneTemplate` | protected | `templateId`, `newName`, `variables?` | A clone (id `cloned-<ts>-<rand>`, `isPublic: false`, `cloneCount: 0`) with `{{ var }}` placeholders interpolated. |
| `templates.searchTemplates` | public | `category?`, `tags?`, `searchText?` | Matching templates. |
| `templates.getTemplatesByCategory` | public | `category` | That category. |
| `templates.getFeaturedTemplates` | public | — | Top 5 by `rating`. |

## Built-in templates

All three ship in the `multi-server` category:

| Name | Id | Rating |
| --- | --- | --- |
| GitHub Issue to Slack | `github-to-slack-001` | 4.8 |
| GitHub PR to Notion | `github-to-notion-001` | 4.6 |
| Slack to GitHub Issue | `slack-to-github-001` | 4.5 |

## Honest limit (read this)

`WorkflowTemplateManager` exposes its store through **static methods that construct a fresh instance on every call** — so template state does not persist across calls in the running server. Treat the catalog as illustrative data, not yet as a durable library.

## UI

`app/template/[id].tsx` renders a template; `app/(tabs)/workflow-templates.tsx` lists and creates from them.

> **Next:** [Webhooks](./webhooks.md)