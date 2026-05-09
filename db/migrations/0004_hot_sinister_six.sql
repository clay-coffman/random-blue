CREATE TABLE `saved_searches` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`filters_json` text NOT NULL,
	`cadence` text DEFAULT 'daily' NOT NULL,
	`last_run_at` integer,
	`last_match_ids_json` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `saved_searches_user_idx` ON `saved_searches` (`user_id`);--> statement-breakpoint
CREATE INDEX `saved_searches_cadence_idx` ON `saved_searches` (`cadence`);--> statement-breakpoint
CREATE TABLE `search_alert_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`saved_search_id` text NOT NULL,
	`new_match_ids_json` text NOT NULL,
	`sent_at` integer NOT NULL,
	FOREIGN KEY (`saved_search_id`) REFERENCES `saved_searches`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `search_alert_deliveries_search_idx` ON `search_alert_deliveries` (`saved_search_id`);