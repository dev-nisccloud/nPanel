ALTER TABLE "user" ADD COLUMN "general_emails_accepted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "invoice_emails_accepted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "support_emails_accepted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "product_emails_accepted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "domain_emails_accepted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "affiliate_emails_accepted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "admin_notes" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "how_did_you_find_us" text;