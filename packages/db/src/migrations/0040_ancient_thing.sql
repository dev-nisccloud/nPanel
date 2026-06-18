ALTER TABLE "invoice" ADD COLUMN "kra_submitted_at" timestamp;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "kra_last_attempt_at" timestamp;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "kra_attempt_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "kra_verification_url" text;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "kra_sync_payload" jsonb;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "kra_sync_response" jsonb;--> statement-breakpoint
CREATE INDEX "invoice_kraStatus_idx" ON "invoice" USING btree ("kra_status");