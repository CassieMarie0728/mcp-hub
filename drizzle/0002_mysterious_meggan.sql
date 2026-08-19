CREATE TABLE `assistant_provider_configs` (
	`id` varchar(64) NOT NULL,
	`workspaceId` varchar(64) NOT NULL,
	`provider` enum('openrouter') NOT NULL,
	`model` varchar(160) NOT NULL,
	`encryptedPayload` text NOT NULL,
	`keyVersion` varchar(32) NOT NULL DEFAULT 'v1',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assistant_provider_configs_id` PRIMARY KEY(`id`),
	CONSTRAINT `assistant_provider_configs_workspace_unique` UNIQUE(`workspaceId`)
);
--> statement-breakpoint
CREATE TABLE `assistant_tool_proposals` (
	`id` varchar(64) NOT NULL,
	`workspaceId` varchar(64) NOT NULL,
	`serverId` varchar(64) NOT NULL,
	`toolName` varchar(255) NOT NULL,
	`inputJson` text NOT NULL,
	`status` enum('pending','consumed','rejected','expired') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp NOT NULL,
	`consumedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assistant_tool_proposals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `assistant_provider_configs` ADD CONSTRAINT `assistant_provider_configs_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assistant_tool_proposals` ADD CONSTRAINT `assistant_tool_proposals_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assistant_tool_proposals` ADD CONSTRAINT `assistant_tool_proposals_serverId_mcp_servers_id_fk` FOREIGN KEY (`serverId`) REFERENCES `mcp_servers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `assistant_tool_proposals_workspace_status_idx` ON `assistant_tool_proposals` (`workspaceId`,`status`,`expiresAt`);