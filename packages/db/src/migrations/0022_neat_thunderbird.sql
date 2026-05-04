ALTER TABLE "email_builder_design" ADD COLUMN "is_ai_generated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "email_builder_design" ADD COLUMN "ai_status" text DEFAULT 'IDLE' NOT NULL;--> statement-breakpoint
ALTER TABLE "email_builder_design" ADD COLUMN "ai_context" jsonb;