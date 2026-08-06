---
title: Testing Strategy
description: How tests gate a contribution — the check/lint/test contract, scripts/test.sh, what the active suites cover, and when to add tests.
tags:
  - contribute
  - testing
  - vitest
---

> Audience: contributors | Status: living document | Last verified: 2026-08-06

This page is the contribution-facing view of testing. It focuses on the **gate** — what you must run and what it protects. For the full suite map (which files live where, what each covers, and what is excluded) see [Testing](../architecture/testing.md) in the architecture section.

## The gate: three separate commands

The three checks are independent scripts — running one does not run the others:

| Command | Runs | Catches |
| --- | --- | --- |
| `pnpm check` | `tsc --noEmit` | Type errors (strict mode) |
| `pnpm lint` | `expo lint` (ESLint) | Style and lint violations |
| `pnpm test` | `vitest run` | Behavior regressions in active suites |

Run **all three** before opening a PR. The one-command shortcut that does exactly this is the repository's own script:

```bash
./scripts/test.sh
```

CI runs the identical sequence (`pnpm check` then `pnpm lint` then `pnpm test`) on every push and PR — see [CI/CD](ci-cd.md). The gate applies to documentation changes too, which are additionally validated by the OpenKnowledge lint/audit rules in the [Documentation guide](documentation.md).

## What the active suites actually cover

- **Client units** (`lib/__tests__/`): MCP client JSON-RPC behavior, HTTP client contract, connection/tool-execution services, app features (theme, settings, onboarding, new-features).
- **Security & integration** (`tests/`): router authorization guards (`router-security`, `extended-router-security`), MCP registration safety (`mcp-security`), logout/auth flows, AI-security posture.

> [!IMPORTANT]
> The large root `__tests__/` tree (26 older feature suites) is **excluded** by `vitest.config.ts`, so a green suite does **not** cover everything that lives there. Do not rely on those tests as coverage of the current behavior.

## When to add tests

Add or update tests when you change:

- **App logic** — client services and libraries (`lib/__tests__/`).
- **Backend procedures** — the security/integration suites in `tests/` assert the `UNAUTHORIZED`/`FORBIDDEN` guard behavior of the tRPC procedures.
- **Integration behavior** — anything that crosses the client/server boundary.

For a small style-only or docs change, adding a test is usually unnecessary — but the three checks must still pass.

## If your change touches the schema

Tests alone are not the gate for persistence changes. If your change affects schema or persistence behavior, `CONTRIBUTING.md` additionally requires `pnpm db:push` and testing against a local database (see [Development workflow](development-workflow.md#5-schema-changes-drizzle)).

## Next steps

- [CI/CD](ci-cd.md) — the same gates run automatically on your branch.
- [Development workflow](development-workflow.md) — when the gate runs in the PR lifecycle.
- [Testing](../architecture/testing.md) — full suite map and excluded directories.
