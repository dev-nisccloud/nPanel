CREATE TABLE "zeepo_agent_token_ledger" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"session_id" text,
	"subscription_usage_id" text,
	"direction" text NOT NULL,
	"tokens" text NOT NULL,
	"balance_before" text NOT NULL,
	"balance_after" text NOT NULL,
	"operation_type" text NOT NULL,
	"description" text,
	"provider_cost_usd_micros" integer,
	"prediction_id" text,
	"model_id" text,
	"generation_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "zeepo_agent_generation" ADD COLUMN "tokens_debited" text;--> statement-breakpoint
ALTER TABLE "zeepo_agent_generation" ADD COLUMN "provider_cost_usd_micros" integer;--> statement-breakpoint
ALTER TABLE "zeepo_agent_token_ledger" ADD CONSTRAINT "zeepo_agent_token_ledger_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_agent_token_ledger" ADD CONSTRAINT "zeepo_agent_token_ledger_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_agent_token_ledger" ADD CONSTRAINT "zeepo_agent_token_ledger_session_id_zeepo_agent_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."zeepo_agent_session"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_agent_token_ledger" ADD CONSTRAINT "zeepo_agent_token_ledger_subscription_usage_id_nisc_client_subscription_usage_id_fk" FOREIGN KEY ("subscription_usage_id") REFERENCES "public"."nisc_client_subscription_usage"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zeepo_agent_token_ledger" ADD CONSTRAINT "zeepo_agent_token_ledger_generation_id_zeepo_agent_generation_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."zeepo_agent_generation"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "zeepo_agent_token_ledger_teamId_idx" ON "zeepo_agent_token_ledger" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "zeepo_agent_token_ledger_userId_idx" ON "zeepo_agent_token_ledger" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "zeepo_agent_token_ledger_sessionId_idx" ON "zeepo_agent_token_ledger" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "zeepo_agent_token_ledger_operationType_idx" ON "zeepo_agent_token_ledger" USING btree ("operation_type");--> statement-breakpoint
CREATE INDEX "zeepo_agent_token_ledger_createdAt_idx" ON "zeepo_agent_token_ledger" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "zeepo_agent_token_ledger_predictionId_idx" ON "zeepo_agent_token_ledger" USING btree ("prediction_id");