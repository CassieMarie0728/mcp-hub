# API Documentation

MCP Hub exposes a comprehensive tRPC API with 50+ procedures for managing servers, workflows, tokens, webhooks, and analytics.

## Base URL

- **Development**: `http://localhost:3000`
- **Production**: `https://api.mcphub.io`

## Authentication

All API requests require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

## Available Routers

### Tokens Router
Manage secure credential storage and lifecycle.

- `tokens.list()` — List all stored tokens
- `tokens.store()` — Store encrypted token
- `tokens.revoke()` — Revoke token
- `tokens.rotate()` — Rotate token
- `tokens.getByServer()` — Get tokens for specific server

### Workflows Router
Create and execute automation workflows.

- `workflows.list()` — List all workflows
- `workflows.create()` — Create new workflow
- `workflows.save()` — Save workflow changes
- `workflows.delete()` — Delete workflow
- `workflows.execute()` — Execute workflow
- `workflows.getById()` — Get workflow details

### Webhooks Router
Manage webhook triggers and executions.

- `webhooks.create()` — Create webhook
- `webhooks.list()` — List webhooks
- `webhooks.update()` — Update webhook
- `webhooks.delete()` — Delete webhook
- `webhooks.test()` — Test webhook
- `webhooks.rotate()` — Rotate webhook secret
- `webhooks.verify()` — Verify webhook signature
- `webhooks.stats()` — Get webhook statistics
- `webhooks.events()` — Get webhook events

### Analytics Router
Track execution metrics and performance.

- `analytics.generateReport()` — Generate execution report
- `analytics.recordExecution()` — Record execution event
- `analytics.getToolStats()` — Get tool usage statistics
- `analytics.getServerStats()` — Get server statistics
- `analytics.getErrorTrends()` — Get error trends

### MCP Router
Discover and execute MCP tools.

- `mcp.discoverTools()` — Discover available tools
- `mcp.executeTool()` — Execute MCP tool
- `mcp.getServerStatus()` — Get server status

### Auth Router
Handle OAuth flows and authentication.

- `auth.initiateOAuth()` — Start OAuth flow
- `auth.completeOAuth()` — Complete OAuth flow
- `auth.refreshToken()` — Refresh OAuth token

## Error Handling

All errors follow this format:

```json
{
  "code": "ERROR_CODE",
  "message": "Human readable error message",
  "details": {}
}
```

Common error codes:

- `UNAUTHORIZED` — Missing or invalid authentication
- `FORBIDDEN` — Insufficient permissions
- `NOT_FOUND` — Resource not found
- `VALIDATION_ERROR` — Invalid input
- `INTERNAL_ERROR` — Server error

## Rate Limiting

API requests are rate limited to 1000 requests per minute per user.

## Webhooks

Webhooks are signed using HMAC-SHA256. Verify the signature using the webhook secret:

```javascript
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(requestBody)
  .digest('hex');

if (signature !== request.headers['x-webhook-signature']) {
  throw new Error('Invalid signature');
}
```

---

For detailed endpoint documentation, see the [tRPC API Reference](./REFERENCE.md).
