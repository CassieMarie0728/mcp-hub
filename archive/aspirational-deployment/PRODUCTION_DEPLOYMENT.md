# MCP Hub: Production Deployment Guide

> [!WARNING]
> **ASPIRATIONAL - NOT production truth.** This document describes a reliability stack (PostgreSQL, Redis, PgBouncer, Prometheus, Grafana, ELK, Jaeger, PagerDuty, Helm, systemd, S3 backups) that **does not exist** in the `mcp-hub` codebase. As of `main` @ `0691562` (2026-08-06): the only database is **MySQL via Drizzle** (single `users` table in `drizzle/schema.ts`); there is **no Redis**, **no monitoring endpoints**, **no Helm chart** (`helm/` does not exist), and **no `/ws/`, `/webhooks/`, or `/metrics` routes** on the live server. The shipped deployment assets are a `Dockerfile`, `docker-compose.yml`, `kubernetes/` manifests, `nginx.conf`, and `scripts/deploy.sh`. Treat the [wiki's Operate section](wiki/operate/index.md) and the code as ground truth; see [Feature status](wiki/project/feature-status.md) for the contradiction register. The Nginx/TLS/SSL snippets below are usable as reference only.

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

## Infrastructure Setup

### Server Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 8 cores |
| RAM | 4 GB | 16 GB |
| Storage | 50 GB | 500 GB SSD |
| Network | 100 Mbps | 1 Gbps |
| Database | PostgreSQL 12+ | PostgreSQL 15+ |
| Cache | Redis 6+ | Redis 7+ |

### Network Security

```bash
# UFW firewall rules
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP redirect
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # API (internal)
sudo ufw allow 9090/tcp  # Prometheus (internal)
sudo ufw enable
```

### SSL/TLS Certificates

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot certonly --standalone -d api.mcphub-cah4bw3p.manus.space

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## Database Configuration

### PostgreSQL Setup

```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create production database
sudo -u postgres psql <<EOF
CREATE USER mcp_hub_prod WITH PASSWORD 'STRONG_PASSWORD';
CREATE DATABASE mcp_hub_prod OWNER mcp_hub_prod;
ALTER DATABASE mcp_hub_prod SET TIMEZONE TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE mcp_hub_prod TO mcp_hub_prod;
EOF
```

### Connection Pooling (PgBouncer)

```bash
sudo apt-get install pgbouncer

# Configure /etc/pgbouncer/pgbouncer.ini
[databases]
mcp_hub_prod = host=localhost port=5432 user=mcp_hub_prod password=STRONG_PASSWORD

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 50
min_pool_size = 10
```

## Nginx Reverse Proxy

Create `/etc/nginx/sites-available/mcp-hub`:

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;
limit_req_zone $binary_remote_addr zone=webhook_limit:10m rate=10r/s;

# Upstream backend
upstream mcp_hub_backend {
    least_conn;
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name api.mcphub-cah4bw3p.manus.space;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name api.mcphub-cah4bw3p.manus.space;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.mcphub-cah4bw3p.manus.space/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.mcphub-cah4bw3p.manus.space/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_min_length 1024;

    # API endpoints with rate limiting
    location /api/ {
        limit_req zone=api_limit burst=200 nodelay;
        proxy_pass http://mcp_hub_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket endpoints
    location /ws/ {
        proxy_pass http://mcp_hub_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 3600s;
    }

    # Webhook endpoints
    location /webhooks/ {
        limit_req zone=webhook_limit burst=20 nodelay;
        proxy_pass http://mcp_hub_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Health check
    location /health {
        access_log off;
        proxy_pass http://mcp_hub_backend;
    }

    # Metrics (internal only)
    location /metrics {
        allow 127.0.0.1;
        allow 10.0.0.0/8;
        deny all;
        proxy_pass http://mcp_hub_backend;
    }
}
```

Enable and test:

```bash
sudo ln -s /etc/nginx/sites-available/mcp-hub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Monitoring & Observability

### Prometheus Metrics

Create `/etc/prometheus/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'mcp-hub'
    static_configs:
      - targets: ['localhost:9090']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:9121']
```

### Alert Rules

Create `/etc/prometheus/alert-rules.yml`:

```yaml
groups:
  - name: mcp_hub_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(workflow_errors_total[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"

      - alert: DatabaseDown
        expr: pg_up == 0
        for: 1m
        annotations:
          summary: "PostgreSQL database is down"

      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes / 1024 / 1024 > 1024
        for: 5m
        annotations:
          summary: "High memory usage (>1GB)"

      - alert: WorkflowQueueBacklog
        expr: workflow_queue_size > 10000
        for: 5m
        annotations:
          summary: "Workflow queue backlog detected"
```

### Grafana Dashboards

Import dashboards for:
- Node.js Application Metrics
- PostgreSQL Performance
- Redis Memory Usage
- Nginx Request Rates
- Workflow Execution Metrics
- Error Rate Trends

## Backup & Disaster Recovery

### Automated Database Backups

Create `/usr/local/bin/backup-mcp-hub.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mcp-hub"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/mcp_hub_prod_$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"
pg_dump -U mcp_hub_prod mcp_hub_prod | gzip > "$BACKUP_FILE"

# Upload to S3
aws s3 cp "$BACKUP_FILE" s3://mcp-hub-prod-backups/

# Cleanup old backups (keep 30 days)
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

Add to crontab:

```bash
0 2 * * * /usr/local/bin/backup-mcp-hub.sh
```

### Point-in-Time Recovery

```bash
# Restore from backup
gunzip < /var/backups/mcp-hub/mcp_hub_prod_20260507_020000.sql.gz | \
  psql -U mcp_hub_prod mcp_hub_prod
```

## Systemd Service

Create `/etc/systemd/system/mcp-hub.service`:

```ini
[Unit]
Description=MCP Hub Production Server
After=network.target postgresql.service redis.service
Wants=postgresql.service redis.service

[Service]
Type=simple
User=mcp-hub
WorkingDirectory=/home/ubuntu/mcp-hub
EnvironmentFile=/etc/mcp-hub/.env.production
ExecStart=/usr/bin/node /home/ubuntu/mcp-hub/dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=mcp-hub

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/log/mcp-hub /var/cache/mcp-hub

# Resource limits
LimitNOFILE=65536
LimitNPROC=512

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable mcp-hub
sudo systemctl start mcp-hub
```

## Blue-Green Deployment

```bash
#!/bin/bash
# Deploy to green environment
cd /home/ubuntu/mcp-hub-green
git pull origin main
pnpm install
pnpm build

# Run smoke tests
pnpm test

# Switch traffic to green
sudo systemctl stop mcp-hub
sudo systemctl start mcp-hub-green
sudo systemctl restart nginx

# Monitor for errors
sleep 60
if [ $? -eq 0 ]; then
  echo "Deployment successful"
else
  echo "Deployment failed, rolling back"
  sudo systemctl stop mcp-hub-green
  sudo systemctl start mcp-hub
  sudo systemctl restart nginx
fi
```

## Post-Deployment Verification

After deployment, verify:

- [ ] API responding (curl https://api.mcphub-cah4bw3p.manus.space/health)
- [ ] WebSocket connections working
- [ ] Database connectivity and performance
- [ ] OAuth flows functional (GitHub, Slack, Notion)
- [ ] Metrics being collected (Prometheus)
- [ ] Logs being written and rotated
- [ ] Backups running successfully
- [ ] Alerts configured and working
- [ ] SSL certificate valid
- [ ] Rate limiting active

## Maintenance Schedule

| Task | Frequency | Command |
|------|-----------|----------|
| Database maintenance | Weekly | `VACUUM ANALYZE;` |
| Log rotation | Daily | Automatic via logrotate |
| Certificate renewal | Monthly | Automatic via certbot |
| Dependency updates | Monthly | `pnpm update` |
| Security patches | As needed | `apt-get update && apt-get upgrade` |

## Incident Response

1. **Check status**: `systemctl status mcp-hub`
2. **View logs**: `journalctl -u mcp-hub -n 100`
3. **Check metrics**: Access Grafana dashboard
4. **Restart service**: `systemctl restart mcp-hub`
5. **Escalate if needed**: Alert on-call engineer via PagerDuty

## Support & Troubleshooting

For issues, check logs:

```bash
journalctl -u mcp-hub -f
```

Common issues and solutions:

| Issue | Solution |
|-------|----------|
| API not responding | Check service status and logs |
| High error rate | Check database connectivity and metrics |
| WebSocket disconnects | Verify Nginx WebSocket config |
| Memory leak | Restart service and review logs |
| Database slow queries | Run VACUUM ANALYZE and check indexes |

Contact support at support@mcphub.io
