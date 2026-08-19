-- Additive tenant persistence layer. Legacy tables remain untouched because
-- their schema is incompatible with the current UUID workspace contract.
CREATE TABLE `hub_workspaces` (
  `id` varchar(64) NOT NULL,
  `ownerUserId` int NOT NULL,
  `name` varchar(128) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `hub_workspaces_id` PRIMARY KEY(`id`),
  CONSTRAINT `hub_workspaces_owner_user_unique` UNIQUE(`ownerUserId`),
  CONSTRAINT `hub_workspaces_ownerUserId_users_id_fk` FOREIGN KEY (`ownerUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE `hub_mcp_servers` (
  `id` varchar(64) NOT NULL,
  `workspaceId` varchar(64) NOT NULL,
  `name` varchar(255) NOT NULL,
  `endpoint` varchar(2048) NOT NULL,
  `transport` enum('http') NOT NULL DEFAULT 'http',
  `headersJson` text,
  `status` enum('connected','disconnected','error') NOT NULL DEFAULT 'disconnected',
  `lastConnectedAt` timestamp NULL,
  `lastError` varchar(512),
  `toolCount` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `hub_mcp_servers_id` PRIMARY KEY(`id`),
  CONSTRAINT `hub_mcp_servers_workspaceId_hub_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `hub_workspaces`(`id`) ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE `hub_mcp_credentials` (
  `id` varchar(64) NOT NULL,
  `serverId` varchar(64) NOT NULL,
  `encryptedPayload` text NOT NULL,
  `keyVersion` varchar(32) NOT NULL DEFAULT 'v1',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `hub_mcp_credentials_id` PRIMARY KEY(`id`),
  CONSTRAINT `hub_mcp_credentials_server_unique` UNIQUE(`serverId`),
  CONSTRAINT `hub_mcp_credentials_serverId_hub_mcp_servers_id_fk` FOREIGN KEY (`serverId`) REFERENCES `hub_mcp_servers`(`id`) ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE `hub_mcp_execution_logs` (
  `id` varchar(64) NOT NULL,
  `workspaceId` varchar(64) NOT NULL,
  `serverId` varchar(64) NOT NULL,
  `operation` varchar(64) NOT NULL,
  `toolName` varchar(255),
  `success` enum('true','false') NOT NULL,
  `durationMs` int,
  `errorMessage` varchar(512),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `hub_mcp_execution_logs_id` PRIMARY KEY(`id`),
  CONSTRAINT `hub_mcp_execution_logs_workspaceId_hub_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `hub_workspaces`(`id`) ON DELETE cascade ON UPDATE no action,
  CONSTRAINT `hub_mcp_execution_logs_serverId_hub_mcp_servers_id_fk` FOREIGN KEY (`serverId`) REFERENCES `hub_mcp_servers`(`id`) ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE `hub_assistant_provider_configs` (
  `id` varchar(64) NOT NULL,
  `workspaceId` varchar(64) NOT NULL,
  `provider` enum('openrouter') NOT NULL,
  `model` varchar(160) NOT NULL,
  `encryptedPayload` text NOT NULL,
  `keyVersion` varchar(32) NOT NULL DEFAULT 'v1',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `hub_assistant_provider_configs_id` PRIMARY KEY(`id`),
  CONSTRAINT `hub_assistant_provider_configs_workspace_unique` UNIQUE(`workspaceId`),
  CONSTRAINT `hub_assistant_provider_configs_workspaceId_hub_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `hub_workspaces`(`id`) ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE `hub_assistant_tool_proposals` (
  `id` varchar(64) NOT NULL,
  `workspaceId` varchar(64) NOT NULL,
  `serverId` varchar(64) NOT NULL,
  `toolName` varchar(255) NOT NULL,
  `inputJson` text NOT NULL,
  `status` enum('pending','consumed','rejected','expired') NOT NULL DEFAULT 'pending',
  `expiresAt` timestamp NOT NULL,
  `consumedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `hub_assistant_tool_proposals_id` PRIMARY KEY(`id`),
  CONSTRAINT `hub_assistant_tool_proposals_workspaceId_hub_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `hub_workspaces`(`id`) ON DELETE cascade ON UPDATE no action,
  CONSTRAINT `hub_assistant_tool_proposals_serverId_hub_mcp_servers_id_fk` FOREIGN KEY (`serverId`) REFERENCES `hub_mcp_servers`(`id`) ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX `hub_mcp_servers_workspace_idx` ON `hub_mcp_servers` (`workspaceId`);
--> statement-breakpoint
CREATE INDEX `hub_mcp_execution_logs_workspace_created_idx` ON `hub_mcp_execution_logs` (`workspaceId`,`createdAt`);
--> statement-breakpoint
CREATE INDEX `hub_mcp_execution_logs_server_created_idx` ON `hub_mcp_execution_logs` (`serverId`,`createdAt`);
--> statement-breakpoint
CREATE INDEX `hub_assistant_tool_proposals_workspace_status_idx` ON `hub_assistant_tool_proposals` (`workspaceId`,`status`,`expiresAt`);
