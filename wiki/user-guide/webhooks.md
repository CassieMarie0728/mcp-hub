---
description: Webhook configuration, signing (HMAC-SHA256), delivery policy, and the current per-call store limitation.
tags:
  - webhooks
  - events
  - automation
title: Webhooks
---
> [!NOTE] Status
> **Experimental** · Last verified 2026-08-06 · Commit `0691562`

| Field | Value |
| --- | --- |
| Purpose | Outbound HTTP callbacks on events: config, signing, and delivery. |
| Audience | Users automating notifications and downstream systems. |
| Source paths | `server/webhooks/webhooks-router.ts`, `server/webhooks/webhook-manager.ts` |
| Prerequisites | [Templates](./templates.md) |
| Next | [Integrations & OAuth](./integrations-oauth.md) |

## Creating a webhook

`webhooks.createWebhook` takes `{name, events: string[], rateLimit (default 60/min), ipWhitelist?, ipBlacklist?, retryPolicy: {maxRetries: 3, backoffMs: 1000}}` and returns a `WebhookConfig` with a generated `secret` (32 random bytes hex) and `url = {WEBHOOK_BASE_URL or 'https://api.mcphub.io'}/webhooks/{id}`.

| Config field | Meaning |
| --- | --- |
| `id` | `wh_<uuid>` |
| `events` | Event names that trigger the webhook. |
| `rateLimit` | Requests per minute. |
| `ipWhitelist` / `ipBlacklist` | Inbound caller filtering. |
| `payloadMapping` | Optional payload reshaping. |
| `retryPolicy` | `{maxRetries, backoffMs}` delivery retries. |
| `executionCount` / `failureCount` | Delivery stats. |

## Procedures

`listWebhooks`, `getWebhook`, `updateWebhook`, `deleteWebhook`, `getWebhookEvents` (default limit 50), `getWebhookStats` (`totalExecutions`, `successRate`, `lastTriggered?`, `averageResponseTime?`), `testWebhook`, `rotateSecret`, and `verifySignature`.

## Signing

- Signatures are **HMAC-SHA256 hex** over the raw payload, keyed by the webhook `secret`.
- `verifySignature` checks with `crypto.timingSafeEqual`. Events carry status `pending → success | failed | retrying`.

## Honest limit (read this)

`WebhookManager` exposes its store through **static methods that build a new instance on every call**, so a `createWebhook` result is not visible to a later `listWebhooks` in the same process. The API surface is implemented, but the feature is not yet operational end to end — treat webhooks as a design preview.

> **Next:** [Integrations & OAuth](./integrations-oauth.md)