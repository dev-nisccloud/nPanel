ALTER TABLE "ticket" ADD COLUMN "customer_user_id" text;--> statement-breakpoint
ALTER TABLE "ticket" ADD COLUMN "visibility" text DEFAULT 'CUSTOMER' NOT NULL;--> statement-breakpoint
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_customer_user_id_user_id_fk" FOREIGN KEY ("customer_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ticket_customerUserId_idx" ON "ticket" USING btree ("customer_user_id");--> statement-breakpoint
CREATE INDEX "ticket_visibility_idx" ON "ticket" USING btree ("visibility");