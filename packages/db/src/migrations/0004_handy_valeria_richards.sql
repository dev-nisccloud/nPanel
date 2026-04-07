CREATE TABLE "nisc_em_quota_reservation" (
	"id" text PRIMARY KEY NOT NULL,
	"window_id" text NOT NULL,
	"team_id" text,
	"user_id" text,
	"campaign_id" text,
	"send_job_id" text,
	"requested_emails" integer NOT NULL,
	"status" text DEFAULT 'RESERVED' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nisc_em_quota_window" (
	"id" text PRIMARY KEY NOT NULL,
	"window_start" timestamp NOT NULL,
	"window_end" timestamp NOT NULL,
	"max_send_rate" integer NOT NULL,
	"max_24_hour_send" integer NOT NULL,
	"sent_last_24_hours_at_start" integer NOT NULL,
	"reserved_emails" integer DEFAULT 0 NOT NULL,
	"actual_sent_emails" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nisc_em_quota_reservation" ADD CONSTRAINT "nisc_em_quota_reservation_window_id_nisc_em_quota_window_id_fk" FOREIGN KEY ("window_id") REFERENCES "public"."nisc_em_quota_window"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_em_quota_reservation" ADD CONSTRAINT "nisc_em_quota_reservation_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_em_quota_reservation" ADD CONSTRAINT "nisc_em_quota_reservation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_em_quota_reservation" ADD CONSTRAINT "nisc_em_quota_reservation_campaign_id_nisc_em_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."nisc_em_campaign"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_em_quota_reservation" ADD CONSTRAINT "nisc_em_quota_reservation_send_job_id_nisc_em_send_job_id_fk" FOREIGN KEY ("send_job_id") REFERENCES "public"."nisc_em_send_job"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "nisc_em_quota_reservation_windowId_idx" ON "nisc_em_quota_reservation" USING btree ("window_id");--> statement-breakpoint
CREATE INDEX "nisc_em_quota_reservation_status_idx" ON "nisc_em_quota_reservation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "nisc_em_quota_reservation_sendJobId_idx" ON "nisc_em_quota_reservation" USING btree ("send_job_id");--> statement-breakpoint
CREATE UNIQUE INDEX "nisc_em_quota_reservation_sendJob_unique_idx" ON "nisc_em_quota_reservation" USING btree ("send_job_id","window_id");--> statement-breakpoint
CREATE UNIQUE INDEX "nisc_em_quota_window_start_end_idx" ON "nisc_em_quota_window" USING btree ("window_start","window_end");--> statement-breakpoint
CREATE INDEX "nisc_em_quota_window_end_idx" ON "nisc_em_quota_window" USING btree ("window_end");