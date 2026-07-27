CREATE TABLE "seo_suite_anchor_distribution" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"target" text NOT NULL,
	"anchor_text" text NOT NULL,
	"count" integer NOT NULL,
	"percentage" double precision,
	"type" text,
	"captured_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_anomaly" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"metric_type" text NOT NULL,
	"metric" text NOT NULL,
	"change_percent" double precision,
	"change_absolute" integer,
	"previous_value" integer,
	"current_value" integer,
	"severity" text,
	"acknowledged" integer DEFAULT 0 NOT NULL,
	"detected_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_app_data" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"app_id" text NOT NULL,
	"platform" text NOT NULL,
	"app_name" text,
	"rating" double precision,
	"reviews" integer,
	"installs" integer,
	"keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"payload" jsonb,
	"captured_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_budget_alert" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"monthly_budget" double precision NOT NULL,
	"current_spend" double precision DEFAULT 0 NOT NULL,
	"alert_threshold" double precision DEFAULT 0.8 NOT NULL,
	"alert_sent" integer DEFAULT 0 NOT NULL,
	"enabled" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_competitor_snapshot" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"competitor_domain" text NOT NULL,
	"organic_traffic" integer,
	"organic_keywords" integer,
	"paid_traffic" integer,
	"paid_keywords" integer,
	"top_pages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"top_keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"payload" jsonb,
	"captured_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_content_brief" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"keyword" text NOT NULL,
	"target_url" text,
	"word_count" integer,
	"headings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"related_keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"top_competitors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_content_gap" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"keyword" text NOT NULL,
	"competitor_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"search_volume" integer,
	"difficulty" integer,
	"intent" text,
	"opportunity" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_historical_backlink" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"target" text NOT NULL,
	"total_backlinks" integer,
	"referring_domains" integer,
	"new_backlinks" integer,
	"lost_backlinks" integer,
	"captured_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_historical_rank" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"target" text NOT NULL,
	"keyword" text NOT NULL,
	"position" integer,
	"search_volume" integer,
	"traffic" integer,
	"captured_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_historical_traffic" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"target" text NOT NULL,
	"organic_traffic" integer,
	"organic_keywords" integer,
	"paid_traffic" integer,
	"paid_keywords" integer,
	"captured_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_keyword_cluster" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"name" text NOT NULL,
	"primary_keyword" text NOT NULL,
	"keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"search_volume_total" integer,
	"avg_difficulty" double precision,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_keyword_intent" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"keyword" text NOT NULL,
	"intent" text NOT NULL,
	"intent_probability" double precision,
	"difficulty" integer,
	"search_volume" integer,
	"cpc" double precision,
	"competition" double precision,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_link_velocity" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"target" text NOT NULL,
	"new_links" integer,
	"lost_links" integer,
	"net_change" integer,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"captured_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_local_pack_tracking" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"keyword" text NOT NULL,
	"business_name" text,
	"position" integer,
	"rating" double precision,
	"reviews" integer,
	"captured_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_mobile_rank" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"keyword" text NOT NULL,
	"mobile_position" integer,
	"desktop_position" integer,
	"difference" integer,
	"captured_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_page_tracking" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"url" text NOT NULL,
	"keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"traffic" integer,
	"last_crawled" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_product_listing" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"product_id" text NOT NULL,
	"platform" text NOT NULL,
	"product_name" text,
	"price" double precision,
	"rating" double precision,
	"reviews" integer,
	"position" integer,
	"impressions" integer,
	"clicks" integer,
	"payload" jsonb,
	"captured_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_recommendation" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"impact" text,
	"effort" text,
	"priority" integer,
	"action_url" text,
	"metadata" jsonb,
	"dismissed" integer DEFAULT 0 NOT NULL,
	"completed" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_review_sentiment" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"source" text NOT NULL,
	"rating" double precision,
	"sentiment" text,
	"sentiment_score" double precision,
	"review_text" text,
	"review_date" timestamp,
	"captured_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_subdomain" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"subdomain" text NOT NULL,
	"organic_traffic" integer,
	"organic_keywords" integer,
	"payload" jsonb,
	"captured_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_toxic_link" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"source_url" text NOT NULL,
	"source_domain" text NOT NULL,
	"target_url" text NOT NULL,
	"toxic_score" integer,
	"reason" text,
	"anchor_text" text,
	"disavowed" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_suite_trending_keyword" (
	"_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"keyword" text NOT NULL,
	"search_volume" integer,
	"growth_percent" double precision,
	"category" text,
	"payload" jsonb,
	"captured_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "seo_suite_anchor_distribution" ADD CONSTRAINT "seo_suite_anchor_distribution_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_anomaly" ADD CONSTRAINT "seo_suite_anomaly_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_app_data" ADD CONSTRAINT "seo_suite_app_data_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_budget_alert" ADD CONSTRAINT "seo_suite_budget_alert_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_competitor_snapshot" ADD CONSTRAINT "seo_suite_competitor_snapshot_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_content_brief" ADD CONSTRAINT "seo_suite_content_brief_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_content_gap" ADD CONSTRAINT "seo_suite_content_gap_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_historical_backlink" ADD CONSTRAINT "seo_suite_historical_backlink_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_historical_rank" ADD CONSTRAINT "seo_suite_historical_rank_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_historical_traffic" ADD CONSTRAINT "seo_suite_historical_traffic_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_keyword_cluster" ADD CONSTRAINT "seo_suite_keyword_cluster_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_keyword_intent" ADD CONSTRAINT "seo_suite_keyword_intent_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_link_velocity" ADD CONSTRAINT "seo_suite_link_velocity_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_local_pack_tracking" ADD CONSTRAINT "seo_suite_local_pack_tracking_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_mobile_rank" ADD CONSTRAINT "seo_suite_mobile_rank_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_page_tracking" ADD CONSTRAINT "seo_suite_page_tracking_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_product_listing" ADD CONSTRAINT "seo_suite_product_listing_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_recommendation" ADD CONSTRAINT "seo_suite_recommendation_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_review_sentiment" ADD CONSTRAINT "seo_suite_review_sentiment_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_subdomain" ADD CONSTRAINT "seo_suite_subdomain_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_toxic_link" ADD CONSTRAINT "seo_suite_toxic_link_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_suite_trending_keyword" ADD CONSTRAINT "seo_suite_trending_keyword_project_id_seo_suite_project__id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_suite_project"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "seo_suite_anchor_distribution_projectId_idx" ON "seo_suite_anchor_distribution" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_anchor_distribution_type_idx" ON "seo_suite_anchor_distribution" USING btree ("type");--> statement-breakpoint
CREATE INDEX "seo_suite_anomaly_projectId_idx" ON "seo_suite_anomaly" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_anomaly_severity_idx" ON "seo_suite_anomaly" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "seo_suite_anomaly_detectedAt_idx" ON "seo_suite_anomaly" USING btree ("detected_at");--> statement-breakpoint
CREATE INDEX "seo_suite_app_data_projectId_idx" ON "seo_suite_app_data" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_app_data_platform_idx" ON "seo_suite_app_data" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "seo_suite_budget_alert_projectId_idx" ON "seo_suite_budget_alert" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_competitor_snapshot_projectId_idx" ON "seo_suite_competitor_snapshot" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_competitor_snapshot_competitorDomain_idx" ON "seo_suite_competitor_snapshot" USING btree ("competitor_domain");--> statement-breakpoint
CREATE INDEX "seo_suite_content_brief_projectId_idx" ON "seo_suite_content_brief" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_content_gap_projectId_idx" ON "seo_suite_content_gap" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_content_gap_opportunity_idx" ON "seo_suite_content_gap" USING btree ("opportunity");--> statement-breakpoint
CREATE INDEX "seo_suite_historical_backlink_projectId_idx" ON "seo_suite_historical_backlink" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_historical_backlink_capturedAt_idx" ON "seo_suite_historical_backlink" USING btree ("captured_at");--> statement-breakpoint
CREATE INDEX "seo_suite_historical_rank_projectId_idx" ON "seo_suite_historical_rank" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_historical_rank_keyword_idx" ON "seo_suite_historical_rank" USING btree ("keyword");--> statement-breakpoint
CREATE INDEX "seo_suite_historical_rank_capturedAt_idx" ON "seo_suite_historical_rank" USING btree ("captured_at");--> statement-breakpoint
CREATE INDEX "seo_suite_historical_traffic_projectId_idx" ON "seo_suite_historical_traffic" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_historical_traffic_capturedAt_idx" ON "seo_suite_historical_traffic" USING btree ("captured_at");--> statement-breakpoint
CREATE INDEX "seo_suite_keyword_cluster_projectId_idx" ON "seo_suite_keyword_cluster" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_keyword_intent_projectId_idx" ON "seo_suite_keyword_intent" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_keyword_intent_keyword_idx" ON "seo_suite_keyword_intent" USING btree ("keyword");--> statement-breakpoint
CREATE INDEX "seo_suite_keyword_intent_intent_idx" ON "seo_suite_keyword_intent" USING btree ("intent");--> statement-breakpoint
CREATE INDEX "seo_suite_link_velocity_projectId_idx" ON "seo_suite_link_velocity" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_link_velocity_capturedAt_idx" ON "seo_suite_link_velocity" USING btree ("captured_at");--> statement-breakpoint
CREATE INDEX "seo_suite_local_pack_tracking_projectId_idx" ON "seo_suite_local_pack_tracking" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_local_pack_tracking_keyword_idx" ON "seo_suite_local_pack_tracking" USING btree ("keyword");--> statement-breakpoint
CREATE INDEX "seo_suite_mobile_rank_projectId_idx" ON "seo_suite_mobile_rank" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_mobile_rank_keyword_idx" ON "seo_suite_mobile_rank" USING btree ("keyword");--> statement-breakpoint
CREATE INDEX "seo_suite_page_tracking_projectId_idx" ON "seo_suite_page_tracking" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_page_tracking_url_idx" ON "seo_suite_page_tracking" USING btree ("url");--> statement-breakpoint
CREATE INDEX "seo_suite_product_listing_projectId_idx" ON "seo_suite_product_listing" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_product_listing_platform_idx" ON "seo_suite_product_listing" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "seo_suite_recommendation_projectId_idx" ON "seo_suite_recommendation" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_recommendation_type_idx" ON "seo_suite_recommendation" USING btree ("type");--> statement-breakpoint
CREATE INDEX "seo_suite_recommendation_priority_idx" ON "seo_suite_recommendation" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "seo_suite_review_sentiment_projectId_idx" ON "seo_suite_review_sentiment" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_review_sentiment_sentiment_idx" ON "seo_suite_review_sentiment" USING btree ("sentiment");--> statement-breakpoint
CREATE INDEX "seo_suite_subdomain_projectId_idx" ON "seo_suite_subdomain" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_toxic_link_projectId_idx" ON "seo_suite_toxic_link" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_toxic_link_toxicScore_idx" ON "seo_suite_toxic_link" USING btree ("toxic_score");--> statement-breakpoint
CREATE INDEX "seo_suite_trending_keyword_projectId_idx" ON "seo_suite_trending_keyword" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_suite_trending_keyword_capturedAt_idx" ON "seo_suite_trending_keyword" USING btree ("captured_at");