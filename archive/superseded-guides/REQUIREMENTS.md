# Requirements

This document lists the current development, runtime, and deployment prerequisites for MCP Hub based on the repository configuration and code.

## Supported development environments

MCP Hub is structured as:

- an Expo and React Native application for web and mobile surfaces
- a Node.js backend runtime built with Express and tRPC
- a Drizzle-managed relational database layer

A typical contributor environment is a Unix-like shell with Node.js, pnpm, Git, and access to a MySQL-compatible database.

## Required and optional dependencies

| Category | Required | Notes |
|---|---|---|
| Node.js | Yes | Use Node.js 20+ to align with the Docker base image and current tooling |
| pnpm | Yes | The repo is pnpm-first and uses `pnpm@9.12.0` |
| Git | Yes | Required for cloning, branching, and contribution workflow |
| MySQL-compatible database | Yes | Required for `DATABASE_URL`, Drizzle, and local schema operations |
| Docker | Optional | Useful for containerized local and deployment workflows |
| Docker Compose | Optional | Used with `docker-compose.yml` |
| kubectl | Optional | Needed if you deploy with the Kubernetes manifests |
| Android Studio | Optional | Needed for Android emulator or device workflows |
| Xcode | Optional | Needed for iOS simulator/device workflows on macOS |
| Expo mobile tooling | Optional | Helpful for native mobile testing beyond the web target |

## Core software requirements

### Node.js and package management

The repository expects:

- Node.js 20 or newer
- pnpm 9.12.0 or newer

Key scripts include:

- `pnpm dev`
- `pnpm build`
- `pnpm start`
- `pnpm check`
- `pnpm lint`
- `pnpm test`
- `pnpm db:push`

## Database requirements

MCP Hub currently points to a MySQL-oriented setup, not PostgreSQL.

This is supported by:

- `.env.example`, which defines `DATABASE_URL=mysql://user:password@localhost:3306/mcp_hub`
- `drizzle/schema.ts`, which imports from `drizzle-orm/mysql-core`
- `drizzle.config.ts`, which sets `dialect: "mysql"`
- `package.json`, which includes the `mysql2` dependency

If you encounter older PostgreSQL references in legacy docs, verify them against the current code and environment configuration before using them.

## Environment configuration requirements

Copy `.env.example` to `.env` before running locally.

The current example includes:

- `NODE_ENV`
- `PORT`
- `EXPO_PORT`
- `DATABASE_URL`
- `COOKIE_SECRET`
- `JWT_SECRET`
- `MCP_SERVER_URL`
- `OPENAI_API_KEY`

At minimum, local contributors should provide valid values for:

- `DATABASE_URL`
- `COOKIE_SECRET`
- `JWT_SECRET`
- any external integration keys needed for the feature they are testing

## Build and runtime requirements

### Local development

For the standard local workflow you need:

- dependencies installed with `pnpm install`
- a populated `.env`
- a reachable MySQL-compatible database
- schema generation and migration via `pnpm db:push`

### Backend runtime

The backend server:

- defaults to port `3000` unless `PORT` is overridden
- serves the landing page and backend routes from the Express entry point
- mounts tRPC under `/api/trpc`

### Web and mobile runtime

The Expo web target defaults to port `8081` through `EXPO_PORT`.

If you plan to run native targets, additional local mobile tooling is required:

- Android Studio for Android builds
- Xcode for iOS builds on macOS

## Container and deployment prerequisites

### Docker

The provided `Dockerfile` uses:

- `node:20-alpine`
- pnpm via Corepack
- `pnpm build` during image creation
- port `3000` for the application runtime

### Docker Compose

`docker-compose.yml` expects:

- a local `.env` file
- the app to run on port `3000`
- Docker build support on the host machine

### Kubernetes

The Kubernetes manifests assume:

- a container image is available
- secrets are injected via `envFrom.secretRef`
- service and ingress resources are managed in your cluster
- you have cluster access and `kubectl` configured

## Optional tooling for contributors

Depending on your role, the following can help:

- Docker for reproducing deployment-like environments
- kubectl for validating manifests
- Expo native tooling for mobile-specific debugging
- browser devtools and device simulators for UI validation

## Practical baseline

For most contributors, the minimum practical setup is:

1. Node.js 20+
2. pnpm 9.12.0+
3. Git
4. a MySQL-compatible database
5. a populated `.env` copied from `.env.example`
6. `pnpm install && pnpm db:push && pnpm dev`
