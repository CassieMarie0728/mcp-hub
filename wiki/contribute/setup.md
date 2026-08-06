---
title: Setup
description: "Contribute to MCP Hub from a clean checkout — prerequisites, fork/clone, install, environment, and verification."
tags:
  - contribute
  - setup
---

> Audience: contributors | Status: living document | Last verified: 2026-08-06

This page is the contributor onboarding path. It covers the same ground as [Local development](../install-and-configure/local-development.md) but from the contribution angle: fork, branch, install, and the gate you must pass before a PR. If you only need to run the project (not change it), start with [Local development](../install-and-configure/local-development.md) instead.

## Prerequisites

| Requirement | Notes |
| --- | --- |
| Node.js 20+ | CI pins node-version 20; Node 24 has been verified locally. |
| pnpm | Activate the pinned version with `corepack enable`, then always run `corepack pnpm` (pnpm is often not on PATH on Windows). |
| Git | Fork and clone from the GitHub remote. |
| MySQL-compatible database | Optional for exploration — the server boots without one. Required only if you exercise user persistence. See [Database](../install-and-configure/database.md). |
| Expo mobile tooling | Optional — Android Studio / Xcode only for the `android` / `ios` scripts. |

See `REQUIREMENTS.md` at the repo root for the canonical statement, and [Environment variables](../install-and-configure/environment-variables.md) for every config knob.

## 1. Fork and clone

1. Fork the repository on GitHub (remote is `CassieMarie0728/mcp-hub`).
2. Clone your fork and add the upstream remote:

```bash
git clone https://github.com/<your-username>/mcp-hub.git
cd mcp-hub
git remote add upstream https://github.com/CassieMarie0728/mcp-hub.git
```

## 2. Install dependencies

```bash
corepack enable
corepack pnpm install
```

The `packageManager: pnpm@9.12.0` field pins the version. CI and Docker install with a frozen lockfile; for a fresh local clone the plain install above is what you want.

## 3. Configure environment

```bash
cp .env.example .env
```

A bare copy works for local exploration. The documented scripts include an automation shortcut:

```bash
./scripts/setup.sh   # checks pnpm, installs, and copies .env.example to .env if missing
```

## 4. Run the app

```bash
corepack pnpm dev
```

`pnpm dev` runs the backend watcher and the Expo web development server together. To run them separately:

```bash
corepack pnpm dev:server   # API on port 3000 (scans up to 3019 if busy)
corepack pnpm dev:metro    # Expo web on EXPO_PORT (default 8081)
```

Verify the API with `http://localhost:3000/api/health` to get `{ ok: true, ... }`. See [Local development](../install-and-configure/local-development.md) for the expected startup logs.

## 5. Verify before you branch

```bash
./scripts/test.sh   # pnpm check + pnpm lint + pnpm test
```

This is the exact gate the repository expects before a PR (see [Testing strategy](testing-strategy.md)). If it is green, you are ready to make changes — branch from `main` following the conventions in [Development workflow](development-workflow.md).

## Next steps

- [Development workflow](development-workflow.md) — branch, commit, PR, and schema conventions.
- [Coding standards](coding-standards.md) — what the codebase expects stylistically.
- [Environment variables](../install-and-configure/environment-variables.md) — configure OAuth, tokens, and integrations.
- [Database](../install-and-configure/database.md) — turn on user persistence.
