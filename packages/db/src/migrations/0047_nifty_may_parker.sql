CREATE TABLE "support_guest_session" (
	"id" text PRIMARY KEY NOT NULL,
	"token_hash" text NOT NULL,
	"guest_user_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"created_ip_hash" text,
	"user_agent_hash" text,
	"claimed_by_user_id" text,
	"claimed_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "support_guest_session" ADD CONSTRAINT "support_guest_session_guest_user_id_user_id_fk" FOREIGN KEY ("guest_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_guest_session" ADD CONSTRAINT "support_guest_session_claimed_by_user_id_user_id_fk" FOREIGN KEY ("claimed_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "support_guest_session_token_hash_uidx" ON "support_guest_session" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "support_guest_session_guest_user_id_idx" ON "support_guest_session" USING btree ("guest_user_id");--> statement-breakpoint
CREATE INDEX "support_guest_session_email_idx" ON "support_guest_session" USING btree ("email");--> statement-breakpoint
CREATE INDEX "support_guest_session_expires_at_idx" ON "support_guest_session" USING btree ("expires_at");