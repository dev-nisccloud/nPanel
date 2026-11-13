CREATE TABLE IF NOT EXISTS "career_application" (
	"_id" text PRIMARY KEY NOT NULL,
	"opening_id" text,
	"opening_title" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"country_code" text NOT NULL,
	"country_name" text NOT NULL,
	"city" text NOT NULL,
	"heard_from" text NOT NULL,
	"linkedin_url" text,
	"salary_range" text NOT NULL,
	"notes" text,
	"cv_storage_key" text NOT NULL,
	"cv_file_name" text NOT NULL,
	"cv_content_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "career_application" ADD CONSTRAINT "career_application_opening_id_career_opening__id_fk" FOREIGN KEY ("opening_id") REFERENCES "public"."career_opening"("_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "career_application_opening_id_idx" ON "career_application" USING btree ("opening_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "career_application_created_at_idx" ON "career_application" USING btree ("created_at");
