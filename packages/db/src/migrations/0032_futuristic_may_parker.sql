ALTER TABLE "creative_asset_ai_analysis" ADD COLUMN "overall_rating_scale_max" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "creative_asset_ai_analysis" ADD COLUMN "overall_rating_value" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "creative_asset_ai_analysis" ADD COLUMN "overall_rating_reason" text;--> statement-breakpoint
ALTER TABLE "creative_asset_ai_analysis" ADD COLUMN "overall_rating_band" text;--> statement-breakpoint
ALTER TABLE "creative_asset_ai_analysis" ADD COLUMN "confidence_score" numeric(5, 4);--> statement-breakpoint
ALTER TABLE "creative_asset_ai_analysis" ADD COLUMN "processing_started_at" timestamp;--> statement-breakpoint
CREATE INDEX "creative_asset_ai_analysis_asset_rating_idx" ON "creative_asset_ai_analysis" USING btree ("creative_asset_id","overall_rating_value");