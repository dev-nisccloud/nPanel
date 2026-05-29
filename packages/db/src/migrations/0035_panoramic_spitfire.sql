CREATE TABLE "neb_media_library" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text,
	"file_name" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" text NOT NULL,
	"file_url" text NOT NULL,
	"storage_key" text,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "neb_media_library" ADD CONSTRAINT "neb_media_library_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neb_media_library" ADD CONSTRAINT "neb_media_library_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "neb_media_library_userId_idx" ON "neb_media_library" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "neb_media_library_teamId_idx" ON "neb_media_library" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "neb_media_library_createdAt_idx" ON "neb_media_library" USING btree ("created_at");