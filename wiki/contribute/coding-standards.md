---
title: Coding Standards
description: Style and layout expectations for MCP Hub — TypeScript, Prettier, ESLint, editorconfig, and repository module boundaries.
tags:
  - contribute
  - standards
  - style
---

> Audience: contributors | Status: living document | Last verified: 2026-08-06

This page captures the repository's tooling-driven style contract. The authoritative list of tooling files lives at the repo root: `tsconfig.json`, `.eslintrc`, `eslint.config.js`, `.prettierrc`, and `.editorconfig`. `pnpm format` (`npx prettier --write .`) will fix formatting for you before you commit.

## Toolchain summary

| Concern | Tool / config | Enforced by |
| --- | --- | --- |
| Language | TypeScript, **strict mode** (`tsconfig.json`) | `pnpm check` (`tsc --noEmit`) |
| Formatting | Prettier via `.prettierrc` | `pnpm format` + CI lint |
| Linting | ESLint via `.eslintrc` (and flat `eslint.config.js`) | `pnpm lint` (`expo lint`) |
| Editor rules | `.editorconfig` | editors |

## TypeScript

- **Strict mode** is on via `tsconfig.json` (extends `expo/tsconfig.base`). `pnpm check` runs `tsc --noEmit` and must pass with zero errors before a PR.
- Path aliases: `@/*` resolves to `./*` and `@shared/*` to `./shared/*`.
- Use TypeScript for all application and server changes — no plain JavaScript for new code.

## Prettier (`.prettierrc`)

| Setting | Value |
| --- | --- |
| `semi` | `true` |
| `singleQuote` | `true` |
| `trailingComma` | `all` |
| `printWidth` | `100` |
| `tabWidth` | `2` |

Run `pnpm format` before committing to normalize anything your editor missed.

## ESLint

- The classic `.eslintrc` extends `expo` + `eslint:recommended`.
- The flat `eslint.config.js` ignores `dist/*` and turns `react/no-unescaped-entities` into an error.
- CI runs `pnpm lint` on every push/PR (see [CI/CD](ci-cd.md)).

## Editor config

`.editorconfig` enforces UTF-8, LF line endings, and 2-space indentation (markdown is exempt from trailing-whitespace trimming).

## Repository layout expectations

`CONTRIBUTING.md` asks contributors to follow the existing folder and module boundaries. The high-level map (detailed in [Repository map](../architecture/repository-map.md)):

- `app/` — Expo client (screens and UI).
- `lib/` — core client logic, including the `lib/__tests__/` unit tests.
- `server/` — the backend: `server/_core/` (bootstrap, context, system router), `server/<feature>/` routers and procedures, `server/tests/` integration tests.
- `shared/` — constants and types shared between client and server.

Keep modules **purpose-driven and readable**, and avoid large unrelated cleanup in feature branches.

## Documentation discipline

- Prefer **repository facts over assumptions**.
- Verify backend/API claims against `server/_core/index.ts` and `server/routers.ts`.
- **Never document a module as a mounted or public API unless the code confirms it** — see the [Documentation guide](documentation.md).

## Next steps

- [Testing strategy](testing-strategy.md) — how style and correctness are gated.
- [Documentation guide](documentation.md) — keeping docs aligned with code.
- [Recipes](recipes.md) — common task walkthroughs.
