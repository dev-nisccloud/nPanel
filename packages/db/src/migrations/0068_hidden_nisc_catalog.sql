ALTER TABLE "nisc_product" ADD COLUMN "hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "nisc_product_plan" ADD COLUMN "hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "nisc_product_hidden_idx" ON "nisc_product" USING btree ("hidden");--> statement-breakpoint
CREATE INDEX "nisc_product_plan_hidden_idx" ON "nisc_product_plan" USING btree ("hidden");