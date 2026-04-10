CREATE TABLE "cron_workflow_edge_snapshot" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"edge_id" text NOT NULL,
	"source_node_id" text NOT NULL,
	"target_node_id" text NOT NULL,
	"payload_json" jsonb NOT NULL,
	"captured_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cron_workflow_run" (
	"id" text PRIMARY KEY NOT NULL,
	"job_key" text NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"graph_state_json" jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"last_error" text,
	"created_by_id" text NOT NULL,
	"team_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cron_workflow_run_invoice" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"platform" text NOT NULL,
	"invoice_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "agency_permission_key_idx";--> statement-breakpoint
DROP INDEX "agency_role_name_idx";--> statement-breakpoint
DROP INDEX "agency_role_permission_roleId_idx";--> statement-breakpoint
DROP INDEX "agency_role_permission_permissionId_idx";--> statement-breakpoint
ALTER TABLE "cron_workflow_edge_snapshot" ADD CONSTRAINT "cron_workflow_edge_snapshot_run_id_cron_workflow_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."cron_workflow_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cron_workflow_run" ADD CONSTRAINT "cron_workflow_run_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cron_workflow_run" ADD CONSTRAINT "cron_workflow_run_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cron_workflow_run_invoice" ADD CONSTRAINT "cron_workflow_run_invoice_run_id_cron_workflow_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."cron_workflow_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cron_workflow_run_invoice" ADD CONSTRAINT "cron_workflow_run_invoice_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cron_workflow_edge_snapshot_run_edge_unique" ON "cron_workflow_edge_snapshot" USING btree ("run_id","edge_id");--> statement-breakpoint
CREATE INDEX "cron_workflow_edge_snapshot_runId_idx" ON "cron_workflow_edge_snapshot" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "cron_workflow_run_jobKey_idx" ON "cron_workflow_run" USING btree ("job_key");--> statement-breakpoint
CREATE INDEX "cron_workflow_run_createdById_idx" ON "cron_workflow_run" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "cron_workflow_run_teamId_idx" ON "cron_workflow_run" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "cron_workflow_run_status_idx" ON "cron_workflow_run" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cron_workflow_run_createdAt_idx" ON "cron_workflow_run" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "cron_workflow_run_invoice_run_platform_unique" ON "cron_workflow_run_invoice" USING btree ("run_id","platform");--> statement-breakpoint
CREATE INDEX "cron_workflow_run_invoice_runId_idx" ON "cron_workflow_run_invoice" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "cron_workflow_run_invoice_invoiceId_idx" ON "cron_workflow_run_invoice" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "agency_role_permission_permission_id_lookup_idx" ON "agency_role_permission" USING btree ("permission_id");