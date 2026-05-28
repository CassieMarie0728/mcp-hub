# Security Policy

This document explains how to report security issues in MCP Hub and how to handle the repository responsibly during development, testing, and deployment.

## Supported versions

MCP Hub does not currently publish a formal supported-version matrix.

Until version support policy is documented more formally, treat the `main` branch and the latest maintained release state as the primary focus for security fixes. If you are running a fork or an older deployment, verify whether the issue also applies to the current codebase before reporting it.

## Reporting a vulnerability

Please do **not** open a public GitHub issue for suspected security vulnerabilities.

A dedicated private security mailbox is not currently documented in this repository. For now, report security concerns through the active maintainer or repository support channels already used for the project, and clearly label the report as a **private security issue**. A dedicated private reporting channel should be added in a future update.

## What to include in a report

Provide enough detail for maintainers to reproduce and assess the issue safely.

| Field                | What to include                                                                |
| -------------------- | ------------------------------------------------------------------------------ |
| Summary              | Short description of the issue and affected area                               |
| Impact               | What an attacker could do or access                                            |
| Affected components  | Files, routes, screens, services, or deployment surfaces involved              |
| Reproduction steps   | Minimal, safe sequence to reproduce the problem                                |
| Environment          | Branch, commit, runtime, container/Kubernetes context, and configuration notes |
| Evidence             | Logs, screenshots, or proof-of-concept details that do not expose secrets      |
| Suggested mitigation | Optional guidance if you already identified a likely fix                       |

## Response expectations

Maintainers will review reports as capacity allows and should acknowledge legitimate reports as soon as practical. This repository does not currently publish a guaranteed response SLA, remediation window, or bug bounty program.

When reporting:

- give maintainers reasonable time to investigate and patch the issue
- avoid public disclosure until maintainers confirm it is safe to do so
- avoid sending real secrets, production tokens, or unnecessary personal data

## Secure development notes

The repository includes several security-sensitive configuration surfaces:

- `.env.example` defines secrets and runtime variables such as `COOKIE_SECRET`, `JWT_SECRET`, `DATABASE_URL`, and integration keys
- `server/_core/index.ts` starts the Express runtime, enables request handling, serves the landing page, and mounts `/api/trpc`
- `Dockerfile` and `docker-compose.yml` define containerized runtime behavior
- `kubernetes/deployment.yaml` injects environment values from a Kubernetes secret
- `nginx.conf` proxies traffic to the application runtime

During development:

- never commit real credentials or production secrets
- keep local `.env` files out of version control
- rotate any test secrets that may have been exposed
- verify auth, session, and integration behavior using non-production credentials whenever possible

## Deployment and infrastructure guidance

### Secrets handling

- store runtime secrets outside the repository
- prefer environment injection through deployment tooling or secret managers
- review `envFrom.secretRef` usage in Kubernetes before deploying
- ensure database credentials and JWT/cookie secrets differ across environments

### Reverse proxy and TLS

The provided `nginx.conf` proxies HTTP traffic to the application container. TLS termination is not configured directly in this file, so production deployments should ensure HTTPS is enforced by the ingress layer, reverse proxy, or platform edge.

### Container and Kubernetes awareness

- review base images and dependencies regularly
- pin and update images intentionally
- confirm cluster secrets, ingress rules, and network exposure match your security requirements
- validate that only intended ports and hosts are exposed

## Dependency and configuration hygiene

- keep Node.js, pnpm, Expo, Express, and other runtime dependencies current
- run linting, tests, and type-checking before shipping changes
- review CI and deployment workflows when changing auth, networking, or persistence behavior
- verify documentation claims against current code so operators are not misled by outdated setup instructions

## Disclosure policy

MCP Hub should follow responsible disclosure practices:

1. report privately through maintainer channels
2. allow time for investigation and remediation
3. coordinate public disclosure after a fix or mitigation is available
4. avoid publishing exploit details while users remain exposed

## Bug bounty

This repository does not document a bug bounty program at this time.

## Security updates

Security fixes should be documented in the changelog and deployment guidance when they affect setup, secrets, infrastructure, or upgrade steps.
