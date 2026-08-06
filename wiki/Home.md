---
title: Home
description: MCP Hub wiki home — the canonical navigation layer over the mcp-hub repository, with honest feature status and verified sources.
tags:
  - wiki
  - hub
---
> Audience: everyone | Status: living document | Last verified: 2026-08-06 | Owner: repo maintainers

MCP Hub is a mobile-first, cross-platform control center for connecting **MCP servers**, discovering their **tools**, executing those tools safely, and composing **reusable automation** (macros, workflows, schedules, and webhooks). One app for Android, iOS, and web — backed by an Express + tRPC API and MySQL.

> [!IMPORTANT]
> This wiki is the **canonical navigation layer** for the `mcp-hub` repository (current `main` audited at commit `0691562`, 2026-08-06). Every page states a **feature status** and cites the **source file** it was verified against. If a root-level report or generated doc disagrees with a wiki page, the wiki's evidence hierarchy says the wiki wins — but tell us about the disagreement. See [Feature status](./project/feature-status.md) for the label definitions and the [contradiction register](./project/feature-status.md#known-contradictions-fixed-here).

## What MCP Hub does today

- **Connect to MCP servers** over a custom HTTP gateway convention (`GET /mcp/info`, `GET /mcp/tools/list`, `POST /mcp/tools/call`) with bearer, API-key, or basic auth. Status: **Stable**. See [Server connections](./user-guide/server-connections.md).
- **Discover tools** and render their JSON Schema inputs as forms. Status: **Stable**. See [Tool discovery](./user-guide/tool-discovery.md).
- **Execute tools** and record history/analytics. Status: **Stable** (HTTP path); credentials are redacted before they reach the client. See [Tool execution](./user-guide/tool-execution.md).
- **Register GitHub, Slack, and Notion** as built-in server presets with token validation. Status: **Beta**. See [Integrations & OAuth](./user-guide/integrations-oauth.md).
- **Macros, workflows, templates, schedules, webhooks, tokens, team workspaces, analytics** — UI and in-memory engines exist and are heavily tested, but several do **not** yet call real tools (macro execution simulates steps). Status: **Experimental** unless a page says otherwise. See [Feature tour](./start-here/feature-tour.md).

> [!WARNING]
> Do not treat simulated or in-memory features as production-ready. The [Feature status](./project/feature-status.md) page separates **what is wired end-to-end** from **what is UI + in-memory engine** from **what is parked under `app/_disabled`**. Read it before you rely on any capability.

## Choose your path

| I want to… | Start here |
| --- | --- |
| Use MCP Hub | [Five-minute quickstart](./start-here/quickstart.md) → [Connect a server](./user-guide/server-connections.md) → [Execute a tool](./user-guide/tool-execution.md) |
| Self-host MCP Hub | [Installation overview](./install-and-configure/installation-overview.md) → [Local development](./install-and-configure/local-development.md) → [Deployment overview](./operate/deployment-overview.md) |
| Integrate an MCP server | [MCP in plain English](./start-here/mcp-in-plain-english.md) → [MCP integration architecture](./architecture/mcp-integration.md) → [Connections API](./api-reference/connections.md) |
| Contribute code | [Contributor setup](./contribute/setup.md) → [Development workflow](./contribute/development-workflow.md) → [Recipes](./contribute/recipes.md) |
| Operate a deployment | [Deployment overview](./operate/deployment-overview.md) → [Production checklist](./operate/production-checklist.md) → [Monitoring & runbooks](./operate/monitoring-runbooks.md) |
| Something broke | [Troubleshooting home](./help/troubleshooting.md) → [Diagnostic checklist](./help/diagnostics.md) |

## Current project snapshot

- **Package version:** `1.0.0` (from `package.json` / `app.config.ts`; no tagged release yet in this audit).
- **Toolchain:** pnpm `9.12.0` (declared via `packageManager`), Node 20+ (CI runs Node 20; verified locally on Node 24.19.0), TypeScript ~5.9.3.
- **Frontend:** Expo SDK ~54, React Native 0.81.5, React 19.1.0, Expo Router ~6, NativeWind 4 + Tailwind 3.4.
- **Backend:** Express 4.22, tRPC 11.17, Drizzle ORM 0.45 (MySQL via `mysql2`), Zod 4, Socket.IO 4.8, Winston, prom-client.
- **Testing:** Vitest 4.1. `pnpm test` runs `lib/__tests__/**` and `tests/**`; the large root `__tests__/` tree is **excluded** by `vitest.config.ts` — see [Testing strategy](./contribute/testing-strategy.md) for what that means.
- **Platforms:** Android (minSdk 24), iOS (needs macOS/Xcode), Docker, and Kubernetes manifests provided.
- **Capability summary:** connections/tools **stable**; providers & OAuth **beta**; macros/workflows/webhooks/tokens/analytics/team **experimental**; 23 screens parked under `app/_disabled`.

## Scope clarification

- **MCP Hub is not an MCP server.** It is a *client and host*: it talks to MCP servers and exposes their tools through its own tRPC API and UI.
- **MCP Hub is not an AI model or provider.** `OPENAI_API_KEY` is an optional integration for AI-assisted features; MCP Hub does not host models.
- **Connecting services ≠ hosting them.** MCP Hub connects to MCP servers you already run (or to built-in presets that target provider HTTP gateways). It does not run those servers for you.
- **Cloud-hosted vs self-hosted:** the application is the same in both modes; the difference is who runs the Node backend + MySQL (you, or a cloud platform). See [Deployment overview](./operate/deployment-overview.md).

## The wiki map

- [Start Here](./start-here/index.md) — product, MCP concepts, quickstart, glossary.
- [Install & Configure](./install-and-configure/index.md) — environment, database, Android/iOS/web, Docker.
- [User Guide](./user-guide/index.md) — every feature, how to use it, with honest status labels.
- [Architecture](./architecture/index.md) — how the system actually works, file by file.
- [API Reference](./api-reference/index.md) — the tRPC surface, procedure by procedure.
- [Develop & Contribute](./contribute/index.md) — setup, standards, recipes, testing, CI/CD.
- [Deploy & Operate](./operate/index.md) — production, monitoring, backup, upgrades.
- [Security & Governance](./security-governance/index.md) — threat model, secrets, MCP safety.
- [Help](./help/index.md) — symptom-first troubleshooting.
- [Project](./project/index.md) — roadmap, releases, limitations, feature status, history.
