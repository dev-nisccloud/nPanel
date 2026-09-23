CREATE TABLE "pagespeed_insight_cache" (
	"id" text PRIMARY KEY NOT NULL,
	"site_url" text NOT NULL,
	"desktop" jsonb,
	"mobile" jsonb,
	"captured_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "pagespeed_insight_cache_siteUrl_uidx" ON "pagespeed_insight_cache" USING btree ("site_url");