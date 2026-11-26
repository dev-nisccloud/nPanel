ALTER TABLE "invoice" ADD COLUMN "billing_country" text;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "ip_country" text;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "payment_country" text;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "tax_policy_id" text;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "tax_evidence" jsonb;--> statement-breakpoint
ALTER TABLE "nisc_order" ADD COLUMN "billing_country" text;--> statement-breakpoint
ALTER TABLE "nisc_order" ADD COLUMN "ip_country" text;--> statement-breakpoint
ALTER TABLE "nisc_order" ADD COLUMN "payment_country" text;--> statement-breakpoint
ALTER TABLE "nisc_order" ADD COLUMN "tax_policy_id" text;--> statement-breakpoint
ALTER TABLE "nisc_order" ADD COLUMN "tax_rate" text;--> statement-breakpoint
ALTER TABLE "nisc_order" ADD COLUMN "tax_evidence" jsonb;--> statement-breakpoint
ALTER TABLE "payment_transaction" ADD COLUMN "billing_country" text;--> statement-breakpoint
ALTER TABLE "payment_transaction" ADD COLUMN "ip_country" text;--> statement-breakpoint
ALTER TABLE "payment_transaction" ADD COLUMN "payment_country" text;--> statement-breakpoint
ALTER TABLE "payment_transaction" ADD COLUMN "tax_policy_id" text;--> statement-breakpoint
ALTER TABLE "payment_transaction" ADD COLUMN "tax_rate" text;--> statement-breakpoint
ALTER TABLE "payment_transaction" ADD COLUMN "tax_evidence" jsonb;