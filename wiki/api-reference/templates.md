---
title: Templates API
description: "The templates tRPC router, procedure by procedure — browse, search, and clone workflow templates, with mixed public/protected guards."
tags:
  - wiki
  - api
  - trpc
  - templates
---

> Audience: developers & contributors | Status: living document | Last verified: 2026-08-06

The `templates` router (`server/templates/templates-router.ts`) exposes the **workflow template catalog**. Reading is **public**; cloning requires a session. Backed by `WorkflowTemplateManager` (in-memory); see [Data model](../architecture/data-model.md).

## Procedures

### `getAllTemplates` — query, **public**

No input. Returns every template in the catalog.

### `getTemplate` — query, **public**

Input `{ templateId }`. Returns the template, or **throws** `Template ${templateId} not found` (surfaces as `INTERNAL_SERVER_ERROR`).

### `cloneTemplate` — mutation, **protected**

Input `{ templateId, newName, variables?: record<string, any> }`. Instantiates the template into a new workflow/preset. Returns the clone.

### `searchTemplates` — query, **public**

Input `{ category?: 'github'|'slack'|'notion'|'multi-server'|'custom', tags?: string[], searchText?: string }`. Returns templates filtered by category, tags, and/or free text.

### `getTemplatesByCategory` — query, **public**

Input `{ category: string }`. Returns templates in that category (delegates to the same search path).

### `getFeaturedTemplates` — query, **public**

No input. Returns the top 5 templates by rating (sorts the full catalog by `rating` descending).

## Related pages

- [Templates (user guide)](../user-guide/templates.md) — categories and built-ins.
- [Workflows](workflows.md) — what a cloned template becomes.
- [Data model](../architecture/data-model.md) — where the catalog lives.
- [System](system.md) — shared rate limits.
