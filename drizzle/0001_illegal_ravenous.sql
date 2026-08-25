CREATE TABLE `mcp_credentials` (
	`id` varchar(64) NOT NULL,
	`serverId` varchar(64) NOT NULL,
	`encryptedPayload` text NOT NULL,
	`keyVersion` varchar(32) NOT NULL DEFAULT 'v1',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mcp_credentials_id` PRIMARY KEY(`id`),
	CONSTRAINT `mcp_credentials_server_unique` UNIQUE(`serverId`)
);
--> statement-breakpoint
CREATE TABLE `mcp_execution_logs` (
	`id` varchar(64) NOT NULL,
	`workspaceId` varchar(64) NOT NULL,
	`serverId` varchar(64) NOT NULL,
	`operation` varchar(64) NOT NULL,
	`toolName` varchar(255),
	`success` enum('true','false') NOT NULL,
	`durationMs` int,
	`errorMessage` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mcp_execution_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mcp_servers` (
	`id` varchar(64) NOT NULL,
	`workspaceId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`endpoint` varchar(2048) NOT NULL,
	`transport` enum('http') NOT NULL DEFAULT 'http',
	`headersJson` text,
	`status` enum('connected','disconnected','error') NOT NULL DEFAULT 'disconnected',
	`lastConnectedAt` timestamp,
	`lastError` varchar(512),
	`toolCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mcp_servers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` varchar(64) NOT NULL,
	`ownerUserId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspaces_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspaces_owner_user_unique` UNIQUE(`ownerUserId`)
);
--> statement-breakpoint
ALTER TABLE `mcp_credentials` ADD CONSTRAINT `mcp_credentials_serverId_mcp_servers_id_fk` FOREIGN KEY (`serverId`) REFERENCES `mcp_servers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mcp_execution_logs` ADD CONSTRAINT `mcp_execution_logs_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mcp_execution_logs` ADD CONSTRAINT `mcp_execution_logs_serverId_mcp_servers_id_fk` FOREIGN KEY (`serverId`) REFERENCES `mcp_servers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mcp_servers` ADD CONSTRAINT `mcp_servers_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workspaces` ADD CONSTRAINT `workspaces_ownerUserId_users_id_fk` FOREIGN KEY (`ownerUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `mcp_execution_logs_workspace_created_idx` ON `mcp_execution_logs` (`workspaceId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `mcp_execution_logs_server_created_idx` ON `mcp_execution_logs` (`serverId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `mcp_servers_workspace_idx` ON `mcp_servers` (`workspaceId`);