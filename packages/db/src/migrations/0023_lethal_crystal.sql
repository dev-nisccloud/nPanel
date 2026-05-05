CREATE TABLE "meta_ads_campaign_analysis" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"internal_campaign_id" text,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'PROCESSING' NOT NULL,
	"analysis" text,
	"error_message" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meta_ads_campaign_analysis" ADD CONSTRAINT "meta_ads_campaign_analysis_internal_campaign_id_meta_ads_campaign_id_fk" FOREIGN KEY ("internal_campaign_id") REFERENCES "public"."meta_ads_campaign"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_ads_campaign_analysis" ADD CONSTRAINT "meta_ads_campaign_analysis_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meta_ads_campaign_analysis_campaignId_idx" ON "meta_ads_campaign_analysis" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "meta_ads_campaign_analysis_userId_idx" ON "meta_ads_campaign_analysis" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "meta_ads_campaign_analysis_status_idx" ON "meta_ads_campaign_analysis" USING btree ("status");