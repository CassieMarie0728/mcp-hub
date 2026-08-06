---
title: Docker & Kubernetes
description: "Run MCP Hub in containers: the Dockerfile image, docker-compose setup, and the provided Kubernetes deployment + ingress manifests."
tags:
  - wiki
  - install
  - docker
  - kubernetes
---

> Audience: operators | Status: stable for the image & compose; experimental for Kubernetes | Last verified: 2026-08-06

MCP Hub ships with three containerization artifacts: a `Dockerfile`, a `docker-compose.yml`, and a `kubernetes/` folder with `deployment.yaml` and `ingress.yaml`. This page documents exactly what each one contains and how to use them.

## Dockerfile

The image is a two-stage Node 20 build:

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

EXPOSE 3000
CMD ["pnpm", "start"]
```

Key properties:

| Aspect | Detail |
| --- | --- |
| Base image | `node:20-alpine` |
| Package manager | corepack-enabled `pnpm@9.12.0` (matches CI and the local toolchain) |
| Install | `pnpm install --frozen-lockfile` — lockfile must stay in sync or the build fails |
| Build step | `pnpm build` (typecheck + compile) runs inside the image |
| Port | `EXPOSE 3000` |
| Runtime command | `pnpm start` — serves the production build |

> [!NOTE]
> The image does **not** bake in a database or any secrets. It runs the app with whatever `DATABASE_URL`, `JWT_SECRET`, and friends are injected at runtime — see [Environment variables](environment-variables.md) for the full contract.

## Docker Compose

The repository root `docker-compose.yml` is deliberately minimal:

```yaml
version: '3.9'
services:
  mcp-hub:
    build: .
    container_name: mcp-hub
    env_file:
      - .env
    ports:
      - "3000:3000"
    restart: unless-stopped
```

| Aspect | Detail |
| --- | --- |
| Service | single `mcp-hub` service, image built from the local `Dockerfile` |
| Config | `env_file: .env` — all runtime config comes from a local `.env` |
| Networking | host port `3000` mapped to container port `3000` |
| Restart | `unless-stopped` |
| Database | **none included** — the compose file ships without a MySQL service; pair it with an external database or add a service block |

To run:

```text
cp .env.example .env
docker compose up -d --build
```

The app listens on `http://localhost:3000`. Verify with the health endpoint described in [Local development](local-development.md).

## Kubernetes

The `kubernetes/` folder holds two manifests.

### Deployment & service

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-hub
spec:
  replicas: 2
  selector:
    matchLabels:
      app: mcp-hub
  template:
    metadata:
      labels:
        app: mcp-hub
    spec:
      containers:
        - name: mcp-hub
          image: ghcr.io/your-org/mcp-hub:v1.0.0
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 3000
          envFrom:
            - secretRef:
                name: mcp-hub-env
---
apiVersion: v1
kind: Service
metadata:
  name: mcp-hub
spec:
  selector:
    app: mcp-hub
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP
```

| Aspect | Detail |
| --- | --- |
| Replicas | 2 |
| Image | `ghcr.io/your-org/mcp-hub:v1.0.0` — replace with your registry reference |
| Pull policy | `IfNotPresent` |
| Environment | `envFrom` secretRef `mcp-hub-env` — create this Secret with your runtime config |
| Service | ClusterIP `mcp-hub`, port `80` → container port `3000` |

### Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: mcp-hub
spec:
  rules:
    - host: mcp-hub.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: mcp-hub
                port:
                  number: 80
```

The ingress terminates host-based routing for `mcp-hub.example.com` (replace with your domain), forwarding everything to the ClusterIP service on port 80.

> [!WARNING]
> The Kubernetes manifests are **starter scaffolding**, not a production spec: no resource requests/limits, no readiness/liveness probes, no horizontal autoscaling, no TLS annotations on the ingress, and no MySQL/PVCs. Treat them as a baseline and extend before real traffic — see the checklist in [operate](../../operate/deployment-overview.md) when that section lands.

## Related pages

- [Installation overview](installation-overview.md) — how containerized deployment fits into the runtime modes.
- [Environment variables](environment-variables.md) — the config contract the image and manifests consume.
- [Database](database.md) — the external MySQL the image expects.
