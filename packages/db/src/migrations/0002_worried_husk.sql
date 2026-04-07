CREATE TABLE "nisc_commission_entry" (
	"id" text PRIMARY KEY NOT NULL,
	"subscription_id" text NOT NULL,
	"product_plan_id" text NOT NULL,
	"team_id" text,
	"period" text NOT NULL,
	"base_amount" numeric(18, 4) NOT NULL,
	"base_amount_description" text,
	"commission_rate" numeric(10, 4) NOT NULL,
	"commission_amount" numeric(18, 4) NOT NULL,
	"currency" text DEFAULT 'KES' NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"invoice_id" text,
	"notes" text,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nisc_em_audience" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text,
	"user_id" text,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nisc_em_campaign" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text,
	"user_id" text NOT NULL,
	"domain_id" text,
	"audience_id" text,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"from_email" text NOT NULL,
	"from_name" text,
	"reply_to" text,
	"html_content" text,
	"text_content" text,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"tracking_enabled" boolean DEFAULT true NOT NULL,
	"total_recipients" integer DEFAULT 0 NOT NULL,
	"total_sent" integer DEFAULT 0 NOT NULL,
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nisc_em_contact" (
	"id" text PRIMARY KEY NOT NULL,
	"audience_id" text NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"company" text,
	"phone" text,
	"status" text DEFAULT 'SUBSCRIBED' NOT NULL,
	"metadata" jsonb,
	"subscribed_at" timestamp,
	"unsubscribed_at" timestamp,
	"bounced_at" timestamp,
	"complained_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nisc_em_domain" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text,
	"user_id" text,
	"domain_name" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"dkim_status" text DEFAULT 'NotStarted' NOT NULL,
	"dkim_tokens" jsonb DEFAULT '[]'::jsonb,
	"mail_from_mode" text DEFAULT 'DEFAULT' NOT NULL,
	"mail_from_domain" text,
	"mail_from_status" text DEFAULT 'Pending',
	"dns_records" jsonb DEFAULT '[]'::jsonb,
	"feedback_forwarding_disabled" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nisc_em_email" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"contact_id" text,
	"to_email" text NOT NULL,
	"from_email" text NOT NULL,
	"subject" text NOT NULL,
	"ses_message_id" text,
	"status" text DEFAULT 'QUEUED' NOT NULL,
	"opens" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"bounced_at" timestamp,
	"bounce_type" text,
	"bounce_sub_type" text,
	"complained_at" timestamp,
	"complaint_feedback_type" text,
	"error_message" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "nisc_em_email_ses_message_id_unique" UNIQUE("ses_message_id")
);
--> statement-breakpoint
CREATE TABLE "nisc_em_email_event" (
	"id" text PRIMARY KEY NOT NULL,
	"email_id" text,
	"ses_message_id" text NOT NULL,
	"event_type" text NOT NULL,
	"occurred_at" timestamp NOT NULL,
	"recipient_email" text,
	"ip_address" text,
	"user_agent" text,
	"link" text,
	"link_tags" jsonb,
	"bounce_type" text,
	"bounce_sub_type" text,
	"bounce_smtp_response" text,
	"bounce_feedback_id" text,
	"bounce_remote_mta_ip" text,
	"bounce_reporting_mta" text,
	"bounce_action" text,
	"bounce_recipient_status" text,
	"complaint_feedback_type" text,
	"complained_recipient_email" text,
	"delivery_processing_ms" integer,
	"delivery_smtp_response" text,
	"delivery_remote_mta_ip" text,
	"delivery_reporting_mta" text,
	"delivery_recipients" jsonb,
	"delay_type" text,
	"raw_payload" jsonb,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nisc_em_send_job" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"status" text DEFAULT 'QUEUED' NOT NULL,
	"qstash_message_id" text,
	"batch_size" integer DEFAULT 0 NOT NULL,
	"processed_count" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"scheduled_for" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nisc_em_suppression" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"email" text NOT NULL,
	"reason" text NOT NULL,
	"source_campaign_id" text,
	"source_email_id" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nisc_commission_entry" ADD CONSTRAINT "nisc_commission_entry_subscription_id_nisc_client_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."nisc_client_subscription"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_commission_entry" ADD CONSTRAINT "nisc_commission_entry_product_plan_id_nisc_product_plan_id_fk" FOREIGN KEY ("product_plan_id") REFERENCES "public"."nisc_product_plan"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_commission_entry" ADD CONSTRAINT "nisc_commission_entry_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_commission_entry" ADD CONSTRAINT "nisc_commission_entry_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_em_audience" ADD CONSTRAINT "nisc_em_audience_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_em_audience" ADD CONSTRAINT "nisc_em_audience_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_em_campaign" ADD CONSTRAINT "nisc_em_campaign_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_em_campaign" ADD CONSTRAINT "nisc_em_campaign_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_em_campaign" ADD CONSTRAINT "nisc_em_campaign_domain_id_nisc_em_domain_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."nisc_em_domain"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_em_campaign" ADD CONSTRAINT "nisc_em_campaign_audience_id_nisc_em_audience_id_fk" FOREIGN KEY ("audience_id") REFERENCES "public"."nisc_em_audience"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_em_contact" ADD CONSTRAINT "nisc_em_contact_audience_id_nisc_em_audience_id_fk" FOREIGN KEY ("audience_id") REFERENCES "public"."nisc_em_audience"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_em_domain" ADD CONSTRAINT "nisc_em_domain_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_em_domain" ADD CONSTRAINT "nisc_em_domain_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_em_email" ADD CONSTRAINT "nisc_em_email_campaign_id_nisc_em_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."nisc_em_campaign"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_em_email" ADD CONSTRAINT "nisc_em_email_contact_id_nisc_em_contact_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."nisc_em_contact"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_em_email_event" ADD CONSTRAINT "nisc_em_email_event_email_id_nisc_em_email_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."nisc_em_email"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_em_send_job" ADD CONSTRAINT "nisc_em_send_job_campaign_id_nisc_em_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."nisc_em_campaign"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_em_suppression" ADD CONSTRAINT "nisc_em_suppression_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_em_suppression" ADD CONSTRAINT "nisc_em_suppression_source_campaign_id_nisc_em_campaign_id_fk" FOREIGN KEY ("source_campaign_id") REFERENCES "public"."nisc_em_campaign"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_em_suppression" ADD CONSTRAINT "nisc_em_suppression_source_email_id_nisc_em_email_id_fk" FOREIGN KEY ("source_email_id") REFERENCES "public"."nisc_em_email"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "nisc_commission_entry_subscriptionId_idx" ON "nisc_commission_entry" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "nisc_commission_entry_teamId_idx" ON "nisc_commission_entry" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "nisc_commission_entry_period_idx" ON "nisc_commission_entry" USING btree ("period");--> statement-breakpoint
CREATE INDEX "nisc_commission_entry_status_idx" ON "nisc_commission_entry" USING btree ("status");--> statement-breakpoint
CREATE INDEX "nisc_em_audience_teamId_idx" ON "nisc_em_audience" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "nisc_em_audience_userId_idx" ON "nisc_em_audience" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "nisc_em_campaign_teamId_idx" ON "nisc_em_campaign" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "nisc_em_campaign_userId_idx" ON "nisc_em_campaign" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "nisc_em_campaign_domainId_idx" ON "nisc_em_campaign" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "nisc_em_campaign_audienceId_idx" ON "nisc_em_campaign" USING btree ("audience_id");--> statement-breakpoint
CREATE INDEX "nisc_em_campaign_status_idx" ON "nisc_em_campaign" USING btree ("status");--> statement-breakpoint
CREATE INDEX "nisc_em_campaign_scheduledAt_idx" ON "nisc_em_campaign" USING btree ("scheduled_at");--> statement-breakpoint
CREATE UNIQUE INDEX "nisc_em_contact_audienceId_email_idx" ON "nisc_em_contact" USING btree ("audience_id","email");--> statement-breakpoint
CREATE INDEX "nisc_em_contact_audienceId_idx" ON "nisc_em_contact" USING btree ("audience_id");--> statement-breakpoint
CREATE INDEX "nisc_em_contact_email_idx" ON "nisc_em_contact" USING btree ("email");--> statement-breakpoint
CREATE INDEX "nisc_em_contact_status_idx" ON "nisc_em_contact" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "nisc_em_domain_teamId_domainName_idx" ON "nisc_em_domain" USING btree ("team_id","domain_name");--> statement-breakpoint
CREATE INDEX "nisc_em_domain_teamId_idx" ON "nisc_em_domain" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "nisc_em_domain_status_idx" ON "nisc_em_domain" USING btree ("status");--> statement-breakpoint
CREATE INDEX "nisc_em_domain_dkimStatus_idx" ON "nisc_em_domain" USING btree ("dkim_status");--> statement-breakpoint
CREATE INDEX "nisc_em_email_sesMessageId_idx" ON "nisc_em_email" USING btree ("ses_message_id");--> statement-breakpoint
CREATE INDEX "nisc_em_email_campaignId_idx" ON "nisc_em_email" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "nisc_em_email_contactId_idx" ON "nisc_em_email" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "nisc_em_email_toEmail_idx" ON "nisc_em_email" USING btree ("to_email");--> statement-breakpoint
CREATE INDEX "nisc_em_email_status_idx" ON "nisc_em_email" USING btree ("status");--> statement-breakpoint
CREATE INDEX "nisc_em_email_campaignId_openedAt_idx" ON "nisc_em_email" USING btree ("campaign_id","opened_at");--> statement-breakpoint
CREATE INDEX "nisc_em_email_campaignId_clickedAt_idx" ON "nisc_em_email" USING btree ("campaign_id","clicked_at");--> statement-breakpoint
CREATE INDEX "nisc_em_email_campaignId_bouncedAt_idx" ON "nisc_em_email" USING btree ("campaign_id","bounced_at");--> statement-breakpoint
CREATE INDEX "nisc_em_email_campaignId_deliveredAt_idx" ON "nisc_em_email" USING btree ("campaign_id","delivered_at");--> statement-breakpoint
CREATE INDEX "nisc_em_email_event_emailId_idx" ON "nisc_em_email_event" USING btree ("email_id");--> statement-breakpoint
CREATE INDEX "nisc_em_email_event_sesMessageId_idx" ON "nisc_em_email_event" USING btree ("ses_message_id");--> statement-breakpoint
CREATE INDEX "nisc_em_email_event_eventType_idx" ON "nisc_em_email_event" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "nisc_em_email_event_occurredAt_idx" ON "nisc_em_email_event" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "nisc_em_email_event_emailId_eventType_idx" ON "nisc_em_email_event" USING btree ("email_id","event_type");--> statement-breakpoint
CREATE INDEX "nisc_em_send_job_campaignId_idx" ON "nisc_em_send_job" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "nisc_em_send_job_status_idx" ON "nisc_em_send_job" USING btree ("status");--> statement-breakpoint
CREATE INDEX "nisc_em_send_job_qstashMessageId_idx" ON "nisc_em_send_job" USING btree ("qstash_message_id");--> statement-breakpoint
CREATE INDEX "nisc_em_send_job_scheduledFor_idx" ON "nisc_em_send_job" USING btree ("scheduled_for");--> statement-breakpoint
CREATE UNIQUE INDEX "nisc_em_suppression_teamId_email_idx" ON "nisc_em_suppression" USING btree ("team_id","email");--> statement-breakpoint
CREATE INDEX "nisc_em_suppression_teamId_idx" ON "nisc_em_suppression" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "nisc_em_suppression_reason_idx" ON "nisc_em_suppression" USING btree ("reason");