ALTER TABLE "neb_design" ADD COLUMN "creative_design_url" text;--> statement-breakpoint
ALTER TABLE "neb_design" ADD COLUMN "creative_design_prompt" text;--> statement-breakpoint
ALTER TABLE "neb_design" ADD COLUMN "design_plan" jsonb;--> statement-breakpoint
ALTER TABLE "neb_design" ADD COLUMN "workflow_phase" text DEFAULT 'BRIEF' NOT NULL;