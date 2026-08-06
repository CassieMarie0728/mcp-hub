---
title: Install & Configure
description: "Section hub: run MCP Hub locally or self-hosted — overview, local dev, environment variables, database, Android/iOS/web, Docker."
tags:
  - wiki
  - section
  - install
---
> Audience: developers & operators | Status: living document | Last verified: 2026-08-06

This section covers everything needed to stand MCP Hub up: what the stack requires, how to run it locally, every environment variable the code reads, database setup, native mobile builds, and containerized deployment.

## Pages in this section

| Page | What it answers |
| --- | --- |
| [Installation overview](installation-overview.md) | Prerequisites, runtime modes, and how the pieces fit together. |
| [Local development](local-development.md) | Clone, install, run the API + Metro, and verify with checks. |
| [Environment variables](environment-variables.md) | Every variable the code reads, plus the `.env.example` contract. |
| [Database](database.md) | MySQL + Drizzle setup, the schema, and migrations. |
| [Android](android.md) | Native Android build prerequisites and configuration. |
| [iOS & web](ios-web.md) | iOS (macOS/Xcode) and Expo static web output. |
| [Docker & Kubernetes](../../install-and-configure/docker.md) | Container image, compose file, and the provided manifests. |

## Suggested reading order

Self-hosting? Start at [Installation overview](installation-overview.md) → [Local development](local-development.md) → [Environment variables](environment-variables.md). Deploying in containers? Jump to [Docker & Kubernetes](../../install-and-configure/docker.md) after the overview.

> [!NOTE]
> Every command in this section was verified on a clean checkout with **Node 24.19.0 + corepack pnpm 9.12.0**. The Docker image and Kubernetes manifests target Node 20 (matching CI). Both work, but pin your toolchain for reproducibility — see [Environment variables](environment-variables.md) for the version contract.
