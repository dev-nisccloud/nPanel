ALTER TABLE "nisc_product" ADD COLUMN "etims_item_cd" text;--> statement-breakpoint
ALTER TABLE "nisc_product" ADD COLUMN "etims_item_cls_cd" text;--> statement-breakpoint
ALTER TABLE "nisc_product" ADD COLUMN "etims_tax_ty_cd" text;--> statement-breakpoint
ALTER TABLE "nisc_product" ADD COLUMN "etims_default_price" text;--> statement-breakpoint
ALTER TABLE "nisc_product" ADD COLUMN "etims_pkg_unit_cd" text;--> statement-breakpoint
ALTER TABLE "nisc_product" ADD COLUMN "etims_qty_unit_cd" text;--> statement-breakpoint
CREATE UNIQUE INDEX "nisc_product_etimsItemCd_unique" ON "nisc_product" USING btree ("etims_item_cd");
