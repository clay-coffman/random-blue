CREATE TABLE `business_ownership_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`company_id` text NOT NULL,
	`r2_key` text NOT NULL,
	`mime_type` text,
	`file_size` integer,
	`submitted_at` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewed_by_user_id` text,
	`reviewed_at` integer,
	`review_notes` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `bos_user_idx` ON `business_ownership_submissions` (`user_id`);--> statement-breakpoint
CREATE INDEX `bos_company_idx` ON `business_ownership_submissions` (`company_id`);--> statement-breakpoint
CREATE INDEX `bos_status_idx` ON `business_ownership_submissions` (`status`);--> statement-breakpoint
CREATE TABLE `companies` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`website` text,
	`description` text,
	`sector` text,
	`stage` text,
	`employee_count` text,
	`hiring_status` integer DEFAULT false NOT NULL,
	`founding_year` integer,
	`linkedin` text,
	`logo_url` text,
	`founder_team_json` text,
	`address_text` text,
	`lat` real,
	`lng` real,
	`verified_at` integer,
	`claimed_at` integer,
	`claimed_by_user_id` text,
	`last_updated_by` text,
	`last_updated_at` integer,
	`embedding` blob,
	FOREIGN KEY (`claimed_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `companies_slug_idx` ON `companies` (`slug`);--> statement-breakpoint
CREATE INDEX `companies_sector_idx` ON `companies` (`sector`);--> statement-breakpoint
CREATE INDEX `companies_stage_idx` ON `companies` (`stage`);--> statement-breakpoint
CREATE INDEX `companies_claimed_by_idx` ON `companies` (`claimed_by_user_id`);--> statement-breakpoint
CREATE TABLE `company_jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` text NOT NULL,
	`title` text NOT NULL,
	`url` text,
	`posted_at` integer,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `company_jobs_company_idx` ON `company_jobs` (`company_id`);--> statement-breakpoint
CREATE TABLE `company_locations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` text NOT NULL,
	`county` text,
	`city` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `company_locations_company_idx` ON `company_locations` (`company_id`);--> statement-breakpoint
CREATE INDEX `company_locations_county_idx` ON `company_locations` (`county`);--> statement-breakpoint
CREATE TABLE `company_photos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` text NOT NULL,
	`r2_key` text NOT NULL,
	`caption` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `company_photos_company_idx` ON `company_photos` (`company_id`);--> statement-breakpoint
CREATE TABLE `founder_passports` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`county` text,
	`city` text,
	`stage` text,
	`industry` text,
	`communities_json` text,
	`goal` text,
	`urgency` text,
	`business_size` text,
	`needs_json` text,
	`constraints_json` text,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `founder_passports_user_idx` ON `founder_passports` (`user_id`);--> statement-breakpoint
CREATE TABLE `profile_updates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` text NOT NULL,
	`submission_id` text,
	`patch_json` text NOT NULL,
	`applied_at` integer,
	`reviewed_by_user_id` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`submission_id`) REFERENCES `business_ownership_submissions`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `profile_updates_company_idx` ON `profile_updates` (`company_id`);--> statement-breakpoint
CREATE TABLE `recommendations` (
	`id` text PRIMARY KEY NOT NULL,
	`passport_id` text NOT NULL,
	`resource_id` text NOT NULL,
	`score` real NOT NULL,
	`reasons_json` text,
	`action_text` text,
	`bucket` text,
	`created_at` integer,
	FOREIGN KEY (`passport_id`) REFERENCES `founder_passports`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `recommendations_passport_idx` ON `recommendations` (`passport_id`);--> statement-breakpoint
CREATE TABLE `resource_communities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`resource_id` text NOT NULL,
	`community` text NOT NULL,
	FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `resource_communities_community_idx` ON `resource_communities` (`community`);--> statement-breakpoint
CREATE INDEX `resource_communities_resource_idx` ON `resource_communities` (`resource_id`);--> statement-breakpoint
CREATE TABLE `resource_industries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`resource_id` text NOT NULL,
	`industry` text NOT NULL,
	FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `resource_industries_industry_idx` ON `resource_industries` (`industry`);--> statement-breakpoint
CREATE INDEX `resource_industries_resource_idx` ON `resource_industries` (`resource_id`);--> statement-breakpoint
CREATE TABLE `resource_locations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`resource_id` text NOT NULL,
	`county` text,
	`city` text,
	`statewide` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `resource_locations_county_idx` ON `resource_locations` (`county`);--> statement-breakpoint
CREATE INDEX `resource_locations_resource_idx` ON `resource_locations` (`resource_id`);--> statement-breakpoint
CREATE TABLE `resource_topics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`resource_id` text NOT NULL,
	`topic` text NOT NULL,
	FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `resource_topics_topic_idx` ON `resource_topics` (`topic`);--> statement-breakpoint
CREATE INDEX `resource_topics_resource_idx` ON `resource_topics` (`resource_id`);--> statement-breakpoint
CREATE TABLE `resources` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`source_url` text,
	`kind` text,
	`contact_email` text,
	`last_updated_at` integer
);
--> statement-breakpoint
CREATE INDEX `resources_kind_idx` ON `resources` (`kind`);--> statement-breakpoint
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`role` text DEFAULT 'owner' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);