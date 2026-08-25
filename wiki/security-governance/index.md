---
title: Security & Governance
description: "Section hub: the security model, secrets handling, MCP safety, threat model, privacy, governance, and vulnerability reporting."
tags:
  - wiki
  - section
  - security
---

> Audience: everyone | Status: living document | Last verified: 2026-08-06

This section is the security and governance view of MCP Hub: what the threat model actually is for this codebase, how secrets are handled, how MCP servers are kept from leaking credentials, and how to report a vulnerability. It is grounded in the repository as it exists on `main` — not in the aspirational deployment docs. When the wiki and a root doc disagree, the wiki wins ([Feature status](../project/feature-status.md)).

## Pages in this section

| Page | What it answers |
| --- | --- |
| [Secrets handling](secrets-handling.md) | The `.env` contract, redaction rules, token encryption, and the operator checklist. |
| [Vulnerability reporting](vulnerability-reporting.md) | Where to report a flaw, what to include, and response expectations. |

## The security model in one paragraph

MCP Hub is a **client/host** that talks to MCP servers over HTTP and exposes their tools through its own tRPC API. The trust boundary that matters most is the **one between the app and the MCP servers it calls** — a malicious or buggy server could return hostile tool output or attempt to capture credentials. The repo's main defense is **secret redaction**: server configs are scrubbed before they are returned to the client. Everything else (auth, sessions, tokens) is secondary hardening on that core boundary.

## What is real vs aspirational

The security posture is defined by what is actually wired:

- **Real (wired):** session JWT auth with `JWT_SECRET`; OAuth flow with CSRF `state` (in-memory, 10-minute expiry); `user`/`admin` roles with tRPC guards; AES-256-GCM token encryption; MCP secret redaction (`redactServerConfig`); global + API rate limiters (the auth-specific limiter is defined but not wired); CORS allowlist. Details on [Auth & Sessions](../architecture/auth-session.md).
- **Aspirational (docs only):** PostgreSQL, Redis, TLS termination in `nginx.conf`, `/metrics`, alert dashboards, and audit-log/governance screens. `nginx.conf` does **not** terminate TLS — HTTPS must come from the ingress/platform edge ([Reverse proxy](../operate/reverse-proxy.md)). `governance.tsx` and `audit-log.tsx` are parked under `app/_disabled` ([Disabled feature catalog](../project/disabled-catalog.md)).

## Secrets handling

Deep dive on the full model - every variable, the redaction walk, and the operator checklist: [Secrets handling](secrets-handling.md). The rules that hold everywhere:

1. **Never commit real credentials.** `.env` is git-ignored; `.env.example` ships placeholders only. See [Environment variables](../install-and-configure/environment-variables.md).
2. **Secrets stay out of MCP responses.** `redactServerConfig` masks bearer tokens, passwords, and any header whose name contains `secret`, `token`, or `password` (or is `authorization`/`x-api-key`) before a server config reaches the client ([MCP integration](../architecture/mcp-integration.md)).
3. **Token encryption keys are ephemeral.** Long-lived tokens are encrypted with AES-256-GCM, but if `TOKEN_ENCRYPTION_KEY` is not set the key is generated fresh at startup — tokens become undecryptable after a restart. In-memory again ([Token management](../user-guide/token-management.md)).
4. **Kubernetes injects secrets from a `Secret`** (`envFrom.secretRef` in `kubernetes/deployment.yaml`); review it before deploying ([Deployment overview](../operate/deployment-overview.md)).

## MCP safety

Because MCP Hub executes tools on remote servers, the MCP layer is a security surface:

- Secrets in server configs are redacted on read (`redactServerConfig`).
- Server configs are validated against `MCPServerConfigSchema` before storage ([MCP integration](../architecture/mcp-integration.md)).
- Tool execution routes through the extended MCP router, which is `protectedProcedure`-guarded (valid session required) ([Backend API surface](../architecture/backend-api-surface.md)).
- The client negotiates a specific protocol version (`2024-11-25`); a fallback reports `'1.0'`. Transport is HTTP-only regardless of what the config schema accepts ([Known limitations](../user-guide/server-connections.md#known-limitations)).
- There is **no sandboxing** of tool output or timeouts beyond the app's own behavior — treat every connected server as a potential source of hostile output.

## Threat model

In decreasing order of plausibility, the threats this codebase is exposed to:

1. **Credential leak via a connected MCP server** — a server returning mirrored/echoed headers, or a config that stores secrets in an unredacted field. Mitigation: redaction on read; the rest is operator diligence on which servers you connect.
2. **Session/token theft** — a stolen `app_session_id` cookie or bearer token is usable until expiry. Mitigation: short-lived JWT, AES-GCM token encryption, secure storage in `SecureStore`.
3. **Brute force on auth** — mitigated by auth-route rate limiters.
4. **Replay/CSRF on OAuth** — mitigated by the 32-byte random `state` (10-minute expiry, in-memory).
5. **Unsecured production transport** — if you deploy without TLS at the edge, traffic is plaintext. The repo does not enforce TLS for you.

## Privacy & data

Almost all app data (servers, tools, tokens, webhooks, workflows, analytics) is in-memory and local to the process; the only durable store is the MySQL `users` table ([Data model](../architecture/data-model.md)). There is no telemetry or analytics shipped back to any vendor from the wiki's point of view — the analytics screens are disabled. `OPENAI_API_KEY` enables optional AI-assisted features only when you configure it ([Environment variables](../install-and-configure/environment-variables.md)).

## Governance

- **License:** MIT (`LICENSE`).
- **Code of conduct:** `CODE_OF_CONDUCT.md` applies to all contributors.
- **Review gates:** CI runs type-check, lint, and tests on PRs ([CI/CD](../contribute/ci-cd.md)); the contributor gate is `./scripts/test.sh`.
- **Audit/governance screens are disabled:** `governance.tsx`, `audit-log.tsx` live under `app/_disabled` ([Disabled feature catalog](../project/disabled-catalog.md)).

## Vulnerability reporting

`SECURITY.md` (repo root) is the policy: report suspected vulnerabilities **privately** — do **not** open a public GitHub issue. There is no dedicated private mailbox, no SLA, and no bug bounty yet; maintainers respond as capacity allows. Full walkthrough - what to include, response expectations, and scope: [Vulnerability reporting](vulnerability-reporting.md). See [Contributing](../contribute/index.md) for the general contribution path.

## Related sections

- [Architecture](../architecture/index.md) — [Auth & Sessions](../architecture/auth-session.md) is the deepest security read.
- [Operate](../operate/index.md) — [Reverse proxy](../operate/reverse-proxy.md) and [Production checklist](../operate/production-checklist.md) for deployment-time hardening.
- [Project](../project/index.md) — [Feature status](../project/feature-status.md) for what is real vs aspirational.
