# Architecture

## High-level design

MCP Hub is split into two primary layers:

1. **Client** (Expo/React Native + Expo Router)
   - UI tabs and feature screens under `app/`
   - Reusable hooks/components under `hooks/`, `components/`, and `lib/`

2. **Server** (Node.js + Express + tRPC)
   - Runtime and core infra in `server/_core/`
   - Domain-specific modules (`analytics/`, `permissions/`, `versioning/`, `websocket/`)

## Data layer

- Drizzle ORM schema and migrations under `drizzle/`
- DB bootstrapping in `server/db.ts`

## Integration model

- MCP server connectivity hooks and clients under `lib/mcp-client.ts`, `hooks/use-mcp-bridge*.ts`
- Macro and execution engines under `lib/engines/` and server orchestration modules
