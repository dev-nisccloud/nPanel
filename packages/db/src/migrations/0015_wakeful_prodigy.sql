ALTER TABLE IF EXISTS "etims_branch" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "etims_customer" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "etims_purchase" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "etims_purchase_item" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "etims_sales_item" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "etims_sales_transaction" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "etims_stock_movement" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "etims_stock_movement_item" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "etims_sync_state" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE IF EXISTS "etims_branch" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "etims_customer" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "etims_purchase" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "etims_purchase_item" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "etims_sales_item" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "etims_sales_transaction" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "etims_stock_movement" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "etims_stock_movement_item" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "etims_sync_state" CASCADE;--> statement-breakpoint
DROP INDEX IF EXISTS "etims_item_regBhfId_idx";--> statement-breakpoint
ALTER TABLE "etims_item" ALTER COLUMN "pkg_unit_cd" SET DEFAULT 'OU';--> statement-breakpoint
ALTER TABLE "etims_item" ALTER COLUMN "tax_ty_cd" SET DEFAULT 'A';--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN IF EXISTS "reg_bhf_id";--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN IF EXISTS "item_ty_cd";--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN IF EXISTS "item_std_nm";--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN IF EXISTS "qty_unit_cd";--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN IF EXISTS "btch_no";--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN IF EXISTS "bcd";--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN IF EXISTS "dft_prc";--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN IF EXISTS "grp_prc_l1";--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN IF EXISTS "grp_prc_l2";--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN IF EXISTS "grp_prc_l3";--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN IF EXISTS "grp_prc_l4";--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN IF EXISTS "grp_prc_l5";--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN IF EXISTS "add_info";--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN IF EXISTS "sfty_qty";--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN IF EXISTS "isrc_aplcb_yn";--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN IF EXISTS "use_yn";--> statement-breakpoint
ALTER TABLE "etims_item" DROP COLUMN IF EXISTS "kra_last_sync_at";
