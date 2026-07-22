CREATE TABLE "nisc_payment_gateway_access_log" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"api_key_id" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"day" integer NOT NULL,
	"hour" integer NOT NULL,
	"total_requests" integer DEFAULT 0 NOT NULL,
	"successful_requests" integer DEFAULT 0 NOT NULL,
	"failed_requests" integer DEFAULT 0 NOT NULL,
	"payment_create_requests" integer DEFAULT 0 NOT NULL,
	"payment_read_requests" integer DEFAULT 0 NOT NULL,
	"payment_list_requests" integer DEFAULT 0 NOT NULL,
	"refund_requests" integer DEFAULT 0 NOT NULL,
	"status_2xx_count" integer DEFAULT 0 NOT NULL,
	"status_4xx_count" integer DEFAULT 0 NOT NULL,
	"status_5xx_count" integer DEFAULT 0 NOT NULL,
	"rate_limit_hits" integer DEFAULT 0 NOT NULL,
	"billable_requests" integer DEFAULT 0 NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nisc_payment_gateway_api_key" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"name" text NOT NULL,
	"key_prefix" text NOT NULL,
	"key_hash" text NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"environment" text NOT NULL,
	"rate_limit" integer DEFAULT 100 NOT NULL,
	"allowed_ips" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"last_used_at" timestamp,
	"metadata" jsonb,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp,
	"revoked_by_id" text,
	CONSTRAINT "nisc_payment_gateway_api_key_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "nisc_payment_gateway_merchant" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text,
	"merchant_name" text NOT NULL,
	"merchant_email" text NOT NULL,
	"merchant_phone" text,
	"merchant_website" text,
	"business_type" text DEFAULT 'BUSINESS' NOT NULL,
	"business_name" text,
	"business_registration" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb,
	"notes" text,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"suspended_at" timestamp,
	"closed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "nisc_payment_gateway_merchant_credentials" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"provider" text NOT NULL,
	"environment" text NOT NULL,
	"credentials_encrypted" text NOT NULL,
	"encryption_version" text DEFAULT 'v1' NOT NULL,
	"encrypted_by_id" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_verified_at" timestamp,
	"verification_status" text,
	"verification_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nisc_payment_gateway_request_log" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"api_key_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"method" text NOT NULL,
	"path" text NOT NULL,
	"request_headers" jsonb NOT NULL,
	"request_body" jsonb,
	"request_size" integer,
	"raw_request" text,
	"ip_address" text,
	"user_agent" text,
	"country" text,
	"status_code" integer NOT NULL,
	"success" boolean NOT NULL,
	"error_code" text,
	"error_message" text,
	"response_body" jsonb,
	"response_size" integer,
	"raw_response" text,
	"timestamp" timestamp NOT NULL,
	"duration_ms" integer NOT NULL,
	"gateway_transaction_id" text,
	"payment_transaction_id" text,
	"rate_limit_remaining" integer,
	"rate_limit_hit" boolean DEFAULT false NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"day" integer NOT NULL,
	"hour" integer NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "nisc_payment_gateway_transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"api_key_id" text NOT NULL,
	"payment_transaction_id" text NOT NULL,
	"client_reference_id" text,
	"client_metadata" jsonb,
	"provider" text NOT NULL,
	"webhook_delivery_status" text DEFAULT 'PENDING' NOT NULL,
	"webhook_delivery_attempts" integer DEFAULT 0 NOT NULL,
	"last_webhook_attempt_at" timestamp,
	"webhook_delivered_at" timestamp,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nisc_payment_gateway_webhook_log" (
	"id" text PRIMARY KEY NOT NULL,
	"gateway_transaction_id" text NOT NULL,
	"merchant_id" text NOT NULL,
	"webhook_url" text NOT NULL,
	"request_payload" jsonb NOT NULL,
	"request_headers" jsonb NOT NULL,
	"response_status" integer,
	"response_body" text,
	"response_headers" jsonb,
	"sent_at" timestamp NOT NULL,
	"responded_at" timestamp,
	"duration_ms" integer,
	"success" boolean NOT NULL,
	"error_message" text,
	"attempt_number" integer NOT NULL,
	"will_retry" boolean DEFAULT false NOT NULL,
	"next_retry_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "nisc_payment_gateway_access_log" ADD CONSTRAINT "nisc_payment_gateway_access_log_merchant_id_nisc_payment_gateway_merchant_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."nisc_payment_gateway_merchant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_payment_gateway_access_log" ADD CONSTRAINT "nisc_payment_gateway_access_log_api_key_id_nisc_payment_gateway_api_key_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."nisc_payment_gateway_api_key"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_payment_gateway_api_key" ADD CONSTRAINT "nisc_payment_gateway_api_key_merchant_id_nisc_payment_gateway_merchant_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."nisc_payment_gateway_merchant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_payment_gateway_api_key" ADD CONSTRAINT "nisc_payment_gateway_api_key_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_payment_gateway_api_key" ADD CONSTRAINT "nisc_payment_gateway_api_key_revoked_by_id_user_id_fk" FOREIGN KEY ("revoked_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_payment_gateway_merchant" ADD CONSTRAINT "nisc_payment_gateway_merchant_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_payment_gateway_merchant" ADD CONSTRAINT "nisc_payment_gateway_merchant_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_payment_gateway_merchant" ADD CONSTRAINT "nisc_payment_gateway_merchant_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_payment_gateway_merchant_credentials" ADD CONSTRAINT "nisc_payment_gateway_merchant_credentials_merchant_id_nisc_payment_gateway_merchant_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."nisc_payment_gateway_merchant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_payment_gateway_merchant_credentials" ADD CONSTRAINT "nisc_payment_gateway_merchant_credentials_encrypted_by_id_user_id_fk" FOREIGN KEY ("encrypted_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_payment_gateway_request_log" ADD CONSTRAINT "nisc_payment_gateway_request_log_merchant_id_nisc_payment_gateway_merchant_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."nisc_payment_gateway_merchant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_payment_gateway_request_log" ADD CONSTRAINT "nisc_payment_gateway_request_log_api_key_id_nisc_payment_gateway_api_key_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."nisc_payment_gateway_api_key"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_payment_gateway_request_log" ADD CONSTRAINT "nisc_payment_gateway_request_log_gateway_transaction_id_nisc_payment_gateway_transaction_id_fk" FOREIGN KEY ("gateway_transaction_id") REFERENCES "public"."nisc_payment_gateway_transaction"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_payment_gateway_transaction" ADD CONSTRAINT "nisc_payment_gateway_transaction_merchant_id_nisc_payment_gateway_merchant_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."nisc_payment_gateway_merchant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_payment_gateway_transaction" ADD CONSTRAINT "nisc_payment_gateway_transaction_api_key_id_nisc_payment_gateway_api_key_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."nisc_payment_gateway_api_key"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_payment_gateway_webhook_log" ADD CONSTRAINT "nisc_payment_gateway_webhook_log_gateway_transaction_id_nisc_payment_gateway_transaction_id_fk" FOREIGN KEY ("gateway_transaction_id") REFERENCES "public"."nisc_payment_gateway_transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_payment_gateway_webhook_log" ADD CONSTRAINT "nisc_payment_gateway_webhook_log_merchant_id_nisc_payment_gateway_merchant_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."nisc_payment_gateway_merchant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "npg_access_log_merchant_period_unique" ON "nisc_payment_gateway_access_log" USING btree ("merchant_id","year","month","day","hour");--> statement-breakpoint
CREATE INDEX "npg_access_log_merchant_month_idx" ON "nisc_payment_gateway_access_log" USING btree ("merchant_id","year","month");--> statement-breakpoint
CREATE INDEX "npg_access_log_merchant_day_idx" ON "nisc_payment_gateway_access_log" USING btree ("merchant_id","year","month","day");--> statement-breakpoint
CREATE INDEX "npg_access_log_apikey_month_idx" ON "nisc_payment_gateway_access_log" USING btree ("api_key_id","year","month");--> statement-breakpoint
CREATE INDEX "npg_apikey_merchantId_idx" ON "nisc_payment_gateway_api_key" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "npg_apikey_keyHash_idx" ON "nisc_payment_gateway_api_key" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "npg_apikey_isActive_idx" ON "nisc_payment_gateway_api_key" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "npg_apikey_environment_idx" ON "nisc_payment_gateway_api_key" USING btree ("environment");--> statement-breakpoint
CREATE INDEX "npg_apikey_createdAt_idx" ON "nisc_payment_gateway_api_key" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "npg_merchant_userId_idx" ON "nisc_payment_gateway_merchant" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "npg_merchant_teamId_idx" ON "nisc_payment_gateway_merchant" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "npg_merchant_status_idx" ON "nisc_payment_gateway_merchant" USING btree ("status");--> statement-breakpoint
CREATE INDEX "npg_merchant_email_idx" ON "nisc_payment_gateway_merchant" USING btree ("merchant_email");--> statement-breakpoint
CREATE INDEX "npg_merchant_createdAt_idx" ON "nisc_payment_gateway_merchant" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "npg_credentials_merchant_provider_env_unique" ON "nisc_payment_gateway_merchant_credentials" USING btree ("merchant_id","provider","environment") WHERE "nisc_payment_gateway_merchant_credentials"."is_active" = true;--> statement-breakpoint
CREATE INDEX "npg_credentials_merchantId_idx" ON "nisc_payment_gateway_merchant_credentials" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "npg_credentials_provider_idx" ON "nisc_payment_gateway_merchant_credentials" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "npg_credentials_isActive_idx" ON "nisc_payment_gateway_merchant_credentials" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "npg_request_log_merchantId_time_idx" ON "nisc_payment_gateway_request_log" USING btree ("merchant_id","timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "npg_request_log_apiKeyId_time_idx" ON "nisc_payment_gateway_request_log" USING btree ("api_key_id","timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "npg_request_log_gatewayTxId_idx" ON "nisc_payment_gateway_request_log" USING btree ("gateway_transaction_id");--> statement-breakpoint
CREATE INDEX "npg_request_log_statusCode_idx" ON "nisc_payment_gateway_request_log" USING btree ("status_code");--> statement-breakpoint
CREATE INDEX "npg_request_log_endpoint_idx" ON "nisc_payment_gateway_request_log" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "npg_request_log_ipAddress_idx" ON "nisc_payment_gateway_request_log" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "npg_request_log_timeseries_idx" ON "nisc_payment_gateway_request_log" USING btree ("year","month","day","hour");--> statement-breakpoint
CREATE INDEX "npg_request_log_financial_idx" ON "nisc_payment_gateway_request_log" USING btree ("timestamp") WHERE "nisc_payment_gateway_request_log"."gateway_transaction_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "npg_transaction_merchantId_idx" ON "nisc_payment_gateway_transaction" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "npg_transaction_apiKeyId_idx" ON "nisc_payment_gateway_transaction" USING btree ("api_key_id");--> statement-breakpoint
CREATE INDEX "npg_transaction_paymentTxId_idx" ON "nisc_payment_gateway_transaction" USING btree ("payment_transaction_id");--> statement-breakpoint
CREATE INDEX "npg_transaction_clientRefId_idx" ON "nisc_payment_gateway_transaction" USING btree ("client_reference_id");--> statement-breakpoint
CREATE INDEX "npg_transaction_status_idx" ON "nisc_payment_gateway_transaction" USING btree ("status");--> statement-breakpoint
CREATE INDEX "npg_transaction_webhookStatus_idx" ON "nisc_payment_gateway_transaction" USING btree ("webhook_delivery_status");--> statement-breakpoint
CREATE INDEX "npg_transaction_createdAt_idx" ON "nisc_payment_gateway_transaction" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "npg_webhook_log_gatewayTxId_idx" ON "nisc_payment_gateway_webhook_log" USING btree ("gateway_transaction_id");--> statement-breakpoint
CREATE INDEX "npg_webhook_log_merchantId_idx" ON "nisc_payment_gateway_webhook_log" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "npg_webhook_log_success_idx" ON "nisc_payment_gateway_webhook_log" USING btree ("success");--> statement-breakpoint
CREATE INDEX "npg_webhook_log_sentAt_idx" ON "nisc_payment_gateway_webhook_log" USING btree ("sent_at");