CREATE TABLE "plesk_server_metric_snapshot" (
	"id" text PRIMARY KEY NOT NULL,
	"host_key" text DEFAULT 'default' NOT NULL,
	"captured_at" timestamp DEFAULT now() NOT NULL,
	"hostname" text,
	"cpu" text,
	"uptime_seconds" double precision,
	"inside_vz" boolean,
	"plesk_version" text,
	"plesk_os" text,
	"load_1" double precision,
	"load_5" double precision,
	"load_15" double precision,
	"mem_total" double precision,
	"mem_used" double precision,
	"mem_free" double precision,
	"mem_shared" double precision,
	"mem_buffer" double precision,
	"mem_cached" double precision,
	"swap_total" double precision,
	"swap_used" double precision,
	"swap_free" double precision,
	"disk_devices" jsonb,
	"objects" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "plesk_server_metric_snapshot_capturedAt_idx" ON "plesk_server_metric_snapshot" USING btree ("captured_at");--> statement-breakpoint
CREATE INDEX "plesk_server_metric_snapshot_host_captured_idx" ON "plesk_server_metric_snapshot" USING btree ("host_key","captured_at");