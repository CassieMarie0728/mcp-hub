---
description: Every screen MCP Hub ships — the five tabs, secondary screens, and the 23 disabled stubs — with status labels.
tags:
  - ui
  - screens
  - tour
title: Feature Tour
---
> [!NOTE] Status
> **Stable** (map of the current UI) · Last verified 2026-08-06 · Commit `0691562`

| Field | Value |
| --- | --- |
| Purpose | Map every screen MCP Hub ships today — active tabs, secondary screens, and disabled stubs — with their status. |
| Audience | New users and contributors wanting the lay of the land. |
| Source paths | `app/(tabs)/`, `app/_disabled/`, `app/template/[id].tsx`, `app/macro/[id].tsx` |
| Prerequisites | [What is MCP Hub?](./what-is-mcp-hub.md) |
| Next | [Quickstart](./quickstart.md) |

## The five tabs

The tab bar (`app/(tabs)/_layout.tsx`) exposes five tabs. Everything else is a screen you reach from inside them.

| Tab | Route | What it does | Status |
| --- | --- | --- | --- |
| Hub | `(tabs)/index` | Home: recent activity, quick actions, entry points. | Stable |
| Servers | `(tabs)/mcp-servers` | Your connected MCP servers; add, edit, connect, OAuth. | Stable |
| Builder | `(tabs)/macro-builder` | Assemble tool call sequences into macros. | Experimental |
| Debug | `(tabs)/execution-debugger` | Inspect runs, step through executions. | Experimental |
| Logs | `(tabs)/blog` | Activity/run log feed. | Experimental |

## Other shipped screens

These are reachable in-app (navigation, not the tab bar):

- **Servers & connections:** `add-server`, `edit-server`, `server-detail`, `server-presets`, `server-connection`, `server-connection-updated`, `mcp-control`, `integrations`, `oauth-connect`
- **Tools:** `tool-discovery`, `tool-browser`, `tool-detail`, `tool-execution`, `results`, `execution-history`
- **Macros:** `macro-editor`, `macro-gallery`, `macro-chaining`, `macro-scheduling`, `macro-sharing`, `macro/[id]`
- **Workflows & templates:** `workflow-templates`, `schedule-workflow`, `template/[id]`
- **Admin & settings:** `admin-dashboard`, `analytics-dashboard`, `token-management`, `webhooks`, `settings`
- **Auxiliary:** `chat`, `onboarding`, `use-cases`, `pricing`, `testimonials`, `faq`, `more`, `team-workspace`, `oauth/callback`, `dev/theme-lab`

## Disabled screens

`app/_disabled/` holds 23 stubs. They are **deliberately disabled** — code exists but is not routed/registered, and some have no backend wiring. They are not user-facing bugs.

| Disabled screen | What it was going to be |
| --- | --- |
| `trending-dashboard` | Trending tools/usage feed |
| `templates-gallery` | Template marketplace gallery |
| `service-control` | Start/stop service controls |
| `recommendations` | Personalized tool recommendations |
| `performance-profiler` | Profiling UI |
| `perception-test` | Demo/perception test UI |
| `notifications-center` | Notifications inbox |
| `notification-settings` | Notification preferences |
| `notification-preferences` | Preferences (duplicate of above) |
| `macro-version-history` | Macro version timeline |
| `macro-sharing` | Share macros (an active copy also exists) |
| `macro-scheduler-ui` | Schedule macro runs |
| `macro-recorder` | Record a sequence into a macro |
| `macro-marketplace` | Macro store/marketplace |
| `macro-management` | Manage installed macros |
| `macro-debugger` | Step-debug macros |
| `macro-comments` | Comment on macros |
| `governance` | Policy/governance console |
| `export-import` | Export/import macros |
| `diff-editor` | Visual diff of macro versions |
| `audit-log` | Audit trail viewer |
| `analytics-dashboard` | Analytics (an active copy also exists) |

See [Disabled feature catalog](../project/disabled-catalog.md) for the full story on why each is off and what would revive it.

## Feature-area status summary

| Area | Status | Details |
| --- | --- | --- |
| MCP connections | Stable | HTTP transport; in-memory registry |
| Tool discovery & execution | Stable | `mcp` router, `lib/services/*` |
| Preset integrations (GitHub/Slack/Notion) + OAuth | Beta | `server/mcp/servers/*`, `server/auth/` |
| Macros | Experimental | simulated engine; saved client-side |
| Workflows & templates | Experimental | in-memory stores |
| Webhooks / tokens / analytics | Experimental | in-memory stores |
| Team, governance, notifications, marketplace, scheduler, versioning | Disabled | server modules present but not wired into the tRPC router; screens disabled |

> **Next:** [Quickstart](./quickstart.md)