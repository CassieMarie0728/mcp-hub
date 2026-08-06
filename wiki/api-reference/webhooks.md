---
title: Webhooks API
description: "The webhooks tRPC router, procedure by procedure — create, configure, test, and verify outgoing webhook delivery."
tags:
  - wiki
  - api
  - trpc
  - webhooks
---

> Audience: developers & contributors | Status: living document | Last verified: 2026-08-06

The `webhooks` router (`server/webhooks/webhooks-router.ts`) manages **outbound webhooks** — callbacks MCP Hub POSTs to your endpoints when events fire. All procedures are **protected**. Backed by `WebhookManager` (in-memory); see [Data model](../architecture/data-model.md) for persistence caveats.

## Procedures

### `createWebhook` — mutation

Input `{ name, events: string[], rateLimit?: number = 60, ipWhitelist?: string[], ipBlacklist?: string[], retryPolicy: { maxRetries?: number = 3, backoffMs?: number = 1000 } }`. Generates a secret and webhook URL internally, then returns the created webhook config (including `id`, `url`, `secret`, `isActive: true`).

### `getWebhook` — query

Input `{ webhookId }`. Returns the webhook config, or **throws** `Webhook ${webhookId} not found` (surfaces as `INTERNAL_SERVER_ERROR`).

### `listWebhooks` — query

No input. Returns all webhooks.

### `updateWebhook` — mutation

Input `{ webhookId, name?, events?, isActive?, rateLimit?, ipWhitelist?, ipBlacklist? }`. Applies the provided fields. Returns the updated config.

### `deleteWebhook` — mutation

Input `{ webhookId }`. Deletes the webhook. Returns `{ success: true }`.

### `getWebhookEvents` — query

Input `{ webhookId, limit?: number = 50 }`. Returns the event delivery log for the webhook.

### `getWebhookStats` — query

Input `{ webhookId }`. Returns delivery statistics for the webhook.

### `testWebhook` — mutation

Input `{ webhookId, event, payload: record<string, any> }`. Records a `'pending'` delivery event and returns `{ event, webhook, testUrl, signature }` — the signature is an HMAC over `JSON.stringify(payload)` using the webhook's secret. Use it to validate your consumer side.

### `rotateSecret` — mutation

Input `{ webhookId }`. Generates a new secret and updates the webhook. Returns `{ webhookId, newSecret, message }`.

### `verifySignature` — query

Input `{ webhookId, payload, signature }`. Verifies the payload signature against the webhook's current secret. Returns `{ valid }`. Throws `Webhook … not found` for an unknown id.

> [!IMPORTANT]
> A rotated secret invalidates every signature issued under the old secret, including `testWebhook` results. After `rotateSecret`, re-test with the new secret.

## Related pages

- [Webhooks (user guide)](../user-guide/webhooks.md) — how the UI manages webhooks.
- [Feature tour](../start-here/feature-tour.md) — where webhooks sit in the product.
- [Analytics](analytics.md) — execution/event statistics sharing the same in-memory lifecycle.
- [Data model](../architecture/data-model.md) — where the webhook store lives.
- [System](system.md) — shared rate limits.
