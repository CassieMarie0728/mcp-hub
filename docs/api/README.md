# API Documentation

## Overview

MCP Hub backend uses Express + tRPC for typed request/response behavior and route composition.

## API surfaces

- tRPC routers in `server/routers.ts`
- Marketplace and specialized routes in `server/routes/`
- Shared types in `shared/` and `lib/types.ts`

## Suggested OpenAPI strategy

While tRPC is the source of truth, teams needing OpenAPI can:
1. Add a schema exporter during build.
2. Publish generated spec artifacts.
3. Validate examples in CI.

## Authentication

Auth/session handling is defined in server core modules (`server/_core/auth.ts`, cookies and context helpers).

## Error handling

Use typed error objects from shared/core error modules to preserve client-safe messages.
