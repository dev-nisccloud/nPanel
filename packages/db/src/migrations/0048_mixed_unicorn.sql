CREATE TABLE "email_builder_operation" (
	"id" text PRIMARY KEY NOT NULL,
	"design_id" text NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text,
	"operation_type" text NOT NULL,
	"status" text DEFAULT 'QUEUED' NOT NULL,
	"qstash_message_id" text,
	"payload" jsonb,
	"result" jsonb,
	"error_message" text,
	"client_version" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "email_builder_design" ADD COLUMN "save_status" text DEFAULT 'SAVED' NOT NULL;--> statement-breakpoint
ALTER TABLE "email_builder_design" ADD COLUMN "last_save_error" text;--> statement-breakpoint
ALTER TABLE "email_builder_design" ADD COLUMN "client_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "email_builder_design" ADD COLUMN "last_saved_at" timestamp;--> statement-breakpoint
ALTER TABLE "email_builder_operation" ADD CONSTRAINT "email_builder_operation_design_id_email_builder_design_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."email_builder_design"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_builder_operation" ADD CONSTRAINT "email_builder_operation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_builder_operation" ADD CONSTRAINT "email_builder_operation_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_builder_operation_designId_idx" ON "email_builder_operation" USING btree ("design_id");--> statement-breakpoint
CREATE INDEX "email_builder_operation_userId_idx" ON "email_builder_operation" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_builder_operation_status_idx" ON "email_builder_operation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_builder_operation_operationType_idx" ON "email_builder_operation" USING btree ("operation_type");--> statement-breakpoint
CREATE INDEX "email_builder_operation_createdAt_idx" ON "email_builder_operation" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "email_builder_design_saveStatus_idx" ON "email_builder_design" USING btree ("save_status");