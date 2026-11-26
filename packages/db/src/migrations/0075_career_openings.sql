CREATE TABLE IF NOT EXISTS "career_opening" (
	"_id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"location" text NOT NULL,
	"employment_type" text NOT NULL,
	"summary" text NOT NULL,
	"description" text NOT NULL,
	"apply_email" text DEFAULT 'sales@nisccloud.com' NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"opens_on" timestamp,
	"closes_on" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "career_opening_slug_unique" ON "career_opening" USING btree ("slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "career_opening_published_idx" ON "career_opening" USING btree ("published");
