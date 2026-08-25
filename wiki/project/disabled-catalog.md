---
title: Disabled Feature Catalog
description: "The 22 screens parked under app/_disabled — what each would do and why it is off."
tags:
  - wiki
  - project
  - disabled
  - catalog
---

> Audience: everyone | Status: living document | Last verified: 2026-08-06

Expo Router treats any directory starting with `_` as non-routable, so the **22 screens** under `app/_disabled/` are shipped source that is **never mounted**. They are the parking lot: implemented enough to show intent, deliberately not user-facing. See [Feature status](feature-status.md) for the `Disabled` label and the contradiction register (an earlier wiki revision said 23; the directory holds 22, verified by listing).

## Why features get parked

Screens land in `app/_disabled` for a few recurring reasons. The catalog notes which applies per feature.

- **Unfinished core integration** — the screen exists but the engine behind it is not wired end to end (still simulates, or has no backend).
- **Server-dependent / no server support** — the feature needs server capabilities this repo does not ship.
- **Scope reduction** — built during an exploratory phase, cut to keep the product surface small.
- **Superseded** — a simpler, shipped screen now covers the use case.

## The catalog

### Macros & automation (8 screens)

| Screen | What it would do | Why disabled |
| --- | --- | --- |
| `macro-recorder` | Record a sequence of UI actions as a macro. | Recorder needs a reliable action stream; shipped macro authoring is manual. |
| `macro-debugger` | Step through macro execution. | Debugger depends on engine internals that are still experimental. |
| `macro-marketplace` | Browse/shared community macros. | Marketplace needs a host and distribution — out of scope. |
| `macro-comments` | Comment threads on shared macros. | Depends on marketplace/sharing; superseded by in-app workflows. |
| `macro-sharing` | Share macros with others. | No sharing backend; in-memory macros are local by definition. |
| `macro-version-history` | Undo/history for macro edits. | Versioning a local, in-memory macro adds little. |
| `macro-management` | Central manage/duplicate/organize view for macros. | Coverage folded into the macro tabs; kept for later. |
| `macro-scheduler-ui` | Schedule macros to run on a timer. | Scheduler needs a persistent daemon; engine is experimental. |

### Notifications & preferences (3 screens)

| Screen | What it would do | Why disabled |
| --- | --- | --- |
| `notifications-center` | In-app notification inbox. | No notification push infra in the shipped backend. |
| `notification-settings` | Per-channel notification toggles. | Depends on the (missing) notification service. |
| `notification-preferences` | Fine-grained preference UI. | Same dependency; merged conceptually with settings. |

### Analytics & insight (5 screens)

| Screen | What it would do | Why disabled |
| --- | --- | --- |
| `analytics-dashboard` | Aggregate tool/macro analytics dashboard. | Analytics engine is in-memory and not production-grade. |
| `trending-dashboard` | Trending tools/servers across users. | Needs cross-user data aggregation + persistence. |
| `recommendations` | Suggested tools/servers/macros. | Recommendation logic depends on analytics that is not wired. |
| `performance-profiler` | Profile tool call latency. | Requires metrics collection that is not mounted. |
| `perception-test` | Experimental perception/perf experiment UI. | Exploratory; no product plan. |

### Governance & platform (3 screens)

| Screen | What it would do | Why disabled |
| --- | --- | --- |
| `governance` | Policy/governance controls for the workspace. | Governance needs backend policy enforcement that is not shipped. |
| `audit-log` | Read the workspace audit trail. | Audit log backend is not implemented. |
| `service-control` | Start/stop/restart platform services. | Targets a service host (PM2/k8s) not present in this repo. |

### Editors & tooling (3 screens)

| Screen | What it would do | Why disabled |
| --- | --- | --- |
| `diff-editor` | Compare two macro/tool configs side by side. | Convenience tool; not core to the shipped flow. |
| `export-import` | Export/import macros and configs. | Needs a serialization/versioning story that is not finalized. |
| `templates-gallery` | Browse gallery of reusable templates. | Gallery superseded by the shipped template screen (`app/template/`). |

## Reviving a disabled feature

Revival means moving the screen out of `app/_disabled`, wiring its backend, and labeling the feature honestly. Use the status labels in [Feature status](feature-status.md): a screen that is only UI is `Experimental` until its engine does real work end to end.

## Related

- [Feature tour](../start-here/feature-tour.md) — the shipped product walkthrough; anything not listed there is disabled or experimental.
- [User guide](../user-guide/index.md) — per-feature statuses, including which macro/template features are disabled.
