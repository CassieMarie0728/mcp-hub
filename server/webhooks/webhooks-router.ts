/**
 * tRPC Router for Webhook Management
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { WebhookManager, type WebhookConfig } from './webhook-manager';

export const webhooksRouter = router({
  /**
   * Create webhook
   */
  createWebhook: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        events: z.array(z.string()),
        rateLimit: z.number().default(60),
        ipWhitelist: z.array(z.string()).optional(),
        ipBlacklist: z.array(z.string()).optional(),
        retryPolicy: z.object({
          maxRetries: z.number().default(3),
          backoffMs: z.number().default(1000),
        }),
      }),
    )
    .mutation(({ input }) => {
      const secret = WebhookManager.generateSecret();
      const webhook = WebhookManager.createWebhook({
        name: input.name,
        url: WebhookManager.generateWebhookUrl('temp'),
        secret,
        events: input.events,
        isActive: true,
        rateLimit: input.rateLimit,
        ipWhitelist: input.ipWhitelist,
        ipBlacklist: input.ipBlacklist,
        retryPolicy: input.retryPolicy,
      });

      // Update URL with actual webhook ID
      webhook.url = WebhookManager.generateWebhookUrl(webhook.id);

      return webhook;
    }),

  /**
   * Get webhook
   */
  getWebhook: protectedProcedure.input(z.object({ webhookId: z.string() })).query(({ input }) => {
    const webhook = WebhookManager.getWebhook(input.webhookId);
    if (!webhook) {
      throw new Error(`Webhook ${input.webhookId} not found`);
    }
    return webhook;
  }),

  /**
   * List webhooks
   */
  listWebhooks: protectedProcedure.query(() => {
    return WebhookManager.listWebhooks();
  }),

  /**
   * Update webhook
   */
  updateWebhook: protectedProcedure
    .input(
      z.object({
        webhookId: z.string(),
        name: z.string().optional(),
        events: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
        rateLimit: z.number().optional(),
        ipWhitelist: z.array(z.string()).optional(),
        ipBlacklist: z.array(z.string()).optional(),
      }),
    )
    .mutation(({ input }) => {
      const { webhookId, ...updates } = input;
      return WebhookManager.updateWebhook(webhookId, updates as any);
    }),

  /**
   * Delete webhook
   */
  deleteWebhook: protectedProcedure
    .input(z.object({ webhookId: z.string() }))
    .mutation(({ input }) => {
      WebhookManager.deleteWebhook(input.webhookId);
      return { success: true };
    }),

  /**
   * Get webhook events
   */
  getWebhookEvents: protectedProcedure
    .input(z.object({ webhookId: z.string(), limit: z.number().default(50) }))
    .query(({ input }) => {
      return WebhookManager.getWebhookEvents(input.webhookId, input.limit);
    }),

  /**
   * Get webhook statistics
   */
  getWebhookStats: protectedProcedure
    .input(z.object({ webhookId: z.string() }))
    .query(({ input }) => {
      return WebhookManager.getWebhookStats(input.webhookId);
    }),

  /**
   * Test webhook
   */
  testWebhook: protectedProcedure
    .input(
      z.object({
        webhookId: z.string(),
        event: z.string(),
        payload: z.record(z.string(), z.any()),
      }),
    )
    .mutation(({ input }) => {
      const webhook = WebhookManager.getWebhook(input.webhookId);
      if (!webhook) {
        throw new Error(`Webhook ${input.webhookId} not found`);
      }

      const event = WebhookManager.recordEvent(
        input.webhookId,
        input.event,
        input.payload,
        'pending',
      );

      return {
        event,
        webhook,
        testUrl: webhook.url,
        signature: WebhookManager.createSignature(JSON.stringify(input.payload), webhook.secret),
      };
    }),

  /**
   * Rotate webhook secret
   */
  rotateSecret: protectedProcedure
    .input(z.object({ webhookId: z.string() }))
    .mutation(({ input }) => {
      const webhook = WebhookManager.getWebhook(input.webhookId);
      if (!webhook) {
        throw new Error(`Webhook ${input.webhookId} not found`);
      }

      const newSecret = WebhookManager.generateSecret();
      const updated = WebhookManager.updateWebhook(input.webhookId, {
        secret: newSecret,
      });

      return {
        webhookId: updated.id,
        newSecret,
        message: 'Secret rotated successfully. Update your webhook consumer with the new secret.',
      };
    }),

  /**
   * Verify webhook signature
   */
  verifySignature: protectedProcedure
    .input(
      z.object({
        webhookId: z.string(),
        payload: z.string(),
        signature: z.string(),
      }),
    )
    .query(({ input }) => {
      const webhook = WebhookManager.getWebhook(input.webhookId);
      if (!webhook) {
        throw new Error(`Webhook ${input.webhookId} not found`);
      }

      const isValid = WebhookManager.verifySignature(
        input.payload,
        input.signature,
        webhook.secret,
      );

      return { valid: isValid };
    }),
});
