---
title: Reverse Proxy
description: The shipped nginx.conf, what it covers, the WebSocket upgrade headers it passes, and the TLS termination you must add.
tags:
  - operate
  - nginx
  - reverse-proxy
  - tls
---

> Audience: operators & self-hosters | Status: living document | Last verified: 2026-08-06

MCP Hub ships a single reverse-proxy artifact: `nginx.conf` at the repo root. It is a real, working Nginx config, but it is a **baseline** — it proxies HTTP and passes WebSocket upgrade headers, and it deliberately leaves TLS termination out. This page documents exactly what the file does and what you must add for HTTPS.

## The shipped `nginx.conf`

The file, in full:

```nginx
events {}

http {
  upstream mcp_hub {
    server mcp-hub:3000;
  }

  server {
    listen 80;
    server_name _;

    location / {
      proxy_pass http://mcp_hub;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }
  }
}
```

| Aspect | Detail |
| --- | --- |
| Upstream | `mcp-hub:3000` — the app container name/port. Matches the Docker Compose `container_name: mcp-hub`. |
| Listener | HTTP on port 80, any host (`server_name _`). |
| WebSocket | `Upgrade` / `Connection: upgrade` headers — real-time channels survive the proxy. |
| Client info | `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto` forwarded. |
| TLS | **None** — no `listen 443`, no certificates. |

## What it covers and what it does not

- **Covers:** routing traffic to the app, WebSocket upgrades, and standard forwarded headers.
- **Does not cover:** TLS/HTTPS, HTTP-to-HTTPS redirects, rate limiting at the edge, path-specific rules (e.g. separating `/api/trpc` from the landing page), or upstream health checks. There is no `location /api/` or `/api/health` block — every path goes to the same upstream.

## Using it

Run Nginx as a container in the same Docker network as the app, or install it on the host. Two expectations matter:

1. The upstream name `mcp-hub` must resolve — with Docker Compose the app's `container_name` is `mcp-hub`, so a sibling nginx container on the same network resolves it.
2. The app must be listening on the port you target. The server scans up to 3019 if 3000 is busy, so pin `PORT` to keep the proxy stable ([Deployment overview](deployment-overview.md)).

## Add TLS (required for production)

The config has no TLS block. To serve HTTPS you must either extend this file with a `listen 443 ssl` server (certbot + Let's Encrypt is the typical path) or terminate TLS at an ingress/edge in front of Nginx. The archived production docs (`archive/aspirational-deployment/PRODUCTION_DEPLOYMENT.md`) show a full TLS Nginx layout — but note that file is otherwise aspirational (PostgreSQL, Redis, PM2, Helm — none in the codebase). Treat its Nginx/TLS snippets as reference, and this wiki + the code as ground truth.

Remember the app's own CORS allowlist: browsers must reach it from an allowed origin (`EXPO_WEB_PREVIEW_URL` / `EXPO_PACKAGER_PROXY_URL` for a real domain) — see [Environment variables](../install-and-configure/environment-variables.md) and the [Production checklist](production-checklist.md).

## Next steps

- [Production checklist](production-checklist.md) — TLS is a go-live requirement.
- [Monitoring & runbooks](monitoring-runbooks.md) — diagnosing proxy-vs-app failures.
- [Docker & Kubernetes](../install-and-configure/docker.md) — the container the proxy forwards to.
