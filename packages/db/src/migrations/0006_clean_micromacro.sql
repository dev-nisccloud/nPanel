DROP INDEX "nisc_em_suppression_teamId_email_idx";--> statement-breakpoint
ALTER TABLE "nisc_em_suppression" ALTER COLUMN "team_id" DROP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "nisc_em_suppression_team_email_uq" ON "nisc_em_suppression" USING btree ("team_id","email") WHERE "nisc_em_suppression"."team_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "nisc_em_suppression_account_email_uq" ON "nisc_em_suppression" USING btree ("email") WHERE "nisc_em_suppression"."team_id" IS NULL;