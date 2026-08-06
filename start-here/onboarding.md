---
description: "The first-run experience: welcome modal, onboarding screen, and what it walks new users through."
tags:
  - onboarding
  - ux
  - first-run
title: Onboarding
---
> [!NOTE] Status
> **Stable** (first-run flow is implemented and tested) · Last verified 2026-08-06 · Commit `0691562`

| Field | Value |
| --- | --- |
| Purpose | Explain the first-run onboarding flow and what a new user sees. |
| Audience | New users; onboarding/UX contributors. |
| Source paths | `components/onboarding-modal.tsx`, `app/(tabs)/onboarding.tsx`, `lib/__tests__/onboarding.test.ts` |
| Prerequisites | [Quickstart](./quickstart.md) |
| Next | [Connect a server](../user-guide/server-connections.md) |

## What onboarding is

Onboarding is the first-run experience: a welcome modal (`components/onboarding-modal.tsx`) plus a dedicated **Onboarding** screen (`app/(tabs)/onboarding`) that walks a new user through the mental model — MCP in one line, what a server is, what a tool is, and what the five tabs do — before the user does anything real.

## What it covers

1. **Welcome** — one-line pitch and what to expect.
2. **What an MCP server is** — a capability provider (GitHub, Slack, …).
3. **What a tool is** — one named, typed capability on a server.
4. **The five tabs** — Hub, Servers, Builder, Debug, Logs.
5. **First action** — a call to action that jumps to adding a server.

## Status notes

- The flow is **client-side only**: it does not create server records or skip anything server-side.
- Completion state is tracked locally (AsyncStorage), not on the backend.
- Covered by `lib/__tests__/onboarding.test.ts`.

## Related

- [Feature tour](./feature-tour.md) — the five tabs explained.
- [Connect a server](../user-guide/server-connections.md) — the recommended first action.

> **Next:** [Connect a server](../user-guide/server-connections.md)