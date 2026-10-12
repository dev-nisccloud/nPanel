CREATE TABLE "agency_permission_denial_log" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"user_email" text,
	"agency_role_id" text,
	"agency_role_name" text,
	"procedure_path" text NOT NULL,
	"procedure_type" text NOT NULL,
	"permission_key" text NOT NULL,
	"required_access" text NOT NULL,
	"granted_access" text,
	"ip_address" text,
	"input" jsonb
);
--> statement-breakpoint
ALTER TABLE "agency_role_permission" ADD COLUMN "access" text DEFAULT 'write' NOT NULL;--> statement-breakpoint
CREATE INDEX "agency_permission_denial_log_created_at_idx" ON "agency_permission_denial_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "agency_permission_denial_log_user_id_idx" ON "agency_permission_denial_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "agency_permission_denial_log_permission_key_idx" ON "agency_permission_denial_log" USING btree ("permission_key");