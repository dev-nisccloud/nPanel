CREATE TABLE "seo_suite_ai_entity" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_ai_mention_snapshot" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"platform" text,
	"payload" jsonb,
	"captured_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_alert_event" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"rule_id" text,
	"title" text NOT NULL,
	"message" text,
	"severity" text DEFAULT 'info' NOT NULL,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_alert_rule" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"name" text NOT NULL,
	"rule_type" text NOT NULL,
	"config" jsonb,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_audit_issue" (
	"_id" text PRIMARY KEY NOT NULL,
	"audit_run_id" text NOT NULL,
	"project_id" text NOT NULL,
	"category" text NOT NULL,
	"severity" text DEFAULT 'warning' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"url" text,
	"evidence" jsonb
);
--> statement-breakpoint
CREATE TABLE "seo_suite_audit_page" (
	"_id" text PRIMARY KEY NOT NULL,
	"audit_run_id" text NOT NULL,
	"project_id" text NOT NULL,
	"url" text NOT NULL,
	"status_code" integer,
	"score" integer,
	"metrics" jsonb
);
--> statement-breakpoint
CREATE TABLE "seo_suite_audit_run" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"target_url" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"max_pages" integer DEFAULT 100 NOT NULL,
	"vendor_task_id" text,
	"score" integer,
	"summary" jsonb,
	"error_message" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_backlink_snapshot" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"target" text NOT NULL,
	"summary" jsonb,
	"captured_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_domain_snapshot" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"target" text NOT NULL,
	"payload" jsonb,
	"captured_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_keyword_list" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_project" (
	"_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"primary_domain" text NOT NULL,
	"location_code" integer DEFAULT 2356 NOT NULL,
	"location_name" text DEFAULT 'Kenya' NOT NULL,
	"language_code" text DEFAULT 'en' NOT NULL,
	"brand_entities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"competitor_domains" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"gsc_site_id" text,
	"ga4_property_id" text,
	"team_id" text,
	"created_by_id" text NOT NULL,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_prompt_run" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"prompt" text NOT NULL,
	"models" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"results" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_rank_keyword" (
	"_id" text PRIMARY KEY NOT NULL,
	"tracker_id" text NOT NULL,
	"project_id" text NOT NULL,
	"keyword" text NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_rank_result" (
	"_id" text PRIMARY KEY NOT NULL,
	"rank_keyword_id" text NOT NULL,
	"project_id" text NOT NULL,
	"checked_at" timestamp DEFAULT now() NOT NULL,
	"rank_absolute" integer,
	"rank_group" integer,
	"url" text,
	"serp_features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ai_overview" boolean DEFAULT false NOT NULL,
	"serp_snapshot" jsonb
);
--> statement-breakpoint
CREATE TABLE "seo_suite_rank_tracker" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"name" text DEFAULT 'Default' NOT NULL,
	"schedule" text DEFAULT 'weekly' NOT NULL,
	"device" text DEFAULT 'desktop' NOT NULL,
	"engine" text DEFAULT 'google' NOT NULL,
	"location_code" integer NOT NULL,
	"language_code" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp,
	"next_run_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_report_run" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"report_type" text NOT NULL,
	"title" text NOT NULL,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_saved_keyword" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"list_id" text,
	"keyword" text NOT NULL,
	"location_code" integer,
	"language_code" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text,
	"source" text DEFAULT 'manual' NOT NULL,
	"status" text DEFAULT 'idea' NOT NULL,
	"metrics_cache" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_serp_cache" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text,
	"cache_key" text NOT NULL,
	"endpoint" text NOT NULL,
	"payload" jsonb,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_tracked_prompt" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"prompt" text NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_vendor_usage" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text,
	"team_id" text,
	"user_id" text,
	"api" text NOT NULL,
	"endpoint" text NOT NULL,
	"units" integer DEFAULT 1 NOT NULL,
	"cost_estimate" double precision,
	"meta" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "seo_suite_ai_entity" ADD CONSTRAINT "seo_suite_ai_entity_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_ai_mention_snapshot" ADD CONSTRAINT "seo_suite_ai_mention_snapshot_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_alert_event" ADD CONSTRAINT "seo_suite_alert_event_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_alert_event" ADD CONSTRAINT "seo_suite_alert_event_rule_id_seo_suite_alert_rule__id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."seo_suite_alert_rule"("_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_alert_rule" ADD CONSTRAINT "seo_suite_alert_rule_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_audit_issue" ADD CONSTRAINT "seo_suite_audit_issue_audit_run_id_seo_suite_audit_run__id_fk" FOREIGN KEY ("audit_run_id") REFERENCES "public"."seo_suite_audit_run"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_audit_issue" ADD CONSTRAINT "seo_suite_audit_issue_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_audit_page" ADD CONSTRAINT "seo_suite_audit_page_audit_run_id_seo_suite_audit_run__id_fk" FOREIGN KEY ("audit_run_id") REFERENCES "public"."seo_suite_audit_run"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_audit_page" ADD CONSTRAINT "seo_suite_audit_page_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_audit_run" ADD CONSTRAINT "seo_suite_audit_run_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_backlink_snapshot" ADD CONSTRAINT "seo_suite_backlink_snapshot_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_domain_snapshot" ADD CONSTRAINT "seo_suite_domain_snapshot_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_keyword_list" ADD CONSTRAINT "seo_suite_keyword_list_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_project" ADD CONSTRAINT "seo_suite_project_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_project" ADD CONSTRAINT "seo_suite_project_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_prompt_run" ADD CONSTRAINT "seo_suite_prompt_run_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_rank_keyword" ADD CONSTRAINT "seo_suite_rank_keyword_tracker_id_seo_suite_rank_tracker__id_fk" FOREIGN KEY ("tracker_id") REFERENCES "public"."seo_suite_rank_tracker"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_rank_keyword" ADD CONSTRAINT "seo_suite_rank_keyword_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_rank_result" ADD CONSTRAINT "seo_suite_rank_result_rank_keyword_id_seo_suite_rank_keyword__id_fk" FOREIGN KEY ("rank_keyword_id") REFERENCES "public"."seo_suite_rank_keyword"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_rank_result" ADD CONSTRAINT "seo_suite_rank_result_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_rank_tracker" ADD CONSTRAINT "seo_suite_rank_tracker_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_report_run" ADD CONSTRAINT "seo_suite_report_run_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_saved_keyword" ADD CONSTRAINT "seo_suite_saved_keyword_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_saved_keyword" ADD CONSTRAINT "seo_suite_saved_keyword_list_id_seo_suite_keyword_list__id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."seo_suite_keyword_list"("_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_serp_cache" ADD CONSTRAINT "seo_suite_serp_cache_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_tracked_prompt" ADD CONSTRAINT "seo_suite_tracked_prompt_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_vendor_usage" ADD CONSTRAINT "seo_suite_vendor_usage_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_vendor_usage" ADD CONSTRAINT "seo_suite_vendor_usage_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_vendor_usage" ADD CONSTRAINT "seo_suite_vendor_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "seo_suite_ai_entity_projectId_idx" ON "seo_suite_ai_entity" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_ai_mention_snapshot_projectId_idx" ON "seo_suite_ai_mention_snapshot" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_alert_event_projectId_idx" ON "seo_suite_alert_event" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_alert_rule_projectId_idx" ON "seo_suite_alert_rule" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_audit_issue_auditRunId_idx" ON "seo_suite_audit_issue" USING btree ("audit_run_id");--> statement-breakpoint
CREATE INDEX "seo_suite_audit_issue_projectId_idx" ON "seo_suite_audit_issue" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_audit_page_auditRunId_idx" ON "seo_suite_audit_page" USING btree ("audit_run_id");--> statement-breakpoint
CREATE INDEX "seo_suite_audit_run_projectId_idx" ON "seo_suite_audit_run" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_audit_run_status_idx" ON "seo_suite_audit_run" USING btree ("status");--> statement-breakpoint
CREATE INDEX "seo_suite_backlink_snapshot_projectId_idx" ON "seo_suite_backlink_snapshot" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_domain_snapshot_projectId_idx" ON "seo_suite_domain_snapshot" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_keyword_list_projectId_idx" ON "seo_suite_keyword_list" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_project_createdById_idx" ON "seo_suite_project" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "seo_suite_project_teamId_idx" ON "seo_suite_project" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "seo_suite_project_primaryDomain_idx" ON "seo_suite_project" USING btree ("primary_domain");--> statement-breakpoint
CREATE INDEX "seo_suite_project_createdAt_idx" ON "seo_suite_project" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "seo_suite_prompt_run_projectId_idx" ON "seo_suite_prompt_run" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_rank_keyword_trackerId_idx" ON "seo_suite_rank_keyword" USING btree ("tracker_id");--> statement-breakpoint
CREATE INDEX "seo_suite_rank_keyword_projectId_idx" ON "seo_suite_rank_keyword" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_rank_result_rankKeywordId_idx" ON "seo_suite_rank_result" USING btree ("rank_keyword_id");--> statement-breakpoint
CREATE INDEX "seo_suite_rank_result_projectId_checkedAt_idx" ON "seo_suite_rank_result" USING btree ("project_id","checked_at");--> statement-breakpoint
CREATE INDEX "seo_suite_rank_tracker_projectId_idx" ON "seo_suite_rank_tracker" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_report_run_projectId_idx" ON "seo_suite_report_run" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_saved_keyword_projectId_idx" ON "seo_suite_saved_keyword" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_saved_keyword_listId_idx" ON "seo_suite_saved_keyword" USING btree ("list_id");--> statement-breakpoint
CREATE INDEX "seo_suite_saved_keyword_keyword_idx" ON "seo_suite_saved_keyword" USING btree ("keyword");--> statement-breakpoint
CREATE INDEX "seo_suite_serp_cache_cacheKey_idx" ON "seo_suite_serp_cache" USING btree ("cache_key");--> statement-breakpoint
CREATE INDEX "seo_suite_serp_cache_expiresAt_idx" ON "seo_suite_serp_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "seo_suite_tracked_prompt_projectId_idx" ON "seo_suite_tracked_prompt" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_vendor_usage_projectId_idx" ON "seo_suite_vendor_usage" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_vendor_usage_createdAt_idx" ON "seo_suite_vendor_usage" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "seo_suite_vendor_usage_api_idx" ON "seo_suite_vendor_usage" USING btree ("api");