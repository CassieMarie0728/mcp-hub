# MCP Hub

[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![TypeScript](https://img.shields.io/badge/typescript-5.9-blue)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/react--native-0.81-blue)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/expo-54-black)](https://expo.dev/)

MCP Hub is a centralized platform for connecting to and interacting with Model Context Protocol servers across web, iOS, and Android surfaces backed by an Express and tRPC server runtime.

## Overview

The repository combines an Expo application, a Node.js backend, and a documentation set for working with MCP servers, discovering tools, executing actions, and extending the platform over time.

> The repository contains more feature modules than are currently mounted in the main backend router. This README distinguishes between implemented repository surfaces and the backend/API surfaces that are clearly registered in code.

## Current architecture

MCP Hub currently includes:

- an Expo Router application under `app/` for web and mobile interfaces
- an Express server entry point at `server/_core/index.ts`
- a tRPC router assembled in `server/routers.ts`
- a Drizzle ORM schema in `drizzle/schema.ts`
- container and deployment assets including `Dockerfile`, `docker-compose.yml`, `nginx.conf`, and `kubernetes/`

## Implemented core surfaces

These areas are clearly wired into the current runtime and developer workflow:

- **Frontend application**: Expo + React Native app with tabbed screens and shared hooks
- **Backend runtime**: Express server serving the landing page, `/api/health`, OAuth routes, and `/api/trpc`
- **Mounted backend routers**: `system`, `auth`, `mcp`, and `mcpServers`
- **Database layer**: Drizzle ORM configured against a MySQL-compatible database
- **Development workflow**: local app and server startup through `pnpm dev`

## Feature modules present in the repository

The repository also contains substantial modules and UI surfaces for broader capabilities, including:

- workflows and macros
- scheduling
- webhooks
- tokens and credential management
- collaboration and workspaces
- governance and permissions
- analytics and recommendations
- templates and marketplace-style flows
- notifications, debugging, profiling, and versioning

These modules are important to the project structure, but they should not automatically be treated as currently mounted public API surfaces unless confirmed in backend registration code.

## Quick start

### Prerequisites

- Node.js 20+
- pnpm 9.12.0+
- a MySQL-compatible database reachable through `DATABASE_URL`
- optional Expo mobile tooling if you plan to run Android or iOS targets locally

### Installation

```bash
git clone https://github.com/CassieMarie0728/mcp-hub.git
cd mcp-hub
pnpm install
cp .env.example .env
pnpm db:push
pnpm dev
```

Default local ports from the repo configuration:

- app/web: `http://localhost:8081`
- backend/landing/API: `http://localhost:3000`

### Basic usage

1. Start the full local stack with `pnpm dev`.
2. Open the Expo web app on port `8081`.
3. Use the backend on port `3000` for the landing page, health check, OAuth routes, and tRPC requests.
4. Review the docs hub in [README.mdx](README.mdx) and the repository docs under [`docs/`](docs/README.md).

## Development scripts

| Script | Purpose |
|---|---|
| `pnpm dev` | Run the backend watcher and Expo web dev server together |
| `pnpm dev:server` | Start the Express/tRPC server in watch mode |
| `pnpm dev:metro` | Start Expo for web on the configured Expo port |
| `pnpm build` | Bundle the server entry point into `dist/` |
| `pnpm start` | Run the production server bundle |
| `pnpm check` | Run TypeScript type-checking |
| `pnpm lint` | Run the Expo/ESLint lint workflow |
| `pnpm format` | Format the repository with Prettier |
| `pnpm test` | Run the Vitest test suite |
| `pnpm db:push` | Generate and apply Drizzle migrations |
| `pnpm android` | Run the Expo Android target |
| `pnpm ios` | Run the Expo iOS target |

## Repository structure

```text
mcp-hub/
├── app/                  # Expo Router application surfaces
├── components/           # Shared UI components
├── docs/                 # Repository documentation by topic
├── drizzle/              # Drizzle schema, SQL, and migration metadata
├── hooks/                # App-level hooks
├── kubernetes/           # Kubernetes manifests
├── lib/                  # Shared client libraries, engines, and utilities
├── scripts/              # Setup, test, build, and deploy helpers
├── server/               # Express, tRPC, MCP, and backend modules
├── .github/              # GitHub templates and workflow automation
├── README.mdx            # Documentation landing page for docs deployment
└── documentation.json    # Documentation site configuration
```

## API and runtime notes

The backend runtime in `server/_core/index.ts` currently does the following:

- serves the landing page from `landing/index.html`
- exposes `GET /api/health`
- registers OAuth routes
- mounts tRPC at `/api/trpc`

The main tRPC router in `server/routers.ts` currently mounts these top-level routers:

- `system`
- `auth`
- `mcp`
- `mcpServers`

## Database notes

The current codebase indicates a MySQL-oriented database setup:

- `.env.example` uses a MySQL `DATABASE_URL`
- `drizzle/schema.ts` imports from `drizzle-orm/mysql-core`
- `package.json` includes the `mysql2` dependency

If you encounter older references to PostgreSQL elsewhere in the repository, verify them against the current schema and environment configuration before treating them as authoritative.

## Deployment options

### Docker

The provided `Dockerfile` builds the application with Node 20 Alpine, installs dependencies with pnpm, runs `pnpm build`, exposes port `3000`, and starts the production server with `pnpm start`.

### Docker Compose

`docker-compose.yml` defines a single `mcp-hub` service that builds the local image, loads `.env`, publishes `3000:3000`, and restarts unless stopped.

### Nginx

`nginx.conf` is available for reverse-proxy or web-serving scenarios and should be reviewed alongside your chosen deployment topology.

### Kubernetes

The `kubernetes/` directory contains deployment and ingress manifests for cluster-based deployment workflows.

## Documentation

For fuller technical documentation, see:

- [Documentation hub](README.mdx)
- [Documentation overview](docs/README.md)
- [API overview](docs/api/README.md)
- [Architecture overview](docs/architecture/README.md)
- [Deployment docs](docs/deployment/README.md)
- [Development docs](docs/development/README.md)

## Contributing, security, support, and license

- [Contributing guide](CONTRIBUTING.md)
- [Security policy](SECURITY.md)
- [Support information](SUPPORT.md)
- [License](LICENSE)
