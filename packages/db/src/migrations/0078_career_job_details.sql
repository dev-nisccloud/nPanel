ALTER TABLE "career_opening" ADD COLUMN IF NOT EXISTS "responsibilities" text;
--> statement-breakpoint
ALTER TABLE "career_opening" ADD COLUMN IF NOT EXISTS "requirements" text;
--> statement-breakpoint
ALTER TABLE "career_opening" ADD COLUMN IF NOT EXISTS "nice_to_have" text;
--> statement-breakpoint
ALTER TABLE "career_opening" ADD COLUMN IF NOT EXISTS "salary_range" text;
--> statement-breakpoint
ALTER TABLE "career_application" ADD COLUMN IF NOT EXISTS "phone" text;
--> statement-breakpoint
ALTER TABLE "career_application" ADD COLUMN IF NOT EXISTS "available_from" date;
