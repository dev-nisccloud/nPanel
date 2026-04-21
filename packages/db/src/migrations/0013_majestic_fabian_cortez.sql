CREATE TABLE "api_request_log" (
	"id" text PRIMARY KEY NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"path" text NOT NULL,
	"type" text NOT NULL,
	"user_id" text,
	"team_id" text,
	"api_key_id" text,
	"input" jsonb,
	"status" text NOT NULL,
	"error_code" text,
	"duration_ms" integer NOT NULL,
	"ip_address" text
);
--> statement-breakpoint
CREATE INDEX "api_log_path_idx" ON "api_request_log" USING btree ("path");--> statement-breakpoint
CREATE INDEX "api_log_timestamp_idx" ON "api_request_log" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "api_log_user_id_idx" ON "api_request_log" USING btree ("user_id");