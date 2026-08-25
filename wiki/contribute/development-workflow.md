---
title: Development Workflow
description: How to land a change in MCP Hub — branch naming, conventional commits, the PR flow, the quality gate, and the Drizzle schema workflow.
tags:
  - contribute
  - workflow
  - pr
---

> Audience: contributors | Status: living document | Last verified: 2026-08-06

This page turns `CONTRIBUTING.md` into a step-by-step workflow: branch, commit, gate, PR. The repository expects one scoped change per branch, local checks before opening a PR, and documentation updated whenever behavior, setup, architecture, or API expectations change.

## 1. Branch from main

Create a short-lived branch off `main`. Preferred branch names:

| Prefix | Use for |
| --- | --- |
| `feature/<short-description>` | New functionality |
| `fix/<short-description>` | Bug fixes |
| `docs/<short-description>` | Documentation-only changes |
| `chore/<short-description>` | Maintenance work |

Example: `git checkout -b fix/connection-screen-timeout`.

## 2. Make one scoped change

Keep each branch to a single purpose. The repository explicitly asks you to **avoid large unrelated cleanup** in feature branches, and to make changes that are **purpose-driven and readable**, following the existing folder and module boundaries in [Coding standards](coding-standards.md).

## 3. Commit with Conventional Commits

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/). The recognized types:

- `feat:` — new functionality
- `fix:` — bug fixes
- `docs:` — documentation-only changes
- `refactor:` — internal cleanup without intended behavior change
- `test:` — test changes
- `chore:` — maintenance work

Example from `CONTRIBUTING.md`:

```text
feat(mcp): add server health indicator for connection screen
```

## 4. Run the local gate

The repository's own `CONTRIBUTING.md` defines the required pre-PR checks as `./scripts/test.sh`, which runs the equivalent of:

```bash
pnpm check   # tsc --noEmit
pnpm lint    # expo lint
pnpm test    # vitest run
```

If your change affects **schema or persistence** behavior, also run `pnpm db:push` (see below). See [Testing strategy](testing-strategy.md) for what the suite covers, and [CI/CD](ci-cd.md) for the identical gates CI runs on your PR.

## 5. Schema changes (Drizzle)

MCP Hub uses Drizzle with MySQL-oriented schema definitions. The schema workflow:

1. Update `drizzle/schema.ts`.
2. Run `pnpm db:push` (runs `drizzle-kit generate && drizzle-kit migrate`).
3. Verify the generated migration output.
4. Test against a local database before opening a PR.
5. Update documentation if setup or schema assumptions changed.

Generated migration files are committed as part of the schema change (see the note in [Database](../install-and-configure/database.md)).

## 6. Open the PR

1. Push your branch.
2. Open the pull request — the repository template (`.github/PULL_REQUEST_TEMPLATE.md`) asks for: summary, why, related issues, testing performed, reviewer checklist, and risks/breaking changes.
3. Link related issues when applicable.
4. Call out **breaking changes or migration impact explicitly**, and mention documentation changes.

### PR author checklist

The template's author checklist, verbatim from `CONTRIBUTING.md`:

- My branch is scoped to one clear change.
- I ran `pnpm check`, `pnpm lint`, and `pnpm test`.
- I ran `pnpm db:push` if schema-related behavior changed.
- I updated docs/changelog where needed.
- I verified technical claims against the current codebase.

## 7. Review and merge

- Expect maintainer review before merge.
- Address review comments with **targeted follow-up commits** (do not rewrite the discussion away).
- Keep discussion tied to the scope of the change.
- Prefer a clear commit history unless maintainers request a different merge strategy.

## Reporting issues

Use the GitHub issue templates in `.github/ISSUE_TEMPLATE/` — `bug_report.md` for defects, `feature_request.md` for enhancements, `custom_template.md` for anything else. Include reproduction steps, environment details, expected behavior, and actual behavior whenever possible.

## Next steps

- [Coding standards](coding-standards.md) — style and layout expectations.
- [Testing strategy](testing-strategy.md) — what the suites cover and the exact gate.
- [CI/CD](ci-cd.md) — what happens to your branch on push and PR.
- [Recipes](recipes.md) — copy-paste workflows for common tasks.
