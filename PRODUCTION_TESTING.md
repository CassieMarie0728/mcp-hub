# Production Testing & Validation Guide

## Overview

This document outlines the testing procedures to validate the MCP Hub production deployment before going live.

---

## 1. Environment Validation

### 1.1 Configuration Checks

```bash
# Verify environment variables are set
env | grep -E "^(NODE_ENV|DATABASE_URL|REDIS_URL|API_PORT)"

# Check production config file exists
ls -la /etc/mcp-hub/.env.production

# Validate config syntax
node -e "require('dotenv').config({ path: '/etc/mcp-hub/.env.production' }); console.log('Config loaded successfully')"
```

### 1.2 System Dependencies

```bash
# Check Node.js version (should be 18+)
node --version

# Check PostgreSQL connectivity
psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME -c "SELECT version();"

# Check Redis connectivity
redis-cli -h $REDIS_HOST ping

# Verify Nginx is running
systemctl status nginx

# Check SSL certificate validity
openssl x509 -in /etc/ssl/certs/mcp-hub.crt -text -noout | grep -A2 "Validity"
```

---

## 2. Database Validation

### 2.1 Schema Verification

```bash
# Connect to production database
psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME

# List all tables
\dt

# Verify key tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

# Check indexes are created
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY indexname;

# Verify triggers are active
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

### 2.2 Data Integrity

```bash
# Check for foreign key constraints
SELECT constraint_name, table_name FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY';

# Verify no orphaned records
SELECT COUNT(*) FROM workspace_members
WHERE workspace_id NOT IN (SELECT id FROM workspaces);

# Check token encryption is working
SELECT COUNT(*) FROM tokens WHERE encrypted_token IS NOT NULL;
```

---

## 3. API Endpoint Testing

### 3.1 Health Checks

```bash
# Test main health endpoint
curl -v https://api.mcp-hub.com/health

# Expected response:
# HTTP/2 200
# {
#   "status": "healthy",
#   "timestamp": "2026-05-07T...",
#   "checks": { ... }
# }

# Test metrics endpoint
curl -v https://api.mcp-hub.com/metrics

# Expected response: Prometheus format metrics
```

### 3.2 Authentication

```bash
# Test OAuth callback
curl -v "https://api.mcp-hub.com/oauth/callback?code=test_code&state=test_state"

# Test token refresh
curl -X POST https://api.mcp-hub.com/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "..."}'

# Test protected endpoint
curl -v https://api.mcp-hub.com/api/workspaces \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 3.3 Workflow Execution

```bash
# Create test workflow
curl -X POST https://api.mcp-hub.com/api/workflows \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Workflow",
    "steps": [
      {
        "type": "tool",
        "tool": "echo",
        "params": {"message": "Hello, Production!"}
      }
    ]
  }'

# Execute workflow
curl -X POST https://api.mcp-hub.com/api/workflows/{id}/execute \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Check execution status
curl https://api.mcp-hub.com/api/executions/{execution_id} \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## 4. Monitoring & Observability

### 4.1 Prometheus Metrics

```bash
# Scrape metrics endpoint
curl http://localhost:9090/metrics | head -50

# Check key metrics are being collected
curl http://localhost:9090/metrics | grep -E "^(workflow_executions_total|tool_executions_total|errors_total)"

# Verify metric labels
curl http://localhost:9090/metrics | grep "workspace_id"
```

### 4.2 Logging

```bash
# Check application logs
tail -f /var/log/mcp-hub/combined-$(date +%Y-%m-%d).log

# Check error logs
tail -f /var/log/mcp-hub/error-$(date +%Y-%m-%d).log

# Search for errors
grep "ERROR" /var/log/mcp-hub/combined-*.log | tail -20

# Check log rotation is working
ls -lah /var/log/mcp-hub/ | head -20
```

### 4.3 Alert System

```bash
# Verify alert rules are registered
curl http://localhost:3000/admin/alerts/rules

# Test alert trigger
curl -X POST http://localhost:3000/admin/alerts/test \
  -H "Content-Type: application/json" \
  -d '{
    "severity": "warning",
    "message": "Test alert"
  }'

# Check Slack webhook is configured
curl -X POST $SLACK_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"text": "Test message from MCP Hub"}'
```

---

## 5. Performance Testing

### 5.1 Load Testing

```bash
# Install Apache Bench
apt-get install apache2-utils

# Test API endpoint under load
ab -n 1000 -c 10 https://api.mcp-hub.com/health

# Test workflow execution endpoint
ab -n 100 -c 5 -p workflow.json -T application/json \
  https://api.mcp-hub.com/api/workflows/test/execute

# Expected: Response time < 500ms, Success rate > 99%
```

### 5.2 Database Performance

```bash
# Check query performance
EXPLAIN ANALYZE SELECT * FROM workflow_executions
WHERE workspace_id = 'test-workspace'
AND created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;

# Monitor slow queries
tail -f /var/log/postgresql/postgresql.log | grep "duration:"

# Check connection pool usage
SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;
```

### 5.3 Memory & CPU

```bash
# Monitor system resources
watch -n 1 'free -h && echo "---" && top -bn1 | head -20'

# Check application memory usage
ps aux | grep "node.*mcp-hub"

# Monitor Docker container (if containerized)
docker stats mcp-hub-api
```

---

## 6. Security Testing

### 6.1 SSL/TLS

```bash
# Verify SSL certificate
openssl s_client -connect api.mcp-hub.com:443 -showcerts

# Check certificate expiration
echo | openssl s_client -servername api.mcp-hub.com -connect api.mcp-hub.com:443 2>/dev/null | openssl x509 -noout -dates

# Test SSL/TLS version
openssl s_client -connect api.mcp-hub.com:443 -tls1_2

# Verify HSTS header
curl -I https://api.mcp-hub.com | grep "Strict-Transport-Security"
```

### 6.2 Authentication & Authorization

```bash
# Test invalid token rejection
curl -v https://api.mcp-hub.com/api/workspaces \
  -H "Authorization: Bearer invalid_token"

# Expected: 401 Unauthorized

# Test cross-workspace access prevention
curl -v https://api.mcp-hub.com/api/workspaces/other-workspace \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Expected: 403 Forbidden (if user doesn't have access)

# Test rate limiting
for i in {1..100}; do
  curl -s https://api.mcp-hub.com/health > /dev/null
done

# Check for rate limit headers
curl -I https://api.mcp-hub.com/health | grep -i "rate-limit"
```

### 6.3 Input Validation

```bash
# Test SQL injection prevention
curl -X POST https://api.mcp-hub.com/api/workflows \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test; DROP TABLE workflows; --"
  }'

# Test XSS prevention
curl -X POST https://api.mcp-hub.com/api/workflows \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<script>alert(\"XSS\")</script>"
  }'

# Test CSRF protection
curl -X POST https://api.mcp-hub.com/api/workflows \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}' \
  # Should fail without proper CSRF token
```

---

## 7. Disaster Recovery

### 7.1 Backup Verification

```bash
# List available backups
ls -lah /backups/mcp-hub/

# Verify backup integrity
pg_dump -h localhost -U postgres mcp-hub | md5sum

# Test restore procedure (on staging)
pg_restore -h staging-db -U postgres -d mcp-hub /backups/mcp-hub/latest.dump

# Verify restored data
psql -h staging-db -U postgres -d mcp-hub -c "SELECT COUNT(*) FROM workflows;"
```

### 7.2 Failover Testing

```bash
# Simulate database failure
# 1. Stop primary database
systemctl stop postgresql

# 2. Verify application handles gracefully
curl -v https://api.mcp-hub.com/health

# 3. Promote replica (if configured)
# 4. Verify application reconnects

# 5. Restart primary
systemctl start postgresql
```

---

## 8. Admin Dashboard Testing

### 8.1 Metrics Display

```bash
# Access admin dashboard
open https://admin.mcp-hub.com/dashboard

# Verify metrics are loading
# - Workflow execution count
# - Success rate percentage
# - Error trends
# - System health status

# Test time range selector
# - Click "Hour", "Day", "Week", "Month"
# - Verify metrics update

# Test tab navigation
# - Click "Overview", "Workflows", "Errors"
# - Verify content changes
```

### 8.2 Real-Time Updates

```bash
# Monitor metrics updates
# - Refresh rate should be ~30 seconds
# - Numbers should change between refreshes

# Test manual refresh button
# - Click "Refresh"
# - Verify immediate update
```

### 8.3 Alert Display

```bash
# Trigger test alert
curl -X POST https://api.mcp-hub.com/admin/alerts/test \
  -H "Content-Type: application/json" \
  -d '{"severity": "warning", "message": "Test alert"}'

# Verify alert appears in dashboard
# - Check alert notification
# - Verify severity color
# - Check timestamp
```

---

## 9. Checklist

- [ ] All environment variables configured
- [ ] Database schema created and verified
- [ ] All indexes created
- [ ] SSL certificate installed and valid
- [ ] Nginx reverse proxy configured
- [ ] Health check endpoint responding
- [ ] Metrics endpoint collecting data
- [ ] Logging system working
- [ ] Alert system configured
- [ ] Admin dashboard accessible
- [ ] Load testing passed
- [ ] Security tests passed
- [ ] Backup system working
- [ ] Failover tested
- [ ] Documentation updated

---

## 10. Rollback Procedure

If critical issues are found:

```bash
# 1. Stop application
systemctl stop mcp-hub

# 2. Restore from previous backup
pg_restore -h localhost -U postgres -d mcp-hub /backups/mcp-hub/previous.dump

# 3. Revert code to previous version
git checkout previous-tag

# 4. Restart application
systemctl start mcp-hub

# 5. Verify health
curl https://api.mcp-hub.com/health
```

---

## Sign-Off

- [ ] QA Lead: _________________ Date: _______
- [ ] DevOps Lead: _________________ Date: _______
- [ ] Product Manager: _________________ Date: _______

**Status:** [ ] Ready for Production [ ] Needs Fixes [ ] Blocked
