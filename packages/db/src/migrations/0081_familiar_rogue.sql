ALTER TABLE "nisc_storage_resource" ADD COLUMN "deletion_scheduled_at" timestamp;--> statement-breakpoint
ALTER TABLE "nisc_storage_resource" ADD COLUMN "status_before_deletion" text;