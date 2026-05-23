CREATE TABLE "neb_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"design_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "neb_asset" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text,
	"design_id" text,
	"kind" text NOT NULL,
	"file_url" text NOT NULL,
	"storage_key" text,
	"mime_type" text NOT NULL,
	"width" integer,
	"height" integer,
	"alt_text" text,
	"prompt" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "neb_brand_kit" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text,
	"logo_asset_id" text,
	"colors" jsonb,
	"fonts" jsonb,
	"footer_legal" text,
	"social_links" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "neb_design" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"subject" text,
	"preheader" text,
	"html_content" text DEFAULT '' NOT NULL,
	"text_content" text,
	"thumbnail_url" text,
	"brand_kit_id" text,
	"brief" jsonb,
	"metadata" jsonb,
	"current_version_id" text,
	"ai_status" text DEFAULT 'IDLE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "neb_design_version" (
	"id" text PRIMARY KEY NOT NULL,
	"design_id" text NOT NULL,
	"version_number" integer NOT NULL,
	"html_content" text NOT NULL,
	"text_content" text,
	"change_summary" text,
	"trigger" text NOT NULL,
	"message_id" text,
	"validation_report" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "neb_generation_job" (
	"id" text PRIMARY KEY NOT NULL,
	"design_id" text NOT NULL,
	"message_id" text,
	"type" text NOT NULL,
	"status" text DEFAULT 'QUEUED' NOT NULL,
	"qstash_message_id" text,
	"input" jsonb,
	"output" jsonb,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "neb_message" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "neb_session" (
	"id" text PRIMARY KEY NOT NULL,
	"design_id" text NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "neb_activity_log" ADD CONSTRAINT "neb_activity_log_design_id_neb_design_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."neb_design"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neb_asset" ADD CONSTRAINT "neb_asset_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neb_asset" ADD CONSTRAINT "neb_asset_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neb_asset" ADD CONSTRAINT "neb_asset_design_id_neb_design_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."neb_design"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neb_brand_kit" ADD CONSTRAINT "neb_brand_kit_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neb_brand_kit" ADD CONSTRAINT "neb_brand_kit_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neb_design" ADD CONSTRAINT "neb_design_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neb_design" ADD CONSTRAINT "neb_design_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neb_design_version" ADD CONSTRAINT "neb_design_version_design_id_neb_design_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."neb_design"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neb_generation_job" ADD CONSTRAINT "neb_generation_job_design_id_neb_design_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."neb_design"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neb_message" ADD CONSTRAINT "neb_message_session_id_neb_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."neb_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neb_session" ADD CONSTRAINT "neb_session_design_id_neb_design_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."neb_design"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neb_session" ADD CONSTRAINT "neb_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neb_session" ADD CONSTRAINT "neb_session_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "neb_activity_log_designId_idx" ON "neb_activity_log" USING btree ("design_id");--> statement-breakpoint
CREATE INDEX "neb_activity_log_createdAt_idx" ON "neb_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "neb_asset_designId_idx" ON "neb_asset" USING btree ("design_id");--> statement-breakpoint
CREATE INDEX "neb_asset_userId_idx" ON "neb_asset" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "neb_brand_kit_teamId_idx" ON "neb_brand_kit" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "neb_brand_kit_userId_idx" ON "neb_brand_kit" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "neb_design_userId_idx" ON "neb_design" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "neb_design_teamId_idx" ON "neb_design" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "neb_design_updatedAt_idx" ON "neb_design" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "neb_design_status_idx" ON "neb_design" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "neb_design_version_design_version_uq" ON "neb_design_version" USING btree ("design_id","version_number");--> statement-breakpoint
CREATE INDEX "neb_design_version_designId_idx" ON "neb_design_version" USING btree ("design_id");--> statement-breakpoint
CREATE INDEX "neb_generation_job_designId_idx" ON "neb_generation_job" USING btree ("design_id");--> statement-breakpoint
CREATE INDEX "neb_generation_job_status_idx" ON "neb_generation_job" USING btree ("status");--> statement-breakpoint
CREATE INDEX "neb_message_sessionId_idx" ON "neb_message" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "neb_message_sessionId_createdAt_idx" ON "neb_message" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "neb_session_designId_uq" ON "neb_session" USING btree ("design_id");--> statement-breakpoint
CREATE INDEX "neb_session_userId_idx" ON "neb_session" USING btree ("user_id");