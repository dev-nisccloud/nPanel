CREATE TABLE "etims_item_classification" (
	"item_cls_cd" text PRIMARY KEY NOT NULL,
	"item_cls_nm" text NOT NULL,
	"item_cls_lvl" integer NOT NULL,
	"tax_ty_cd" text,
	"mjr_tg_yn" text,
	"use_yn" text DEFAULT 'Y',
	"synced_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "etims_item_classification_level_idx" ON "etims_item_classification" USING btree ("item_cls_lvl");