---
description: GitHub, Slack, and Notion presets, their scopes and tools, and the OAuth authorize/exchange/refresh/revoke flows.
tags:
  - oauth
  - integrations
  - presets
  - github
  - slack
  - notion
title: Integrations & OAuth
---
> [!NOTE] Status
> **Beta** · Last verified 2026-08-06 · Commit `0691562`

| Field | Value |
| --- | --- |
| Purpose | The GitHub / Slack / Notion presets and their OAuth flows. |
| Audience | Users connecting the big three providers. |
| Source paths | `server/mcp/mcp-server-registry.ts`, `server/mcp/servers/{github,slack,notion}-mcp.ts`, `server/auth/oauth-router.ts`, `server/auth/oauth-manager.ts` |
| Prerequisites | [Server connections](./server-connections.md) |
| Next | [Token management](./token-management.md) |

## Presets

| Server | Auth | Required scopes | MCP URL (config) | Tools |
| --- | --- | --- | --- | --- |
| GitHub | `bearer` | `repo`, `user`, `gist` | `https://api.github.com/mcp` | 8 (incl. `list_repositories`, `create_issue`, `create_pull_request`, `search_repositories`) |
| Slack | `bearer` | `chat:write`, `channels:read`, `users:read` | `https://slack.com/api/mcp` | 10 (incl. `send_message`, `list_channels`, `create_channel`, `get_auth_test`) |
| Notion | `bearer` | `read`, `write` | `https://api.notion.com/v1/mcp` | 10 (incl. `query_database`, `create_page`, `update_page`, `search`) |

Preset definitions include `docs` links and per-server headers (e.g. GitHub's `X-GitHub-Api-Version: 2022-11-28`, Notion's `Notion-Version: 2022-06-28`).

## OAuth flow

Supported providers: **github, slack, notion**. OAuth config is read from env vars `GITHUB_OAUTH_CLIENT_ID/SECRET/REDIRECT_URI`, `SLACK_OAUTH_*`, and `NOTION_OAUTH_*`.

| Procedure | What it does |
| --- | --- |
| `oauth.getAuthorizationUrl` | Builds the provider authorize URL + a random `state` (32 bytes hex, **10-minute TTL**, single-use, stored in memory). |
| `oauth.exchangeCode` | Swaps the code for a token; rejects with "Invalid or expired state token" if `state` is missing/expired. |
| `oauth.refreshToken` | Refreshes Slack/Notion; **GitHub does not support refresh** (throws). |
| `oauth.revokeToken` | Revokes the token with the provider. |
| `oauth.checkTokenStatus` | Reports `needsRefresh` / `isExpired` / `expiresIn` (refresh threshold: 5 minutes). |

The client flow lives at `app/oauth/callback.tsx` + `app/(tabs)/oauth-connect.tsx`. After the exchange, `mcpServers.registerRealServer({type, token, customName})` validates the token, builds the preset config, registers it, and runs a connection test.

## Known gaps

- **In-memory OAuth state.** The state map resets on server restart; an in-flight OAuth login may fail if the backend restarts mid-flow.
- **Env-dependent.** Providers are unavailable until their `*_OAUTH_*` vars are configured.
- Beta: the flows are implemented and tested in isolation, but live provider quirks (redirect URIs, GitHub refresh) are the roughest edge.

> **Next:** [Token management](./token-management.md)