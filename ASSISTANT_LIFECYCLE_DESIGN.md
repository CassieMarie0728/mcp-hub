# Authorized Assistant and Durable Lifecycle Design

## Purpose

This design introduces an MCP Hub assistant that can help users understand their workspace and propose MCP tool actions without acquiring a hidden provider credential, selecting an endpoint, or executing a tool on the user’s behalf without approval. It also defines the durable tenant-scoped foundations required to replace the existing OAuth, webhook, and workflow gates safely.

## Assistant Trust Boundary

| Stage | Responsibility | Boundary |
|---|---|---|
| Mobile client | Collects a provider key, displays configuration state, sends conversation text, and lets the user approve a proposed tool call. | Never stores provider credentials after submission and never calls an MCP endpoint directly. |
| Protected assistant API | Resolves the authenticated user’s workspace, loads only that workspace’s encrypted provider configuration, and validates every conversation or approval request. | Fails closed when no provider is configured or the requested provider is unsupported. |
| Provider adapter | Calls a fixed, approved OpenAI-compatible provider URL with the decrypted key in memory only. | No arbitrary base URLs, model fallbacks, or silently chosen paid models. |
| Authorized MCP runtime | Lists tools or executes one explicitly approved tool against an owned HTTPS MCP server. | Reuses existing workspace ownership, SSRF policy, encrypted MCP credentials, and execution logging. |

## User-Supplied Provider Key Contract

The first supported provider is **OpenRouter-compatible**, using the fixed `https://openrouter.ai/api/v1` base URL. A configuration stores the encrypted API key, an explicit model identifier, and a safe public status record. The mobile experience never receives the stored key again. The API accepts only user-selected models matching the free-model allowlist; it does not substitute a different model if the selected model is unavailable.

| Public field | Meaning | Secret exposure |
|---|---|---|
| `provider` | Fixed supported provider identifier | Safe |
| `model` | User-selected allowlisted model | Safe |
| `configuredAt` | When the key was last saved | Safe |
| `keyConfigured` | Whether an encrypted key exists | Safe |
| `encryptedPayload` | Key material envelope | Server-only |

Saving a key replaces the prior configuration for that workspace. Deleting the configuration removes the encrypted row. The system never returns a key, token fragment, endpoint override, or provider response body to the client.

## Conversational Tool Approval Contract

The assistant has two distinct operations:

1. **Conversation** returns assistant text plus an optional structured tool proposal. A proposal may name one workspace-owned server, one discovered tool, and validated JSON input, but performs no MCP tool execution.
2. **Approval** requires the exact proposal identifier returned to the user, an explicit `approved: true` flag, and the same authenticated workspace. It consumes the one-time proposal and invokes `executeAuthorizedMcpTool`.

Proposals expire quickly, are scoped to one workspace, and can be consumed once. Tool discovery and execution are still recorded through the authorized runtime. The model is not trusted to bypass input schemas, select unowned servers, or convert chat text into unapproved side effects.

## Durable Lifecycle Foundations

| Resource | Durable records | Initial supported lifecycle |
|---|---|---|
| OAuth connection | Workspace, MCP server, provider, encrypted token payload, state nonce, status, expiry/revocation metadata | Store and inspect approved connection records; exchange/refresh/revoke remain unavailable until provider callback verification is implemented. |
| Webhook subscription | Workspace, name, event allowlist, encrypted signing secret, status, retry configuration, timestamps | Create, list, inspect, rotate secret, and delete subscriptions. Inbound delivery remains unavailable until a signed receiver and queue exist. |
| Workflow | Workspace, name, description, draft definition JSON, status, timestamps | Create, list, inspect, save draft, and delete. Execution and scheduling remain unavailable until an authorized step engine and retention policy exist. |

Each route obtains the workspace using the existing `getOrCreatePersonalWorkspaceAccess` helper. Every read, update, deletion, and secret rotation requires a workspace-qualified record lookup. Unsupported execution or callback phases retain explicit `PRECONDITION_FAILED` responses rather than pretending a lifecycle exists.

## Non-Negotiable Fail-Closed Rules

- No configured assistant provider means no model call.
- No user approval means no MCP tool call.
- No owned server means no discovery or proposal.
- No supported provider/model means no provider call.
- No durable state machine means no OAuth exchange, webhook delivery, workflow execution, or workflow schedule.
- No client response includes plaintext provider keys, OAuth tokens, webhook secrets, raw tool results, or provider error payloads.
