CREATE TABLE "zeepo_agent_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zeepo_agent_generation" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"message_id" text,
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
CREATE TABLE "zeepo_agent_message" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text,
	"tool_calls" jsonb,
	"tool_call_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zeepo_agent_session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text,
	"title" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "zeepo_agent_activity_log" ADD CONSTRAINT "zeepo_agent_activity_log_session_id_zeepo_agent_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."zeepo_agent_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_agent_generation" ADD CONSTRAINT "zeepo_agent_generation_session_id_zeepo_agent_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."zeepo_agent_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_agent_generation" ADD CONSTRAINT "zeepo_agent_generation_message_id_zeepo_agent_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."zeepo_agent_message"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_agent_generation" ADD CONSTRAINT "zeepo_agent_generation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_agent_generation" ADD CONSTRAINT "zeepo_agent_generation_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_agent_message" ADD CONSTRAINT "zeepo_agent_message_session_id_zeepo_agent_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."zeepo_agent_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_agent_session" ADD CONSTRAINT "zeepo_agent_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_agent_session" ADD CONSTRAINT "zeepo_agent_session_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "zeepo_agent_activity_log_sessionId_idx" ON "zeepo_agent_activity_log" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "zeepo_agent_activity_log_userId_idx" ON "zeepo_agent_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "zeepo_agent_activity_log_action_idx" ON "zeepo_agent_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "zeepo_agent_activity_log_createdAt_idx" ON "zeepo_agent_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "zeepo_agent_generation_sessionId_idx" ON "zeepo_agent_generation" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "zeepo_agent_generation_userId_idx" ON "zeepo_agent_generation" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "zeepo_agent_generation_teamId_idx" ON "zeepo_agent_generation" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "zeepo_agent_generation_status_idx" ON "zeepo_agent_generation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "zeepo_agent_generation_createdAt_idx" ON "zeepo_agent_generation" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "zeepo_agent_message_sessionId_idx" ON "zeepo_agent_message" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "zeepo_agent_message_createdAt_idx" ON "zeepo_agent_message" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "zeepo_agent_message_sessionId_createdAt_idx" ON "zeepo_agent_message" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "zeepo_agent_session_userId_idx" ON "zeepo_agent_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "zeepo_agent_session_teamId_idx" ON "zeepo_agent_session" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "zeepo_agent_session_updatedAt_idx" ON "zeepo_agent_session" USING btree ("updated_at");