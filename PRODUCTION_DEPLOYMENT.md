# MCP Hub: Production Deployment Guide

## Overview

This guide covers deploying MCP Hub to production with full security, monitoring, and reliability. The platform is designed for teams automating workflows across GitHub, Slack, and Notion.

## Pre-Deployment Checklist

- [ ] Database backups configured
- [ ] SSL/TLS certificates obtained
- [ ] OAuth apps registered (GitHub, Slack, Notion)
- [ ] Environment variables configured
- [ ] Monitoring and alerting set up
- [ ] Disaster recovery plan documented

## Database Setup

Apply migrations to production database:

```bash
npm run db:push
```

## OAuth Configuration

### GitHub OAuth App

1. Navigate to GitHub Settings → Developer settings → OAuth Apps
2. Create new OAuth App with:
   - **Authorization callback URL**: `https://your-domain.com/auth/github/callback`
   - **Scopes**: `repo`, `workflow`, `user:email`

### Slack OAuth App

1. Go to Slack API → Your Apps → Create New App
2. Configure OAuth redirect URLs:
   - `https://your-domain.com/auth/slack/callback`
3. Request scopes: `chat:write`, `channels:read`, `users:read`

### Notion OAuth App

1. Visit Notion Developers → My integrations
2. Create integration with redirect URI:
   - `https://your-domain.com/auth/notion/callback`

## Environment Variables

Create `.env.production`:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/mcp_hub
JWT_SECRET=<generate-strong-secret>
GITHUB_CLIENT_ID=<from-github-app>
GITHUB_CLIENT_SECRET=<from-github-app>
SLACK_CLIENT_ID=<from-slack-app>
SLACK_CLIENT_SECRET=<from-slack-app>
NOTION_CLIENT_ID=<from-notion-app>
NOTION_CLIENT_SECRET=<from-notion-app>
WEBHOOK_SECRET=<generate-strong-secret>
```

## Deployment

### Using Docker

```bash
docker build -t mcp-hub:latest .
docker run -d \
  --name mcp-hub \
  -p 3000:3000 \
  -p 8081:8081 \
  --env-file .env.production \
  mcp-hub:latest
```

### Using Kubernetes

Deploy using provided Helm chart:

```bash
helm install mcp-hub ./helm \
  --namespace production \
  --values values.production.yaml
```

## Monitoring & Observability

Enable comprehensive monitoring:

- **Metrics**: Prometheus (port 9090)
- **Logs**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Tracing**: Jaeger for distributed tracing
- **Alerts**: PagerDuty integration for critical issues

## Security Best Practices

1. **Credential Encryption**: All tokens encrypted with AES-256-GCM
2. **Rate Limiting**: 100 requests/minute per user
3. **CORS**: Whitelist production domains only
4. **HTTPS Only**: Redirect all HTTP to HTTPS
5. **Security Headers**: Implement CSP, HSTS, X-Frame-Options

## Backup & Recovery

Daily automated backups to S3:

```bash
aws s3 sync /var/lib/postgresql s3://mcp-hub-backups/
```

Recovery procedure:

```bash
aws s3 sync s3://mcp-hub-backups/ /var/lib/postgresql
systemctl restart postgresql
```

## Performance Optimization

- Enable Redis caching for frequently accessed data
- Use CDN for static assets
- Implement database connection pooling (PgBouncer)
- Configure WebSocket connection limits

## Support & Troubleshooting

For issues, check logs:

```bash
docker logs mcp-hub
```

Contact support at support@mcphub.io
