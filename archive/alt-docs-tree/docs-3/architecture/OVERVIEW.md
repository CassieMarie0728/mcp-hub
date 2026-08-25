# Architecture Overview

MCP Hub is built on a modern, scalable architecture combining React Native for mobile, Express/tRPC for backend, and PostgreSQL for data persistence.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React Native App (Expo)                             │   │
│  │  - Token Management UI                               │   │
│  │  - Macro Builder (Visual Workflow Editor)             │   │
│  │  - Analytics Dashboard                               │   │
│  │  - OAuth Connection Flows                            │   │
│  │  - Webhook Management                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                    ┌───────┴───────┐
                    │ tRPC Client   │
                    │ Socket.io     │
                    └───────┬───────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Express)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  tRPC Routers                                        │   │
│  │  - Tokens, Workflows, Webhooks                       │   │
│  │  - Analytics, MCP, Auth                              │   │
│  │  - Templates, Notifications                          │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Business Logic Layer                                │   │
│  │  - TokenManager (Encryption/Decryption)              │   │
│  │  - WorkflowEngine (Execution/Simulation)             │   │
│  │  - WebhookManager (Signature Verification)           │   │
│  │  - MCPServerManager (Tool Discovery)                 │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Infrastructure                                      │   │
│  │  - WebSocket (Socket.io)                             │   │
│  │  - Authentication (JWT, OAuth)                       │   │
│  │  - Rate Limiting & Validation                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                    ┌───────┴───────┐
                    │ Drizzle ORM   │
                    └───────┬───────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PostgreSQL Database                                 │   │
│  │  - Tokens (encrypted)                                │   │
│  │  - Workflows & Steps                                 │   │
│  │  - Executions & Analytics                            │   │
│  │  - Webhooks & Events                                 │   │
│  │  - Users & Workspaces                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### Token Management
- **AES-256-GCM Encryption** for secure storage
- **Automatic Rotation** with versioning
- **OAuth Token Refresh** for expiring credentials
- **Audit Logging** for compliance

### Workflow Engine
- **Conditional Execution** (if/else branches)
- **Loop Support** (for, while iterations)
- **Parallel Execution** (concurrent steps)
- **Error Handling** (retry with backoff)
- **Dry-Run Mode** (preview without side effects)

### MCP Integration
- **Server Discovery** (GitHub, Slack, Notion)
- **Tool Discovery** (dynamic from servers)
- **Real-Time Execution** (with progress tracking)
- **Error Recovery** (graceful fallbacks)

### Webhook System
- **HMAC-SHA256 Signatures** for verification
- **Rate Limiting** (per-minute per webhook)
- **IP Whitelist/Blacklist** for security
- **Automatic Retry** with exponential backoff
- **Execution Logging** for debugging

### Real-Time Sync
- **Socket.io** for WebSocket connections
- **Room-Based Broadcasting** for scalability
- **Message Queuing** for offline clients
- **Reconnection Handling** (automatic)

## Data Flow

### Macro Execution Flow

1. **User triggers workflow** (manual, schedule, or webhook)
2. **WorkflowEngine validates** workflow structure
3. **Tokens retrieved** and decrypted from database
4. **MCP tools discovered** from registered servers
5. **Workflow steps executed** sequentially or in parallel
6. **Variable substitution** applied between steps
7. **Execution results recorded** in analytics
8. **Real-time updates** broadcast via WebSocket
9. **Errors logged** with retry attempts
10. **Completion event** sent to user

### Token Lifecycle

1. **User authenticates** via OAuth
2. **Token stored** encrypted in database
3. **Token expiration tracked** with alerts
4. **Automatic refresh** before expiration
5. **Manual rotation** available on demand
6. **Revocation** removes from system
7. **Audit log** records all changes

## Security Architecture

- **End-to-End Encryption** for sensitive data
- **JWT Authentication** for API requests
- **HMAC Signatures** for webhook verification
- **Rate Limiting** to prevent abuse
- **CORS Configuration** for cross-origin requests
- **SQL Injection Prevention** via ORM
- **XSS Protection** via React Native
- **CSRF Protection** for state-changing operations

## Scalability Considerations

- **Horizontal Scaling** via stateless API servers
- **Database Connection Pooling** for efficiency
- **WebSocket Load Balancing** via sticky sessions
- **Caching Layer** for frequent queries
- **Async Job Queue** for long-running tasks
- **CDN** for static assets

---

See [Deployment Guide](../deployment/README.md) for production setup.
