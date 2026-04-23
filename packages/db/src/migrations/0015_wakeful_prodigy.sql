ALTER TABLE "etims_branch" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "etims_customer" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "etims_purchase" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "etims_purchase_item" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "etims_sales_item" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "etims_sales_transaction" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "etims_stock_movement" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "etims_stock_movement_item" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "etims_sync_state" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "etims_branch" CASCADE;--> statement-breakpoint
DROP TABLE "etims_customer" CASCADE;--> statement-breakpoint
DROP TABLE "etims_purchase" CASCADE;--> statement-breakpoint
DROP TABLE "etims_purchase_item" CASCADE;--> statement-breakpoint
DROP TABLE "etims_sales_item" CASCADE;--> statement-breakpoint
DROP TABLE "etims_sales_transaction" CASCADE;--> statement-breakpoint
DROP TABLE "etims_stock_movement" CASCADE;--> statement-breakpoint
DROP TABLE "etims_stock_movement_item" CASCADE;--> statement-breakpoint
DROP TABLE "etims_sync_state" CASCADE;--> statement-breakpoint
DROP INDEX "etims_item_regBhfId_idx";--> statement-breakpoint
ALTER TABLE "etims_item" ALTER COLUMN "pkg_unit_cd" SET DEFAULT 'OU';--> statement-breakpoint
ALTER TABLE "etims_item" ALTER COLUMN "tax_ty_cd" SET DEFAULT 'A';--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN "reg_bhf_id";--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN "item_ty_cd";--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN "item_std_nm";--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN "qty_unit_cd";--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN "btch_no";--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN "bcd";--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN "dft_prc";--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN "grp_prc_l1";--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN "grp_prc_l2";--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN "grp_prc_l3";--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN "grp_prc_l4";--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN "grp_prc_l5";--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN "add_info";--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN "sfty_qty";--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN "isrc_aplcb_yn";--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN "use_yn";--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN "kra_last_sync_at";