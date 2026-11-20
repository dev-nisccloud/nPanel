CREATE TABLE "nisc_storage_audit" (
	"id" text PRIMARY KEY NOT NULL,
	"resource_id" text,
	"team_id" text,
	"actor_user_id" text,
	"action" text NOT NULL,
	"object_key" text,
	"outcome" text NOT NULL,
	"detail" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nisc_storage_folder_grant" (
	"id" text PRIMARY KEY NOT NULL,
	"resource_id" text NOT NULL,
	"team_member_id" text NOT NULL,
	"prefix" text NOT NULL,
	"can_list" boolean DEFAULT false NOT NULL,
	"can_get" boolean DEFAULT false NOT NULL,
	"can_put" boolean DEFAULT false NOT NULL,
	"can_delete" boolean DEFAULT false NOT NULL,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nisc_storage_resource" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"subscription_id" text NOT NULL,
	"product_plan_id" text NOT NULL,
	"storage_cluster_id" text,
	"bucket_name" text NOT NULL,
	"bucket_name_source" text NOT NULL,
	"iam_user_name" text NOT NULL,
	"access_key_id" text,
	"secret_ciphertext" text,
	"status" text NOT NULL,
	"quota_bytes" text NOT NULL,
	"max_object_bytes" text NOT NULL,
	"used_bytes" text DEFAULT '0' NOT NULL,
	"encryption_status" text DEFAULT 'UNKNOWN' NOT NULL,
	"quota_sync_status" text DEFAULT 'PENDING' NOT NULL,
	"failed_step" text,
	"failure_reason" text,
	"correlation_id" text NOT NULL,
	"credentials_created_at" timestamp,
	"credentials_rotated_at" timestamp,
	"suspended_at" timestamp,
	"deleted_at" timestamp,
	"last_health_check_at" timestamp,
	"last_usage_sync_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nisc_storage_upload_reservation" (
	"id" text PRIMARY KEY NOT NULL,
	"resource_id" text NOT NULL,
	"object_key" text NOT NULL,
	"bytes" text NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nisc_storage_audit" ADD CONSTRAINT "nisc_storage_audit_resource_id_nisc_storage_resource_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."nisc_storage_resource"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_storage_audit" ADD CONSTRAINT "nisc_storage_audit_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_storage_folder_grant" ADD CONSTRAINT "nisc_storage_folder_grant_resource_id_nisc_storage_resource_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."nisc_storage_resource"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_storage_folder_grant" ADD CONSTRAINT "nisc_storage_folder_grant_team_member_id_team_member_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_storage_folder_grant" ADD CONSTRAINT "nisc_storage_folder_grant_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_storage_resource" ADD CONSTRAINT "nisc_storage_resource_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_storage_resource" ADD CONSTRAINT "nisc_storage_resource_subscription_id_nisc_client_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."nisc_client_subscription"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_storage_resource" ADD CONSTRAINT "nisc_storage_resource_product_plan_id_nisc_product_plan_id_fk" FOREIGN KEY ("product_plan_id") REFERENCES "public"."nisc_product_plan"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_storage_upload_reservation" ADD CONSTRAINT "nisc_storage_upload_reservation_resource_id_nisc_storage_resource_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."nisc_storage_resource"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nisc_storage_upload_reservation" ADD CONSTRAINT "nisc_storage_upload_reservation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "nisc_storage_audit_resource_idx" ON "nisc_storage_audit" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "nisc_storage_audit_team_idx" ON "nisc_storage_audit" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "nisc_storage_audit_actor_idx" ON "nisc_storage_audit" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "nisc_storage_audit_created_idx" ON "nisc_storage_audit" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "nisc_storage_grant_member_prefix_uid" ON "nisc_storage_folder_grant" USING btree ("resource_id","team_member_id","prefix");--> statement-breakpoint
CREATE INDEX "nisc_storage_grant_resource_idx" ON "nisc_storage_folder_grant" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "nisc_storage_grant_member_idx" ON "nisc_storage_folder_grant" USING btree ("team_member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "nisc_storage_team_live_uid" ON "nisc_storage_resource" USING btree ("team_id") WHERE "nisc_storage_resource"."status" <> 'DELETED';--> statement-breakpoint
CREATE UNIQUE INDEX "nisc_storage_bucket_live_uid" ON "nisc_storage_resource" USING btree ("bucket_name") WHERE "nisc_storage_resource"."status" <> 'DELETED';--> statement-breakpoint
CREATE UNIQUE INDEX "nisc_storage_subscription_uid" ON "nisc_storage_resource" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "nisc_storage_resource_status_idx" ON "nisc_storage_resource" USING btree ("status");--> statement-breakpoint
CREATE INDEX "nisc_storage_resource_teamId_idx" ON "nisc_storage_resource" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "nisc_storage_resource_planId_idx" ON "nisc_storage_resource" USING btree ("product_plan_id");--> statement-breakpoint
CREATE UNIQUE INDEX "nisc_storage_reservation_key_uid" ON "nisc_storage_upload_reservation" USING btree ("resource_id","object_key");--> statement-breakpoint
CREATE INDEX "nisc_storage_reservation_expiry_idx" ON "nisc_storage_upload_reservation" USING btree ("expires_at");
