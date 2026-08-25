# Documentation Overview

This section is the main index for the repository documentation set. Use it to navigate the current MCP Hub docs by audience, task, and system area.

## Docs tree overview

The `docs/` directory groups technical material by domain:

| Section | Focus |
|---|---|
| [`api/`](./api/README.md) | Current backend/runtime entry points and API scope |
| [`architecture/`](./architecture/README.md) | System design, runtime layers, and data model context |
| [`deployment/`](./deployment/README.md) | Local, container, and Kubernetes deployment workflows |
| [`development/`](./development/README.md) | Contributor setup and local development guidance |
| [`maintenance/`](./maintenance/README.md) | Operational checks, release process, and incident response |
| [`user-guides/`](./user-guides/README.md) | Practical workflows for people using MCP Hub surfaces |

## Navigate by audience

### Using MCP Hub

Start here if you want to understand or operate product workflows:

- [`user-guides/README.md`](./user-guides/README.md)
- [`api/README.md`](./api/README.md) if you need backend/runtime context

### Developing MCP Hub

Start here if you are contributing code or documentation:

- [`development/README.md`](./development/README.md)
- [`architecture/README.md`](./architecture/README.md)
- [`api/README.md`](./api/README.md)

### Operating and deploying MCP Hub

Use these pages for runtime and deployment work:

- [`deployment/README.md`](./deployment/README.md)
- [`architecture/README.md`](./architecture/README.md)
- [`maintenance/README.md`](./maintenance/README.md)

### Maintaining MCP Hub

Use these pages for release, support, and long-term upkeep:

- [`maintenance/README.md`](./maintenance/README.md)
- [`deployment/README.md`](./deployment/README.md)
- root-level docs such as `CHANGELOG.md`, `SECURITY.md`, and `SUPPORT.md`

## Scope note

The docs intentionally distinguish between:

- **implemented core backend/runtime surfaces** that are clearly mounted in the current server entry points, and
- **broader repository modules** that exist in the codebase but should not automatically be described as public or mounted API surfaces without code confirmation

This is especially important for MCP Hub because the repository contains many feature modules beyond the currently mounted top-level backend routers.

## Suggested reading order

If you are new to the project, a practical order is:

1. root [`README.md`](../../../README.md)
2. root [`README.mdx`](../../../README.mdx)
3. [`architecture/README.md`](./architecture/README.md)
4. [`api/README.md`](./api/README.md)
5. [`development/README.md`](./development/README.md) or [`deployment/README.md`](./deployment/README.md), depending on your role
