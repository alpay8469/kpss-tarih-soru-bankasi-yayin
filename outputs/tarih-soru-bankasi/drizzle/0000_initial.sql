CREATE TABLE `answers` (
	`id` text PRIMARY KEY NOT NULL,
	`test_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`question_id` text NOT NULL,
	`choice` text NOT NULL,
	`correct` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`test_id`) REFERENCES `tests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);

--> statement-breakpoint
CREATE UNIQUE INDEX `idx_answers_test_question` ON `answers` (`test_id`,`question_id`);
--> statement-breakpoint
CREATE INDEX `idx_answers_profile_question_time` ON `answers` (`profile_id`,`question_id`,`created_at`);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`nickname` text NOT NULL,
	`nickname_key` text NOT NULL,
	`recovery_hash` text,
	`created_at` integer NOT NULL
);

--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_nickname_key_unique` ON `profiles` (`nickname_key`);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_recovery_hash_unique` ON `profiles` (`recovery_hash`);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`hash` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);

--> statement-breakpoint
CREATE TABLE `tests` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`topic` text NOT NULL,
	`mode` text NOT NULL,
	`question_ids` text NOT NULL,
	`created_at` integer NOT NULL,
	`finished_at` integer,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);

--> statement-breakpoint
CREATE INDEX `idx_tests_profile_created` ON `tests` (`profile_id`,`created_at`);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_tests_one_active` ON `tests` (`profile_id`) WHERE finished_at IS NULL;
