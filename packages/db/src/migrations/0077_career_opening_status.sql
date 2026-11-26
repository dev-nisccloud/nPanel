ALTER TABLE "career_opening" ADD COLUMN IF NOT EXISTS "status" text;
--> statement-breakpoint
UPDATE "career_opening"
SET "status" = CASE
	WHEN "published" IS NOT TRUE THEN 'draft'
	WHEN "opens_on" IS NOT NULL AND "opens_on"::date > CURRENT_DATE THEN 'scheduled'
	WHEN "closes_on" IS NOT NULL AND "closes_on"::date < CURRENT_DATE THEN 'closed'
	ELSE 'published'
END
WHERE "status" IS NULL OR "status" = '';
--> statement-breakpoint
ALTER TABLE "career_opening" ALTER COLUMN "status" SET DEFAULT 'draft';
--> statement-breakpoint
ALTER TABLE "career_opening" ALTER COLUMN "status" SET NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "career_opening" ADD CONSTRAINT "career_opening_status_check" CHECK ("status" in ('draft', 'scheduled', 'published', 'closed'));
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
