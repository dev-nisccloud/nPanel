CREATE TABLE "nisc_client_subscription_note" (
	"id" text PRIMARY KEY NOT NULL,
	"subscription_id" text NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nisc_client_subscription" ADD COLUMN "progress_percent" integer;--> statement-breakpoint
ALTER TABLE "nisc_client_subscription" ADD COLUMN "progress_status" text;--> statement-breakpoint
ALTER TABLE "nisc_client_subscription_note" ADD CONSTRAINT "nisc_client_subscription_note_subscription_id_nisc_client_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."nisc_client_subscription"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_client_subscription_note" ADD CONSTRAINT "nisc_client_subscription_note_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "nisc_client_subscription_note_subscriptionId_idx" ON "nisc_client_subscription_note" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "nisc_client_subscription_note_userId_idx" ON "nisc_client_subscription_note" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "nisc_client_subscription_note_createdAt_idx" ON "nisc_client_subscription_note" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "nisc_client_subscription_progressStatus_idx" ON "nisc_client_subscription" USING btree ("progress_status");--> statement-breakpoint
CREATE INDEX "nisc_client_subscription_billingCycle_idx" ON "nisc_client_subscription" USING btree ("billing_cycle");