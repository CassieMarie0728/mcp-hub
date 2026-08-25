# Tenant Security Foundation

## Decision

MCP Hub treats every connected server, credential, and execution record as **workspace-scoped data**. A user is provisioned one personal workspace today. Future collaborative workspaces must extend the membership model rather than bypassing this boundary.

## Data Boundary

| Table | Ownership boundary | Sensitive material | Lifecycle |
|---|---|---|---|
| `workspaces` | Owned by `users.id` | None | One personal workspace per user at present. |
| `mcp_servers` | Foreign key to `workspaces.id` | No secrets | Public connection metadata and operational status. |
| `mcp_credentials` | One-to-one with `mcp_servers.id` | AES-256-GCM encrypted payload only | Cascades with server removal. |
| `mcp_execution_logs` | Foreign keys to workspace and server | Sanitized outcome and timing only | Append-only operational record. |

Every repository lookup includes both the server identifier and current workspace identifier. A server ID by itself is **never** authority to read, modify, test, execute, or delete a connection.

## Runtime Boundary

The durable repository returns a public server shape that intentionally excludes headers and authentication. When an operation needs credentials, `withAuthorizedMcpRuntime` loads the owned encrypted payload, creates a local manager for that single request, executes through the SSRF-safe outbound policy, and removes the in-memory configuration in a `finally` block.

> Credentials do not enter the global MCP server registry, public tRPC responses, execution logs, or client-side state.

## Availability Gates

OAuth, standalone credential management, webhooks, and workflows remain protected but unavailable. Each procedure raises `PRECONDITION_FAILED` until its full tenant-scoped durable model exists. A disabled feature is safer than a half-built feature that silently stores secrets or cross-tenant state in memory.

## Acceptance Criteria for Future Lifecycle Features

Before a gated feature is enabled, its implementation must provide durable schema, ownership-scoped repository methods, encrypted-secret handling where applicable, transaction/retry semantics, audit records, error sanitization, authorization tests, and a documented retention/deletion policy. Public marketing copy must remain aligned with this actual release state.
