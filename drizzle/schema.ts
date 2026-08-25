import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** A user-owned boundary for all durable MCP configuration and execution data. */
export const workspaces = mysqlTable(
  "hub_workspaces",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    ownerUserId: int("ownerUserId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 128 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("workspaces_owner_user_unique").on(table.ownerUserId),
  ],
);

/** Public, non-secret MCP connection metadata. Secrets are isolated in mcp_credentials. */
export const mcpServers = mysqlTable(
  "hub_mcp_servers",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    workspaceId: varchar("workspaceId", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    endpoint: varchar("endpoint", { length: 2048 }).notNull(),
    transport: mysqlEnum("transport", ["http"]).default("http").notNull(),
    headersJson: text("headersJson"),
    status: mysqlEnum("status", ["connected", "disconnected", "error"])
      .default("disconnected")
      .notNull(),
    lastConnectedAt: timestamp("lastConnectedAt"),
    lastError: varchar("lastError", { length: 512 }),
    toolCount: int("toolCount").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("mcp_servers_workspace_idx").on(table.workspaceId),
  ],
);

/** Encrypted server-specific credential material. No plaintext credential columns are permitted. */
export const mcpCredentials = mysqlTable(
  "hub_mcp_credentials",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    serverId: varchar("serverId", { length: 64 })
      .notNull()
      .references(() => mcpServers.id, { onDelete: "cascade" }),
    encryptedPayload: text("encryptedPayload").notNull(),
    keyVersion: varchar("keyVersion", { length: 32 }).default("v1").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("mcp_credentials_server_unique").on(table.serverId),
  ],
);

/** Append-only, ownership-scoped operational record for MCP requests. */
export const mcpExecutionLogs = mysqlTable(
  "hub_mcp_execution_logs",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    workspaceId: varchar("workspaceId", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    serverId: varchar("serverId", { length: 64 })
      .notNull()
      .references(() => mcpServers.id, { onDelete: "cascade" }),
    operation: varchar("operation", { length: 64 }).notNull(),
    toolName: varchar("toolName", { length: 255 }),
    success: mysqlEnum("success", ["true", "false"]).notNull(),
    durationMs: int("durationMs"),
    errorMessage: varchar("errorMessage", { length: 512 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("mcp_execution_logs_workspace_created_idx").on(table.workspaceId, table.createdAt),
    index("mcp_execution_logs_server_created_idx").on(table.serverId, table.createdAt),
  ],
);

/** A workspace-owned assistant provider choice. The API key remains encrypted server-side. */
export const assistantProviderConfigs = mysqlTable(
  "hub_assistant_provider_configs",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    workspaceId: varchar("workspaceId", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    provider: mysqlEnum("provider", ["openrouter", "gemini", "groq", "mistral"]).notNull(),
    model: varchar("model", { length: 160 }).notNull(),
    encryptedPayload: text("encryptedPayload").notNull(),
    keyVersion: varchar("keyVersion", { length: 32 }).default("v1").notNull(),
    fallbackEnabled: boolean("fallbackEnabled").default(false).notNull(),
    fallbackPriority: int("fallbackPriority").default(100).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("assistant_provider_configs_workspace_provider_unique").on(table.workspaceId, table.provider),
  ],
);

/** Safe provider-returned health metadata. Raw keys and response bodies are never stored here. */
export const assistantProviderHealth = mysqlTable(
  "hub_assistant_provider_health",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    workspaceId: varchar("workspaceId", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    provider: mysqlEnum("provider", ["openrouter", "gemini", "groq", "mistral"]).notNull(),
    status: mysqlEnum("status", ["valid", "invalid", "rate_limited", "unavailable"]).notNull(),
    remainingRequests: int("remainingRequests"),
    remainingTokens: int("remainingTokens"),
    remainingCredit: varchar("remainingCredit", { length: 64 }),
    resetAt: timestamp("resetAt"),
    source: mysqlEnum("source", ["openrouter_key", "response_headers", "none"]).default("none").notNull(),
    checkedAt: timestamp("checkedAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("assistant_provider_health_workspace_provider_unique").on(table.workspaceId, table.provider),
  ],
);

/** Server-side record of explicit opt-in. Device notification identifiers stay on the device. */
export const assistantProviderAlertPreferences = mysqlTable(
  "hub_assistant_provider_alert_preferences",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    workspaceId: varchar("workspaceId", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    provider: mysqlEnum("provider", ["openrouter", "gemini", "groq", "mistral"]).notNull(),
    resetAlertEnabled: boolean("resetAlertEnabled").default(false).notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("assistant_provider_alert_preferences_workspace_provider_unique").on(table.workspaceId, table.provider),
  ],
);

/** A short-lived encrypted assistant request restored only after an explicit notification retry. */
export const assistantRetryRequests = mysqlTable(
  "hub_assistant_retry_requests",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    workspaceId: varchar("workspaceId", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    sourceProvider: mysqlEnum("sourceProvider", ["openrouter", "gemini", "groq", "mistral"]).notNull(),
    serverId: varchar("serverId", { length: 64 }),
    encryptedPayload: text("encryptedPayload").notNull(),
    status: mysqlEnum("status", ["pending", "consumed", "expired"]).default("pending").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    consumedAt: timestamp("consumedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("assistant_retry_requests_workspace_status_idx").on(table.workspaceId, table.status, table.expiresAt),
  ],
);

/** A short-lived, one-time approval record for a proposed authorized MCP tool call. */
export const assistantToolProposals = mysqlTable(
  "hub_assistant_tool_proposals",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    workspaceId: varchar("workspaceId", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    serverId: varchar("serverId", { length: 64 })
      .notNull()
      .references(() => mcpServers.id, { onDelete: "cascade" }),
    toolName: varchar("toolName", { length: 255 }).notNull(),
    inputJson: text("inputJson").notNull(),
    status: mysqlEnum("status", ["pending", "consumed", "rejected", "expired"])
      .default("pending")
      .notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    consumedAt: timestamp("consumedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("assistant_tool_proposals_workspace_status_idx").on(table.workspaceId, table.status, table.expiresAt),
  ],
);

/** Durable OAuth connection metadata. Token exchange remains unavailable until callback verification is implemented. */
export const oauthConnections = mysqlTable(
  "hub_oauth_connections",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    workspaceId: varchar("workspaceId", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    serverId: varchar("serverId", { length: 64 })
      .notNull()
      .references(() => mcpServers.id, { onDelete: "cascade" }),
    provider: mysqlEnum("provider", ["github", "slack", "notion"]).notNull(),
    status: mysqlEnum("status", ["configured", "revoked", "error"]).default("configured").notNull(),
    encryptedPayload: text("encryptedPayload"),
    expiresAt: timestamp("expiresAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("hub_oauth_connections_workspace_server_provider_unique").on(table.workspaceId, table.serverId, table.provider),
  ],
);

/** Durable webhook subscription configuration. Delivery is gated until a signed receiver and queue are implemented. */
export const webhookSubscriptions = mysqlTable(
  "hub_webhook_subscriptions",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    workspaceId: varchar("workspaceId", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 128 }).notNull(),
    eventsJson: text("eventsJson").notNull(),
    encryptedSecret: text("encryptedSecret").notNull(),
    status: mysqlEnum("status", ["inactive", "active", "error"]).default("inactive").notNull(),
    retryJson: text("retryJson").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("hub_webhook_subscriptions_workspace_idx").on(table.workspaceId, table.createdAt),
  ],
);

/** Durable workflow draft configuration. Execution and scheduling remain gated until an authorized step engine exists. */
export const workflowDrafts = mysqlTable(
  "hub_workflow_drafts",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    workspaceId: varchar("workspaceId", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 128 }).notNull(),
    description: varchar("description", { length: 512 }),
    definitionJson: text("definitionJson").notNull(),
    status: mysqlEnum("status", ["draft", "archived"]).default("draft").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("hub_workflow_drafts_workspace_idx").on(table.workspaceId, table.updatedAt),
  ],
);

export type Workspace = typeof workspaces.$inferSelect;
export type McpServer = typeof mcpServers.$inferSelect;
export type McpCredential = typeof mcpCredentials.$inferSelect;
export type McpExecutionLog = typeof mcpExecutionLogs.$inferSelect;
export type AssistantProviderConfig = typeof assistantProviderConfigs.$inferSelect;
export type AssistantToolProposal = typeof assistantToolProposals.$inferSelect;
export type OAuthConnection = typeof oauthConnections.$inferSelect;
export type WebhookSubscription = typeof webhookSubscriptions.$inferSelect;
export type WorkflowDraft = typeof workflowDrafts.$inferSelect;
