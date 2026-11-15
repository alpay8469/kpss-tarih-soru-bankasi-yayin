CREATE TABLE `admin_login_guard` (
	`id` text PRIMARY KEY NOT NULL,
	`attempts` integer NOT NULL,
	`reset_at` integer NOT NULL
);

--> statement-breakpoint
CREATE TABLE `admin_sessions` (
	`hash` text PRIMARY KEY NOT NULL,
	`credential_hash` text NOT NULL,
	`expires_at` integer NOT NULL
);

--> statement-breakpoint
CREATE TABLE `question_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`test_id` text NOT NULL,
	`question_id` text NOT NULL,
	`question_revision` integer NOT NULL,
	`question_snapshot` text NOT NULL,
	`category` text NOT NULL,
	`detail` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`decision` text DEFAULT '' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`test_id`) REFERENCES `tests`(`id`) ON UPDATE no action ON DELETE no action
);

--> statement-breakpoint
CREATE UNIQUE INDEX `idx_report_profile_question_revision` ON `question_reports` (`profile_id`,`question_id`,`question_revision`);
--> statement-breakpoint
CREATE INDEX `idx_reports_status_created` ON `question_reports` (`status`,`created_at`);
--> statement-breakpoint
CREATE TABLE `report_events` (
	`id` text PRIMARY KEY NOT NULL,
	`report_id` text NOT NULL,
	`status` text NOT NULL,
	`decision` text NOT NULL,
	`version` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`report_id`) REFERENCES `question_reports`(`id`) ON UPDATE no action ON DELETE no action
);


