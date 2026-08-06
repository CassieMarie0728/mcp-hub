# Deployment Guide

MCP Hub can be deployed to various cloud platforms or self-hosted environments.

## Prerequisites

- Node.js 22.13.0+
- PostgreSQL 14+
- Docker (optional, for containerized deployment)
- SSL certificate (for production)

## Environment Variables

Create a `.env` file with:

```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mcp_hub

# API
API_PORT=3000
API_URL=https://api.mcphub.io

# OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
SLACK_CLIENT_ID=your-slack-client-id
SLACK_CLIENT_SECRET=your-slack-client-secret
NOTION_CLIENT_ID=your-notion-client-id
NOTION_CLIENT_SECRET=your-notion-client-secret

# Encryption
ENCRYPTION_KEY=your-256-bit-encryption-key

# JWT
JWT_SECRET=your-jwt-secret

# WebSocket
WEBSOCKET_URL=wss://api.mcphub.io

# Monitoring
PROMETHEUS_PORT=9090
LOG_LEVEL=info
```

## Database Setup

```bash
# Run migrations
pnpm db:push
```

## Deployment Options

### AWS ECS

1. Build Docker image
2. Push to ECR
3. Create ECS task definition
4. Deploy to ECS cluster
5. Configure ALB for load balancing

### Google Cloud Run

```bash
gcloud run deploy mcp-hub \
  --source . \
  --platform managed \
  --region us-central1 \
  --set-env-vars DATABASE_URL=$DATABASE_URL
```

### Self-Hosted (Docker)

```bash
docker build -t mcp-hub .
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  mcp-hub
```

## Monitoring & Logging

- **Sentry** for error tracking
- **CloudWatch** for logs
- **Prometheus** for metrics
- **Grafana** for dashboards

## SSL/TLS

Use Let's Encrypt for free SSL certificates:

```bash
certbot certonly --standalone -d api.mcphub.io
```

## Backup & Recovery

- Daily automated backups
- Point-in-time recovery
- Cross-region replication
- Backup encryption

---

See [DEPLOYMENT.md](../../DEPLOYMENT.md) for detailed instructions.
