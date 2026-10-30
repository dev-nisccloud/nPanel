CREATE TABLE "facebook_page" (
	"id" text PRIMARY KEY NOT NULL,
	"connection_id" text NOT NULL,
	"user_id" text NOT NULL,
	"page_id" text NOT NULL,
	"name" text NOT NULL,
	"username" text,
	"category" text,
	"picture_url" text,
	"page_access_token" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "facebook_page" ADD CONSTRAINT "facebook_page_connection_id_customer_oauth_connection_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."customer_oauth_connection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facebook_page" ADD CONSTRAINT "facebook_page_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "facebook_page_connection_page_unique" ON "facebook_page" USING btree ("connection_id","page_id");--> statement-breakpoint
CREATE INDEX "facebook_page_userId_idx" ON "facebook_page" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "facebook_page_pageId_idx" ON "facebook_page" USING btree ("page_id");