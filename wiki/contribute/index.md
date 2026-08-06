---
title: Develop & Contribute
description: "Section hub: how to contribute to MCP Hub — contributor setup, development workflow, coding standards, recipes, testing strategy, CI/CD, and the documentation guide."
tags:
  - wiki
  - section
  - contribute
---

> Audience: developers & contributors | Status: living document | Last verified: 2026-08-06

This section is the contributor-facing companion to the rest of the wiki. The [user guide](../user-guide/index.md) tells you *what* MCP Hub does, the [architecture](../architecture/index.md) and [API reference](../api-reference/index.md) sections tell you *how* it is built, and this section tells you how to **change** it. Everything below is grounded in the repository itself — `CONTRIBUTING.md`, `package.json`, the scripts in `scripts/`, the tooling configs, and the workflows in `.github/workflows/`.

## Contribution principles

The repository's own `CONTRIBUTING.md` opens with these principles, and they drive everything in this section:

- Make one **scoped** change at a time, on a short-lived branch.
- Run the relevant local checks before opening a PR (`./scripts/test.sh` = `pnpm check` + `pnpm lint` + `pnpm test`).
- **Update documentation when behavior, setup, architecture, or API expectations change** — docs are part of the product surface.
- Prefer repository facts over assumptions. Verify backend/API claims against `server/_core/index.ts` and `server/routers.ts`, and never document a module as mounted or public API unless the code confirms it.

## Pages in this section

| Page | What it answers |
| --- | --- |
| [Setup](setup.md) | Prerequisites, fork/clone, install, and how the local environment is verified. |
| [Development workflow](development-workflow.md) | Branch naming, commit conventions, the PR flow, and the schema workflow. |
| [Coding standards](coding-standards.md) | TypeScript, Prettier, ESLint, and repo layout expectations. |
| [Testing strategy](testing-strategy.md) | What the Vitest suites cover, what they exclude, and the check/lint/test gate. |
| [Recipes](recipes.md) | Copy-paste workflows for common tasks: full-stack loop, adding a procedure, schema change, docs update. |
| [CI/CD](ci-cd.md) | The three GitHub Actions workflows and what they do on push/PR. |
| [Documentation guide](documentation.md) | How this wiki is maintained and validated, and how to keep docs aligned with code. |

## Suggested reading order

Start at [Setup](setup.md) to get a working environment, then [Development workflow](development-workflow.md) before making your first change. Read [Coding standards](coding-standards.md) and [Testing strategy](testing-strategy.md) once, then use [Recipes](recipes.md) for day-to-day tasks. [CI/CD](ci-cd.md) and the [Documentation guide](documentation.md) matter most once a change is ready to merge.

> [!IMPORTANT]
> The root `README.md` is stale (it mentions Yarn/npm and older versions). Treat `package.json`, `CONTRIBUTING.md`, and the wiki as truth. The project is **pnpm-only**, pinned to `pnpm@9.12.0` via `packageManager`.
