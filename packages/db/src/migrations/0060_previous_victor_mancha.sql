CREATE TABLE "customer_asset_mapping" (
	"id" text PRIMARY KEY NOT NULL,
	"asset_id" text NOT NULL,
	"meta_ads_account_id" text,
	"target_table" text,
	"target_id" text,
	"sync_status" text DEFAULT 'SYNCED' NOT NULL,
	"last_synced_at" timestamp,
	"sync_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_oauth_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"connection_id" text,
	"asset_id" text,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"status" text NOT NULL,
	"description" text,
	"error_message" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_oauth_connection" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text,
	"platform" text NOT NULL,
	"platform_user_id" text NOT NULL,
	"platform_business_id" text,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"token_type" text DEFAULT 'Bearer',
	"token_expires_at" timestamp,
	"scopes" text[],
	"display_name" text,
	"email" text,
	"profile_picture_url" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"requires_reconnect" boolean DEFAULT false NOT NULL,
	"last_verified_at" timestamp,
	"last_refresh_at" timestamp,
	"last_error" text,
	"error_count" integer DEFAULT 0 NOT NULL,
	"awaiting_account_selection" boolean DEFAULT false NOT NULL,
	"selection_expires_at" timestamp,
	"selection_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "customer_oauth_state" (
	"state_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text,
	"platform" text NOT NULL,
	"code_verifier" text,
	"nonce" text,
	"flow_type" text NOT NULL,
	"reconnect_connection_id" text,
	"return_url" text,
	"ip_address" text,
	"user_agent" text,
	"referer" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_platform_asset" (
	"id" text PRIMARY KEY NOT NULL,
	"connection_id" text NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text,
	"platform" text NOT NULL,
	"asset_type" text NOT NULL,
	"platform_asset_id" text NOT NULL,
	"platform_parent_id" text,
	"asset_access_token" text,
	"asset_token_expires_at" timestamp,
	"name" text NOT NULL,
	"username" text,
	"profile_picture_url" text,
	"description" text,
	"parent_asset_id" text,
	"business_id" text,
	"business_name" text,
	"permissions" jsonb,
	"capabilities" jsonb,
	"limits" jsonb,
	"currency" text,
	"timezone" text,
	"spend_limit" numeric(15, 2),
	"amount_spent" numeric(15, 2),
	"balance" numeric(15, 2),
	"account_status" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"last_verified_at" timestamp,
	"verification_error" text,
	"health_score" integer,
	"last_used_at" timestamp,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"last_post_at" timestamp,
	"last_campaign_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_platform_config" (
	"platform" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"auth_url_template" text NOT NULL,
	"token_url_template" text NOT NULL,
	"revoke_url_template" text,
	"required_scopes" text[] NOT NULL,
	"optional_scopes" text[],
	"supports_refresh" boolean DEFAULT true NOT NULL,
	"requires_asset_selection" boolean DEFAULT false NOT NULL,
	"default_token_ttl_seconds" integer,
	"refresh_before_expiry_seconds" integer DEFAULT 86400,
	"rate_limit_per_minute" integer,
	"rate_limit_per_hour" integer,
	"api_base_url" text,
	"api_version" text,
	"config" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_platform_webhook" (
	"id" text PRIMARY KEY NOT NULL,
	"platform" text NOT NULL,
	"webhook_id" text,
	"event_type" text NOT NULL,
	"connection_id" text,
	"asset_id" text,
	"payload" jsonb NOT NULL,
	"signature" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"processed_at" timestamp,
	"error_message" text,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_token_refresh_queue" (
	"id" text PRIMARY KEY NOT NULL,
	"connection_id" text NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"scheduled_for" timestamp NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"last_attempt_at" timestamp,
	"last_error" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "customer_asset_mapping" ADD CONSTRAINT "customer_asset_mapping_asset_id_customer_platform_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."customer_platform_asset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_asset_mapping" ADD CONSTRAINT "customer_asset_mapping_meta_ads_account_id_meta_ads_account_id_fk" FOREIGN KEY ("meta_ads_account_id") REFERENCES "public"."meta_ads_account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_oauth_activity_log" ADD CONSTRAINT "customer_oauth_activity_log_connection_id_customer_oauth_connection_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."customer_oauth_connection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_oauth_activity_log" ADD CONSTRAINT "customer_oauth_activity_log_asset_id_customer_platform_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."customer_platform_asset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_oauth_activity_log" ADD CONSTRAINT "customer_oauth_activity_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_oauth_connection" ADD CONSTRAINT "customer_oauth_connection_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_oauth_connection" ADD CONSTRAINT "customer_oauth_connection_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_oauth_connection" ADD CONSTRAINT "customer_oauth_connection_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_oauth_state" ADD CONSTRAINT "customer_oauth_state_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_oauth_state" ADD CONSTRAINT "customer_oauth_state_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_oauth_state" ADD CONSTRAINT "customer_oauth_state_reconnect_connection_id_customer_oauth_connection_id_fk" FOREIGN KEY ("reconnect_connection_id") REFERENCES "public"."customer_oauth_connection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_platform_asset" ADD CONSTRAINT "customer_platform_asset_connection_id_customer_oauth_connection_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."customer_oauth_connection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_platform_asset" ADD CONSTRAINT "customer_platform_asset_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_platform_asset" ADD CONSTRAINT "customer_platform_asset_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_platform_asset" ADD CONSTRAINT "customer_platform_asset_parent_asset_id_customer_platform_asset_id_fk" FOREIGN KEY ("parent_asset_id") REFERENCES "public"."customer_platform_asset"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_platform_webhook" ADD CONSTRAINT "customer_platform_webhook_connection_id_customer_oauth_connection_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."customer_oauth_connection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_platform_webhook" ADD CONSTRAINT "customer_platform_webhook_asset_id_customer_platform_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."customer_platform_asset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_token_refresh_queue" ADD CONSTRAINT "customer_token_refresh_queue_connection_id_customer_oauth_connection_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."customer_oauth_connection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "customer_asset_mapping_asset_target_unique" ON "customer_asset_mapping" USING btree ("asset_id","target_table","target_id");--> statement-breakpoint
CREATE INDEX "customer_asset_mapping_assetId_idx" ON "customer_asset_mapping" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "customer_asset_mapping_metaAdsAccountId_idx" ON "customer_asset_mapping" USING btree ("meta_ads_account_id");--> statement-breakpoint
CREATE INDEX "customer_asset_mapping_target_idx" ON "customer_asset_mapping" USING btree ("target_table","target_id");--> statement-breakpoint
CREATE INDEX "customer_oauth_activity_log_connectionId_idx" ON "customer_oauth_activity_log" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "customer_oauth_activity_log_assetId_idx" ON "customer_oauth_activity_log" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "customer_oauth_activity_log_userId_idx" ON "customer_oauth_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "customer_oauth_activity_log_action_idx" ON "customer_oauth_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "customer_oauth_activity_log_createdAt_idx" ON "customer_oauth_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_oauth_connection_user_platform_unique" ON "customer_oauth_connection" USING btree ("user_id","platform","platform_user_id");--> statement-breakpoint
CREATE INDEX "customer_oauth_connection_userId_idx" ON "customer_oauth_connection" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "customer_oauth_connection_teamId_idx" ON "customer_oauth_connection" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "customer_oauth_connection_platform_idx" ON "customer_oauth_connection" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "customer_oauth_connection_status_idx" ON "customer_oauth_connection" USING btree ("status");--> statement-breakpoint
CREATE INDEX "customer_oauth_connection_expires_idx" ON "customer_oauth_connection" USING btree ("token_expires_at");--> statement-breakpoint
CREATE INDEX "customer_oauth_connection_needs_refresh_idx" ON "customer_oauth_connection" USING btree ("requires_reconnect");--> statement-breakpoint
CREATE INDEX "customer_oauth_connection_business_idx" ON "customer_oauth_connection" USING btree ("platform_business_id");--> statement-breakpoint
CREATE INDEX "customer_oauth_state_expiresAt_idx" ON "customer_oauth_state" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "customer_oauth_state_userId_idx" ON "customer_oauth_state" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "customer_oauth_state_reconnectConnectionId_idx" ON "customer_oauth_state" USING btree ("reconnect_connection_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_platform_asset_connection_asset_unique" ON "customer_platform_asset" USING btree ("connection_id","platform","platform_asset_id");--> statement-breakpoint
CREATE INDEX "customer_platform_asset_connectionId_idx" ON "customer_platform_asset" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "customer_platform_asset_userId_idx" ON "customer_platform_asset" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "customer_platform_asset_teamId_idx" ON "customer_platform_asset" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "customer_platform_asset_type_idx" ON "customer_platform_asset" USING btree ("asset_type");--> statement-breakpoint
CREATE INDEX "customer_platform_asset_platformAssetId_idx" ON "customer_platform_asset" USING btree ("platform_asset_id");--> statement-breakpoint
CREATE INDEX "customer_platform_asset_active_idx" ON "customer_platform_asset" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "customer_platform_asset_businessId_idx" ON "customer_platform_asset" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "customer_platform_asset_parentAssetId_idx" ON "customer_platform_asset" USING btree ("parent_asset_id");--> statement-breakpoint
CREATE INDEX "customer_platform_asset_accountStatus_idx" ON "customer_platform_asset" USING btree ("account_status");--> statement-breakpoint
CREATE INDEX "customer_platform_webhook_status_idx" ON "customer_platform_webhook" USING btree ("status");--> statement-breakpoint
CREATE INDEX "customer_platform_webhook_platform_idx" ON "customer_platform_webhook" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "customer_platform_webhook_connectionId_idx" ON "customer_platform_webhook" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "customer_platform_webhook_receivedAt_idx" ON "customer_platform_webhook" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "customer_token_refresh_queue_scheduled_idx" ON "customer_token_refresh_queue" USING btree ("scheduled_for","status");--> statement-breakpoint
CREATE INDEX "customer_token_refresh_queue_connectionId_idx" ON "customer_token_refresh_queue" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "customer_token_refresh_queue_status_idx" ON "customer_token_refresh_queue" USING btree ("status");