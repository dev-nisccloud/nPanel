CREATE TABLE "hivelocity_pricing_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"product_type" text NOT NULL,
	"margin_type" text,
	"percentage_margin" text,
	"fixed_margin" text,
	"round_off" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hivelocity_pricing_settings_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"hivelocity_pricing_settings_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hivelocity_pricing_settings" ADD CONSTRAINT "hivelocity_pricing_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hivelocity_pricing_settings_activity_log" ADD CONSTRAINT "hivelocity_pricing_settings_activity_log_hivelocity_pricing_settings_id_hivelocity_pricing_settings_id_fk" FOREIGN KEY ("hivelocity_pricing_settings_id") REFERENCES "public"."hivelocity_pricing_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hivelocity_pricing_settings_userId_idx" ON "hivelocity_pricing_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "hivelocity_pricing_settings_productType_idx" ON "hivelocity_pricing_settings" USING btree ("product_type");--> statement-breakpoint
CREATE INDEX "hivelocity_pricing_settings_isDefault_idx" ON "hivelocity_pricing_settings" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "hivelocity_pricing_settings_activity_userId_idx" ON "hivelocity_pricing_settings_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "hivelocity_pricing_settings_activity_settingsId_idx" ON "hivelocity_pricing_settings_activity_log" USING btree ("hivelocity_pricing_settings_id");--> statement-breakpoint
CREATE INDEX "hivelocity_pricing_settings_activity_action_idx" ON "hivelocity_pricing_settings_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "hivelocity_pricing_settings_activity_createdAt_idx" ON "hivelocity_pricing_settings_activity_log" USING btree ("created_at");