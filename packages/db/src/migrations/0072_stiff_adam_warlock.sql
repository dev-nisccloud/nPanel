CREATE TABLE "webhook_event" (
	"_id" text PRIMARY KEY NOT NULL,
	"namespace" text NOT NULL,
	"event_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "source_subtotal" text;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "source_amount" text;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "source_currency" text;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "fx_rate" text;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "fx_provider" text;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "fx_timestamp" timestamp;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "kes_fiscal_amount" text;--> statement-breakpoint
ALTER TABLE "nisc_order" ADD COLUMN "source_subtotal" text;--> statement-breakpoint
ALTER TABLE "nisc_order" ADD COLUMN "source_total" text;--> statement-breakpoint
ALTER TABLE "nisc_order" ADD COLUMN "source_currency" text;--> statement-breakpoint
ALTER TABLE "nisc_order" ADD COLUMN "fx_rate" text;--> statement-breakpoint
ALTER TABLE "nisc_order" ADD COLUMN "fx_provider" text;--> statement-breakpoint
ALTER TABLE "nisc_order" ADD COLUMN "fx_timestamp" timestamp;--> statement-breakpoint
ALTER TABLE "nisc_order" ADD COLUMN "fx_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "payment_transaction" ADD COLUMN "source_amount" text;--> statement-breakpoint
ALTER TABLE "payment_transaction" ADD COLUMN "source_currency" text;--> statement-breakpoint
ALTER TABLE "payment_transaction" ADD COLUMN "fx_rate" text;--> statement-breakpoint
ALTER TABLE "payment_transaction" ADD COLUMN "fx_provider" text;--> statement-breakpoint
ALTER TABLE "payment_transaction" ADD COLUMN "fx_timestamp" timestamp;--> statement-breakpoint
ALTER TABLE "payment_transaction" ADD COLUMN "fx_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "payment_transaction" ADD COLUMN "quote_token" text;--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_event_namespace_eventId_uidx" ON "webhook_event" USING btree ("namespace","event_id");--> statement-breakpoint
CREATE INDEX "webhook_event_createdAt_idx" ON "webhook_event" USING btree ("created_at");