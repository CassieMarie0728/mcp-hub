---
title: Documentation Guide
description: How this wiki is written and validated — documentation discipline, wiki conventions, and the OpenKnowledge lint/audit rules that gate docs changes.
tags:
  - contribute
  - documentation
  - wiki
---

> Audience: contributors | Status: living document | Last verified: 2026-08-06

This wiki is part of the MCP Hub product surface, not an afterthought. `CONTRIBUTING.md` treats documentation changes as first-class contributions: they go through the same PR flow and the same gate. This page explains the discipline the repo asks for, and the automated validation this wiki runs.

## Documentation discipline (from CONTRIBUTING.md)

- **Prefer repository facts over assumptions.** If a behavior is not in the code, it is not documented as fact.
- **Verify backend/API claims against `server/_core/index.ts` and `server/routers.ts`.** These two files are the source of truth for what is mounted and reachable.
- **Never document a repository module as a mounted or public API unless the code confirms it.** A router file that exists but is not composed in `server/routers.ts` is not public API — the [API Reference](../api-reference/index.md) section only covers the ten routers that are actually mounted.
- **Update related docs together** when a change affects setup, architecture, or usage. A single feature change often touches several pages; leave none stale.

## Wiki structure

| Section | Audience / purpose |
| --- | --- |
| [Start here](../start-here/index.md) | New users getting oriented. |
| [User guide](../user-guide/index.md) | Feature usage without internals. |
| [Install & configure](../install-and-configure/index.md) | Running, configuring, and deploying MCP Hub. |
| [Architecture](../architecture/index.md) | How it works, file by file. |
| [API reference](../api-reference/index.md) | The tRPC surface, procedure by procedure. |
| [Develop & Contribute](../contribute/index.md) | This section — changing MCP Hub. |

## Validation: the OpenKnowledge lint/audit rules

The wiki is an OpenKnowledge project, so docs changes are validated by two automated rules (in addition to the normal `pnpm check` / `pnpm lint` / `pnpm test` gate):

1. **Markdown linting** — each page must satisfy the configured markdownlint rules (e.g. no hard tabs, trailing newline present, correct heading levels). Fixable violations can be auto-fixed; the rest need content edits.
2. **Link audit** — every internal wiki link must resolve to an existing document. Broken links surface as warnings, so a page that links to a not-yet-written target shows up in the audit.

The audit reports both together, grouped by the file to fix, so a docs change is not considered clean until both lint and links pass.

## How to update a page

1. Read the current page fully first — sections cross-link heavily, and edits must stay consistent with the rest of the wiki.
2. Change behavior, then update docs in the **same** PR, per `CONTRIBUTING.md`.
3. Verify every claim you touch against the code (`server/_core/index.ts`, `server/routers.ts`).
4. Run the docs validation after editing and resolve any lint or dead-link findings before opening the PR.
5. If you add a page, link it from the nearest section hub so it is not an orphan; if you rename or move a page, update all inbound links.

> [!IMPORTANT]
> Docs-only PRs still pass through the normal gate. Keep the wiki factual, code-verified, and in sync — a stale doc is a bug.

## Next steps

- [Development workflow](development-workflow.md) — how a docs change flows through the PR lifecycle.
- [Coding standards](coding-standards.md) — the style contract for the code the docs describe.
- [Testing strategy](testing-strategy.md) — the gate docs changes share.
