CREATE TABLE "user_mfa_challenge" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"session_id" text NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_mfa_session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"session_id" text NOT NULL,
	"required_at" timestamp DEFAULT now() NOT NULL,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_mfa_session_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "user_mfa_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"email_otp_enabled" boolean DEFAULT false NOT NULL,
	"preferred_method" text DEFAULT 'EMAIL_OTP' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_mfa_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "user_mfa_challenge" ADD CONSTRAINT "user_mfa_challenge_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_mfa_session" ADD CONSTRAINT "user_mfa_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_mfa_settings" ADD CONSTRAINT "user_mfa_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_mfa_challenge_userId_idx" ON "user_mfa_challenge" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_mfa_challenge_sessionId_idx" ON "user_mfa_challenge" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "user_mfa_challenge_expiresAt_idx" ON "user_mfa_challenge" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "user_mfa_session_userId_idx" ON "user_mfa_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_mfa_session_sessionId_idx" ON "user_mfa_session" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "user_mfa_session_verifiedAt_idx" ON "user_mfa_session" USING btree ("verified_at");--> statement-breakpoint
CREATE INDEX "user_mfa_settings_userId_idx" ON "user_mfa_settings" USING btree ("user_id");