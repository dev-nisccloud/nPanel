CREATE TABLE "etims_stock_movement" (
	"id" text PRIMARY KEY NOT NULL,
	"item_cd" text NOT NULL,
	"item_nm" text NOT NULL,
	"sar_ty_cd" text NOT NULL,
	"sar_no" integer,
	"qty" text NOT NULL,
	"ocrn_dt" text NOT NULL,
	"remark" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "etims_item" ADD COLUMN "rsd_qty" text;--> statement-breakpoint
CREATE INDEX "etims_stock_movement_itemCd_idx" ON "etims_stock_movement" USING btree ("item_cd");