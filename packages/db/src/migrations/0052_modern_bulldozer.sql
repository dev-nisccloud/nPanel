CREATE TABLE "agency_cron_job_run" (
	"id" text PRIMARY KEY NOT NULL,
	"job_key" text NOT NULL,
	"source" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"triggered_by_user_id" text,
	"qstash_message_id" text,
	"scanned" integer DEFAULT 0 NOT NULL,
	"sent" integer DEFAULT 0 NOT NULL,
	"skipped" integer DEFAULT 0 NOT NULL,
	"failed" integer DEFAULT 0 NOT NULL,
	"current_offset" integer DEFAULT 0 NOT NULL,
	"batch_count" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"summary" text,
	"metadata" jsonb,
	"started_at" timestamp,
	"finished_at" timestamp,
	"heartbeat_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agency_cron_job_run_item" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"subscription_id" text,
	"outcome" text NOT NULL,
	"skip_reason" text,
	"email_to" text,
	"subject" text,
	"error" text,
	"subscription_name" text,
	"product_name" text,
	"expiry_date" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agency_cron_job_run" ADD CONSTRAINT "agency_cron_job_run_triggered_by_user_id_user_id_fk" FOREIGN KEY ("triggered_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_cron_job_run_item" ADD CONSTRAINT "agency_cron_job_run_item_run_id_agency_cron_job_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."agency_cron_job_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_cron_job_run_item" ADD CONSTRAINT "agency_cron_job_run_item_subscription_id_nisc_client_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."nisc_client_subscription"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agency_cron_job_run_jobKey_idx" ON "agency_cron_job_run" USING btree ("job_key");--> statement-breakpoint
CREATE INDEX "agency_cron_job_run_status_idx" ON "agency_cron_job_run" USING btree ("status");--> statement-breakpoint
CREATE INDEX "agency_cron_job_run_createdAt_idx" ON "agency_cron_job_run" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "agency_cron_job_run_jobKey_status_idx" ON "agency_cron_job_run" USING btree ("job_key","status");--> statement-breakpoint
CREATE INDEX "agency_cron_job_run_triggeredByUserId_idx" ON "agency_cron_job_run" USING btree ("triggered_by_user_id");--> statement-breakpoint
CREATE INDEX "agency_cron_job_run_item_runId_idx" ON "agency_cron_job_run_item" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "agency_cron_job_run_item_subscriptionId_idx" ON "agency_cron_job_run_item" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "agency_cron_job_run_item_outcome_idx" ON "agency_cron_job_run_item" USING btree ("outcome");--> statement-breakpoint
CREATE INDEX "agency_cron_job_run_item_createdAt_idx" ON "agency_cron_job_run_item" USING btree ("created_at");