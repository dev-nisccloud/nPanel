ALTER TABLE "facebook_page" ADD COLUMN "team_id" text;--> statement-breakpoint
ALTER TABLE "facebook_page" ADD CONSTRAINT "facebook_page_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "facebook_page_teamId_idx" ON "facebook_page" USING btree ("team_id");