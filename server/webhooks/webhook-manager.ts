/**
 * Webhook Manager
 * Handles webhook creation, validation, execution, and logging
 */

import crypto from 'crypto';

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  rateLimit: number; // requests per minute
  ipWhitelist?: string[];
  ipBlacklist?: string[];
  payloadMapping?: Record<string, string>;
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
  };
  createdAt: Date;
  updatedAt: Date;
  lastTriggeredAt?: Date;
  executionCount: number;
  failureCount: number;
}

export interface WebhookEvent {
  id: string;
  webhookId: string;
  event: string;
  payload: Record<string, unknown>;
  timestamp: Date;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  attempts: number;
  lastError?: string;
  response?: {
    statusCode: number;
    body: string;
  };
}

export interface WebhookRequest {
  timestamp: number;
  signature: string;
  payload: Record<string, unknown>;
}

class WebhookManager {
  private webhooks: Map<string, WebhookConfig> = new Map();
  private events: Map<string, WebhookEvent> = new Map();
  private rateLimitMap: Map<string, number[]> = new Map();

  /**
   * Generate webhook secret
   */
  static generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate webhook URL
   */
  static generateWebhookUrl(webhookId: string): string {
    return `${process.env.WEBHOOK_BASE_URL || 'https://api.mcphub.io'}/webhooks/${webhookId}`;
  }

  /**
   * Create HMAC signature for webhook payload
   */
  static createSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Verify webhook signature
   */
  static verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.createSignature(payload, secret);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }

  /**
   * Create webhook
   */
  static createWebhook(
    config: Omit<
      WebhookConfig,
      'id' | 'createdAt' | 'updatedAt' | 'executionCount' | 'failureCount'
    >,
  ): WebhookConfig {
    const webhook: WebhookConfig = {
      ...config,
      id: `wh_${crypto.randomUUID()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
      failureCount: 0,
    };

    const instance = new WebhookManager();
    instance.webhooks.set(webhook.id, webhook);
    return webhook;
  }

  /**
   * Get webhook by ID
   */
  static getWebhook(webhookId: string): WebhookConfig | null {
    const instance = new WebhookManager();
    return instance.webhooks.get(webhookId) || null;
  }

  /**
   * List all webhooks
   */
  static listWebhooks(): WebhookConfig[] {
    const instance = new WebhookManager();
    return Array.from(instance.webhooks.values());
  }

  /**
   * Update webhook
   */
  static updateWebhook(webhookId: string, updates: Partial<WebhookConfig>): WebhookConfig {
    const instance = new WebhookManager();
    const webhook = instance.webhooks.get(webhookId);

    if (!webhook) {
      throw new Error(`Webhook ${webhookId} not found`);
    }

    const updated = {
      ...webhook,
      ...updates,
      id: webhook.id,
      createdAt: webhook.createdAt,
      updatedAt: new Date(),
    };

    instance.webhooks.set(webhookId, updated);
    return updated;
  }

  /**
   * Delete webhook
   */
  static deleteWebhook(webhookId: string): void {
    const instance = new WebhookManager();
    instance.webhooks.delete(webhookId);
    instance.rateLimitMap.delete(webhookId);
  }

  /**
   * Check rate limit
   */
  static checkRateLimit(webhookId: string, rateLimit: number): boolean {
    const instance = new WebhookManager();
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    let requests = instance.rateLimitMap.get(webhookId) || [];
    requests = requests.filter((timestamp) => timestamp > oneMinuteAgo);

    if (requests.length >= rateLimit) {
      return false;
    }

    requests.push(now);
    instance.rateLimitMap.set(webhookId, requests);
    return true;
  }

  /**
   * Validate IP address
   */
  static validateIP(ip: string, whitelist?: string[], blacklist?: string[]): boolean {
    if (blacklist && blacklist.includes(ip)) {
      return false;
    }

    if (whitelist && whitelist.length > 0) {
      return whitelist.includes(ip);
    }

    return true;
  }

  /**
   * Validate webhook request
   */
  static validateRequest(
    payload: string,
    signature: string,
    secret: string,
    ip: string,
    webhook: WebhookConfig,
  ): { valid: boolean; error?: string } {
    // Verify signature
    try {
      if (!this.verifySignature(payload, signature, secret)) {
        return { valid: false, error: 'Invalid signature' };
      }
    } catch (error) {
      return { valid: false, error: 'Signature verification failed' };
    }

    // Check IP whitelist/blacklist
    if (!this.validateIP(ip, webhook.ipWhitelist, webhook.ipBlacklist)) {
      return { valid: false, error: 'IP not allowed' };
    }

    // Check rate limit
    if (!this.checkRateLimit(webhook.id, webhook.rateLimit)) {
      return { valid: false, error: 'Rate limit exceeded' };
    }

    return { valid: true };
  }

  /**
   * Record webhook event
   */
  static recordEvent(
    webhookId: string,
    event: string,
    payload: Record<string, unknown>,
    status: 'pending' | 'success' | 'failed' | 'retrying' = 'pending',
  ): WebhookEvent {
    const webhookEvent: WebhookEvent = {
      id: `evt_${crypto.randomUUID()}`,
      webhookId,
      event,
      payload,
      timestamp: new Date(),
      status,
      attempts: 0,
    };

    const instance = new WebhookManager();
    instance.events.set(webhookEvent.id, webhookEvent);

    // Update webhook execution count
    const webhook = instance.webhooks.get(webhookId);
    if (webhook) {
      webhook.executionCount++;
      webhook.lastTriggeredAt = new Date();
      if (status === 'failed') {
        webhook.failureCount++;
      }
    }

    return webhookEvent;
  }

  /**
   * Get webhook events
   */
  static getWebhookEvents(webhookId: string, limit: number = 50): WebhookEvent[] {
    const instance = new WebhookManager();
    return Array.from(instance.events.values())
      .filter((e) => e.webhookId === webhookId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Update event status
   */
  static updateEventStatus(
    eventId: string,
    status: 'success' | 'failed' | 'retrying',
    response?: { statusCode: number; body: string },
    error?: string,
  ): WebhookEvent {
    const instance = new WebhookManager();
    const event = instance.events.get(eventId);

    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }

    event.status = status;
    event.attempts++;
    if (response) event.response = response;
    if (error) event.lastError = error;

    return event;
  }

  /**
   * Get webhook statistics
   */
  static getWebhookStats(webhookId: string): {
    totalExecutions: number;
    successRate: number;
    lastTriggered?: Date;
    averageResponseTime?: number;
  } {
    const instance = new WebhookManager();
    const webhook = instance.webhooks.get(webhookId);

    if (!webhook) {
      throw new Error(`Webhook ${webhookId} not found`);
    }

    const events = Array.from(instance.events.values()).filter((e) => e.webhookId === webhookId);
    const successCount = events.filter((e) => e.status === 'success').length;
    const successRate = events.length > 0 ? (successCount / events.length) * 100 : 0;

    return {
      totalExecutions: webhook.executionCount,
      successRate: Math.round(successRate * 100) / 100,
      lastTriggered: webhook.lastTriggeredAt,
    };
  }
}

export { WebhookManager };
