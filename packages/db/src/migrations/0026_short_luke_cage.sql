CREATE TABLE "zeepo_agent_image_edit_history" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"generation_id" text NOT NULL,
	"parent_id" text,
	"user_id" text NOT NULL,
	"image_url" text NOT NULL,
	"operation_type" text DEFAULT 'instruction' NOT NULL,
	"label" text,
	"prompt" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "zeepo_agent_image_edit_history" ADD CONSTRAINT "zeepo_agent_image_edit_history_session_id_zeepo_agent_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."zeepo_agent_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_agent_image_edit_history" ADD CONSTRAINT "zeepo_agent_image_edit_history_generation_id_zeepo_agent_generation_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."zeepo_agent_generation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_agent_image_edit_history" ADD CONSTRAINT "zeepo_agent_image_edit_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "zeepo_agent_image_edit_history_sessionId_idx" ON "zeepo_agent_image_edit_history" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "zeepo_agent_image_edit_history_generationId_idx" ON "zeepo_agent_image_edit_history" USING btree ("generation_id");--> statement-breakpoint
CREATE INDEX "zeepo_agent_image_edit_history_userId_idx" ON "zeepo_agent_image_edit_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "zeepo_agent_image_edit_history_createdAt_idx" ON "zeepo_agent_image_edit_history" USING btree ("created_at");