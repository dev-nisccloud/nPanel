CREATE INDEX IF NOT EXISTS "user_mfa_session_pending_by_session_idx" ON "user_mfa_session" USING btree ("session_id") WHERE "verified_at" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_expires_at_idx" ON "session" USING btree ("expires_at");
