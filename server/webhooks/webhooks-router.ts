import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../_core/trpc";
import { getOrCreatePersonalWorkspaceAccess } from "../security/workspace-access";
import { requireTenantLifecyclePersistence } from "../security/feature-availability";
import { createWebhook, deleteWebhook, listWebhooks, rotateWebhookSecret, updateWebhook } from "../lifecycle/lifecycle-repository";

const retryPolicy = z.object({ maxRetries: z.number().int().min(0).max(10), backoffMs: z.number().int().min(100).max(3_600_000) });
const webhookId = z.string().uuid();
const unavailable = (feature: string) => requireTenantLifecyclePersistence(feature);

async function workspaceFor(ctx: { user: { id: number } | null }) {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication is required" });
  return getOrCreatePersonalWorkspaceAccess(ctx.user);
}

export const webhooksRouter = router({
  createWebhook: protectedProcedure.input(z.object({ name: z.string().trim().min(1).max(128), events: z.array(z.string().trim().min(1).max(128)).min(1).max(25), retryPolicy })).mutation(async ({ ctx, input }) => createWebhook(await workspaceFor(ctx), input)),
  listWebhooks: protectedProcedure.query(async ({ ctx }) => listWebhooks(await workspaceFor(ctx))),
  updateWebhook: protectedProcedure.input(z.object({ webhookId, name: z.string().trim().min(1).max(128).optional(), events: z.array(z.string().trim().min(1).max(128)).min(1).max(25).optional(), retryPolicy: retryPolicy.optional() })).mutation(async ({ ctx, input }) => updateWebhook(await workspaceFor(ctx), input.webhookId, input)),
  deleteWebhook: protectedProcedure.input(z.object({ webhookId })).mutation(async ({ ctx, input }) => {
    await deleteWebhook(await workspaceFor(ctx), input.webhookId);
    return { success: true };
  }),
  rotateSecret: protectedProcedure.input(z.object({ webhookId })).mutation(async ({ ctx, input }) => ({ signingSecret: await rotateWebhookSecret(await workspaceFor(ctx), input.webhookId) })),
  getWebhook: protectedProcedure.input(z.object({ webhookId })).query(() => unavailable("Webhook retrieval by ID")),
  getWebhookEvents: protectedProcedure.input(z.object({ webhookId, limit: z.number().optional() })).query(() => unavailable("Webhook event delivery history")),
  getWebhookStats: protectedProcedure.input(z.object({ webhookId })).query(() => unavailable("Webhook delivery statistics")),
  testWebhook: protectedProcedure.input(z.object({ webhookId, event: z.string(), payload: z.record(z.string(), z.unknown()) })).mutation(() => unavailable("Webhook test delivery")),
  verifySignature: protectedProcedure.input(z.object({ webhookId, payload: z.string(), signature: z.string() })).query(() => unavailable("Webhook signature verification")),
});
