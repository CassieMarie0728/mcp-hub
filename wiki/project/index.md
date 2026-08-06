---
title: Project
description: "Section hub: roadmap, releases and changelog, known limitations, feature status, and the contradiction register."
tags:
  - wiki
  - section
  - project
---

> Audience: everyone | Status: living document | Last verified: 2026-08-06

This section is the project-level view of MCP Hub: where the project is going (roadmap), what has shipped (releases and changelog), what is parked (disabled catalog), and how the wiki's feature-status labels work. If you are trying to decide whether a capability is real, this section is the authority — read [Feature status](feature-status.md) before you rely on anything.

## What this section answers

| Page | What it answers |
| --- | --- |
| [Feature status](feature-status.md) | The wiki's status labels (Stable / Beta / Experimental / Disabled), how they are assigned, and the register of known contradictions between repo docs and reality. |
| [Disabled feature catalog](disabled-catalog.md) | The 22 screens parked under `app/_disabled` — what each would do and why it is off. |

## Roadmap

There is no `ROADMAP.md` in the repository and no published roadmap. The closest thing to a signal is `CHANGELOG.md` (root), which follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). As of this audit:

- **[Unreleased]** — root documentation site config and landing page files; README and contributor guide rework; doc-site deployment. No feature work yet.
- **[1.0.0] - 2026-04-09** — initial MCP Hub application baseline: Expo client + TypeScript backend.

There is no tagged release in `git tag`; the `1.0.0` version comes from `package.json` / `app.config.ts` and the changelog.

## Releases & changelog

The canonical changelog is `CHANGELOG.md` at the repo root (27 lines, two sections: `[Unreleased]` and `[1.0.0]`). The wiki does not duplicate it; see [Build & release](../operate/build-release.md) for how releases are cut.

## Known limitations

The structural limitations that shape every other page:

1. **Almost all state is in-memory.** Servers, tools, tokens, webhooks, workflows, and analytics are lost on restart; only the MySQL `users` table is durable. See [Data model](../architecture/data-model.md) and [Known limitations](../user-guide/server-connections.md#known-limitations).
2. **HTTP transport only.** The MCP config schema accepts `websocket` and `stdio`, but only HTTP is implemented end to end. See [MCP integration](../architecture/mcp-integration.md).
3. **The monitoring subsystem is defined but not wired.** See [Monitoring & runbooks](../operate/monitoring-runbooks.md).
4. **Root-level deployment/testing docs are aspirational.** `DEPLOYMENT.md`, `PRODUCTION_DEPLOYMENT.md`, and `PRODUCTION_TESTING.md` describe PostgreSQL, Redis, PM2, Helm, metrics endpoints, and alert dashboards that do not exist in this codebase.

## History & governance

- **License:** MIT (`LICENSE`, root) — Copyright (c) 2026 MCP Hub contributors.
- **Code of conduct:** `CODE_OF_CONDUCT.md` (root) applies to all contributors.
- **Security policy:** `SECURITY.md` (root); see [Security & Governance](../security-governance/index.md) for the wiki treatment.
- **Contribution rules:** `CONTRIBUTING.md` and the [Develop & Contribute](../contribute/index.md) section.

## Related sections

- [Start Here](../start-here/index.md) — what MCP Hub is, before you trust any feature label.
- [User Guide](../user-guide/index.md) — per-feature pages carry a status label; this section defines what those labels mean.
- [Architecture](../architecture/index.md) — the code each status label is assigned against.
