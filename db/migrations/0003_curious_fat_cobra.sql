CREATE TABLE `admin_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'goeo_admin' NOT NULL,
	`token_hash` text NOT NULL,
	`invited_by_user_id` text,
	`created_at` integer,
	`expires_at` integer NOT NULL,
	`consumed_at` integer,
	FOREIGN KEY (`invited_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_invites_token_idx` ON `admin_invites` (`token_hash`);--> statement-breakpoint
CREATE INDEX `admin_invites_email_idx` ON `admin_invites` (`email`);--> statement-breakpoint
CREATE TABLE `investor_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`firm_name` text,
	`investor_type` text,
	`stages_json` text,
	`sectors_json` text,
	`check_size_min` integer,
	`check_size_max` integer,
	`geo_focus_json` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `investor_profiles_user_idx` ON `investor_profiles` (`user_id`);--> statement-breakpoint
ALTER TABLE `profile_updates` ADD `source_client` text;