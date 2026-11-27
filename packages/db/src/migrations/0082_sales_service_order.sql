CREATE TABLE "sales_service_order" (
	"_id" text PRIMARY KEY NOT NULL,
	"order_number" text,
	"customer_name" text,
	"customer_email" text,
	"billing_email" text,
	"phone" text,
	"contact_person" text,
	"token" text NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"amount" text,
	"subtotal" text,
	"tax" text,
	"tax_percentage" double precision,
	"vat" text,
	"discount" text,
	"currency" text DEFAULT 'KES' NOT NULL,
	"issue_date" timestamp,
	"valid_until" timestamp,
	"payment_terms" text,
	"prepared_by" text,
	"note" text,
	"from_details" jsonb,
	"customer_details" jsonb,
	"authorization" jsonb,
	"metadata" jsonb,
	"linked_user_id" text,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "sales_service_order_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "sales_service_order_activity_log" (
	"_id" text PRIMARY KEY NOT NULL,
	"service_order_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_service_order_counter" (
	"id" text PRIMARY KEY DEFAULT 'sales-service-order-counter' NOT NULL,
	"last_number" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_service_order_line_item" (
	"_id" text PRIMARY KEY NOT NULL,
	"service_order_id" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"category" text,
	"name" text,
	"primary_domain" text,
	"quantity" double precision,
	"billing_cycle" text,
	"price" text,
	"total" text,
	"metadata" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sales_service_order" ADD CONSTRAINT "sales_service_order_linked_user_id_user_id_fk" FOREIGN KEY ("linked_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_service_order" ADD CONSTRAINT "sales_service_order_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_service_order_activity_log" ADD CONSTRAINT "sales_service_order_activity_log_service_order_id_sales_service_order__id_fk" FOREIGN KEY ("service_order_id") REFERENCES "public"."sales_service_order"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_service_order_line_item" ADD CONSTRAINT "sales_service_order_line_item_service_order_id_sales_service_order__id_fk" FOREIGN KEY ("service_order_id") REFERENCES "public"."sales_service_order"("_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sales_service_order_orderNumber_idx" ON "sales_service_order" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "sales_service_order_status_idx" ON "sales_service_order" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sales_service_order_createdBy_idx" ON "sales_service_order" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "sales_service_order_issueDate_idx" ON "sales_service_order" USING btree ("issue_date");--> statement-breakpoint
CREATE INDEX "sales_service_order_customerEmail_idx" ON "sales_service_order" USING btree ("customer_email");--> statement-breakpoint
CREATE INDEX "sales_service_order_activity_log_serviceOrderId_idx" ON "sales_service_order_activity_log" USING btree ("service_order_id");--> statement-breakpoint
CREATE INDEX "sales_service_order_activity_log_createdAt_idx" ON "sales_service_order_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "sales_service_order_line_item_serviceOrderId_idx" ON "sales_service_order_line_item" USING btree ("service_order_id");--> statement-breakpoint
CREATE INDEX "sales_service_order_line_item_position_idx" ON "sales_service_order_line_item" USING btree ("position");