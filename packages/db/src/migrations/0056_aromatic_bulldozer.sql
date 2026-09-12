CREATE TABLE "agency_cron_job_activity" (
	"id" text PRIMARY KEY NOT NULL,
	"job_key" text NOT NULL,
	"action" text NOT NULL,
	"user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "agency_cron_job_setting" (
	"job_key" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"updated_by_user_id" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agency_cron_job_activity" ADD CONSTRAINT "agency_cron_job_activity_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_cron_job_setting" ADD CONSTRAINT "agency_cron_job_setting_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agency_cron_job_activity_jobKey_idx" ON "agency_cron_job_activity" USING btree ("job_key");--> statement-breakpoint
CREATE INDEX "agency_cron_job_activity_createdAt_idx" ON "agency_cron_job_activity" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "agency_cron_job_activity_jobKey_createdAt_idx" ON "agency_cron_job_activity" USING btree ("job_key","created_at");