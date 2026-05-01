CREATE TABLE "zeepo_canvas_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zeepo_canvas_generation" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"node_id" text NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text,
	"model_category" text NOT NULL,
	"model_id" text NOT NULL,
	"status" text DEFAULT 'QUEUED' NOT NULL,
	"qstash_message_id" text,
	"prediction_id" text,
	"prompt" text,
	"inputs" jsonb,
	"outputs" jsonb,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "zeepo_canvas_project" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text DEFAULT 'Untitled Canvas' NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text,
	"canvas_json" jsonb DEFAULT '{"nodes":[],"edges":[]}' NOT NULL,
	"width" integer DEFAULT 1200 NOT NULL,
	"height" integer DEFAULT 800 NOT NULL,
	"thumbnail_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "zeepo_canvas_activity_log" ADD CONSTRAINT "zeepo_canvas_activity_log_project_id_zeepo_canvas_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."zeepo_canvas_project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_canvas_generation" ADD CONSTRAINT "zeepo_canvas_generation_project_id_zeepo_canvas_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."zeepo_canvas_project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_canvas_generation" ADD CONSTRAINT "zeepo_canvas_generation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_canvas_generation" ADD CONSTRAINT "zeepo_canvas_generation_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_canvas_project" ADD CONSTRAINT "zeepo_canvas_project_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_canvas_project" ADD CONSTRAINT "zeepo_canvas_project_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "zeepo_canvas_activity_log_projectId_idx" ON "zeepo_canvas_activity_log" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "zeepo_canvas_activity_log_userId_idx" ON "zeepo_canvas_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "zeepo_canvas_activity_log_action_idx" ON "zeepo_canvas_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "zeepo_canvas_activity_log_createdAt_idx" ON "zeepo_canvas_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "zeepo_canvas_generation_projectId_idx" ON "zeepo_canvas_generation" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "zeepo_canvas_generation_userId_idx" ON "zeepo_canvas_generation" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "zeepo_canvas_generation_teamId_idx" ON "zeepo_canvas_generation" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "zeepo_canvas_generation_status_idx" ON "zeepo_canvas_generation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "zeepo_canvas_generation_createdAt_idx" ON "zeepo_canvas_generation" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "zeepo_canvas_project_userId_idx" ON "zeepo_canvas_project" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "zeepo_canvas_project_teamId_idx" ON "zeepo_canvas_project" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "zeepo_canvas_project_updatedAt_idx" ON "zeepo_canvas_project" USING btree ("updated_at");