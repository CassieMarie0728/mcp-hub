CREATE TABLE `hub_assistant_provider_alert_preferences` (
	`id` varchar(64) NOT NULL,
	`workspaceId` varchar(64) NOT NULL,
	`provider` enum('openrouter','gemini','groq','mistral') NOT NULL,
	`resetAlertEnabled` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hub_assistant_provider_alert_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `assistant_provider_alert_preferences_workspace_provider_unique` UNIQUE(`workspaceId`,`provider`)
);
--> statement-breakpoint
CREATE TABLE `hub_assistant_provider_health` (
	`id` varchar(64) NOT NULL,
	`workspaceId` varchar(64) NOT NULL,
	`provider` enum('openrouter','gemini','groq','mistral') NOT NULL,
	`status` enum('valid','invalid','rate_limited','unavailable') NOT NULL,
	`remainingRequests` int,
	`remainingTokens` int,
	`remainingCredit` varchar(64),
	`resetAt` timestamp,
	`source` enum('openrouter_key','response_headers','none') NOT NULL DEFAULT 'none',
	`checkedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hub_assistant_provider_health_id` PRIMARY KEY(`id`),
	CONSTRAINT `assistant_provider_health_workspace_provider_unique` UNIQUE(`workspaceId`,`provider`)
);
--> statement-breakpoint
ALTER TABLE `hub_assistant_provider_alert_preferences` ADD CONSTRAINT `assistant_provider_alert_prefs_workspace_fk` FOREIGN KEY (`workspaceId`) REFERENCES `hub_workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `hub_assistant_provider_health` ADD CONSTRAINT `assistant_provider_health_workspace_fk` FOREIGN KEY (`workspaceId`) REFERENCES `hub_workspaces`(`id`) ON DELETE cascade ON UPDATE no action;
