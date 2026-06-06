# Development Guide

## Setup

- Follow `REQUIREMENTS.md`
- Run `scripts/setup.sh`

## Common commands

- `pnpm dev` — run server + web client
- `pnpm check` — TypeScript checks
- `pnpm lint` — linting
- `pnpm test` — test suite

## Code organization

- `app/` feature screens and routes
- `lib/` core app logic and models
- `server/` backend modules and API surface
- `shared/` cross-runtime constants/types

## Standards

See `CONTRIBUTING.md` for branch naming, commit style, testing gates, and PR requirements.
