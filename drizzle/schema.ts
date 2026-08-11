import {
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
  "workspaces",
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
  "mcp_servers",
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
  "mcp_credentials",
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
  "mcp_execution_logs",
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

export type Workspace = typeof workspaces.$inferSelect;
export type McpServer = typeof mcpServers.$inferSelect;
export type McpCredential = typeof mcpCredentials.$inferSelect;
export type McpExecutionLog = typeof mcpExecutionLogs.$inferSelect;
