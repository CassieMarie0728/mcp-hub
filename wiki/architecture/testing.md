---
title: Testing
description: "Test layout, what the suites cover, how to run them, and the pnpm check contract."
tags:
  - architecture
  - testing
  - vitest
---

> Audience: developers & contributors | Last verified: 2026-08-06

How MCP Hub is tested: where the suites live, what they actually verify, and the commands that gate a PR.

## Test runner: Vitest

`vitest.config.ts` includes two patterns:

- `lib/__tests__/**/*.test.ts`
- `tests/**/*.test.ts`

Excluded: the root `__tests__/**` and `**/__fixtures__/**`.

> [!NOTE]
> The root `__tests__/` directory holds 26 feature suites, but it is **excluded** by the vitest config. Those suites are legacy/aspirational coverage — they do not run under the standard test command. Prefer adding tests under `lib/__tests__/` or `tests/`.

## The three suite locations

| Location | Contents | Runs by default? |
| --- | --- | --- |
| `lib/__tests__/` | Unit tests for client libraries: `http-client`, `mcp-client`, `server-connection-service`, `tool-execution-service`, plus app features (theme, settings, onboarding, new-features) | Yes |
| `tests/` | Security & integration suites: `router-security`, `extended-router-security`, `mcp-security`, `auth.logout`, `ai-security` | Yes |
| `__tests__/` | 26 older feature suites (macros, workflows, OAuth flow, presets, load testing, performance profiling, versioning, notifications, …) | No |

## What the active suites cover

- **Client units** (`lib/__tests__/`): the MCP client JSON-RPC behavior, HTTP client contract, connection/tool-execution services, and app-level concerns.
- **Security** (`tests/`): router authorization guards (`router-security`, `extended-router-security`), MCP registration safety (`mcp-security`), logout/auth flows (`auth.logout`), AI-security posture (`ai-security`).
- **Legacy feature suites** (`__tests__/`): macros, workflows/templates, OAuth, presets, analytics, load, performance — useful as documentation of intended behavior even though they are not in the default run.

## The check contract

The package scripts are separate — each is a distinct gate:

| Command | Runs |
| --- | --- |
| `pnpm check` | `tsc --noEmit` (typecheck only) |
| `pnpm lint` | `expo lint` (ESLint) |
| `pnpm test` | `vitest run` (the active suites above) |

> [!IMPORTANT]
> Run `pnpm check`, `pnpm lint`, and `pnpm test` before opening a PR, per the repository instructions in [AGENTS.md](../../AGENTS.md). If a change touches the wiki only, the docs are additionally validated by the OpenKnowledge lint/audit rules described on the [contribute](../contribute/index.md) page.

## Testing notes by area

- **MCP client** — `lib/__tests__/mcp-client.test.ts` exercises the JSON-RPC 2.0 protocol client without a live server.
- **Security guards** — `tests/router-security.test.ts` and `tests/extended-router-security.test.ts` assert the `UNAUTHORIZED`/`FORBIDDEN` behavior of the tRPC procedures.
- **Real servers** — `__tests__/real-mcp-servers.test.ts` documents intent for live-server testing but is outside the default run.

## Related pages

- [Repository map](repository-map.md) — where the test files live in the tree.
- [Contribute](../contribute/index.md) — the contribution workflow and the `pnpm check` requirement.
- [Backend API surface](backend-api-surface.md) — the code under test.
