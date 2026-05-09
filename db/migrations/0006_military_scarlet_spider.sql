CREATE TABLE `intro_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`requester_user_id` text NOT NULL,
	`requester_role` text NOT NULL,
	`target_investor_id` text,
	`target_company_id` text,
	`message_text` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`submitted_at` integer NOT NULL,
	`reviewed_by_user_id` text,
	`reviewed_at` integer,
	`admin_notes` text,
	FOREIGN KEY (`requester_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_investor_id`) REFERENCES `investor_profiles`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`target_company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `intro_requests_requester_idx` ON `intro_requests` (`requester_user_id`);--> statement-breakpoint
CREATE INDEX `intro_requests_target_investor_idx` ON `intro_requests` (`target_investor_id`);--> statement-breakpoint
CREATE INDEX `intro_requests_target_company_idx` ON `intro_requests` (`target_company_id`);--> statement-breakpoint
CREATE INDEX `intro_requests_status_idx` ON `intro_requests` (`status`);--> statement-breakpoint
CREATE TABLE `saved_companies` (
	`id` text PRIMARY KEY NOT NULL,
	`investor_id` text NOT NULL,
	`company_id` text NOT NULL,
	`note` text,
	`saved_at` integer NOT NULL,
	FOREIGN KEY (`investor_id`) REFERENCES `investor_profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `saved_companies_investor_idx` ON `saved_companies` (`investor_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `saved_companies_investor_company_idx` ON `saved_companies` (`investor_id`,`company_id`);--> statement-breakpoint
ALTER TABLE `investor_profiles` ADD `slug` text;--> statement-breakpoint
ALTER TABLE `investor_profiles` ADD `display_name` text;--> statement-breakpoint
ALTER TABLE `investor_profiles` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `investor_profiles` ADD `tagline` text;--> statement-breakpoint
ALTER TABLE `investor_profiles` ADD `website` text;--> statement-breakpoint
ALTER TABLE `investor_profiles` ADD `linkedin` text;--> statement-breakpoint
ALTER TABLE `investor_profiles` ADD `verification_status` text DEFAULT 'unverified' NOT NULL;--> statement-breakpoint
ALTER TABLE `investor_profiles` ADD `verified_at` integer;--> statement-breakpoint
ALTER TABLE `investor_profiles` ADD `last_updated_by` text REFERENCES user(id) ON DELETE SET NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `investor_profiles_slug_idx` ON `investor_profiles` (`slug`);--> statement-breakpoint
CREATE INDEX `investor_profiles_verification_idx` ON `investor_profiles` (`verification_status`);