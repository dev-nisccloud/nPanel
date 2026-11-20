DROP INDEX "nisc_storage_team_live_uid";--> statement-breakpoint
ALTER TABLE "nisc_storage_resource" ALTER COLUMN "team_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "nisc_storage_resource" ALTER COLUMN "subscription_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "nisc_storage_resource" ALTER COLUMN "product_plan_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "nisc_storage_resource" ADD COLUMN "kind" text DEFAULT 'CUSTOMER' NOT NULL;--> statement-breakpoint
ALTER TABLE "nisc_storage_resource" ADD COLUMN "label" text;--> statement-breakpoint
CREATE UNIQUE INDEX "nisc_storage_team_live_uid" ON "nisc_storage_resource" USING btree ("team_id") WHERE "nisc_storage_resource"."status" <> 'DELETED' AND "nisc_storage_resource"."team_id" IS NOT NULL;