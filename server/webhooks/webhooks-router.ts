/** Webhook lifecycle routes remain fail-closed until each resource is tenant-scoped and durable. */

import { z } from "zod";

import { protectedProcedure, router } from "../_core/trpc";
import { requireTenantLifecyclePersistence } from "../security/feature-availability";

const unavailable = (feature: string) => requireTenantLifecyclePersistence(feature);

export const webhooksRouter = router({
  createWebhook: protectedProcedure.input(z.object({ name: z.string(), events: z.array(z.string()), rateLimit: z.number().optional(), ipWhitelist: z.array(z.string()).optional(), ipBlacklist: z.array(z.string()).optional(), retryPolicy: z.object({ maxRetries: z.number(), backoffMs: z.number() }) })).mutation(() => unavailable("Webhook creation")),
  getWebhook: protectedProcedure.input(z.object({ webhookId: z.string().uuid() })).query(() => unavailable("Webhook retrieval")),
  listWebhooks: protectedProcedure.query(() => unavailable("Webhook listing")),
  updateWebhook: protectedProcedure.input(z.object({ webhookId: z.string().uuid() }).passthrough()).mutation(() => unavailable("Webhook update")),
  deleteWebhook: protectedProcedure.input(z.object({ webhookId: z.string().uuid() })).mutation(() => unavailable("Webhook deletion")),
  getWebhookEvents: protectedProcedure.input(z.object({ webhookId: z.string().uuid(), limit: z.number().optional() })).query(() => unavailable("Webhook event history")),
  getWebhookStats: protectedProcedure.input(z.object({ webhookId: z.string().uuid() })).query(() => unavailable("Webhook statistics")),
  testWebhook: protectedProcedure.input(z.object({ webhookId: z.string().uuid(), event: z.string(), payload: z.record(z.string(), z.unknown()) })).mutation(() => unavailable("Webhook testing")),
  rotateSecret: protectedProcedure.input(z.object({ webhookId: z.string().uuid() })).mutation(() => unavailable("Webhook secret rotation")),
  verifySignature: protectedProcedure.input(z.object({ webhookId: z.string().uuid(), payload: z.string(), signature: z.string() })).query(() => unavailable("Webhook signature verification")),
});
