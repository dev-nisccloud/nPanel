CREATE TABLE "credit_note_counter" (
	"id" text PRIMARY KEY DEFAULT 'credit-note-counter' NOT NULL,
	"last_number" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoice_credit_note" ADD COLUMN "kra_refund_reason_code" text;--> statement-breakpoint
ALTER TABLE "invoice_credit_note" ADD COLUMN "original_invoice_number" text;--> statement-breakpoint
ALTER TABLE "invoice_credit_note" ADD COLUMN "kra_invoice_number" text;--> statement-breakpoint
ALTER TABLE "invoice_credit_note" ADD COLUMN "kra_receipt_number" text;--> statement-breakpoint
ALTER TABLE "invoice_credit_note" ADD COLUMN "kra_signature" text;--> statement-breakpoint
ALTER TABLE "invoice_credit_note" ADD COLUMN "kra_qr_code" text;--> statement-breakpoint
ALTER TABLE "invoice_credit_note" ADD COLUMN "kra_verified_date" timestamp;--> statement-breakpoint
ALTER TABLE "invoice_credit_note" ADD COLUMN "kra_status" text;--> statement-breakpoint
ALTER TABLE "invoice_credit_note" ADD COLUMN "kra_error" text;--> statement-breakpoint
ALTER TABLE "invoice_credit_note" ADD COLUMN "kra_submitted_at" timestamp;--> statement-breakpoint
ALTER TABLE "invoice_credit_note" ADD COLUMN "kra_last_attempt_at" timestamp;--> statement-breakpoint
ALTER TABLE "invoice_credit_note" ADD COLUMN "kra_attempt_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice_credit_note" ADD COLUMN "kra_verification_url" text;--> statement-breakpoint
ALTER TABLE "invoice_credit_note" ADD COLUMN "kra_sync_payload" jsonb;--> statement-breakpoint
ALTER TABLE "invoice_credit_note" ADD COLUMN "kra_sync_response" jsonb;--> statement-breakpoint
CREATE INDEX "credit_note_kraStatus_idx" ON "invoice_credit_note" USING btree ("kra_status");