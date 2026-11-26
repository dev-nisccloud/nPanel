CREATE TABLE "etims_partial_order" (
	"id" text PRIMARY KEY NOT NULL,
	"seed_invc_no" integer NOT NULL,
	"trd_invc_no" text,
	"item_cd" text NOT NULL,
	"item_nm" text NOT NULL,
	"item_cls_cd" text,
	"pkg_unit_cd" text,
	"qty_unit_cd" text,
	"tax_ty_cd" text,
	"inclusive_prc" text NOT NULL,
	"dc_rt" text,
	"ordered_qty" text NOT NULL,
	"invoiced_qty" text NOT NULL,
	"cust_tin" text,
	"cust_nm" text,
	"pmt_ty_cd" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "etims_partial_order_seed_item_idx" ON "etims_partial_order" USING btree ("seed_invc_no","item_cd");--> statement-breakpoint
CREATE INDEX "etims_partial_order_seed_idx" ON "etims_partial_order" USING btree ("seed_invc_no");