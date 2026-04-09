# Deployment Guide

## Local development deployment

```bash
pnpm install
cp .env.example .env
pnpm dev
```

## Production build

```bash
pnpm build
pnpm start
```

## Docker deployment

```bash
docker compose up --build -d
```

## Kubernetes deployment

```bash
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/ingress.yaml
```

## Reverse proxy

An example nginx config is provided in `nginx.conf` for upstream proxying.
