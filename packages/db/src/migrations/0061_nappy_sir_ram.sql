CREATE TYPE "public"."crm_activity_type" AS ENUM('call', 'email', 'meeting', 'task', 'note', 'linkedin_message', 'whatsapp', 'sms', 'custom');--> statement-breakpoint
CREATE TYPE "public"."crm_deal_stage" AS ENUM('lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost');--> statement-breakpoint
CREATE TYPE "public"."crm_entity_type" AS ENUM('contact', 'company', 'deal', 'activity', 'task');--> statement-breakpoint
CREATE TYPE "public"."crm_field_type" AS ENUM('text', 'textarea', 'number', 'decimal', 'boolean', 'date', 'datetime', 'email', 'phone', 'url', 'select', 'multiselect', 'currency', 'percentage', 'rating', 'file', 'user', 'relation');--> statement-breakpoint
CREATE TYPE "public"."crm_sync_status" AS ENUM('synced', 'pending', 'failed', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."crm_task_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."crm_task_status" AS ENUM('todo', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "crm_activity" (
	"id" text PRIMARY KEY NOT NULL,
	"activity_type" "crm_activity_type" NOT NULL,
	"subject" text NOT NULL,
	"description" text,
	"contact_id" text,
	"company_id" text,
	"deal_id" text,
	"duration" integer,
	"location" text,
	"scheduled_at" timestamp,
	"completed_at" timestamp,
	"participants" jsonb,
	"outcome" text,
	"is_completed" boolean DEFAULT false NOT NULL,
	"custom_fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ai_insights" jsonb,
	"external_id" text,
	"external_system" text,
	"external_data" jsonb,
	"sync_status" "crm_sync_status" DEFAULT 'disabled',
	"last_synced_at" timestamp,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_type" "crm_entity_type" NOT NULL,
	"entity_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"changes" jsonb,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_ai_config" (
	"id" text PRIMARY KEY NOT NULL,
	"enable_contact_enrichment" boolean DEFAULT false NOT NULL,
	"enable_deal_scoring" boolean DEFAULT false NOT NULL,
	"enable_next_best_action" boolean DEFAULT false NOT NULL,
	"enable_sentiment_analysis" boolean DEFAULT false NOT NULL,
	"enable_activity_summaries" boolean DEFAULT false NOT NULL,
	"enable_auto_tagging" boolean DEFAULT false NOT NULL,
	"model_settings" jsonb,
	"custom_prompts" jsonb,
	"updated_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_company" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"website" text,
	"industry" text,
	"size" text,
	"description" text,
	"email" text,
	"phone" text,
	"address_line1" text,
	"address_line2" text,
	"city" text,
	"state" text,
	"country" text,
	"postal_code" text,
	"linkedin_url" text,
	"twitter_url" text,
	"facebook_url" text,
	"annual_revenue" numeric(15, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"custom_fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ai_insights" jsonb,
	"external_id" text,
	"external_system" text,
	"external_data" jsonb,
	"sync_status" "crm_sync_status" DEFAULT 'disabled',
	"last_synced_at" timestamp,
	"created_by_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_company_tag" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"tag_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_contact" (
	"id" text PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"full_name" text NOT NULL,
	"title" text,
	"company_id" text,
	"email" text,
	"phone" text,
	"mobile_phone" text,
	"whatsapp" text,
	"address_line1" text,
	"address_line2" text,
	"city" text,
	"state" text,
	"country" text,
	"postal_code" text,
	"linkedin_url" text,
	"twitter_url" text,
	"facebook_url" text,
	"department" text,
	"seniority" text,
	"lead_source" text,
	"lead_status" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"custom_fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ai_insights" jsonb,
	"external_id" text,
	"external_system" text,
	"external_data" jsonb,
	"sync_status" "crm_sync_status" DEFAULT 'disabled',
	"last_synced_at" timestamp,
	"created_by_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_contact_tag" (
	"id" text PRIMARY KEY NOT NULL,
	"contact_id" text NOT NULL,
	"tag_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_custom_field_definition" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_type" "crm_entity_type" NOT NULL,
	"field_name" text NOT NULL,
	"field_label" text NOT NULL,
	"field_type" "crm_field_type" NOT NULL,
	"description" text,
	"is_required" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"field_config" jsonb,
	"ai_config" jsonb,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_deal" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"company_id" text,
	"primary_contact_id" text,
	"pipeline_id" text NOT NULL,
	"stage_id" text NOT NULL,
	"amount" numeric(15, 2),
	"currency" text DEFAULT 'KES' NOT NULL,
	"probability" integer,
	"expected_revenue" numeric(15, 2),
	"expected_close_date" timestamp,
	"actual_close_date" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_closed" boolean DEFAULT false NOT NULL,
	"is_won" boolean DEFAULT false NOT NULL,
	"lost_reason" text,
	"custom_fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ai_insights" jsonb,
	"external_id" text,
	"external_system" text,
	"external_data" jsonb,
	"sync_status" "crm_sync_status" DEFAULT 'disabled',
	"last_synced_at" timestamp,
	"created_by_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_deal_tag" (
	"id" text PRIMARY KEY NOT NULL,
	"deal_id" text NOT NULL,
	"tag_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_external_sync_config" (
	"id" text PRIMARY KEY NOT NULL,
	"system_name" text NOT NULL,
	"system_display_name" text NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"sync_direction" text DEFAULT 'bidirectional' NOT NULL,
	"credentials" jsonb,
	"sync_settings" jsonb,
	"last_synced_at" timestamp,
	"last_sync_status" text,
	"last_sync_error" text,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_note" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"contact_id" text,
	"company_id" text,
	"deal_id" text,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"ai_insights" jsonb,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_pipeline" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_pipeline_stage" (
	"id" text PRIMARY KEY NOT NULL,
	"pipeline_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"probability" integer DEFAULT 0 NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"color" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"ai_config" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_tag" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"description" text,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "crm_tag_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "crm_task" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "crm_task_status" DEFAULT 'todo' NOT NULL,
	"priority" "crm_task_priority" DEFAULT 'medium' NOT NULL,
	"contact_id" text,
	"company_id" text,
	"deal_id" text,
	"assigned_to_id" text NOT NULL,
	"due_date" timestamp,
	"completed_at" timestamp,
	"reminder_at" timestamp,
	"reminder_sent" boolean DEFAULT false NOT NULL,
	"custom_fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ai_suggestions" jsonb,
	"external_id" text,
	"external_system" text,
	"external_data" jsonb,
	"sync_status" "crm_sync_status" DEFAULT 'disabled',
	"last_synced_at" timestamp,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "crm_activity" ADD CONSTRAINT "crm_activity_contact_id_crm_contact_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."crm_contact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_activity" ADD CONSTRAINT "crm_activity_company_id_crm_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."crm_company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_activity" ADD CONSTRAINT "crm_activity_deal_id_crm_deal_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."crm_deal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_activity" ADD CONSTRAINT "crm_activity_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_activity_log" ADD CONSTRAINT "crm_activity_log_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_ai_config" ADD CONSTRAINT "crm_ai_config_updated_by_id_user_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_company" ADD CONSTRAINT "crm_company_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_company" ADD CONSTRAINT "crm_company_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_company_tag" ADD CONSTRAINT "crm_company_tag_company_id_crm_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."crm_company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_company_tag" ADD CONSTRAINT "crm_company_tag_tag_id_crm_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."crm_tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_contact" ADD CONSTRAINT "crm_contact_company_id_crm_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."crm_company"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_contact" ADD CONSTRAINT "crm_contact_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_contact" ADD CONSTRAINT "crm_contact_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_contact_tag" ADD CONSTRAINT "crm_contact_tag_contact_id_crm_contact_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."crm_contact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_contact_tag" ADD CONSTRAINT "crm_contact_tag_tag_id_crm_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."crm_tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_custom_field_definition" ADD CONSTRAINT "crm_custom_field_definition_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deal" ADD CONSTRAINT "crm_deal_company_id_crm_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."crm_company"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deal" ADD CONSTRAINT "crm_deal_primary_contact_id_crm_contact_id_fk" FOREIGN KEY ("primary_contact_id") REFERENCES "public"."crm_contact"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deal" ADD CONSTRAINT "crm_deal_pipeline_id_crm_pipeline_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "public"."crm_pipeline"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deal" ADD CONSTRAINT "crm_deal_stage_id_crm_pipeline_stage_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."crm_pipeline_stage"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deal" ADD CONSTRAINT "crm_deal_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deal" ADD CONSTRAINT "crm_deal_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deal_tag" ADD CONSTRAINT "crm_deal_tag_deal_id_crm_deal_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."crm_deal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deal_tag" ADD CONSTRAINT "crm_deal_tag_tag_id_crm_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."crm_tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_external_sync_config" ADD CONSTRAINT "crm_external_sync_config_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_note" ADD CONSTRAINT "crm_note_contact_id_crm_contact_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."crm_contact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_note" ADD CONSTRAINT "crm_note_company_id_crm_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."crm_company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_note" ADD CONSTRAINT "crm_note_deal_id_crm_deal_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."crm_deal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_note" ADD CONSTRAINT "crm_note_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_pipeline" ADD CONSTRAINT "crm_pipeline_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_pipeline_stage" ADD CONSTRAINT "crm_pipeline_stage_pipeline_id_crm_pipeline_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "public"."crm_pipeline"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_tag" ADD CONSTRAINT "crm_tag_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_task" ADD CONSTRAINT "crm_task_contact_id_crm_contact_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."crm_contact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_task" ADD CONSTRAINT "crm_task_company_id_crm_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."crm_company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_task" ADD CONSTRAINT "crm_task_deal_id_crm_deal_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."crm_deal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_task" ADD CONSTRAINT "crm_task_assigned_to_id_user_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_task" ADD CONSTRAINT "crm_task_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "crm_activity_contact_id_idx" ON "crm_activity" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "crm_activity_company_id_idx" ON "crm_activity" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "crm_activity_deal_id_idx" ON "crm_activity" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "crm_activity_activity_type_idx" ON "crm_activity" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "crm_activity_scheduled_at_idx" ON "crm_activity" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "crm_activity_is_completed_idx" ON "crm_activity" USING btree ("is_completed");--> statement-breakpoint
CREATE INDEX "crm_activity_created_by_id_idx" ON "crm_activity" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "crm_activity_external_id_idx" ON "crm_activity" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "crm_activity_sync_status_idx" ON "crm_activity" USING btree ("sync_status");--> statement-breakpoint
CREATE INDEX "crm_activity_log_entity_type_idx" ON "crm_activity_log" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "crm_activity_log_entity_id_idx" ON "crm_activity_log" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "crm_activity_log_action_idx" ON "crm_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "crm_activity_log_created_by_id_idx" ON "crm_activity_log" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "crm_activity_log_created_at_idx" ON "crm_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "crm_company_name_idx" ON "crm_company" USING btree ("name");--> statement-breakpoint
CREATE INDEX "crm_company_owner_id_idx" ON "crm_company" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "crm_company_is_active_idx" ON "crm_company" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "crm_company_external_id_idx" ON "crm_company" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "crm_company_sync_status_idx" ON "crm_company" USING btree ("sync_status");--> statement-breakpoint
CREATE UNIQUE INDEX "crm_company_tag_company_id_tag_id_unique" ON "crm_company_tag" USING btree ("company_id","tag_id");--> statement-breakpoint
CREATE INDEX "crm_company_tag_company_id_idx" ON "crm_company_tag" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "crm_company_tag_tag_id_idx" ON "crm_company_tag" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "crm_contact_full_name_idx" ON "crm_contact" USING btree ("full_name");--> statement-breakpoint
CREATE INDEX "crm_contact_email_idx" ON "crm_contact" USING btree ("email");--> statement-breakpoint
CREATE INDEX "crm_contact_company_id_idx" ON "crm_contact" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "crm_contact_owner_id_idx" ON "crm_contact" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "crm_contact_is_active_idx" ON "crm_contact" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "crm_contact_lead_status_idx" ON "crm_contact" USING btree ("lead_status");--> statement-breakpoint
CREATE INDEX "crm_contact_external_id_idx" ON "crm_contact" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "crm_contact_sync_status_idx" ON "crm_contact" USING btree ("sync_status");--> statement-breakpoint
CREATE UNIQUE INDEX "crm_contact_tag_contact_id_tag_id_unique" ON "crm_contact_tag" USING btree ("contact_id","tag_id");--> statement-breakpoint
CREATE INDEX "crm_contact_tag_contact_id_idx" ON "crm_contact_tag" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "crm_contact_tag_tag_id_idx" ON "crm_contact_tag" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "crm_custom_field_definition_entity_name_unique" ON "crm_custom_field_definition" USING btree ("entity_type","field_name");--> statement-breakpoint
CREATE INDEX "crm_custom_field_definition_entity_type_idx" ON "crm_custom_field_definition" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "crm_custom_field_definition_is_active_idx" ON "crm_custom_field_definition" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "crm_deal_name_idx" ON "crm_deal" USING btree ("name");--> statement-breakpoint
CREATE INDEX "crm_deal_company_id_idx" ON "crm_deal" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "crm_deal_primary_contact_id_idx" ON "crm_deal" USING btree ("primary_contact_id");--> statement-breakpoint
CREATE INDEX "crm_deal_pipeline_id_idx" ON "crm_deal" USING btree ("pipeline_id");--> statement-breakpoint
CREATE INDEX "crm_deal_stage_id_idx" ON "crm_deal" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "crm_deal_owner_id_idx" ON "crm_deal" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "crm_deal_is_active_idx" ON "crm_deal" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "crm_deal_is_closed_idx" ON "crm_deal" USING btree ("is_closed");--> statement-breakpoint
CREATE INDEX "crm_deal_expected_close_date_idx" ON "crm_deal" USING btree ("expected_close_date");--> statement-breakpoint
CREATE INDEX "crm_deal_external_id_idx" ON "crm_deal" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "crm_deal_sync_status_idx" ON "crm_deal" USING btree ("sync_status");--> statement-breakpoint
CREATE UNIQUE INDEX "crm_deal_tag_deal_id_tag_id_unique" ON "crm_deal_tag" USING btree ("deal_id","tag_id");--> statement-breakpoint
CREATE INDEX "crm_deal_tag_deal_id_idx" ON "crm_deal_tag" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "crm_deal_tag_tag_id_idx" ON "crm_deal_tag" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "crm_external_sync_config_system_name_unique" ON "crm_external_sync_config" USING btree ("system_name");--> statement-breakpoint
CREATE INDEX "crm_external_sync_config_is_active_idx" ON "crm_external_sync_config" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "crm_note_contact_id_idx" ON "crm_note" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "crm_note_company_id_idx" ON "crm_note" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "crm_note_deal_id_idx" ON "crm_note" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "crm_note_created_by_id_idx" ON "crm_note" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "crm_note_is_pinned_idx" ON "crm_note" USING btree ("is_pinned");--> statement-breakpoint
CREATE INDEX "crm_pipeline_is_active_idx" ON "crm_pipeline" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "crm_pipeline_is_default_idx" ON "crm_pipeline" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "crm_pipeline_stage_pipeline_id_idx" ON "crm_pipeline_stage" USING btree ("pipeline_id");--> statement-breakpoint
CREATE INDEX "crm_pipeline_stage_is_active_idx" ON "crm_pipeline_stage" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "crm_tag_name_idx" ON "crm_tag" USING btree ("name");--> statement-breakpoint
CREATE INDEX "crm_task_contact_id_idx" ON "crm_task" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "crm_task_company_id_idx" ON "crm_task" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "crm_task_deal_id_idx" ON "crm_task" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "crm_task_assigned_to_id_idx" ON "crm_task" USING btree ("assigned_to_id");--> statement-breakpoint
CREATE INDEX "crm_task_status_idx" ON "crm_task" USING btree ("status");--> statement-breakpoint
CREATE INDEX "crm_task_priority_idx" ON "crm_task" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "crm_task_due_date_idx" ON "crm_task" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "crm_task_created_by_id_idx" ON "crm_task" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "crm_task_external_id_idx" ON "crm_task" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "crm_task_sync_status_idx" ON "crm_task" USING btree ("sync_status");