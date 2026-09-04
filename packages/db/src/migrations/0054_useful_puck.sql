ALTER TABLE "invoice" ADD COLUMN "amount_paid" text DEFAULT '0';--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "amount_remaining" text;--> statement-breakpoint
ALTER TABLE "nisc_client_subscription" ADD COLUMN "invoice_id" text;--> statement-breakpoint
CREATE INDEX "nisc_client_subscription_invoiceId_idx" ON "nisc_client_subscription" USING btree ("invoice_id");