# MCP Integration Domain - Provider Adapters for GitHub, Slack, and Notion

## Overview

This integration domain connects MCP Hub to three external provider ecosystems: GitHub, Slack, and Notion. The provider adapters encapsulate the provider-specific MCP server configuration, the static tool manifests exposed to the app, and the validation logic used before a server is registered.

The flow is intentionally split into two layers. `MCPServerRegistry` selects the correct adapter for a `ServerType`, builds a provider-specific `MCPServerConfig`, and exposes the available tool manifests without connecting. `OAuthManager` handles provider OAuth state, authorization URLs, token exchange, refresh, and revocation, so the adapters themselves only need a bearer token and do not own the OAuth flow.

## Architecture Overview

```mermaid
flowchart TD
    subgraph ClientLayer[Client and tRPC Entry Points]
        MCPExtendedRouter[mcpExtendedRouter]
        OAuthRouter[oauthRouter]
    end

    subgraph ControlLayer[Registry and OAuth Control]
        MCPServerRegistryNode[MCPServerRegistry]
        OAuthManagerNode[OAuthManager]
        OAuthStateStore[oauthStateStore]
    end

    subgraph AdapterLayer[Provider Adapters]
        GitHubAdapter[GitHubMCPServer]
        SlackAdapter[SlackMCPServer]
        NotionAdapter[NotionMCPServer]
    end

    subgraph RuntimeLayer[MCP Runtime]
        MCPServerManagerNode[mcpServerManager]
    end

    subgraph ExternalSystems[External Provider APIs]
        GitHubAPI[GitHub API]
        SlackAPI[Slack API]
        NotionAPI[Notion API]
    end

    MCPExtendedRouter --> MCPServerRegistryNode
    MCPExtendedRouter --> MCPServerManagerNode
    OAuthRouter --> OAuthManagerNode
    OAuthManagerNode --> OAuthStateStore

    MCPServerRegistryNode --> GitHubAdapter
    MCPServerRegistryNode --> SlackAdapter
    MCPServerRegistryNode --> NotionAdapter

    GitHubAdapter --> GitHubAPI
    SlackAdapter --> SlackAPI
    NotionAdapter --> NotionAPI

    MCPServerManagerNode --> GitHubAPI
    MCPServerManagerNode --> SlackAPI
    MCPServerManagerNode --> NotionAPI
```

## Component Structure

### Provider Registry and Dispatch

#### MCP Server Config Contract

The provider registry and OAuth manager do not share token storage. OAuthManager creates and exchanges OAuth tokens, while the adapter classes consume a token that is already available.

*server/mcp/mcp-server-manager.ts*

This is the config shape produced by the provider adapters and consumed by the MCP server manager.

| Property | Type | Description |
| --- | --- | --- |
| `id` | `string` | Unique server identifier used as the manager key. |
| `name` | `string` | Display name shown in the UI and server lists. |
| `url` | `string` | MCP transport URL constructed by the adapter. |
| `type` | `'http' \ | 'websocket' \ | 'stdio'` | Transport type used by the manager. |
| `headers` | `Record<string, string>` | Adapter-provided headers merged into the manager client. |
| `auth` | `{ type: 'bearer' \ | 'api-key' \ | 'basic'; token?: string; username?: string; password?: string }` | Auth contract used by the manager when it builds request headers. |
| `timeout` | `number` | Client timeout in milliseconds. |
| `retryAttempts` | `number` | Optional retry count passed through by the config. |


#### MCPServerRegistry

*server/mcp/mcp-server-registry.ts*

`MCPServerRegistry` centralizes the provider catalog and dispatches provider-specific adapter logic.

**Properties**

| Property | Type | Description |
| --- | --- | --- |
| `servers` | `Map<ServerType, ServerDefinition>` | Static registry of GitHub, Slack, and Notion definitions. |


**Constructor Dependencies**

| Type | Description |
| --- | --- |
| None | This class is static and does not accept injected dependencies. |


**Public Methods**

| Method | Description |
| --- | --- |
| `getServerDefinition` | Returns the registry entry for one provider type. |
| `getAllServers` | Returns every registered provider definition. |
| `createServerConfig` | Instantiates the provider adapter and returns its `MCPServerConfig`. |
| `getServerTools` | Instantiates the provider adapter and returns the static tool manifest. |
| `validateToken` | Instantiates the provider adapter and validates the token against the provider API. |


**ServerType values**

`github`, `slack`, `notion`

#### ServerDefinition

*server/mcp/mcp-server-registry.ts*

| Property | Type | Description |
| --- | --- | --- |
| `id` | `ServerType` | Registry key for the provider. |
| `name` | `string` | Display name for the provider. |
| `description` | `string` | Human-readable provider summary. |
| `icon` | `string` | Icon name used by the client. |
| `docs` | `string` | Provider documentation URL. |
| `requiredScopes` | `string[] \ | undefined` | Scopes expected for the provider token. |
| `authMethod` | `'bearer' \ | 'api-key' \ | 'basic'` | Authentication method expected by the manager. |


**Registry entries**

| Provider | `id` | `authMethod` | `requiredScopes` | `docs` |
| --- | --- | --- | --- | --- |
| GitHub | `github` | `bearer` | `repo`, `user`, `gist` | `https://docs.github.com/en/rest` |
| Slack | `slack` | `bearer` | `chat:write`, `channels:read`, `users:read` |  |
| Notion | `notion` | `bearer` | `[]` |  |


### GitHub Provider Adapter

#### GitHubConfig

MCPServerRegistry marks Notion with an empty requiredScopes array, while OAuthManager requests read and write scopes for Notion. Scope validation in the registry therefore does not enforce Notion permission requirements.

*server/mcp/servers/github-mcp.ts*

| Property | Type | Description |
| --- | --- | --- |
| `token` | `string` | Bearer token used for GitHub validation and MCP auth. |
| `baseUrl` | `string \ | undefined` | Optional API base override; defaults to . |


#### GitHubMCPServer

*server/mcp/servers/github-mcp.ts*

**Properties**

| Property | Type | Description |
| --- | --- | --- |
| `config` | `GitHubConfig` | Adapter configuration merged with the default GitHub base URL. |


**Constructor Dependencies**

| Type | Description |
| --- | --- |
| `GitHubConfig` | Provides the bearer token and optional base URL override. |


**Public Methods**

| Method | Description |
| --- | --- |
| `getMCPConfig` | Builds the GitHub MCP transport config and auth headers. |
| `getAvailableTools` | Returns the GitHub tool manifest used for discovery. |
| `validateToken` | Calls GitHub `/user` to verify the bearer token. |


**MCP config output**

- `id`: `github-mcp`
- `name`: `GitHub`
- `url`: `${baseUrl}/mcp`
- `type`: `http`
- `auth.type`: `bearer`
- `headers`:- `Accept: application/vnd.github.v3+json`
- `X-GitHub-Api-Version: 2022-11-28`
- `timeout`: `30000`

**Tool manifest**

| Tool | Purpose | Required inputs | Optional inputs |
| --- | --- | --- | --- |
| `list_repositories` | Lists repositories for the authenticated user or organization. | None | `org`, `per_page`, `page` |
| `create_issue` | Creates a new issue in a repository. | `owner`, `repo`, `title` | `body`, `labels`, `assignees` |
| `create_pull_request` | Creates a new pull request. | `owner`, `repo`, `title`, `head`, `base` | `body` |
| `list_issues` | Lists issues in a repository. | `owner`, `repo` | `state`, `per_page` |
| `get_user_profile` | Returns the authenticated user profile. | None | None |
| `search_repositories` | Searches repositories. | `query` | `sort`, `per_page` |
| `add_repository_label` | Adds labels to an issue. | `owner`, `repo`, `issue_number`, `labels` | None |
| `create_repository` | Creates a repository. | `name` | `description`, `private`, `auto_init` |


**Authentication assumptions**

- The adapter expects a GitHub bearer token.
- The registry advertises `repo`, `user`, and `gist` scopes.
- `validateToken` checks the token against `GET /user` and treats any non-OK response as invalid.

### Slack Provider Adapter

#### SlackConfig

*server/mcp/servers/slack-mcp.ts*

| Property | Type | Description |
| --- | --- | --- |
| `token` | `string` | Bearer token used for Slack validation and MCP auth. |
| `baseUrl` | `string \ | undefined` | Optional API base override; defaults to `https://slack.com/api`. |


#### SlackMCPServer

*server/mcp/servers/slack-mcp.ts*

**Properties**

| Property | Type | Description |
| --- | --- | --- |
| `config` | `SlackConfig` | Adapter configuration merged with the default Slack base URL. |


**Constructor Dependencies**

| Type | Description |
| --- | --- |
| `SlackConfig` | Provides the bearer token and optional base URL override. |


**Public Methods**

| Method | Description |
| --- | --- |
| `getMCPConfig` | Builds the Slack MCP transport config and auth headers. |
| `getAvailableTools` | Returns the Slack tool manifest used for discovery. |
| `validateToken` | Calls Slack `auth.test` to verify the bearer token. |


**MCP config output**

- `id`: `slack-mcp`
- `name`: `Slack`
- `url`: `${baseUrl}/mcp`
- `type`: `http`
- `auth.type`: `bearer`
- `headers`:- `Content-Type: application/json`
- `timeout`: `30000`

**Tool manifest**

| Tool | Purpose | Required inputs | Optional inputs |
| --- | --- | --- | --- |
| `send_message` | Sends a message to a channel. | `channel`, `text` | `thread_ts`, `blocks` |
| `list_channels` | Lists channels in the workspace. | None | `exclude_archived`, `limit` |
| `get_channel_info` | Returns channel information. | `channel` | None |
| `list_users` | Lists workspace users. | None | `limit` |
| `get_user_info` | Returns information about a user. | `user` | None |
| `create_channel` | Creates a new channel. | `name` | `is_private`, `description` |
| `add_reaction` | Adds an emoji reaction to a message. | `channel`, `timestamp`, `name` | None |
| `set_topic` | Updates a channel topic. | `channel`, `topic` | None |
| `invite_users` | Invites users to a channel. | `channel`, `users` | None |
| `get_auth_test` | Tests authentication and returns workspace info. | None | None |


**Authentication assumptions**

- The adapter expects a Slack bearer token.
- The registry advertises `chat:write`, `channels:read`, and `users:read` scopes.
- `validateToken` calls  and requires the JSON response to contain `ok: true`.

### Notion Provider Adapter

#### NotionConfig

*server/mcp/servers/notion-mcp.ts*

| Property | Type | Description |
| --- | --- | --- |
| `token` | `string` | Bearer token used for Notion validation and MCP auth. |
| `baseUrl` | `string \ | undefined` | Optional API base override; defaults to `https://api.notion.com/v1`. |


#### NotionMCPServer

*server/mcp/servers/notion-mcp.ts*

**Properties**

| Property | Type | Description |
| --- | --- | --- |
| `config` | `NotionConfig` | Adapter configuration merged with the default Notion base URL. |


**Constructor Dependencies**

| Type | Description |
| --- | --- |
| `NotionConfig` | Provides the bearer token and optional base URL override. |


**Public Methods**

| Method | Description |
| --- | --- |
| `getMCPConfig` | Builds the Notion MCP transport config and auth headers. |
| `getAvailableTools` | Returns the Notion tool manifest used for discovery. |
| `validateToken` | Calls Notion `/users/me` to verify the bearer token. |


**MCP config output**

- `id`: `notion-mcp`
- `name`: `Notion`
- `url`: `${baseUrl}/mcp`
- `type`: `http`
- `auth.type`: `bearer`
- `headers`:- `Notion-Version: 2022-06-28`
- `Content-Type: application/json`
- `timeout`: `30000`

**Tool manifest**

| Tool | Purpose | Required inputs | Optional inputs |
| --- | --- | --- | --- |
| `query_database` | Queries a Notion database. | `database_id` | `filter`, `sorts`, `page_size` |
| `create_page` | Creates a new page. | `parent`, `properties` | `children` |
| `update_page` | Updates a page. | `page_id` | `properties`, `archived` |
| `retrieve_block_children` | Returns child blocks for a block or page. | `block_id` | `page_size` |
| `delete_block` | Deletes a block. | `block_id` | None |
| `get_page` | Returns page details. | `page_id` | None |
| `get_database` | Returns database schema. | `database_id` | None |
| `append_block_children` | Appends blocks to a page. | `block_id`, `children` | None |
| `search` | Searches pages and databases. | `query` | `filter`, `sort` |
| `create_database` | Creates a new database. | `parent`, `title`, `properties` | None |


**Authentication assumptions**

- The adapter expects a Notion bearer token.
- The registry does not enforce scopes for Notion.
- `validateToken` checks `GET /users/me` with the `Notion-Version` header.

### OAuth Configuration and Token Lifecycle

#### OAuthConfig

*server/auth/oauth-manager.ts*

| Property | Type | Description |
| --- | --- | --- |
| `clientId` | `string` | OAuth client identifier used in authorization and token exchange. |
| `clientSecret` | `string` | OAuth client secret used in token exchange and refresh. |
| `redirectUri` | `string` | Callback URL registered with the provider. |
| `scopes` | `string[]` | Provider scopes requested during authorization. |


#### OAuthState

*server/auth/oauth-manager.ts*

| Property | Type | Description |
| --- | --- | --- |
| `state` | `string` | Random CSRF protection token. |
| `serverId` | `string` | Server identifier tied to the OAuth flow. |
| `serverType` | `string` | Provider name associated with the OAuth flow. |
| `createdAt` | `Date` | Creation time for the state record. |
| `expiresAt` | `Date` | Expiration time for the state record. |


#### OAuthToken

*server/auth/oauth-manager.ts*

| Property | Type | Description |
| --- | --- | --- |
| `accessToken` | `string` | Access token returned by the provider. |
| `refreshToken` | `string \ | undefined` | Refresh token returned by the provider, if supported. |
| `expiresIn` | `number \ | undefined` | Token lifetime in seconds. |
| `expiresAt` | `Date \ | undefined` | Derived expiration timestamp. |
| `tokenType` | `string` | Token type returned by the provider or defaulted to `bearer`. |


#### OAuthManager

*server/auth/oauth-manager.ts*

**Public Methods**

| Method | Description |
| --- | --- |
| `generateAuthorizationUrl` | Builds the provider authorization URL and stores the OAuth state. |
| `verifyState` | Looks up a stored state token and checks expiration. |
| `exchangeCodeForToken` | Exchanges an authorization code for an OAuth token. |
| `refreshAccessToken` | Refreshes an OAuth token for providers that support refresh. |
| `revokeToken` | Revokes an access token through the provider. |
| `isTokenExpired` | Returns whether a token is expired. |
| `shouldRefreshToken` | Returns whether a token is inside the refresh window. |


**Provider configuration expectations**

| Provider | Env vars | Default redirect URI | Requested scopes | Scope separator | Refresh supported |
| --- | --- | --- | --- | --- | --- |
| GitHub | `GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET`, `GITHUB_OAUTH_REDIRECT_URI` | `http://localhost:3000/oauth/github/callback` | `repo`, `user`, `gist` | Space | No |
| Slack | `SLACK_OAUTH_CLIENT_ID`, `SLACK_OAUTH_CLIENT_SECRET`, `SLACK_OAUTH_REDIRECT_URI` | `http://localhost:3000/oauth/slack/callback` | `chat:write`, `channels:read`, `users:read` | Comma | Yes |
| Notion | `NOTION_OAUTH_CLIENT_ID`, `NOTION_OAUTH_CLIENT_SECRET`, `NOTION_OAUTH_REDIRECT_URI` | `http://localhost:3000/oauth/notion/callback` | `read`, `write` | Comma | Yes |


**OAuth state behavior**

- `generateAuthorizationUrl` creates a random 32-byte state token.
- State records expire after 10 minutes.
- `verifyState` removes expired records from the in-memory store.
- `exchangeCodeForToken` relies on `oauthRouter` to verify state before the code exchange is performed.

## Feature Flows

### Register a Real Provider Backed MCP Server

```mermaid
sequenceDiagram
    participant Client
    participant Router as MCPExtendedRouter
    participant Registry as MCPServerRegistry
    participant Adapter as Provider Adapter
    participant API as Provider API
    participant Manager as mcpServerManager

    Client->>Router: registerRealServer type token customName
    Router->>Registry: validateToken type token
    Registry->>Adapter: validateToken
    Adapter->>API: provider validation request
    API-->>Adapter: response
    Adapter-->>Registry: boolean
    Registry-->>Router: token validation result

    alt token is valid
        Router->>Registry: createServerConfig type token
        Registry->>Adapter: getMCPConfig
        Adapter-->>Registry: MCPServerConfig
        Registry-->>Router: config
        Router->>Manager: registerServer config
        Router->>Manager: testConnection config id
        Manager-->>Router: connected boolean
        Router-->>Client: success serverId serverName connected
    else token is invalid
        Router-->>Client: success false error
    end
```

shouldRefreshToken currently compares new Date() against fiveMinutesFromNow using new Date() > fiveMinutesFromNow, which can never be true during the intended refresh window. As implemented, the method returns false for tokens with an expiresAt value.

1. `mcpExtendedRouter.registerRealServer` validates the token first.
2. `MCPServerRegistry.createServerConfig` instantiates the matching adapter and returns its MCP transport config.
3. `customName` overrides the adapter-provided name before registration.
4. `mcpServerManager.registerServer` stores the server config and initializes the HTTP client.
5. `mcpServerManager.testConnection` probes the registered server before the caller gets success feedback.

### Discover Tools Without Connecting

```mermaid
sequenceDiagram
    participant Client
    participant Router as MCPExtendedRouter
    participant Registry as MCPServerRegistry
    participant Adapter as Provider Adapter

    Client->>Router: getServerTools type
    Router->>Registry: getServerTools type
    Registry->>Adapter: getAvailableTools
    Adapter-->>Registry: tool manifest
    Registry-->>Router: tools count
    Router-->>Client: tools array
```

1. `MCPServerRegistry.getServerTools` instantiates the adapter with an empty token.
2. `getAvailableTools` returns the static manifest only.
3. No provider network call occurs during this discovery path.

### OAuth Authorization and Code Exchange

```mermaid
sequenceDiagram
    participant Client
    participant OAuthRouter as oauthRouter
    participant OAuthManager as OAuthManager
    participant StateStore as oauthStateStore
    participant API as Provider OAuth API

    Client->>OAuthRouter: getAuthorizationUrl serverType serverId
    OAuthRouter->>OAuthManager: generateAuthorizationUrl
    OAuthManager->>StateStore: store state record
    OAuthManager-->>OAuthRouter: url and state
    OAuthRouter-->>Client: authorization url and state

    Client->>OAuthRouter: exchangeCode serverType code state
    OAuthRouter->>OAuthManager: verifyState
    OAuthManager->>StateStore: read state record
    StateStore-->>OAuthManager: OAuthState
    OAuthManager-->>OAuthRouter: valid state

    OAuthRouter->>OAuthManager: exchangeCodeForToken
    OAuthManager->>API: token exchange request
    API-->>OAuthManager: token response
    OAuthManager-->>OAuthRouter: OAuthToken
    OAuthRouter-->>Client: accessToken tokenType expiresAt serverId
```

1. `OAuthManager.generateAuthorizationUrl` creates the provider URL and stores the state for 10 minutes.
2. `oauthRouter.exchangeCode` verifies the state before exchanging the code.
3. `exchangeCodeForToken` sends a provider-specific form-encoded request.
4. `expiresAt` is computed locally from `expires_in` when the provider returns it.

## API Integration

The provider adapters and OAuth manager call external provider APIs directly. These are the HTTP calls that are explicitly implemented in the source.

#### GitHub OAuth Code Exchange

```api
{
    "title": "GitHub OAuth Code Exchange",
    "description": "Exchanges an OAuth authorization code for a GitHub access token",
    "method": "POST",
    "baseUrl": "<GitHubApiBaseUrl>",
    "endpoint": "/login/oauth/access_token",
    "headers": [
        {
            "key": "Content-Type",
            "value": "application/x-www-form-urlencoded",
            "required": true
        },
        {
            "key": "Accept",
            "value": "application/json",
            "required": true
        }
    ],
    "queryParams": [],
    "pathParams": [],
    "bodyType": "form",
    "requestBody": "{\n    \"client_id\": \"gho_client_1234567890\",\n    \"client_secret\": \"ghs_secret_abcdef1234567890\",\n    \"code\": \"code_1234567890\",\n    \"redirect_uri\": \"http://localhost:3000/oauth/github/callback\"\n}",
    "formData": [
        {
            "key": "client_id",
            "value": "gho_client_1234567890",
            "required": true
        },
        {
            "key": "client_secret",
            "value": "ghs_secret_abcdef1234567890",
            "required": true
        },
        {
            "key": "code",
            "value": "code_1234567890",
            "required": true
        },
        {
            "key": "redirect_uri",
            "value": "http://localhost:3000/oauth/github/callback",
            "required": true
        }
    ],
    "rawBody": "",
    "responses": {
        "200": {
            "description": "Success",
            "body": "{\n    \"access_token\": \"gho_access_token_1234567890\",\n    \"token_type\": \"bearer\"\n}"
        }
    }
}
```

#### Slack OAuth Code Exchange

```api
{
    "title": "Slack OAuth Code Exchange",
    "description": "Exchanges an OAuth authorization code for a Slack access token",
    "method": "POST",
    "baseUrl": "<SlackApiBaseUrl>",
    "endpoint": "/api/oauth.v2.access",
    "headers": [
        {
            "key": "Content-Type",
            "value": "application/x-www-form-urlencoded",
            "required": true
        },
        {
            "key": "Accept",
            "value": "application/json",
            "required": true
        }
    ],
    "queryParams": [],
    "pathParams": [],
    "bodyType": "form",
    "requestBody": "{\n    \"client_id\": \"1234567890.1234567890\",\n    \"client_secret\": \"slack_secret_abcdef1234567890\",\n    \"code\": \"slack_code_1234567890\",\n    \"redirect_uri\": \"http://localhost:3000/oauth/slack/callback\"\n}",
    "formData": [
        {
            "key": "client_id",
            "value": "1234567890.1234567890",
            "required": true
        },
        {
            "key": "client_secret",
            "value": "slack_secret_abcdef1234567890",
            "required": true
        },
        {
            "key": "code",
            "value": "slack_code_1234567890",
            "required": true
        },
        {
            "key": "redirect_uri",
            "value": "http://localhost:3000/oauth/slack/callback",
            "required": true
        }
    ],
    "rawBody": "",
    "responses": {
        "200": {
            "description": "Success",
            "body": "{\n    \"access_token\": \"xoxb-access-token-1234567890\",\n    \"token_type\": \"bearer\",\n    \"expires_in\": 43200\n}"
        }
    }
}
```

#### Notion OAuth Code Exchange

```api
{
    "title": "Notion OAuth Code Exchange",
    "description": "Exchanges an OAuth authorization code for a Notion access token",
    "method": "POST",
    "baseUrl": "<NotionApiBaseUrl>",
    "endpoint": "/v1/oauth/token",
    "headers": [
        {
            "key": "Content-Type",
            "value": "application/x-www-form-urlencoded",
            "required": true
        },
        {
            "key": "Accept",
            "value": "application/json",
            "required": true
        }
    ],
    "queryParams": [],
    "pathParams": [],
    "bodyType": "form",
    "requestBody": "{\n    \"client_id\": \"notion_client_1234567890\",\n    \"client_secret\": \"notion_secret_abcdef1234567890\",\n    \"code\": \"notion_code_1234567890\",\n    \"redirect_uri\": \"http://localhost:3000/oauth/notion/callback\"\n}",
    "formData": [
        {
            "key": "client_id",
            "value": "notion_client_1234567890",
            "required": true
        },
        {
            "key": "client_secret",
            "value": "notion_secret_abcdef1234567890",
            "required": true
        },
        {
            "key": "code",
            "value": "notion_code_1234567890",
            "required": true
        },
        {
            "key": "redirect_uri",
            "value": "http://localhost:3000/oauth/notion/callback",
            "required": true
        }
    ],
    "rawBody": "",
    "responses": {
        "200": {
            "description": "Success",
            "body": "{\n    \"access_token\": \"secret_notion_access_token_1234567890\",\n    \"token_type\": \"bearer\",\n    \"expires_in\": 3600\n}"
        }
    }
}
```

#### Slack OAuth Token Refresh

```api
{
    "title": "Slack OAuth Token Refresh",
    "description": "Refreshes a Slack access token using a refresh token",
    "method": "POST",
    "baseUrl": "<SlackApiBaseUrl>",
    "endpoint": "/api/oauth.v2.access",
    "headers": [
        {
            "key": "Content-Type",
            "value": "application/x-www-form-urlencoded",
            "required": true
        },
        {
            "key": "Accept",
            "value": "application/json",
            "required": true
        }
    ],
    "queryParams": [],
    "pathParams": [],
    "bodyType": "form",
    "requestBody": "{\n    \"client_id\": \"1234567890.1234567890\",\n    \"client_secret\": \"slack_secret_abcdef1234567890\",\n    \"refresh_token\": \"xoxr-refresh-token-1234567890\",\n    \"grant_type\": \"refresh_token\"\n}",
    "formData": [
        {
            "key": "client_id",
            "value": "1234567890.1234567890",
            "required": true
        },
        {
            "key": "client_secret",
            "value": "slack_secret_abcdef1234567890",
            "required": true
        },
        {
            "key": "refresh_token",
            "value": "xoxr-refresh-token-1234567890",
            "required": true
        },
        {
            "key": "grant_type",
            "value": "refresh_token",
            "required": true
        }
    ],
    "rawBody": "",
    "responses": {
        "200": {
            "description": "Success",
            "body": "{\n    \"access_token\": \"xoxb-new-access-token-1234567890\",\n    \"token_type\": \"bearer\",\n    \"expires_in\": 43200\n}"
        }
    }
}
```

#### Notion OAuth Token Refresh

```api
{
    "title": "Notion OAuth Token Refresh",
    "description": "Refreshes a Notion access token using a refresh token",
    "method": "POST",
    "baseUrl": "<NotionApiBaseUrl>",
    "endpoint": "/v1/oauth/token",
    "headers": [
        {
            "key": "Content-Type",
            "value": "application/x-www-form-urlencoded",
            "required": true
        },
        {
            "key": "Accept",
            "value": "application/json",
            "required": true
        }
    ],
    "queryParams": [],
    "pathParams": [],
    "bodyType": "form",
    "requestBody": "{\n    \"client_id\": \"notion_client_1234567890\",\n    \"client_secret\": \"notion_secret_abcdef1234567890\",\n    \"refresh_token\": \"secret_refresh_token_1234567890\",\n    \"grant_type\": \"refresh_token\"\n}",
    "formData": [
        {
            "key": "client_id",
            "value": "notion_client_1234567890",
            "required": true
        },
        {
            "key": "client_secret",
            "value": "notion_secret_abcdef1234567890",
            "required": true
        },
        {
            "key": "refresh_token",
            "value": "secret_refresh_token_1234567890",
            "required": true
        },
        {
            "key": "grant_type",
            "value": "refresh_token",
            "required": true
        }
    ],
    "rawBody": "",
    "responses": {
        "200": {
            "description": "Success",
            "body": "{\n    \"access_token\": \"secret_new_notion_access_token_1234567890\",\n    \"token_type\": \"bearer\",\n    \"expires_in\": 3600\n}"
        }
    }
}
```

#### GitHub OAuth Token Revocation

```api
{
    "title": "GitHub OAuth Token Revocation",
    "description": "Revokes a GitHub OAuth token using the GitHub applications token revocation endpoint",
    "method": "POST",
    "baseUrl": "<GitHubApiBaseUrl>",
    "endpoint": "/applications/{client_id}/token",
    "headers": [
        {
            "key": "Content-Type",
            "value": "application/x-www-form-urlencoded",
            "required": true
        },
        {
            "key": "Authorization",
            "value": "Bearer <token>",
            "required": true
        }
    ],
    "queryParams": [],
    "pathParams": [
        {
            "key": "client_id",
            "value": "gho_client_1234567890",
            "required": true
        }
    ],
    "bodyType": "form",
    "requestBody": "{\n    \"token\": \"gho_access_token_1234567890\"\n}",
    "formData": [
        {
            "key": "token",
            "value": "gho_access_token_1234567890",
            "required": true
        }
    ],
    "rawBody": "",
    "responses": {
        "200": {
            "description": "Success",
            "body": "[]"
        }
    }
}
```

#### Slack OAuth Token Revocation

```api
{
    "title": "Slack OAuth Token Revocation",
    "description": "Revokes a Slack access token",
    "method": "POST",
    "baseUrl": "<SlackApiBaseUrl>",
    "endpoint": "/api/auth.revoke",
    "headers": [
        {
            "key": "Content-Type",
            "value": "application/x-www-form-urlencoded",
            "required": true
        },
        {
            "key": "Authorization",
            "value": "Bearer <token>",
            "required": true
        }
    ],
    "queryParams": [],
    "pathParams": [],
    "bodyType": "form",
    "requestBody": "{\n    \"token\": \"xoxb-access-token-1234567890\"\n}",
    "formData": [
        {
            "key": "token",
            "value": "xoxb-access-token-1234567890",
            "required": true
        }
    ],
    "rawBody": "",
    "responses": {
        "200": {
            "description": "Success",
            "body": "{\n    \"ok\": true\n}"
        }
    }
}
```

#### Notion OAuth Token Revocation

```api
{
    "title": "Notion OAuth Token Revocation",
    "description": "Revokes a Notion access token",
    "method": "POST",
    "baseUrl": "<NotionApiBaseUrl>",
    "endpoint": "/v1/oauth/revoke",
    "headers": [
        {
            "key": "Content-Type",
            "value": "application/x-www-form-urlencoded",
            "required": true
        },
        {
            "key": "Authorization",
            "value": "Bearer <token>",
            "required": true
        }
    ],
    "queryParams": [],
    "pathParams": [],
    "bodyType": "form",
    "requestBody": "{\n    \"token\": \"secret_notion_access_token_1234567890\"\n}",
    "formData": [
        {
            "key": "token",
            "value": "secret_notion_access_token_1234567890",
            "required": true
        }
    ],
    "rawBody": "",
    "responses": {
        "200": {
            "description": "Success",
            "body": "[]"
        }
    }
}
```

#### GitHub Token Validation

```api
{
    "title": "GitHub Token Validation",
    "description": "Validates a GitHub bearer token by calling the authenticated user endpoint",
    "method": "GET",
    "baseUrl": "<GitHubApiBaseUrl>",
    "endpoint": "/user",
    "headers": [
        {
            "key": "Authorization",
            "value": "Bearer <token>",
            "required": true
        },
        {
            "key": "Accept",
            "value": "application/vnd.github.v3+json",
            "required": true
        }
    ],
    "queryParams": [],
    "pathParams": [],
    "bodyType": "none",
    "requestBody": "",
    "formData": [],
    "rawBody": "",
    "responses": {
        "200": {
            "description": "Success",
            "body": "[]"
        }
    }
}
```

#### Slack Token Validation

```api
{
    "title": "Slack Token Validation",
    "description": "Validates a Slack bearer token by calling auth.test",
    "method": "POST",
    "baseUrl": "<SlackApiBaseUrl>",
    "endpoint": "/api/auth.test",
    "headers": [
        {
            "key": "Authorization",
            "value": "Bearer <token>",
            "required": true
        },
        {
            "key": "Content-Type",
            "value": "application/json",
            "required": true
        }
    ],
    "queryParams": [],
    "pathParams": [],
    "bodyType": "none",
    "requestBody": "",
    "formData": [],
    "rawBody": "",
    "responses": {
        "200": {
            "description": "Success",
            "body": "{\n    \"ok\": true\n}"
        }
    }
}
```

#### Notion Token Validation

```api
{
    "title": "Notion Token Validation",
    "description": "Validates a Notion bearer token by calling users.me",
    "method": "GET",
    "baseUrl": "<NotionApiBaseUrl>",
    "endpoint": "/v1/users/me",
    "headers": [
        {
            "key": "Authorization",
            "value": "Bearer <token>",
            "required": true
        },
        {
            "key": "Notion-Version",
            "value": "2022-06-28",
            "required": true
        }
    ],
    "queryParams": [],
    "pathParams": [],
    "bodyType": "none",
    "requestBody": "",
    "formData": [],
    "rawBody": "",
    "responses": {
        "200": {
            "description": "Success",
            "body": "[]"
        }
    }
}
```

## State Management

- `MCPServerRegistry.servers` is a static `Map` keyed by `ServerType`, so provider definitions are shared across the process.
- `oauthStateStore` is an in-memory `Map<string, OAuthState>` keyed by the random OAuth state token.
- OAuth state entries are timestamped and expire after 10 minutes.
- `verifyState` removes expired entries during lookup.
- Token expiration helpers operate on `OAuthToken.expiresAt`.

## Integration Points

- `mcpExtendedRouter.registerRealServer` uses `MCPServerRegistry.validateToken`, `MCPServerRegistry.createServerConfig`, and `mcpServerManager.registerServer`.
- `mcpExtendedRouter.getServerTools` uses `MCPServerRegistry.getServerTools` to expose static tool manifests without a live connection.
- `oauthRouter.getAuthorizationUrl`, `oauthRouter.exchangeCode`, `oauthRouter.refreshToken`, and `oauthRouter.revokeToken` delegate to `OAuthManager`.
- The provider adapter outputs are consumed as `MCPServerConfig` objects by the server manager.
- The provider-specific bearer tokens are expected to come from the OAuth flow and be passed into the registry or server manager, not embedded in the adapters.

## Error Handling

- `MCPServerRegistry.getServerDefinition` returns `null` when the type is unknown.
- `MCPServerRegistry.createServerConfig` returns `null` for unsupported provider types.
- `MCPServerRegistry.getServerTools` returns an empty array for unsupported provider types.
- `MCPServerRegistry.validateToken` returns `false` for unsupported provider types.
- Each adapter `validateToken` method catches fetch failures and returns `false`.
- `OAuthManager.generateAuthorizationUrl` throws when the provider config is missing a `clientId`.
- `OAuthManager.exchangeCodeForToken`, `refreshAccessToken`, and `revokeToken` rethrow provider errors with a class-specific message prefix.
- `oauthRouter.exchangeCode` rejects invalid or expired state before the code exchange occurs.

## Dependencies

- `crypto` is used by `OAuthManager` for state token generation.
- `fetch` is used for all provider validation, token exchange, refresh, and revocation calls.
- Environment variables are required for `OAuthManager`:- `GITHUB_OAUTH_CLIENT_ID`
- `GITHUB_OAUTH_CLIENT_SECRET`
- `GITHUB_OAUTH_REDIRECT_URI`
- `SLACK_OAUTH_CLIENT_ID`
- `SLACK_OAUTH_CLIENT_SECRET`
- `SLACK_OAUTH_REDIRECT_URI`
- `NOTION_OAUTH_CLIENT_ID`
- `NOTION_OAUTH_CLIENT_SECRET`
- `NOTION_OAUTH_REDIRECT_URI`
- `mcpServerManager` consumes the configs emitted by `MCPServerRegistry`.
- The server README establishes OAuth as the authentication model for backend integrations and matches the bearer-token flow used by the provider adapters.

## Testing Considerations

- Validate that each provider adapter returns the expected `MCPServerConfig` fields.
- Verify that `getAvailableTools` returns the full static manifest for GitHub, Slack, and Notion.
- Assert that token validation fails cleanly when the provider endpoint returns a non-OK response.
- Confirm that `generateAuthorizationUrl` stores a state record and that `verifyState` rejects expired state.
- Confirm that `exchangeCodeForToken` maps provider responses into the expected `OAuthToken` shape.
- Confirm that GitHub refresh attempts throw the documented unsupported error.
- Confirm that the Slack and Notion refresh flows call their provider-specific token URLs with `grant_type=refresh_token`.
- Verify that the Notion adapter always sends `Notion-Version: 2022-06-28` during validation.

## Key Classes Reference

| Class | Responsibility |
| --- | --- |
| `mcp-server-registry.ts` | Registry for provider definitions, adapter dispatch, token validation, and tool discovery. |
| `github-mcp.ts` | GitHub-specific MCP config, tool manifest, and token validation. |
| `slack-mcp.ts` | Slack-specific MCP config, tool manifest, and token validation. |
| `notion-mcp.ts` | Notion-specific MCP config, tool manifest, and token validation. |
| `oauth-manager.ts` | OAuth state generation, code exchange, refresh, revocation, and token freshness checks. |
