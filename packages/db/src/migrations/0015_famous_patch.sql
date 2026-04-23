CREATE TABLE "etims_branch" (
	"id" text PRIMARY KEY NOT NULL,
	"tin" text NOT NULL,
	"bhf_id" text NOT NULL,
	"bhf_nm" text,
	"bhf_stts_cd" text,
	"prvnc_nm" text,
	"dstrt_nm" text,
	"sctr_nm" text,
	"loc_desc" text,
	"adrs" text,
	"mgr_nm" text,
	"mgr_tel_no" text,
	"mgr_email" text,
	"hq_yn" text,
	"kra_last_sync_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "etims_customer" (
	"id" text PRIMARY KEY NOT NULL,
	"tin" text NOT NULL,
	"cust_no" text,
	"cust_tin" text NOT NULL,
	"cust_nm" text,
	"adrs" text,
	"tel_no" text,
	"email" text,
	"fax_no" text,
	"use_yn" text DEFAULT 'Y',
	"remark" text,
	"kra_last_sync_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "etims_purchase" (
	"id" text PRIMARY KEY NOT NULL,
	"tin" text NOT NULL,
	"bhf_id" text NOT NULL,
	"invc_no" integer NOT NULL,
	"org_invc_no" integer,
	"spplr_tin" text,
	"spplr_bhf_id" text,
	"spplr_nm" text,
	"spplr_invc_no" text,
	"reg_ty_cd" text,
	"pchs_ty_cd" text,
	"rcpt_ty_cd" text,
	"pmt_ty_cd" text,
	"pchs_stts_cd" text,
	"cfm_dt" text,
	"pchs_dt" text,
	"wrhs_dt" text,
	"tot_item_cnt" integer,
	"tot_taxbl_amt" text,
	"tot_tax_amt" text,
	"tot_amt" text,
	"remark" text,
	"source" text DEFAULT 'kra_sync' NOT NULL,
	"kra_raw" jsonb,
	"kra_result_cd" text,
	"kra_result_msg" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "etims_purchase_item" (
	"id" text PRIMARY KEY NOT NULL,
	"purchase_id" text NOT NULL,
	"item_seq" integer NOT NULL,
	"item_cd" text,
	"item_cls_cd" text,
	"item_nm" text,
	"bcd" text,
	"spplr_item_cls_cd" text,
	"spplr_item_cd" text,
	"spplr_item_nm" text,
	"pkg_unit_cd" text,
	"pkg" text,
	"qty_unit_cd" text,
	"qty" text,
	"prc" text,
	"sply_amt" text,
	"dc_rt" text,
	"dc_amt" text,
	"tax_ty_cd" text,
	"taxbl_amt" text,
	"tax_amt" text,
	"tot_amt" text,
	"item_expr_dt" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "etims_sales_item" (
	"id" text PRIMARY KEY NOT NULL,
	"sales_transaction_id" text NOT NULL,
	"item_seq" integer NOT NULL,
	"item_cd" text NOT NULL,
	"item_cls_cd" text,
	"item_nm" text,
	"bcd" text,
	"pkg_unit_cd" text,
	"pkg" text,
	"qty_unit_cd" text,
	"qty" text,
	"prc" text,
	"sply_amt" text,
	"dc_rt" text,
	"dc_amt" text,
	"tax_ty_cd" text,
	"taxbl_amt" text,
	"tax_amt" text,
	"tot_amt" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "etims_sales_transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"tin" text NOT NULL,
	"bhf_id" text NOT NULL,
	"trd_invc_no" text,
	"invc_no" integer NOT NULL,
	"org_invc_no" integer,
	"cust_tin" text,
	"cust_nm" text,
	"sales_ty_cd" text,
	"rcpt_ty_cd" text,
	"pmt_ty_cd" text,
	"sales_stts_cd" text,
	"cfm_dt" text,
	"sales_dt" text,
	"stock_rls_dt" text,
	"tot_item_cnt" integer,
	"tot_taxbl_amt" text,
	"tot_tax_amt" text,
	"tot_amt" text,
	"remark" text,
	"regr_id" text,
	"regr_nm" text,
	"modr_id" text,
	"modr_nm" text,
	"receipt" jsonb,
	"cur_rcpt_no" integer,
	"tot_rcpt_no" integer,
	"intrl_data" text,
	"rcpt_sign" text,
	"sdc_date_time" text,
	"mrc_no" text,
	"kra_raw" jsonb,
	"kra_result_cd" text,
	"kra_result_msg" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "etims_stock_movement" (
	"id" text PRIMARY KEY NOT NULL,
	"tin" text NOT NULL,
	"bhf_id" text NOT NULL,
	"sar_no" integer,
	"org_sar_no" integer,
	"reg_ty_cd" text,
	"sar_ty_cd" text,
	"cust_tin" text,
	"cust_nm" text,
	"cust_bhf_id" text,
	"ocrn_dt" text,
	"tot_item_cnt" integer,
	"tot_taxbl_amt" text,
	"tot_tax_amt" text,
	"tot_amt" text,
	"remark" text,
	"source" text DEFAULT 'kra_sync' NOT NULL,
	"kra_raw" jsonb,
	"kra_result_cd" text,
	"kra_result_msg" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "etims_stock_movement_item" (
	"id" text PRIMARY KEY NOT NULL,
	"movement_id" text NOT NULL,
	"item_seq" integer NOT NULL,
	"item_cd" text NOT NULL,
	"item_cls_cd" text,
	"item_nm" text,
	"bcd" text,
	"pkg_unit_cd" text,
	"pkg" text,
	"qty_unit_cd" text,
	"qty" text,
	"item_expr_dt" text,
	"prc" text,
	"sply_amt" text,
	"tot_dc_amt" text,
	"taxbl_amt" text,
	"tax_ty_cd" text,
	"tax_amt" text,
	"tot_amt" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "etims_sync_state" (
	"id" text PRIMARY KEY NOT NULL,
	"tin" text NOT NULL,
	"bhf_id" text NOT NULL,
	"resource" text NOT NULL,
	"last_req_dt" text,
	"last_sync_at" timestamp,
	"last_result_cd" text,
	"last_result_msg" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "etims_item" ALTER COLUMN "tax_ty_cd" SET DEFAULT 'B';--> statement-breakpoint
ALTER TABLE "etims_item" ALTER COLUMN "pkg_unit_cd" SET DEFAULT 'NT';--> statement-breakpoint
ALTER TABLE "etims_item" ADD COLUMN "reg_bhf_id" text;--> statement-breakpoint
ALTER TABLE "etims_item" ADD COLUMN "item_ty_cd" text;--> statement-breakpoint
ALTER TABLE "etims_item" ADD COLUMN "item_std_nm" text;--> statement-breakpoint
ALTER TABLE "etims_item" ADD COLUMN "qty_unit_cd" text DEFAULT 'U';--> statement-breakpoint
ALTER TABLE "etims_item" ADD COLUMN "btch_no" text;--> statement-breakpoint
ALTER TABLE "etims_item" ADD COLUMN "bcd" text;--> statement-breakpoint
ALTER TABLE "etims_item" ADD COLUMN "dft_prc" text;--> statement-breakpoint
ALTER TABLE "etims_item" ADD COLUMN "grp_prc_l1" text;--> statement-breakpoint
ALTER TABLE "etims_item" ADD COLUMN "grp_prc_l2" text;--> statement-breakpoint
ALTER TABLE "etims_item" ADD COLUMN "grp_prc_l3" text;--> statement-breakpoint
ALTER TABLE "etims_item" ADD COLUMN "grp_prc_l4" text;--> statement-breakpoint
ALTER TABLE "etims_item" ADD COLUMN "grp_prc_l5" text;--> statement-breakpoint
ALTER TABLE "etims_item" ADD COLUMN "add_info" text;--> statement-breakpoint
ALTER TABLE "etims_item" ADD COLUMN "sfty_qty" text;--> statement-breakpoint
ALTER TABLE "etims_item" ADD COLUMN "isrc_aplcb_yn" text DEFAULT 'N';--> statement-breakpoint
ALTER TABLE "etims_item" ADD COLUMN "use_yn" text DEFAULT 'Y';--> statement-breakpoint
ALTER TABLE "etims_item" ADD COLUMN "kra_last_sync_at" timestamp;--> statement-breakpoint
ALTER TABLE "etims_purchase_item" ADD CONSTRAINT "etims_purchase_item_purchase_id_etims_purchase_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."etims_purchase"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "etims_sales_item" ADD CONSTRAINT "etims_sales_item_sales_transaction_id_etims_sales_transaction_id_fk" FOREIGN KEY ("sales_transaction_id") REFERENCES "public"."etims_sales_transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "etims_stock_movement_item" ADD CONSTRAINT "etims_stock_movement_item_movement_id_etims_stock_movement_id_fk" FOREIGN KEY ("movement_id") REFERENCES "public"."etims_stock_movement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "etims_branch_tin_bhfId_unique" ON "etims_branch" USING btree ("tin","bhf_id");--> statement-breakpoint
CREATE UNIQUE INDEX "etims_customer_tin_custTin_unique" ON "etims_customer" USING btree ("tin","cust_tin");--> statement-breakpoint
CREATE INDEX "etims_purchase_tin_bhfId_idx" ON "etims_purchase" USING btree ("tin","bhf_id");--> statement-breakpoint
CREATE UNIQUE INDEX "etims_purchase_tin_spplrTin_invcNo_unique" ON "etims_purchase" USING btree ("tin","spplr_tin","invc_no");--> statement-breakpoint
CREATE INDEX "etims_purchase_item_purchaseId_idx" ON "etims_purchase_item" USING btree ("purchase_id");--> statement-breakpoint
CREATE INDEX "etims_sales_item_salesTxnId_idx" ON "etims_sales_item" USING btree ("sales_transaction_id");--> statement-breakpoint
CREATE INDEX "etims_sales_txn_tin_bhfId_idx" ON "etims_sales_transaction" USING btree ("tin","bhf_id");--> statement-breakpoint
CREATE INDEX "etims_sales_txn_salesDt_idx" ON "etims_sales_transaction" USING btree ("sales_dt");--> statement-breakpoint
CREATE UNIQUE INDEX "etims_sales_txn_bhfId_invcNo_unique" ON "etims_sales_transaction" USING btree ("bhf_id","invc_no");--> statement-breakpoint
CREATE INDEX "etims_stock_mov_tin_bhfId_idx" ON "etims_stock_movement" USING btree ("tin","bhf_id");--> statement-breakpoint
CREATE INDEX "etims_stock_mov_ocrnDt_idx" ON "etims_stock_movement" USING btree ("ocrn_dt");--> statement-breakpoint
CREATE INDEX "etims_stock_mov_item_movementId_idx" ON "etims_stock_movement_item" USING btree ("movement_id");--> statement-breakpoint
CREATE UNIQUE INDEX "etims_sync_state_tin_bhfId_resource_unique" ON "etims_sync_state" USING btree ("tin","bhf_id","resource");--> statement-breakpoint
CREATE INDEX "etims_item_regBhfId_idx" ON "etims_item" USING btree ("reg_bhf_id");