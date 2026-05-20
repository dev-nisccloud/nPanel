CREATE TABLE "creative_asset_ai_analysis" (
	"id" text PRIMARY KEY NOT NULL,
	"creative_asset_id" text NOT NULL,
	"creative_asset_version_id" text NOT NULL,
	"requested_by" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"model" text,
	"summary" text,
	"result" jsonb,
	"error_message" text,
	"created_at" timestamp NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "creative_asset_ai_analysis" ADD CONSTRAINT "creative_asset_ai_analysis_creative_asset_id_creative_asset_id_fk" FOREIGN KEY ("creative_asset_id") REFERENCES "public"."creative_asset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creative_asset_ai_analysis" ADD CONSTRAINT "creative_asset_ai_analysis_creative_asset_version_id_creative_asset_version_id_fk" FOREIGN KEY ("creative_asset_version_id") REFERENCES "public"."creative_asset_version"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "creative_asset_ai_analysis_creativeAssetId_idx" ON "creative_asset_ai_analysis" USING btree ("creative_asset_id");--> statement-breakpoint
CREATE INDEX "creative_asset_ai_analysis_creativeAssetVersionId_idx" ON "creative_asset_ai_analysis" USING btree ("creative_asset_version_id");--> statement-breakpoint
CREATE INDEX "creative_asset_ai_analysis_status_idx" ON "creative_asset_ai_analysis" USING btree ("status");--> statement-breakpoint
CREATE INDEX "creative_asset_ai_analysis_createdAt_idx" ON "creative_asset_ai_analysis" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "creative_asset_ai_analysis_requestedBy_idx" ON "creative_asset_ai_analysis" USING btree ("requested_by");