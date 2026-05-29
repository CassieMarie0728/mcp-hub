# MCP Hub Production Deployment Guide

This guide covers deploying MCP Hub to production with full database integration, OAuth flows, and WebSocket real-time sync.

## Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL 12+
- Redis (for session management)
- GitHub, Slack, and Notion OAuth applications registered
- SSL/TLS certificates for HTTPS

## Environment Setup

### 1. Database Configuration

Create a PostgreSQL database and user:

```sql
CREATE DATABASE mcp_hub;
CREATE USER mcp_hub_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE mcp_hub TO mcp_hub_user;
```

### 2. Environment Variables

Create `.env.production`:

```env
# Database
DATABASE_URL=postgresql://mcp_hub_user:secure_password@db.example.com:5432/mcp_hub
DATABASE_POOL_SIZE=20
DATABASE_SSL=true

# API Server
NODE_ENV=production
PORT=3000
API_URL=https://api.example.com
WEB_URL=https://app.example.com

# WebSocket
WEBSOCKET_URL=wss://api.example.com
WEBSOCKET_PING_INTERVAL=30000

# Token Encryption
TOKEN_ENCRYPTION_KEY=your_32_byte_hex_key_here

# GitHub OAuth
GITHUB_OAUTH_CLIENT_ID=your_github_client_id
GITHUB_OAUTH_CLIENT_SECRET=your_github_client_secret
GITHUB_OAUTH_REDIRECT_URI=https://api.example.com/oauth/github/callback

# Slack OAuth
SLACK_OAUTH_CLIENT_ID=your_slack_client_id
SLACK_OAUTH_CLIENT_SECRET=your_slack_client_secret
SLACK_OAUTH_REDIRECT_URI=https://api.example.com/oauth/slack/callback

# Notion OAuth
NOTION_OAUTH_CLIENT_ID=your_notion_client_id
NOTION_OAUTH_CLIENT_SECRET=your_notion_client_secret
NOTION_OAUTH_REDIRECT_URI=https://api.example.com/oauth/notion/callback

# Monitoring
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info

# Security
SESSION_SECRET=your_session_secret_key
CORS_ORIGIN=https://app.example.com
```

## Deployment Steps

### 1. Build the Application

```bash
pnpm install
pnpm build
```

### 2. Run Database Migrations

```bash
# Apply all pending migrations
psql -h db.example.com -U mcp_hub_user -d mcp_hub < server/migrations/001_initial_schema.sql

# Verify migration
psql -h db.example.com -U mcp_hub_user -d mcp_hub -c "\dt"
```

### 3. Start the Server

```bash
# Using Node directly
NODE_ENV=production node dist/index.js

# Or using PM2 for process management
pm2 start dist/index.js --name "mcp-hub" --env production
```

### 4. Configure Reverse Proxy (Nginx)

```nginx
upstream mcp_hub_api {
  server localhost:3000;
}

server {
  listen 443 ssl http2;
  server_name api.example.com;

  ssl_certificate /etc/ssl/certs/example.com.crt;
  ssl_certificate_key /etc/ssl/private/example.com.key;

  # WebSocket support
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";

  location / {
    proxy_pass http://mcp_hub_api;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 60s;
  }

  location /socket.io {
    proxy_pass http://mcp_hub_api/socket.io;
    proxy_http_version 1.1;
    proxy_buffering off;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

### 5. Configure SSL/TLS

```bash
# Using Let's Encrypt with Certbot
certbot certonly --standalone -d api.example.com

# Auto-renew
certbot renew --quiet --no-self-upgrade
```

## Monitoring & Logging

### 1. Application Monitoring

```bash
# Using PM2 monitoring
pm2 monit

# View logs
pm2 logs mcp-hub
```

### 2. Database Monitoring

```sql
-- Check active connections
SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;

-- Check slow queries
SELECT query, calls, mean_exec_time FROM pg_stat_statements
ORDER BY mean_exec_time DESC LIMIT 10;
```

### 3. WebSocket Monitoring

Monitor WebSocket connections in real-time:

```bash
# Check Socket.io connections
curl http://localhost:3000/socket.io/admin/

# Monitor memory usage
pm2 show mcp-hub
```

## Backup & Recovery

### 1. Database Backup

```bash
# Daily backup
pg_dump -h db.example.com -U mcp_hub_user mcp_hub > /backups/mcp_hub_$(date +%Y%m%d).sql

# Backup with compression
pg_dump -h db.example.com -U mcp_hub_user -Fc mcp_hub > /backups/mcp_hub_$(date +%Y%m%d).dump
```

### 2. Restore from Backup

```bash
# From SQL dump
psql -h db.example.com -U mcp_hub_user mcp_hub < /backups/mcp_hub_20260504.sql

# From compressed dump
pg_restore -h db.example.com -U mcp_hub_user -d mcp_hub /backups/mcp_hub_20260504.dump
```

## Security Checklist

- [ ] All environment variables configured
- [ ] SSL/TLS certificates installed
- [ ] Database user has minimal required privileges
- [ ] Firewall rules configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] OAuth redirect URIs match production URLs
- [ ] Token encryption key is secure and backed up
- [ ] Session secrets are strong and unique
- [ ] Monitoring and alerting configured

## Troubleshooting

### WebSocket Connection Issues

```bash
# Check if WebSocket is accessible
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  https://api.example.com/socket.io/

# Check firewall
sudo iptables -L -n | grep 3000
```

### Database Connection Issues

```bash
# Test connection
psql -h db.example.com -U mcp_hub_user -d mcp_hub -c "SELECT 1"

# Check connection pool
SELECT count(*) FROM pg_stat_activity WHERE datname = 'mcp_hub';
```

### OAuth Token Issues

```bash
# Verify OAuth configuration
curl -X GET https://api.github.com/user \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Performance Optimization

### 1. Database Optimization

```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM executions WHERE user_id = 'user-id';

-- Vacuum and analyze
VACUUM ANALYZE;
```

### 2. Caching Strategy

- Cache OAuth tokens with 5-minute refresh buffer
- Cache workflow definitions in memory
- Use Redis for session management

### 3. Connection Pooling

Configure connection pooling in `.env.production`:

```env
DATABASE_POOL_SIZE=20
DATABASE_IDLE_TIMEOUT=30000
DATABASE_CONNECTION_TIMEOUT=5000
```

## Rollback Plan

If issues occur after deployment:

1. **Immediate Rollback**: Revert to previous version
   ```bash
   pm2 restart mcp-hub
   ```

2. **Database Rollback**: Restore from backup
   ```bash
   pg_restore -h db.example.com -U mcp_hub_user -d mcp_hub /backups/mcp_hub_previous.dump
   ```

3. **DNS Rollback**: Point to previous server
   ```bash
   # Update DNS records to point to previous API server
   ```

## Post-Deployment Verification

```bash
# Health check
curl https://api.example.com/health

# Test OAuth flow
curl -X GET https://api.example.com/oauth/github/authorize \
  -H "Content-Type: application/json"

# Test WebSocket connection
wscat -c wss://api.example.com/socket.io/

# Run end-to-end tests
pnpm test:e2e
```

## Support & Documentation

- API Documentation: https://api.example.com/docs
- GitHub Issues: https://github.com/yourusername/mcp-hub/issues
- Deployment Help: deployment@example.com
