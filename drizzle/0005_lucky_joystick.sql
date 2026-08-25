ALTER TABLE `hub_assistant_provider_configs` DROP FOREIGN KEY `hub_assistant_provider_configs_workspaceId_hub_workspaces_id_fk`;--> statement-breakpoint
ALTER TABLE `hub_assistant_provider_configs` DROP INDEX `hub_assistant_provider_configs_workspace_unique`;--> statement-breakpoint
ALTER TABLE `hub_assistant_provider_configs` MODIFY COLUMN `provider` enum('openrouter','gemini','groq','mistral') NOT NULL;--> statement-breakpoint
ALTER TABLE `hub_assistant_provider_configs` ADD CONSTRAINT `assistant_provider_configs_workspace_provider_unique` UNIQUE(`workspaceId`,`provider`);--> statement-breakpoint
ALTER TABLE `hub_assistant_provider_configs` ADD CONSTRAINT `hub_assistant_provider_configs_workspaceId_hub_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `hub_workspaces`(`id`) ON DELETE cascade ON UPDATE no action;
