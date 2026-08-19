CREATE TABLE `hub_oauth_connections` (
	`id` varchar(64) NOT NULL,
	`workspaceId` varchar(64) NOT NULL,
	`serverId` varchar(64) NOT NULL,
	`provider` enum('github','slack','notion') NOT NULL,
	`status` enum('configured','revoked','error') NOT NULL DEFAULT 'configured',
	`encryptedPayload` text,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hub_oauth_connections_id` PRIMARY KEY(`id`),
	CONSTRAINT `hub_oauth_connections_workspace_server_provider_unique` UNIQUE(`workspaceId`,`serverId`,`provider`)
);
--> statement-breakpoint
CREATE TABLE `hub_webhook_subscriptions` (
	`id` varchar(64) NOT NULL,
	`workspaceId` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`eventsJson` text NOT NULL,
	`encryptedSecret` text NOT NULL,
	`status` enum('inactive','active','error') NOT NULL DEFAULT 'inactive',
	`retryJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hub_webhook_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hub_workflow_drafts` (
	`id` varchar(64) NOT NULL,
	`workspaceId` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` varchar(512),
	`definitionJson` text NOT NULL,
	`status` enum('draft','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hub_workflow_drafts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `hub_oauth_connections` ADD CONSTRAINT `hub_oauth_connections_workspaceId_hub_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `hub_workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `hub_oauth_connections` ADD CONSTRAINT `hub_oauth_connections_serverId_hub_mcp_servers_id_fk` FOREIGN KEY (`serverId`) REFERENCES `hub_mcp_servers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `hub_webhook_subscriptions` ADD CONSTRAINT `hub_webhook_subscriptions_workspaceId_hub_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `hub_workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `hub_workflow_drafts` ADD CONSTRAINT `hub_workflow_drafts_workspaceId_hub_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `hub_workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `hub_webhook_subscriptions_workspace_idx` ON `hub_webhook_subscriptions` (`workspaceId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `hub_workflow_drafts_workspace_idx` ON `hub_workflow_drafts` (`workspaceId`,`updatedAt`);