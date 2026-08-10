CREATE TABLE "zeepo_ai_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text,
	"user_id" text NOT NULL,
	"team_id" text,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zeepo_ai_attachment" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"message_id" text,
	"user_id" text NOT NULL,
	"url" text NOT NULL,
	"storage_key" text,
	"name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zeepo_ai_generation" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"message_id" text,
	"user_id" text NOT NULL,
	"team_id" text,
	"kind" text NOT NULL,
	"provider" text NOT NULL,
	"model_id" text NOT NULL,
	"status" text DEFAULT 'QUEUED' NOT NULL,
	"qstash_message_id" text,
	"provider_request_id" text,
	"parent_generation_id" text,
	"tokens_debited" text,
	"provider_cost_usd_micros" integer,
	"prompt" text,
	"inputs" jsonb,
	"outputs" jsonb,
	"error_message" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "zeepo_ai_image_edit_history" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"generation_id" text NOT NULL,
	"parent_id" text,
	"user_id" text NOT NULL,
	"image_url" text NOT NULL,
	"operation_type" text DEFAULT 'instruction' NOT NULL,
	"label" text,
	"prompt" text,
	"provider" text,
	"model_id" text,
	"provider_request_id" text,
	"tokens_debited" text,
	"provider_cost_usd_micros" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zeepo_ai_message" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text,
	"reasoning" text,
	"tool_calls" jsonb,
	"tool_call_id" text,
	"status" text DEFAULT 'complete' NOT NULL,
	"input_tokens" integer,
	"output_tokens" integer,
	"cache_read_tokens" integer,
	"cache_write_tokens" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zeepo_ai_session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text,
	"title" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zeepo_ai_token_ledger" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"session_id" text,
	"subscription_usage_id" text,
	"usage_event_id" text,
	"direction" text NOT NULL,
	"tokens" text NOT NULL,
	"balance_before" text NOT NULL,
	"balance_after" text NOT NULL,
	"operation_type" text NOT NULL,
	"description" text,
	"provider_cost_usd_micros" integer,
	"provider_request_id" text,
	"model_id" text,
	"provider" text,
	"generation_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zeepo_ai_tool_invocation" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"message_id" text,
	"user_id" text NOT NULL,
	"team_id" text,
	"tool_name" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"args" jsonb,
	"result" jsonb,
	"error_message" text,
	"duration_ms" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "zeepo_ai_usage_event" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text,
	"user_id" text NOT NULL,
	"session_id" text,
	"message_id" text,
	"generation_id" text,
	"tool_invocation_id" text,
	"event_type" text NOT NULL,
	"provider" text,
	"model_id" text,
	"kind" text,
	"status" text DEFAULT 'succeeded' NOT NULL,
	"tokens_debited" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"provider_cost_usd_micros" integer,
	"latency_ms" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "zeepo_ai_activity_log" ADD CONSTRAINT "zeepo_ai_activity_log_session_id_zeepo_ai_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."zeepo_ai_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_ai_activity_log" ADD CONSTRAINT "zeepo_ai_activity_log_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_ai_attachment" ADD CONSTRAINT "zeepo_ai_attachment_session_id_zeepo_ai_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."zeepo_ai_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_ai_attachment" ADD CONSTRAINT "zeepo_ai_attachment_message_id_zeepo_ai_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."zeepo_ai_message"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_ai_attachment" ADD CONSTRAINT "zeepo_ai_attachment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_ai_generation" ADD CONSTRAINT "zeepo_ai_generation_session_id_zeepo_ai_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."zeepo_ai_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_ai_generation" ADD CONSTRAINT "zeepo_ai_generation_message_id_zeepo_ai_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."zeepo_ai_message"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_ai_generation" ADD CONSTRAINT "zeepo_ai_generation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_ai_generation" ADD CONSTRAINT "zeepo_ai_generation_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_ai_image_edit_history" ADD CONSTRAINT "zeepo_ai_image_edit_history_session_id_zeepo_ai_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."zeepo_ai_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_ai_image_edit_history" ADD CONSTRAINT "zeepo_ai_image_edit_history_generation_id_zeepo_ai_generation_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."zeepo_ai_generation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_ai_image_edit_history" ADD CONSTRAINT "zeepo_ai_image_edit_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_ai_message" ADD CONSTRAINT "zeepo_ai_message_session_id_zeepo_ai_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."zeepo_ai_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_ai_session" ADD CONSTRAINT "zeepo_ai_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_ai_session" ADD CONSTRAINT "zeepo_ai_session_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_ai_token_ledger" ADD CONSTRAINT "zeepo_ai_token_ledger_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_ai_token_ledger" ADD CONSTRAINT "zeepo_ai_token_ledger_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_ai_token_ledger" ADD CONSTRAINT "zeepo_ai_token_ledger_session_id_zeepo_ai_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."zeepo_ai_session"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_ai_token_ledger" ADD CONSTRAINT "zeepo_ai_token_ledger_subscription_usage_id_nisc_client_subscription_usage_id_fk" FOREIGN KEY ("subscription_usage_id") REFERENCES "public"."nisc_client_subscription_usage"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_ai_token_ledger" ADD CONSTRAINT "zeepo_ai_token_ledger_usage_event_id_zeepo_ai_usage_event_id_fk" FOREIGN KEY ("usage_event_id") REFERENCES "public"."zeepo_ai_usage_event"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_ai_token_ledger" ADD CONSTRAINT "zeepo_ai_token_ledger_generation_id_zeepo_ai_generation_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."zeepo_ai_generation"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_ai_tool_invocation" ADD CONSTRAINT "zeepo_ai_tool_invocation_session_id_zeepo_ai_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."zeepo_ai_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_ai_tool_invocation" ADD CONSTRAINT "zeepo_ai_tool_invocation_message_id_zeepo_ai_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."zeepo_ai_message"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_ai_tool_invocation" ADD CONSTRAINT "zeepo_ai_tool_invocation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_ai_tool_invocation" ADD CONSTRAINT "zeepo_ai_tool_invocation_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_ai_usage_event" ADD CONSTRAINT "zeepo_ai_usage_event_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_ai_usage_event" ADD CONSTRAINT "zeepo_ai_usage_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_ai_usage_event" ADD CONSTRAINT "zeepo_ai_usage_event_session_id_zeepo_ai_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."zeepo_ai_session"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_ai_usage_event" ADD CONSTRAINT "zeepo_ai_usage_event_message_id_zeepo_ai_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."zeepo_ai_message"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_ai_usage_event" ADD CONSTRAINT "zeepo_ai_usage_event_generation_id_zeepo_ai_generation_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."zeepo_ai_generation"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_ai_usage_event" ADD CONSTRAINT "zeepo_ai_usage_event_tool_invocation_id_zeepo_ai_tool_invocation_id_fk" FOREIGN KEY ("tool_invocation_id") REFERENCES "public"."zeepo_ai_tool_invocation"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "zeepo_ai_activity_log_sessionId_idx" ON "zeepo_ai_activity_log" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "zeepo_ai_activity_log_userId_idx" ON "zeepo_ai_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "zeepo_ai_activity_log_teamId_idx" ON "zeepo_ai_activity_log" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "zeepo_ai_activity_log_action_idx" ON "zeepo_ai_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "zeepo_ai_activity_log_createdAt_idx" ON "zeepo_ai_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "zeepo_ai_attachment_sessionId_idx" ON "zeepo_ai_attachment" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "zeepo_ai_attachment_messageId_idx" ON "zeepo_ai_attachment" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "zeepo_ai_attachment_userId_idx" ON "zeepo_ai_attachment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "zeepo_ai_attachment_createdAt_idx" ON "zeepo_ai_attachment" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "zeepo_ai_generation_sessionId_idx" ON "zeepo_ai_generation" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "zeepo_ai_generation_messageId_idx" ON "zeepo_ai_generation" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "zeepo_ai_generation_userId_idx" ON "zeepo_ai_generation" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "zeepo_ai_generation_teamId_idx" ON "zeepo_ai_generation" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "zeepo_ai_generation_kind_idx" ON "zeepo_ai_generation" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "zeepo_ai_generation_provider_idx" ON "zeepo_ai_generation" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "zeepo_ai_generation_status_idx" ON "zeepo_ai_generation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "zeepo_ai_generation_providerRequestId_idx" ON "zeepo_ai_generation" USING btree ("provider_request_id");--> statement-breakpoint
CREATE INDEX "zeepo_ai_generation_parentGenerationId_idx" ON "zeepo_ai_generation" USING btree ("parent_generation_id");--> statement-breakpoint
CREATE INDEX "zeepo_ai_generation_createdAt_idx" ON "zeepo_ai_generation" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "zeepo_ai_image_edit_history_sessionId_idx" ON "zeepo_ai_image_edit_history" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "zeepo_ai_image_edit_history_generationId_idx" ON "zeepo_ai_image_edit_history" USING btree ("generation_id");--> statement-breakpoint
CREATE INDEX "zeepo_ai_image_edit_history_userId_idx" ON "zeepo_ai_image_edit_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "zeepo_ai_image_edit_history_createdAt_idx" ON "zeepo_ai_image_edit_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "zeepo_ai_message_sessionId_idx" ON "zeepo_ai_message" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "zeepo_ai_message_createdAt_idx" ON "zeepo_ai_message" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "zeepo_ai_message_sessionId_createdAt_idx" ON "zeepo_ai_message" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "zeepo_ai_message_role_idx" ON "zeepo_ai_message" USING btree ("role");--> statement-breakpoint
CREATE INDEX "zeepo_ai_session_userId_idx" ON "zeepo_ai_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "zeepo_ai_session_teamId_idx" ON "zeepo_ai_session" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "zeepo_ai_session_status_idx" ON "zeepo_ai_session" USING btree ("status");--> statement-breakpoint
CREATE INDEX "zeepo_ai_session_updatedAt_idx" ON "zeepo_ai_session" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "zeepo_ai_token_ledger_teamId_idx" ON "zeepo_ai_token_ledger" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "zeepo_ai_token_ledger_userId_idx" ON "zeepo_ai_token_ledger" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "zeepo_ai_token_ledger_sessionId_idx" ON "zeepo_ai_token_ledger" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "zeepo_ai_token_ledger_operationType_idx" ON "zeepo_ai_token_ledger" USING btree ("operation_type");--> statement-breakpoint
CREATE INDEX "zeepo_ai_token_ledger_providerRequestId_idx" ON "zeepo_ai_token_ledger" USING btree ("provider_request_id");--> statement-breakpoint
CREATE INDEX "zeepo_ai_token_ledger_createdAt_idx" ON "zeepo_ai_token_ledger" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "zeepo_ai_token_ledger_teamId_createdAt_idx" ON "zeepo_ai_token_ledger" USING btree ("team_id","created_at");--> statement-breakpoint
CREATE INDEX "zeepo_ai_tool_invocation_sessionId_idx" ON "zeepo_ai_tool_invocation" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "zeepo_ai_tool_invocation_messageId_idx" ON "zeepo_ai_tool_invocation" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "zeepo_ai_tool_invocation_userId_idx" ON "zeepo_ai_tool_invocation" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "zeepo_ai_tool_invocation_toolName_idx" ON "zeepo_ai_tool_invocation" USING btree ("tool_name");--> statement-breakpoint
CREATE INDEX "zeepo_ai_tool_invocation_status_idx" ON "zeepo_ai_tool_invocation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "zeepo_ai_tool_invocation_createdAt_idx" ON "zeepo_ai_tool_invocation" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "zeepo_ai_usage_event_teamId_idx" ON "zeepo_ai_usage_event" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "zeepo_ai_usage_event_userId_idx" ON "zeepo_ai_usage_event" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "zeepo_ai_usage_event_sessionId_idx" ON "zeepo_ai_usage_event" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "zeepo_ai_usage_event_eventType_idx" ON "zeepo_ai_usage_event" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "zeepo_ai_usage_event_provider_idx" ON "zeepo_ai_usage_event" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "zeepo_ai_usage_event_kind_idx" ON "zeepo_ai_usage_event" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "zeepo_ai_usage_event_createdAt_idx" ON "zeepo_ai_usage_event" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "zeepo_ai_usage_event_teamId_createdAt_idx" ON "zeepo_ai_usage_event" USING btree ("team_id","created_at");