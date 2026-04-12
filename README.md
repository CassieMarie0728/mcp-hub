# MCP Hub

[![CI](https://github.com/your-org/mcp-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/mcp-hub/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6)](https://www.typescriptlang.org/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020)](https://expo.dev/)

MCP Hub is a centralized platform for connecting to and interacting with **Model Context Protocol (MCP) servers**. It combines a React Native + Expo client with a TypeScript/Express backend to help users discover tools, execute tool calls, manage server presets, run macro workflows, and monitor execution history.

## What this project gives you

- Unified MCP server connection and management UI.
- Tool discovery, execution, and result visualization workflows.
- Macro orchestration, scheduling, sharing, and versioning support.
- Backend router architecture for MCP APIs, marketplace features, analytics, and collaboration.

## Quick Start

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Then open:
- Web client: `http://localhost:8081`
- API server: `http://localhost:3000` (default, if configured in `.env`)

## Prerequisites

- Node.js 20+
- pnpm 9+
- Expo-compatible environment (for mobile testing)
- Optional: Docker 24+ / Docker Compose v2+

## Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Create your environment file:
   ```bash
   cp .env.example .env
   ```
4. Start development services:
   ```bash
   pnpm dev
   ```

## Basic Usage Examples

### Start local development

```bash
pnpm dev
```

### Run static checks and tests

```bash
pnpm check
pnpm lint
pnpm test
```

### Build and start production server

```bash
pnpm build
pnpm start
```

## Documentation map

For full technical documentation, start at [`docs/`](./docs):

- [Architecture](./docs/architecture/README.md)
- [API](./docs/api/README.md)
- [Deployment](./docs/deployment/README.md)
- [Development](./docs/development/README.md)
- [Maintenance](./docs/maintenance/README.md)
- [User Guides](./docs/user-guides/README.md)

## Technologies used

- TypeScript
- React Native + Expo Router
- Express
- tRPC
- Drizzle ORM
- Vitest
- ESLint + Prettier
- Docker / Kubernetes (deployment scaffolding)

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for setup, workflow, branch naming, code style, tests, and PR requirements.

## License

Distributed under the MIT License. See [`LICENSE`](./LICENSE).
