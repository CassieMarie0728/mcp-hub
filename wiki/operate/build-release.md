---
title: Build & Release
description: How MCP Hub artifacts are built and shipped — pnpm build, the Docker image, scripts/build.sh and deploy.sh, and the landing-page deploys.
tags:
  - operate
  - build
  - release
  - ci
---

> Audience: operators & contributors | Status: living document | Last verified: 2026-08-06

This page covers every supported way to produce and ship a build of MCP Hub: the local production build, the Docker image, the deploy scripts, and the automated GitHub Pages deploys for the landing page. The CI pipeline that gates code changes is documented in the [contribute](../contribute/ci-cd.md) section; this page is the operator's view of the same artifacts.

## The production build

| Command | What it does | Output |
| --- | --- | --- |
| `pnpm build` | esbuild bundle of `server/_core/index.ts` | `dist/index.js` |
| `pnpm start` | Run the built bundle in production mode | `NODE_ENV=production node dist/index.js` |
| `scripts/build.sh` | Thin wrapper — runs `pnpm build` | — |

```bash
pnpm build
NODE_ENV=production node dist/index.js
```

The build bundles the backend only (Express + tRPC). The landing page is static HTML served from `landing/` by the Express server, and the Expo web client is a development-time surface — production serves the API, the landing page, and (via OAuth) the mobile/web client flows.

## The Docker image

The two-stage `Dockerfile` (full contents in [Docker & Kubernetes](../install-and-configure/docker.md)) builds inside the image:

1. `pnpm install --frozen-lockfile` on `node:20-alpine` with corepack-pinned `pnpm@9.12.0`.
2. `pnpm build` produces the production bundle.
3. `CMD ["pnpm", "start"]` serves it on port 3000.

Build and tag it yourself:

```bash
docker build -t mcp-hub:latest .
```

For Kubernetes you need a registry reference — the manifest defaults to `ghcr.io/your-org/mcp-hub:v1.0.0` (replace with your registry).

## `scripts/deploy.sh`

The deploy script wraps Docker build + `kubectl apply`:

```bash
IMAGE_TAG="${IMAGE_TAG:-latest}"
IMAGE_NAME="${IMAGE_NAME:-ghcr.io/your-org/mcp-hub}"
docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" .
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/ingress.yaml
```

```bash
IMAGE_NAME=ghcr.io/your-org/mcp-hub IMAGE_TAG=v1.0.0 ./scripts/deploy.sh
```

> [!WARNING]
> `deploy.sh` does **not** push the image to the registry or roll a rollout — it builds locally and applies the manifests, which reference whatever image you tagged. The Kubernetes `imagePullPolicy: IfNotPresent` means a node only pulls what it does not already have. Publishing the image and managing rollouts is left to you (see the [Production checklist](production-checklist.md)).

## Landing page deploys

The static `landing/` site is served two ways:

1. **By the app** — Express serves `landing/index.html` at `/` and the rest of `landing/` as static assets (`server/_core/index.ts`).
2. **To GitHub Pages** — two workflows deploy it on pushes to `main` ([contribute](../contribute/ci-cd.md)): `deploy-landing-page.yml` (uploads `landing-page/` or `landing/`) and `static.yml` (uploads `./landing`). Both share the `pages` concurrency group and target the `github-pages` environment.

If you edit landing assets, the app serves them on the next restart; the Pages deploys happen automatically on `main` pushes.

## Versioning and changelog

The API health payload reports a hard-coded `version: "1.0.0"` ([System API](../api-reference/system.md)). There is no release tooling, version bump automation, or generated changelog in the repo — release notes and version tagging are manual.

## Rollback guidance

Because the release surface is "build an image, run it" (single host) or "build, tag, apply" (Kubernetes), rollback is:

- **Docker single host:** `docker run` the previous image tag (keep prior tags around).
- **Kubernetes:** `kubectl set image deployment/mcp-hub mcp-hub=<previous-tag>` — the manifests reference the image, so pointing at the prior tag reverts it.
- **Database migrations:** `pnpm db:push` is forward-only (`drizzle-kit generate && migrate`); there is no automated rollback for applied migrations. Back up before migrating ([Database](../install-and-configure/database.md)).

## Next steps

- [Production checklist](production-checklist.md) — what to verify after a release.
- [Reverse proxy](reverse-proxy.md) — expose the built app over TLS.
- [CI/CD](../contribute/ci-cd.md) — the automated gates and Pages deploys.
- [Docker & Kubernetes](../install-and-configure/docker.md) — the image and manifests in full.
