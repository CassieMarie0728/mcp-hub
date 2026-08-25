CREATE TABLE `hub_assistant_retry_requests` (
	`id` varchar(64) NOT NULL,
	`workspaceId` varchar(64) NOT NULL,
	`sourceProvider` enum('openrouter','gemini','groq','mistral') NOT NULL,
	`serverId` varchar(64),
	`encryptedPayload` text NOT NULL,
	`status` enum('pending','consumed','expired') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp NOT NULL,
	`consumedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hub_assistant_retry_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `hub_assistant_provider_configs` ADD `fallbackEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `hub_assistant_provider_configs` ADD `fallbackPriority` int DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE `hub_assistant_retry_requests` ADD CONSTRAINT `hub_assistant_retry_requests_workspaceId_hub_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `hub_workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `assistant_retry_requests_workspace_status_idx` ON `hub_assistant_retry_requests` (`workspaceId`,`status`,`expiresAt`);