DROP INDEX "nisc_em_suppression_team_email_uq";--> statement-breakpoint
DROP INDEX "nisc_em_suppression_account_email_uq";--> statement-breakpoint
CREATE UNIQUE INDEX "nisc_em_suppression_team_email_reason_uq" ON "nisc_em_suppression" USING btree ("team_id","email","reason") WHERE "nisc_em_suppression"."team_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "nisc_em_suppression_account_email_reason_uq" ON "nisc_em_suppression" USING btree ("email","reason") WHERE "nisc_em_suppression"."team_id" IS NULL;