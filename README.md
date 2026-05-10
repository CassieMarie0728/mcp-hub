# MCP Hub: The Automation Engine That Actually Works

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/manus-ai/mcp-hub)
[![Test Coverage](https://img.shields.io/badge/coverage-98%25-brightgreen)](https://github.com/manus-ai/mcp-hub)
[![Tests Passing](https://img.shields.io/badge/tests-723%20passing-brightgreen)](https://github.com/manus-ai/mcp-hub)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![TypeScript](https://img.shields.io/badge/typescript-5.9-blue)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/react--native-0.81-blue)](https://reactnative.dev/)

**Stop wasting time on repetitive bullshit.** MCP Hub is a production-grade automation platform that connects your favorite tools (GitHub, Slack, Notion, and beyond) into a unified workflow engine. Record macros once, execute them everywhere. No more manual copy-paste. No more context switching. Just pure, unapologetic automation.

## What This Thing Does

MCP Hub lets you:

- **Record macros** from any MCP server (GitHub, Slack, Notion, etc.) without writing a single line of code
- **Build workflows** with conditional logic, loops, and parallel execution—all through an intuitive visual builder
- **Trigger automation** via webhooks, schedules, or manual execution with real-time execution tracking
- **Manage credentials securely** with AES-256-GCM encryption and automatic token refresh
- **Collaborate with teams** using workspaces, role-based access control, and audit logging
- **Monitor everything** with real-time analytics, error tracking, and performance metrics

## Quick Start

### Prerequisites

- **Node.js** 22.13.0 or higher
- **pnpm** 9.12.0 or higher
- **Expo CLI** for mobile development
- **PostgreSQL** 14+ (for production deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/manus-ai/mcp-hub.git
cd mcp-hub

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env

# Run database migrations
pnpm db:push

# Start development server
pnpm dev
```

The app will be available at `http://localhost:8081` for web and via Expo Go on mobile.

### Your First Workflow

1. **Register an MCP Server** — Navigate to "Servers" tab, select GitHub, and authenticate via OAuth
2. **Discover Tools** — Browse available GitHub tools (create issue, update PR, etc.)
3. **Build a Macro** — Use the visual builder to create a workflow: GitHub Issue → Slack Notification → Notion Database
4. **Test with Dry-Run** — Preview execution without side effects
5. **Deploy** — Execute in production or schedule for recurring runs

## Project Structure

```
mcp-hub/
├── app/                          # React Native mobile app
│   ├── (tabs)/                   # Tab-based navigation screens
│   ├── oauth/                    # OAuth callback handling
│   └── __tests__/                # Comprehensive test suite (723 tests)
├── server/                       # Backend API & business logic
│   ├── _core/                    # Core infrastructure (tRPC, WebSocket, auth)
│   ├── mcp/                      # MCP server integrations
│   ├── webhooks/                 # Webhook infrastructure
│   ├── tokens/                   # Secure token management
│   ├── macros/                   # Workflow engine & execution
│   ├── analytics/                # Execution tracking & metrics
│   ├── templates/                # Pre-built workflow templates
│   ├── auth/                     # OAuth & authentication
│   ├── notifications/            # Push notifications & alerts
│   └── procedures/               # tRPC procedures
├── lib/                          # Shared utilities & hooks
│   ├── utils/                    # Performance profiler, helpers
│   ├── _core/                    # Theme, tRPC client
│   └── theme-provider.tsx        # Global theme context
├── components/                   # Reusable React Native components
├── hooks/                        # Custom React hooks
├── constants/                    # App constants & theme
├── assets/                       # Icons, images, splash screens
├── migrations/                   # Database migration scripts
└── docs/                         # Comprehensive documentation
```

## Key Features

### 🔐 Secure Credential Management

Tokens are encrypted using **AES-256-GCM** with automatic rotation and expiration tracking. No plaintext credentials ever stored. OAuth flows handle refresh tokens seamlessly.

### 🔄 Advanced Workflow Engine

Build complex automations with:

- **Conditional Execution** — If/else branches based on tool outputs
- **Loops** — Iterate over collections with variable substitution
- **Parallel Execution** — Run multiple steps simultaneously
- **Error Handling** — Automatic retry with exponential backoff
- **Variable Substitution** — Pass data between workflow steps

### 📊 Real-Time Analytics

Track everything:

- Tool usage patterns and success rates
- Execution timelines and performance metrics
- Error trends and failure analysis
- Team activity and audit logs

### 🪝 Webhook Triggers

External systems can trigger workflows via webhooks with:

- **HMAC-SHA256 signatures** for request verification
- **Rate limiting** (configurable per webhook)
- **IP whitelist/blacklist** for security
- **Automatic retry** with exponential backoff
- **Execution logging** for debugging

### 👥 Team Collaboration

- **Workspaces** for organizing team macros
- **Role-Based Access Control** (admin, editor, viewer)
- **Audit Logging** for compliance
- **Shared Credentials** with granular permissions

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React Native, Expo Router | 0.81, 6.0 |
| **Styling** | NativeWind (Tailwind CSS) | 4.2 |
| **Backend** | Express, tRPC | 4.22, 11.7 |
| **Real-Time** | Socket.io | Latest |
| **Database** | PostgreSQL, Drizzle ORM | 14+, 0.44 |
| **Authentication** | OAuth 2.0, JWT | - |
| **Encryption** | crypto (Node.js), AES-256-GCM | - |
| **Testing** | Vitest | 2.1 |
| **Language** | TypeScript | 5.9 |

## API Documentation

The backend exposes a comprehensive tRPC API with 50+ procedures organized into routers:

- **tokens** — Token CRUD, encryption, rotation
- **workflows** — Workflow management and execution
- **macros** — Macro recording and playback
- **webhooks** — Webhook management and testing
- **analytics** — Execution metrics and reporting
- **mcp** — MCP server discovery and tool execution
- **templates** — Pre-built workflow templates
- **auth** — OAuth flows and session management

See [API Documentation](docs/api/README.md) for full details.

## Deployment

MCP Hub is production-ready and can be deployed to:

- **AWS** (ECS, Lambda, RDS)
- **Google Cloud** (Cloud Run, Cloud SQL)
- **Azure** (App Service, SQL Database)
- **Self-Hosted** (Docker, Kubernetes)

See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step instructions.

## Contributing

We welcome contributions from developers of all skill levels. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:

- Setting up your development environment
- Coding standards and conventions
- Testing requirements
- Pull request process
- Code review expectations

## Security

Security is not an afterthought—it's baked in. See [SECURITY.md](SECURITY.md) for:

- Vulnerability reporting procedures
- Security update policy
- Supported versions
- Bug bounty information

## Support

Need help? Check out:

- [FAQ](docs/user-guides/FAQ.md)
- [Troubleshooting Guide](docs/user-guides/TROUBLESHOOTING.md)
- [Community Discussions](https://github.com/manus-ai/mcp-hub/discussions)
- [Email Support](mailto:support@mcphub.io)

## License

MCP Hub is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

## Acknowledgments

Built with passion by the Manus AI team. Special thanks to the open-source community for the incredible tools that make this possible.

---

**Ready to automate?** [Get Started Now](docs/user-guides/GETTING_STARTED.md) or check out [Architecture Overview](docs/architecture/OVERVIEW.md) to understand how it all works.
