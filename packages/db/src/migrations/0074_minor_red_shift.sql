ALTER TABLE "user" ADD COLUMN "display_currency" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "display_currency_updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_display_currency_check" CHECK ("user"."display_currency" is null or "user"."display_currency" in ('KES', 'USD'));