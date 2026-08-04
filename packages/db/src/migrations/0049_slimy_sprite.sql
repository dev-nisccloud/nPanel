ALTER TABLE "neb_design" ADD COLUMN "save_status" text DEFAULT 'SAVED' NOT NULL;--> statement-breakpoint
ALTER TABLE "neb_design" ADD COLUMN "last_save_error" text;--> statement-breakpoint
ALTER TABLE "neb_design" ADD COLUMN "client_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "neb_design" ADD COLUMN "last_saved_at" timestamp;--> statement-breakpoint
CREATE INDEX "neb_design_saveStatus_idx" ON "neb_design" USING btree ("save_status");