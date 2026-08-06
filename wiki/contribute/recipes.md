---
title: Recipes
description: Copy-paste workflows for common contributor tasks — full-stack loop, add a procedure, schema change, docs update, containerized deploy.
tags:
  - contribute
  - recipes
  - howto
---

> Audience: contributors | Status: living document | Last verified: 2026-08-06

Bite-size, copy-paste workflows for the tasks contributors actually do. Each recipe points to the page with the full detail. All commands assume you have completed [Setup](setup.md).

## Run the full-stack dev loop

The single command that runs the backend watcher and the Expo web client together:

```bash
corepack pnpm dev
```

Verify the API at `http://localhost:3000/api/health`. See [Local development](../install-and-configure/local-development.md) for the startup logs and port behavior.

## Run only the API server

```bash
corepack pnpm dev:server
```

Runs `node --loader tsx server/_core/index.ts` on port 3000 (scans up to 3019 if busy). This is the fastest loop for backend-only work.

## Run only the web client

```bash
corepack pnpm dev:metro
```

Runs Expo web on `EXPO_PORT` (default 8081).

## Run the pre-PR gate

```bash
./scripts/test.sh
```

Runs `pnpm check` + `pnpm lint` + `pnpm test`. If schema behavior changed, add `pnpm db:push` and test against a local database (see [Development workflow](development-workflow.md)).

## Make a schema change

1. Edit `drizzle/schema.ts`.
2. `corepack pnpm db:push` (generates + applies migrations).
3. Review the generated migration output in `drizzle/`.
4. Commit the schema file **and** the generated migration.

See [Database](../install-and-configure/database.md) for the full walkthrough.

## Format the whole repo

```bash
corepack pnpm format
```

Normalizes everything to `.prettierrc` (semicolons, single quotes, trailing commas, 100-column). Run this before committing to keep the diff clean.

## Update the docs

1. Verify every claim against the code: backend/API claims against `server/_core/index.ts` and `server/routers.ts`.
2. Follow the wiki conventions and validation rules in the [Documentation guide](documentation.md).
3. Update related docs together when behavior, setup, architecture, or API expectations change.

## Add a backend procedure

1. Find the router for the feature in `server/<feature>/` (the ten mounted routers are listed in [API Reference](../api-reference/index.md)).
2. Add your procedure to that router, following the existing guard style (`public` / `protected` / `admin`).
3. Add or extend the security suite in `tests/` that asserts the guard behavior.
4. Run `./scripts/test.sh`.

> [!IMPORTANT]
> Do **not** create a new router file and assume it is mounted — only the ten routers composed in `server/routers.ts` are reachable. Verify mounts against `server/routers.ts`, never against an unlisted file.

## Containerized build and deploy

```bash
./scripts/build.sh     # pnpm build (esbuild production bundle to dist/)
./scripts/deploy.sh    # docker build + kubectl apply kubernetes/ deployment + ingress
```

`deploy.sh` defaults `IMAGE_NAME=ghcr.io/your-org/mcp-hub` and `IMAGE_TAG=latest`; override via `IMAGE_NAME` / `IMAGE_TAG` env vars. Requires Docker and kubectl — see [Docker & Kubernetes](../install-and-configure/docker.md).

## Next steps

- [Development workflow](development-workflow.md) — the lifecycle these recipes fit into.
- [CI/CD](ci-cd.md) — what automation does with your branch.
- [Testing strategy](testing-strategy.md) — what the gate protects.
